// GENESIS-TRIBUNAL — Conflict exclusion table
// DIAMOND 4 from Spark #045 Round 1.
// No provider may evaluate its own model. Reuses Red Aggressor V6 pattern (v4.11).

// Map: providerName -> list of model identifiers it cannot evaluate
export const CONFLICT_EXCLUSION: Record<string, string[]> = {
  anthropic: ["claude-opus-4.6"],
  openai: ["gpt-5"],
  google: ["gemini-2-pro"],
  xai: ["grok-4"],
  mistral: ["large-2"],
  deepseek: ["v3"],
  meta: ["llama-4"],
  cohere: ["command-r-plus"],
};

// Returns true if provider P is allowed to evaluate the question whose
// subject involves model M from another provider.
// In v0.1 the Tribunal asks ABOUT opportunities, not about other models —
// so this exclusion is only consulted when the opportunity packet contains
// a model attribution. Otherwise all 8 providers are eligible.
export function isExcluded(providerName: string, subjectModelHint?: string): boolean {
  if (!subjectModelHint) return false;
  const excludedModels = CONFLICT_EXCLUSION[providerName] ?? [];
  return excludedModels.some((m) => subjectModelHint.includes(m));
}
