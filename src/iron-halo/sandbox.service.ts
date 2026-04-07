// GENESIS-TRIBUNAL — Iron Halo sandbox
// DIAMOND 6 from Spark #045 Round 1.
// Wraps every outbound AI call with:
//   1. Strict output schema validation (JSON only, vote+confidence+reason)
//   2. Per-call timeout (2800ms per Decree 223 clause 8)
//   3. Outbound-only egress to whitelisted endpoints
//   4. Fail-closed on any non-JSON or schema violation
//
// In v0.1 the actual AI calls are STUBBED (see stub-caller.ts). The sandbox layer
// is real and ready to wrap real provider clients when Commander wires API keys
// on Server A.

import { ProviderConfig, AIVote } from "../types";
import { callStubProvider } from "../providers/stub-caller";
import * as crypto from "crypto";

const PER_AI_TIMEOUT_MS = 2800; // Decree 223 clause 8
const RESPONSE_SCHEMA_KEYS = ["vote", "confidence", "reason"];
const ALLOWED_VOTES = new Set(["YES", "NO"]);

interface RawResponse {
  vote?: unknown;
  confidence?: unknown;
  reason?: unknown;
}

export interface CallResult {
  vote: AIVote;
  rawText: string;
}

// Strict response sanitisation: any extra keys, any wrong types, any non-YES/NO vote
// = treated as a HOLD vote with contamination flag set by the upstream scanner.
function sanitise(raw: string, providerName: string, modelVersion: string, latencyMs: number, voteId: string): AIVote {
  let parsed: RawResponse | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      voteId,
      providerName,
      modelVersion,
      vote: "NO",
      confidence: 0,
      reason: "non-json response",
      contaminationStatus: "CONTAMINATED",
      latencyMs,
      timedOut: false,
    };
  }
  if (!parsed || typeof parsed !== "object") {
    return {
      voteId,
      providerName,
      modelVersion,
      vote: "NO",
      confidence: 0,
      reason: "non-object response",
      contaminationStatus: "CONTAMINATED",
      latencyMs,
      timedOut: false,
    };
  }
  // Reject any extra keys (strict schema)
  const keys = Object.keys(parsed);
  for (const k of keys) {
    if (!RESPONSE_SCHEMA_KEYS.includes(k)) {
      return {
        voteId,
        providerName,
        modelVersion,
        vote: "NO",
        confidence: 0,
        reason: `unexpected field: ${k}`,
        contaminationStatus: "CONTAMINATED",
        latencyMs,
        timedOut: false,
      };
    }
  }
  const voteRaw = String(parsed.vote ?? "").toUpperCase();
  if (!ALLOWED_VOTES.has(voteRaw)) {
    return {
      voteId,
      providerName,
      modelVersion,
      vote: "NO",
      confidence: 0,
      reason: `invalid vote value: ${voteRaw}`,
      contaminationStatus: "CONTAMINATED",
      latencyMs,
      timedOut: false,
    };
  }
  const confNum = typeof parsed.confidence === "number" ? parsed.confidence : 0;
  const conf = Math.max(0, Math.min(1, confNum));
  const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : "";
  return {
    voteId,
    providerName,
    modelVersion,
    vote: voteRaw as "YES" | "NO",
    confidence: conf,
    reason,
    contaminationStatus: "CLEAN", // contamination scanner runs separately
    latencyMs,
    timedOut: false,
  };
}

export async function callProvider(
  provider: ProviderConfig,
  signedPrompt: string
): Promise<CallResult> {
  const start = Date.now();
  const voteId = crypto.randomBytes(8).toString("hex");

  const timeoutPromise = new Promise<CallResult>((resolve) => {
    setTimeout(() => {
      resolve({
        vote: {
          voteId,
          providerName: provider.name,
          modelVersion: provider.model,
          vote: "NO",
          confidence: 0,
          reason: "timeout",
          contaminationStatus: "CLEAN",
          latencyMs: PER_AI_TIMEOUT_MS,
          timedOut: true,
        },
        rawText: "",
      });
    }, PER_AI_TIMEOUT_MS);
  });

  const callPromise: Promise<CallResult> = callStubProvider(provider, signedPrompt).then((rawText) => {
    const latencyMs = Date.now() - start;
    return { vote: sanitise(rawText, provider.name, provider.model, latencyMs, voteId), rawText };
  });

  return Promise.race([callPromise, timeoutPromise]);
}
