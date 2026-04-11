// GENESIS-TRIBUNAL — All route definitions
// T19 Wave 4: router/tribunal.router.ts
// Spark #045. Route paths preserved verbatim from original index.ts.

import { Router, Request, Response } from "express";
import * as crypto from "crypto";
import { CarouselService } from "../carousel/carousel.service";
import { callProvider } from "../iron-halo/sandbox.service";
import { aggregate, VotingContext } from "../voting/state-machine";
import { ArisPreFilter } from "../aris/pre-filter.service";
import { PrecedentLibrary } from "../aris/precedent-library.service";
import { BudgetMeter } from "../cost/budget-meter.service";
import { RiskMeter } from "../commercial/risk-meter.service";
import { FreeDataHarvest } from "../free-data/harvest.service";
import { PrecedentFlywheel } from "../flywheel/precedent-flywheel.service";
import { DeadmanService } from "../deadman.service";
import { signQuery, verifyQuery } from "../iron-halo/auth.service";
import { OpportunityPacket, TribunalQuery } from "../types";
import { config } from "../config";
import { logger } from "../utils/logger";

// ── service instances (wired once, shared across all route handlers) ──

const carousel = new CarouselService();
const precedents = new PrecedentLibrary();
const preFilter = new ArisPreFilter(precedents);
const budget = new BudgetMeter();
const riskMeter = new RiskMeter();
const harvest = new FreeDataHarvest();
const flywheel = new PrecedentFlywheel();
export const deadman = new DeadmanService(config.deadman.host, config.deadman.port);

// ── shared counters for /tribunal/state ──

const counters = {
  totalQueries: 0,
  totalAutoAuthorized: 0,
  totalEscalatedToTribunal: 0,
  totalVotes: 0,
  totalApproved: 0,
  totalHeld: 0,
  totalErrors: 0,
};

// ── internal ticks ──

// Budget meter tick — every 60s for daily reset detection
setInterval(() => {
  try {
    budget.getState();
  } catch (e) {
    logger.error("[budget-tick]", e);
  }
}, 60_000);

// Flywheel monthly tick — daily check, applies decline once per 30 days
let lastFlywheelTickMs = Date.now();
setInterval(
  () => {
    try {
      flywheel.recordHitRate(precedents.hitRate());
      const now = Date.now();
      if (now - lastFlywheelTickMs >= 30 * 24 * 3600 * 1000) {
        flywheel.applyMonthlyTick();
        lastFlywheelTickMs = now;
      }
    } catch (e) {
      logger.error("[flywheel-tick]", e);
    }
  },
  24 * 3600 * 1000
);

// ── autopsy store ──

const autopsyDispatches: Array<{
  receivedAt: number;
  source: string;
  claimId: string | null;
  weaponId: string | null;
  rejectionReason: string | null;
  seeGates: unknown;
  evidenceHash: string | null;
  payload: unknown;
}> = [];
const MAX_AUTOPSY_DISPATCHES = 256;

// ── router ──

export const tribunalRouter = Router();

// THE main endpoint — ARIS submits an opportunity for Tribunal vote
tribunalRouter.post("/vote", async (req: Request, res: Response) => {
  const start = Date.now();
  counters.totalQueries++;

  const opportunityPacket = req.body?.opportunityPacket as OpportunityPacket | undefined;
  const arisSignature = req.body?.arisSignature as string | undefined;

  if (!opportunityPacket || !arisSignature) {
    return res.status(400).json({ ok: false, error: "missing opportunityPacket or arisSignature" });
  }

  const payload = JSON.stringify(opportunityPacket);
  if (!verifyQuery(payload, arisSignature)) {
    return res.status(401).json({ ok: false, error: "invalid ARIS signature" });
  }

  // Step 1: ARIS pre-filter (6 conditions)
  const preResult = preFilter.evaluate(opportunityPacket);
  if (preResult.autoAuthorize) {
    counters.totalAutoAuthorized++;
    return res.json({
      ok: true,
      verdict: "APPROVED",
      route: "aris_auto_authorize",
      precedentMatched: preResult.precedentMatched,
      latencyMs: Date.now() - start,
    });
  }

  // Step 2: Budget check
  const panel = carousel.selectPanel();
  const budgetCheck = budget.canSpend(panel);
  if (!budgetCheck.allowed) {
    counters.totalHeld++;
    return res.json({
      ok: true,
      verdict: "HOLD",
      route: "budget_exhausted",
      reason: budgetCheck.reason,
      latencyMs: Date.now() - start,
    });
  }

  // Step 3: Tribunal vote
  counters.totalEscalatedToTribunal++;

  const queryId = crypto.randomBytes(8).toString("hex");
  const tribunalQuery: TribunalQuery = {
    queryId,
    opportunityPacket,
    arisPreFilterPassed: false,
    arisSignature,
    createdAtMs: Date.now(),
  };

  const prompt = `tribunal_query:${queryId} fusion_confidence:${opportunityPacket.fusionConfidence} anchor_confirmations:${opportunityPacket.onChainAnchorConfirmations} clip_gbp:${opportunityPacket.clipSizeGbp}`;
  const _promptSignature = signQuery(prompt); // for audit trail

  const callResults = await Promise.all(panel.map((p) => callProvider(p, prompt)));
  const votes = callResults.map((r) => r.vote);
  const rawTexts = callResults.map((r) => r.rawText);

  // Step 4: Voting state machine + contamination scan + aggregation
  const ctx: VotingContext = { queryId, votes, rawTexts };
  const result = aggregate(ctx);

  for (const v of votes) {
    carousel.recordContamination(v.providerName, v.contaminationStatus === "CONTAMINATED");
  }

  harvest.ingestBatch(votes);
  budget.recordSpend(panel);

  if (result.verdict.finalVerdict === "APPROVED" || result.verdict.finalVerdict === "HOLD") {
    precedents.add(opportunityPacket, result.verdict.finalVerdict, result.verdict.unanimous ? 1 : 0.5);
  }
  flywheel.recordHitRate(precedents.hitRate());

  counters.totalVotes++;
  if (result.verdict.finalVerdict === "APPROVED") counters.totalApproved++;
  else if (result.verdict.finalVerdict === "HOLD") counters.totalHeld++;
  else counters.totalErrors++;

  // suppress unused variable warning
  void tribunalQuery;

  res.json({
    ok: true,
    route: "tribunal_voted",
    verdict: result.verdict,
    contaminatedProviders: result.contaminatedProviders,
    latencyMs: Date.now() - start,
  });
});

