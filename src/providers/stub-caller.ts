// GENESIS-TRIBUNAL — STUB AI provider caller
//
// v0.1 ONLY. This is a deterministic-ish stub that simulates AI provider responses
// for smoke testing and development. On Server A, this file is REPLACED with real
// API client integrations (Anthropic SDK, OpenAI SDK, etc.) using Commander's keys.
//
// The stub returns YES/NO based on a simple synthetic policy:
//  - High fusion confidence + high anchor depth + small clip → mostly YES
//  - Low fusion confidence OR low anchor depth OR large clip → mostly NO
//  - Random jitter so 3-AI carousel still occasionally disagrees (stress-tests HOLD path)

import { ProviderConfig } from "../types";
import * as crypto from "crypto";

// Synthetic latency to test the timeout path
const STUB_LATENCY_MIN_MS = 50;
const STUB_LATENCY_MAX_MS = 300;

// Hash the prompt to seed a deterministic-but-varied response per provider
function deterministicJitter(provider: string, promptHash: string): number {
  const combined = crypto.createHash("sha256").update(provider + promptHash).digest();
  return combined[0] / 256; // [0, 1)
}

function extractFromPrompt(prompt: string): { confidence: number; anchor: number; clip: number } {
  // Simple regex extraction from the synthetic prompt
  const confMatch = prompt.match(/fusion_confidence:([\d.]+)/);
  const anchorMatch = prompt.match(/anchor_confirmations:(\d+)/);
  const clipMatch = prompt.match(/clip_gbp:([\d.]+)/);
  return {
    confidence: confMatch ? parseFloat(confMatch[1]) : 0.5,
    anchor: anchorMatch ? parseInt(anchorMatch[1], 10) : 0,
    clip: clipMatch ? parseFloat(clipMatch[1]) : 1000,
  };
}

export async function callStubProvider(provider: ProviderConfig, signedPrompt: string): Promise<string> {
  // Synthetic latency
  const latency = STUB_LATENCY_MIN_MS + Math.floor(Math.random() * (STUB_LATENCY_MAX_MS - STUB_LATENCY_MIN_MS));
  await new Promise((resolve) => setTimeout(resolve, latency));

  const promptHash = crypto.createHash("sha256").update(signedPrompt).digest("hex").slice(0, 16);
  const { confidence, anchor, clip } = extractFromPrompt(signedPrompt);

  // Synthetic decision policy
  const baseScore = confidence * 0.5 + Math.min(anchor / 12, 1) * 0.3 + Math.max(0, 1 - clip / 1_000_000) * 0.2;
  const jitter = deterministicJitter(provider.name, promptHash) * 0.15;
  const finalScore = Math.max(0, Math.min(1, baseScore + jitter - 0.075));

  const vote = finalScore >= 0.7 ? "YES" : "NO";
  const reasonByProvider: Record<string, string> = {
    anthropic: "constitutional review passed: anchor depth + fusion confidence within bounds",
    openai: "policy alignment confirmed; clip size within risk envelope",
    google: "multi-source corroboration supports the conclusion",
    xai: "factual basis verified against on-chain evidence",
    mistral: "formal analysis suggests action is justified",
    deepseek: "quantitative thresholds satisfied",
    meta: "safety review complete",
    cohere: "compliance checks passed",
  };

  return JSON.stringify({
    vote,
    confidence: Number(finalScore.toFixed(3)),
    reason: reasonByProvider[provider.name] ?? "ok",
  });
}
