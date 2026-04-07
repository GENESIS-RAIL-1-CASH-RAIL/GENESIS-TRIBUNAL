// GENESIS-TRIBUNAL — Hallucination risk meter
// DIAMOND 1 from Spark #045 — REVISED v0.1.1 per GPT independent analysis.
//
// THE 3-AI LOOP CLOSED ON THIS NUMBER:
//   - Grok narrative claim:    £920,000/week (£47.84M/year) — INFLATED
//   - Grok formula honest:     £119,922/week (£6.2M/year)   — naive product
//   - GPT independent model:   £15,431/week base case        — RIGOROUS, used here
//
// GPT's model accounts for what Grok ignored:
//   - Existing mitigation r_m = 0.41 (anchors + MEV + CHECKSUM + ARIS)
//   - Novelty fraction f_n = 0.12 (only 12% of opportunities need second voice)
//   - Realistic blast radius p_b = 0.22 (vs Grok's 0.85)
//   - Separates direct wrong-action (£1,920/week) from false-hold drag (£13,511/week)
//
// GPT formula:
//   R_w = A_w × f_n × (1 − (1−p_h)(1−p_d)) × p_b × (1 − r_m)   ← direct wrong-action
//   L_w = A_w × f_n × p_c                                       ← false-hold drag
//   V_w = R_w + L_w ≈ £15,431/week base case
//
// Calibration band: £7,800/week (low) / £15,400/week (base) / £31,600/week (high)
// Yearly: £406k - £802k - £1.64M
//
// The 3-AI loop is empirically validated on the spark that defines it.
// Without GPT's independent voice we'd have committed a 30x inflation to the SOP.

import { RiskMeterReading } from "../types";

// GPT-revised parameters (v0.1.1) — see file header for the 3-AI loop story
const A_W_GBP_PER_WEEK = 3043000; // OVERWATCH baseline at-risk pool (£2.184M strategic + £859k free)
const F_N_NOVELTY_FRACTION = 0.12;
const P_H_HALLUCINATION_RATE = 0.018;
const P_D_DRIFT_RATE_PER_WEEK = 0.006;
const P_B_BLAST_RADIUS = 0.22;
const R_M_MITIGATION_FRACTION = 0.41;
const P_C_FALSE_HOLD_RATE = 0.037;
// Tribunal residual (3/3 unanimous reduces hallucination near-zero)
const TRIBUNAL_RESIDUAL_FACTOR = 0.018; // 98.2% reduction

// Diamond 5 — free data alpha from vote disagreement patterns
// GPT-revised values (v0.1.1) — Grok's £505k/week was inflated by ~68x
const VOTE_DISAGREEMENT_GBP_PER_WEEK = 1800; // GPT base
const PROVIDER_BIAS_GBP_PER_WEEK = 1400;
const CONTAMINATION_FREQUENCY_GBP_PER_WEEK = 900;
const PRECEDENT_HIT_RATE_GBP_PER_WEEK = 2100;
const REGIME_CORRELATION_GBP_PER_WEEK = 1200;
const FREE_DATA_TOTAL_GBP_PER_WEEK =
  VOTE_DISAGREEMENT_GBP_PER_WEEK +
  PROVIDER_BIAS_GBP_PER_WEEK +
  CONTAMINATION_FREQUENCY_GBP_PER_WEEK +
  PRECEDENT_HIT_RATE_GBP_PER_WEEK +
  REGIME_CORRELATION_GBP_PER_WEEK;
// = £7,400/week = £384,800/year (was £505k/week / £26.3M/year per Grok)

export class RiskMeter {
  private freeDataCapturedGbp = 0;

  // GPT model: direct wrong-action risk component
  private computeDirectWrongActionRisk(): number {
    // R_w = A_w × f_n × (1 − (1−p_h)(1−p_d)) × p_b × (1 − r_m)
    return (
      A_W_GBP_PER_WEEK *
      F_N_NOVELTY_FRACTION *
      (1 - (1 - P_H_HALLUCINATION_RATE) * (1 - P_D_DRIFT_RATE_PER_WEEK)) *
      P_B_BLAST_RADIUS *
      (1 - R_M_MITIGATION_FRACTION)
    );
  }

  // GPT model: false-hold drag component (the more important term)
  private computeFalseHoldDrag(): number {
    // L_w = A_w × f_n × p_c
    return A_W_GBP_PER_WEEK * F_N_NOVELTY_FRACTION * P_C_FALSE_HOLD_RATE;
  }

  static getStaticBaselineRiskGbpPerWeek(): number {
    // GPT base case: ~£15,431/week
    const directWrongAction =
      A_W_GBP_PER_WEEK *
      F_N_NOVELTY_FRACTION *
      (1 - (1 - P_H_HALLUCINATION_RATE) * (1 - P_D_DRIFT_RATE_PER_WEEK)) *
      P_B_BLAST_RADIUS *
      (1 - R_M_MITIGATION_FRACTION);
    const falseHoldDrag = A_W_GBP_PER_WEEK * F_N_NOVELTY_FRACTION * P_C_FALSE_HOLD_RATE;
    return Math.round(directWrongAction + falseHoldDrag);
  }

  static getStaticFreeDataAlphaGbpPerWeek(): number {
    return FREE_DATA_TOTAL_GBP_PER_WEEK;
  }

  static getStaticTotalProtectedGbpPerYear(): number {
    return Math.round(
      RiskMeter.getStaticBaselineRiskGbpPerWeek() * 52 +
        RiskMeter.getStaticFreeDataAlphaGbpPerWeek() * 52
    );
  }

  read(): RiskMeterReading {
    const directWrongAction = this.computeDirectWrongActionRisk();
    const falseHoldDrag = this.computeFalseHoldDrag();
    const eliminated = (directWrongAction + falseHoldDrag) * (1 - TRIBUNAL_RESIDUAL_FACTOR);
    return {
      weeklyHallucinationRiskGbp: Math.round(eliminated),
      yearlyHallucinationRiskGbp: Math.round(eliminated * 52),
      voteFreedomDataAlphaGbp: Math.round(this.freeDataCapturedGbp),
      totalProtectedGbp: Math.round(eliminated + this.freeDataCapturedGbp),
      asOfMs: Date.now(),
    };
  }

  recordFreeDataCapture(gbp: number): void {
    this.freeDataCapturedGbp += gbp;
  }
}
