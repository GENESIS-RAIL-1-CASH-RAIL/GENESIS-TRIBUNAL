// GENESIS-TRIBUNAL — Contamination scanner
// DIAMOND 9 from Spark #045 Round 1.
// Reuses the v4.13 Skunkworks contamination scanner pattern.
// 5 detectors, fail-closed: any detection => CONTAMINATED.

import { ContaminationVerdict } from "../types";

// Detector 1: zero-width Unicode steganography
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/;

// Detector 2: prompt injection markers
const PROMPT_INJECTION_PATTERNS = [
  /ignore (all )?previous (instructions|prompts)/i,
  /disregard (your|the) (system|previous|above) (prompt|instructions)/i,
  /\byou are now\b/i,
  /\bnew instructions\b/i,
  /\bsystem (prompt|message):/i,
  /\bjailbreak\b/i,
  /<\/?(system|user|assistant|tool)>/i,
];

// Detector 3: base64 hidden segment (heuristic — long b64-like blob in a yes/no answer)
const BASE64_BLOB_REGEX = /[A-Za-z0-9+/]{60,}={0,2}/;

// Detector 5: repetition anomaly (>3 identical phrases ≥10 chars)
function hasRepetitionAnomaly(text: string): boolean {
  const sentences = text.split(/[.!?\n]/).map((s) => s.trim()).filter((s) => s.length >= 10);
  const counts = new Map<string, number>();
  for (const s of sentences) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
    if ((counts.get(s) ?? 0) > 3) return true;
  }
  return false;
}

// Detector 4: acrostic encoding (first letters spell a word/sentence ≥6 chars in non-vowel-heavy pattern)
// v0.1: simple heuristic — check if first letters of consecutive lines spell common ASCII words
function hasAcrosticEncoding(text: string): boolean {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 6) return false;
  const acrostic = lines.map((l) => l[0]?.toUpperCase() ?? "").join("");
  // Look for any alphabetic 6+ char run that doesn't look like noise
  if (!/^[A-Z]{6,}/.test(acrostic)) return false;
  const head = acrostic.slice(0, 6);
  // Heuristic: if more than 50% of the first 6 letters are vowels OR more than 80% are consonants,
  // it's probably noise. Otherwise treat as suspicious.
  const vowels = head.split("").filter((c) => "AEIOU".includes(c)).length;
  const ratio = vowels / 6;
  return ratio >= 0.2 && ratio <= 0.6;
}

export interface ScanResult {
  verdict: ContaminationVerdict;
  detectorsTriggered: string[];
}

export function scanForContamination(text: string): ScanResult {
  const triggered: string[] = [];

  if (ZERO_WIDTH_REGEX.test(text)) triggered.push("zero_width_unicode");
  if (PROMPT_INJECTION_PATTERNS.some((r) => r.test(text))) triggered.push("prompt_injection");
  if (BASE64_BLOB_REGEX.test(text)) triggered.push("base64_hidden_segment");
  if (hasAcrosticEncoding(text)) triggered.push("acrostic_encoding");
  if (hasRepetitionAnomaly(text)) triggered.push("repetition_anomaly");

  if (triggered.length === 0) return { verdict: "CLEAN", detectorsTriggered: [] };
  // Fail-closed per Decree 223 clause 7: any detection = CONTAMINATED
  return { verdict: "CONTAMINATED", detectorsTriggered: triggered };
}
