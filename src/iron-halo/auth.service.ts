// GENESIS-TRIBUNAL — Iron Halo HMAC authentication
// DIAMOND 6 from Spark #045 Round 1 (v0.1 simplification).
// v0.1 uses HMAC-SHA256 instead of BLS12-381 + Dilithium.
// BLS + post-quantum is deferred to Super Rail per discipline.
//
// Every TribunalQuery is signed by ARIS with a shared HMAC key.
// The Tribunal verifies the signature before processing.

import * as crypto from "crypto";

// In production this key is loaded from an environment variable or secrets manager.
// In v0.1 we generate one at boot if none provided. CHECKSUM signature catches any
// missing-key situation as a behavioural anomaly.
const ENV_KEY = process.env.TRIBUNAL_ARIS_HMAC_KEY;
const HMAC_KEY = ENV_KEY && ENV_KEY.length >= 32 ? ENV_KEY : crypto.randomBytes(32).toString("hex");

export function signQuery(payload: string): string {
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
}

export function verifyQuery(payload: string, signature: string): boolean {
  if (!signature || signature.length !== 64) return false;
  const expected = signQuery(payload);
  // Constant-time comparison to defeat timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function signVerdict(verdictId: string, finalVerdict: string): string {
  return signQuery(`${verdictId}:${finalVerdict}`);
}

export function isUsingGeneratedKey(): boolean {
  return !ENV_KEY || ENV_KEY.length < 32;
}
