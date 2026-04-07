// GENESIS-TRIBUNAL — ARIS pre-filter
// DIAMOND 5 from Spark #045 Round 1.
// 6 conditions for ARIS auto-authorization without invoking the Tribunal.
// All 6 must hold simultaneously.

import { OpportunityPacket } from "../types";
import { PrecedentLibrary } from "./precedent-library.service";

const MAX_AUTO_CLIP_GBP = 100;
const MIN_FUSION_CONFIDENCE = 0.85;
const MIN_ANCHOR_CONFIRMATIONS = 8;

export interface PreFilterResult {
  autoAuthorize: boolean;
  failedConditions: string[];
  precedentMatched: boolean;
}

export class ArisPreFilter {
  constructor(private precedents: PrecedentLibrary) {}

  evaluate(o: OpportunityPacket): PreFilterResult {
    const failed: string[] = [];

    // Condition 1: Clip size ≤ £100
    if (o.clipSizeGbp > MAX_AUTO_CLIP_GBP) {
      failed.push(`clip_size_gbp(${o.clipSizeGbp})>${MAX_AUTO_CLIP_GBP}`);
    }

    // Condition 2: Decision matches a prior precedent within 95% similarity
    const precedent = this.precedents.lookup(o);
    if (!precedent) {
      failed.push("no_precedent_within_95pct_similarity");
    } else if (precedent.verdict !== "APPROVED") {
      failed.push("matched_precedent_was_HOLD");
    }

    // Condition 3: All MEV guards green
    if (!o.mevGuardsGreen) failed.push("mev_guards_not_green");

    // Condition 4: All CHECKSUM signatures green
    if (!o.checksumGreen) failed.push("checksum_not_green");

    // Condition 5: OVERWATCH fusion confidence ≥ 0.85
    if (o.fusionConfidence < MIN_FUSION_CONFIDENCE) {
      failed.push(`fusion_confidence(${o.fusionConfidence.toFixed(2)})<${MIN_FUSION_CONFIDENCE}`);
    }

    // Condition 6: On-chain anchor confirmations ≥ 8
    if (o.onChainAnchorConfirmations < MIN_ANCHOR_CONFIRMATIONS) {
      failed.push(`anchor_confirmations(${o.onChainAnchorConfirmations})<${MIN_ANCHOR_CONFIRMATIONS}`);
    }

    return {
      autoAuthorize: failed.length === 0,
      failedConditions: failed,
      precedentMatched: precedent !== null && precedent.verdict === "APPROVED",
    };
  }
}