tribunalRouter.get("/state", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    counters,
    voting: {
      totalVotes: counters.totalVotes,
      totalApproved: counters.totalApproved,
      totalHeld: counters.totalHeld,
      totalErrors: counters.totalErrors,
    },
    aris: {
      totalAutoAuthorized: counters.totalAutoAuthorized,
      totalEscalatedToTribunal: counters.totalEscalatedToTribunal,
      escalationRate: counters.totalQueries === 0 ? 0 : counters.totalEscalatedToTribunal / counters.totalQueries,
    },
    precedents: {
      totalAdded: precedents.totalAdded,
      totalLookups: precedents.totalLookups,
      totalHits: precedents.totalHits,
      hitRate: Number(precedents.hitRate().toFixed(4)),
      currentSize: precedents.size(),
    },
    budget: budget.getState(),
    risk: riskMeter.read(),
    flywheel: flywheel.read(),
    carousel: {
      activeProviders: carousel.activeProviderCount(),
      activations: carousel.getActivations(),
    },
    harvest: {
      totalSignalsCaptured: harvest.totalSignalsCaptured,
      disagreementByProvider: harvest.disagreementRateByProvider(),
      contaminationByProvider: harvest.contaminationRateByProvider(),
    },
  });
});

tribunalRouter.get("/risk", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    live: riskMeter.read(),
    static_baseline: {
      weekly_hallucination_risk_gbp: RiskMeter.getStaticBaselineRiskGbpPerWeek(),
      weekly_free_data_alpha_gbp: RiskMeter.getStaticFreeDataAlphaGbpPerWeek(),
      yearly_total_protected_gbp: RiskMeter.getStaticTotalProtectedGbpPerYear(),
    },
    spark_reference: "Spark #045 Round 1 Diamond 1 + Diamond 5",
  });
});

tribunalRouter.get("/budget/report", (_req: Request, res: Response) => {
  res.json({ ok: true, report: budget.generateDailyReport() });
});

tribunalRouter.get("/flywheel/projection", (req: Request, res: Response) => {
  const months = Number(req.query.months ?? 9);
  const hitRate = Number(req.query.hitRate ?? 0.5);
  const projection: { month: number; rate: number }[] = [];
  for (let m = 0; m <= months; m++) {
    projection.push({ month: m, rate: Number(flywheel.projectRateAtMonth(m, hitRate).toFixed(4)) });
  }
  res.json({ ok: true, projection, hitRateAssumption: hitRate });
});

tribunalRouter.get("/deadman/last", (_req: Request, res: Response) => {
  res.json({ ok: true, ...deadman.status() });
});

// Helper for ARIS to sign queries during integration testing
tribunalRouter.post("/sign", (req: Request, res: Response) => {
  const payload = JSON.stringify(req.body);
  res.json({ ok: true, signature: signQuery(payload) });
});

// MIL → TRIBUNAL autopsy intake (added 2026-04-09 per Wargame Wire mission)
tribunalRouter.post("/autopsy/intake", (req: Request, res: Response) => {
  const packet = (req.body || {}) as Record<string, unknown>;
  const dispatch = {
    receivedAt: Date.now(),
    source: (packet.source as string) || "unknown",
    claimId: (packet.claimId as string) || null,
    weaponId: (packet.weaponId as string) || null,
    rejectionReason: (packet.rejectionReason as string) || (packet.reason as string) || null,
    seeGates: packet.seeGates ?? null,
    evidenceHash: (packet.evidenceHash as string) || null,
    payload: packet,
  };
  autopsyDispatches.push(dispatch);
  if (autopsyDispatches.length > MAX_AUTOPSY_DISPATCHES) {
    autopsyDispatches.shift();
  }
  logger.info(`autopsy intake: source=${dispatch.source} weapon=${dispatch.weaponId} reason=${dispatch.rejectionReason}`);
  res.status(202).json({ accepted: true, autopsyId: `AUT-${Date.now()}`, queueDepth: autopsyDispatches.length });
});

tribunalRouter.get("/autopsy/dispatches", (_req: Request, res: Response) => {
  res.json({ dispatches: autopsyDispatches.slice(-50), totalReceived: autopsyDispatches.length });
});
