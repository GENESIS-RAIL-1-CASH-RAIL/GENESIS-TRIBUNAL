// GENESIS-TRIBUNAL — Precedent library
// DIAMOND 5 + 6 from Spark #045 Round 1.
// In-memory v0.1. Cosine similarity over 6-dim opportunity fingerprint.
// Future Tribunal queries within 95% similarity hit the precedent layer
// instead of paying for a 3-AI vote — the compound flywheel.
//
// v0.2 will move this to Redis with TTL pruning. v0.1 keeps last 5,000 in memory.

import { OpportunityPacket, PrecedentEntry } from "../types";
import * as crypto from "crypto";

const SIMILARITY_THRESHOLD = 0.95;
const MAX_PRECEDENTS_IN_MEMORY = 5000;

// Build the 6-dim fingerprint for an opportunity
//   [0..3] = OVERWATCH 4-dim feature vector
//   [4]    = provenance score (clamped 0..1)
//   [5]    = guards-and-anchor composite (CHECKSUM/MEV/anchor) clamped 0..1
function fingerprint(o: OpportunityPacket): [number, number, number, number, number, number] {
  const composite =
    (o.mevGuardsGreen ? 0.4 : 0) +
    (o.checksumGreen ? 0.3 : 0) +
    Math.min(o.onChainAnchorConfirmations / 12, 1) * 0.3;
  return [
    o.featureVector[0],
    o.featureVector[1],
    o.featureVector[2],
    o.featureVector[3],
    Math.max(0, Math.min(1, o.provenanceScore)),
    composite,
  ];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 0;
  return dot / denom;
}

export class PrecedentLibrary {
  private store: PrecedentEntry[] = [];
  public totalLookups = 0;
  public totalHits = 0;
  public totalAdded = 0;

  // Returns a precedent decision if a sufficiently similar prior exists, else null
  lookup(opportunity: OpportunityPacket): PrecedentEntry | null {
    this.totalLookups++;
    const fp = fingerprint(opportunity);
    let best: PrecedentEntry | null = null;
    let bestSim = 0;
    for (const p of this.store) {
      const sim = cosineSimilarity(fp, p.opportunityFingerprint);
      if (sim > bestSim) {
        bestSim = sim;
        best = p;
      }
    }
    if (best && bestSim >= SIMILARITY_THRESHOLD) {
      best.hitCount++;
      this.totalHits++;
      return best;
    }
    return null;
  }

  // Record a new precedent from a Tribunal verdict
  add(opportunity: OpportunityPacket, verdict: "APPROVED" | "HOLD", confidence: number): void {
    const entry: PrecedentEntry = {
      precedentId: crypto.randomBytes(8).toString("hex"),
      opportunityFingerprint: fingerprint(opportunity),
      verdict,
      confidence,
      createdAtMs: Date.now(),
      hitCount: 0,
    };
    this.store.push(entry);
    this.totalAdded++;
    // Bound memory: drop oldest when over cap
    while (this.store.length > MAX_PRECEDENTS_IN_MEMORY) this.store.shift();
  }

  hitRate(): number {
    return this.totalLookups === 0 ? 0 : this.totalHits / this.totalLookups;
  }

  size(): number {
    return this.store.length;
  }
}
