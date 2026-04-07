// GENESIS-TRIBUNAL — 8-provider pool definition
// DIAMOND 3 from Spark #045 Round 1.
// Reuses the provider list from Red Aggressor V6 (governance v4.11).

import { ProviderConfig } from "../types";

// Cost figures from Spark #045 Round 1 Diamond 8 — pre-cache rates per MTok
// Prompt caching reduces input cost to ~10% of nominal (Anthropic pattern)
export const PROVIDER_POOL: ProviderConfig[] = [
  {
    name: "anthropic",
    model: "claude-opus-4.6",
    endpoint: "api.anthropic.com",
    inputCostPerMTokGbp: 12.0,
    outputCostPerMTokGbp: 60.0,
    cachedInputCostPerMTokGbp: 1.2,
  },
  {
    name: "openai",
    model: "gpt-5",
    endpoint: "api.openai.com",
    inputCostPerMTokGbp: 4.0,
    outputCostPerMTokGbp: 16.0,
    cachedInputCostPerMTokGbp: 0.4,
  },
  {
    name: "google",
    model: "gemini-2-pro",
    endpoint: "generativelanguage.googleapis.com",
    inputCostPerMTokGbp: 2.4,
    outputCostPerMTokGbp: 8.0,
    cachedInputCostPerMTokGbp: 0.24,
  },
  {
    name: "xai",
    model: "grok-4",
    endpoint: "api.x.ai",
    inputCostPerMTokGbp: 8.0,
    outputCostPerMTokGbp: 24.0,
    cachedInputCostPerMTokGbp: 0.8,
  },
  {
    name: "mistral",
    model: "large-2",
    endpoint: "api.mistral.ai",
    inputCostPerMTokGbp: 2.4,
    outputCostPerMTokGbp: 7.2,
    cachedInputCostPerMTokGbp: 0.24,
  },
  {
    name: "deepseek",
    model: "v3",
    endpoint: "api.deepseek.com",
    inputCostPerMTokGbp: 0.8,
    outputCostPerMTokGbp: 2.4,
    cachedInputCostPerMTokGbp: 0.08,
  },
  {
    name: "meta",
    model: "llama-4",
    endpoint: "api.meta.ai",
    inputCostPerMTokGbp: 1.6,
    outputCostPerMTokGbp: 4.8,
    cachedInputCostPerMTokGbp: 0.16,
  },
  {
    name: "cohere",
    model: "command-r-plus",
    endpoint: "api.cohere.ai",
    inputCostPerMTokGbp: 2.4,
    outputCostPerMTokGbp: 12.0,
    cachedInputCostPerMTokGbp: 0.24,
  },
];

export function getProvider(name: string): ProviderConfig | undefined {
  return PROVIDER_POOL.find((p) => p.name === name);
}
