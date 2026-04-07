// GENESIS-TRIBUNAL — Voting state machine
// DIAMOND 7 from Spark #045 Round 1.
// Conservative Unanimous: 3/3 YES required for action. Anything else = HOLD.
// Bound by ARIS Decree 223 clause 1.

import { AIVote, TribunalVerdict, VotingState } from "../types";
import { signVerdict } from "../iron-halo/auth.service";
import { scanForContamination } from "../contamination/scanner.service";
import * as crypto from "crypto";

export interface VotingContext {
  queryId: string;
  votes: AIVote[];
  rawTexts: string[];
}

export interface VotingResult {
  state: VotingState;
  verdict: TribunalVerdict;
  contaminatedProviders: string[];
}

// Run all 3 votes through the contamination scanner FIRST.
// Then apply the conservative unanimous rule.
export function aggregate(ctx: VotingContext): VotingResult {
  const contaminatedProviders: string[] = [];
  const cleanVotes: AIVote[] = [];

  for (let i = 0; i < ctx.votes.length; i++) {
    const v = ctx.votes[i];
    const raw = ctx.rawTexts[i] ?? "";

    // Skip if already marked contaminated by sandbox sanitisation
    if (v.contaminationStatus === "CONTAMINATED") {
      contaminatedProviders.push(v.providerName);
      continue;
    }

    // Run text scanner on the raw response (catches stego the sanitiser missed)
    const scan = scanForContamination(raw);
    if (scan.verdict === "CONTAMINATED") {
      v.contaminationStatus = "CONTAMINATED";
      v.reason = `contamination: ${scan.detectorsTriggered.join(",")}`;
      contaminatedProviders.push(v.providerName);
      continue;
    }
    cleanVotes.push(v);
  }

  const yesCount = cleanVotes.filter((v) => v.vote === "YES").length;
  const noCount = cleanVotes.filter((v) => v.vote === "NO" && !v.timedOut).length;
  const timedOutCount = ctx.votes.filter((v) => v.timedOut).length;
  const contaminatedCount = contaminatedProviders.length;

  // Conservative Unanimous: require exactly 3 clean YES votes
  let finalVerdict: "APPROVED" | "HOLD" | "ERROR";
  let unanimous: boolean;
  let reason: string;

  if (cleanVotes.length === 0) {
    finalVerdict = "ERROR";
    unanimous = false;
    reason = "no clean votes available (all contaminated or timed out)";
  } else if (cleanVotes.length < 3) {
    finalVerdict = "HOLD";
    unanimous = false;
    reason = `only ${cleanVotes.length} of 3 clean votes received (contaminated=${contaminatedCount}, timeouts=${timedOutCount})`;
  } else if (yesCount === 3) {
    finalVerdict = "APPROVED";
    unanimous = true;
    reason = "3/3 unanimous YES";
  } else {
    finalVerdict = "HOLD";
    unanimous = false;
    reason = `not unanimous: ${yesCount} YES, ${noCount} NO`;
  }

  const verdictId = crypto.randomBytes(8).toString("hex");
  const totalLatencyMs = Math.max(...ctx.votes.map((v) => v.latencyMs), 0);

  const verdict: TribunalVerdict = {
    verdictId,
    queryId: ctx.queryId,
    finalVerdict,
    unanimous,
    yesCount,
    noCount,
    contaminatedCount,
    timedOutCount,
    individualVotes: ctx.votes,
    reason,
    decidedAtMs: Date.now(),
    totalLatencyMs,
    signedQc: signVerdict(verdictId, finalVerdict),
  };

  const state: VotingState = finalVerdict === "APPROVED" ? "APPROVED" : finalVerdict === "ERROR" ? "ERROR" : "HOLD";
  return { state, verdict, contaminatedProviders };
}
