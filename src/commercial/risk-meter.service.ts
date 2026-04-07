// GENESIS-TRIBUNAL — Hallucination risk meter
// DIAMOND 1 from Spark #045 Round 1.
//
// FORMULA AS WRITTEN BY GROK (Round 1):
//   L = 7 × R × λ × α₀ × h × b
//   where R=6, λ=3.1, α₀=£38,700, h=0.028, b=0.85
//   → £119,921/week (HONEST COMPUTATION) → ~£6.2M/year protected
//
// IMPORTANT DISCREPANCY: Grok's narrative claimed £920,000/week, but the
// stated variables compute to £119,922/week. The £920k claim does not
// match the formula. We use the HONEST computation here.
//
// THIS IS A LIVE VALIDATION OF WHY TRIBUNAL EXISTS: single-AI output can
// be confidently wrong. Cross-verification catches it. Today's discrepancy
// is the proof. Gemini's parallel run (still pending) will provide the
// second opinion that should have caught this in Round 1.
//
// The honest number is still material (£6.2M/year of hallucination risk
// protected on top of OVERWATCH's £158M/year). We will refine against real
// Rail 1 data once it's flowing.

import { RiskMeterReading } from "../types";

const R_RAILS = 6;
const LAMBDA_PATTERNS_PER_RAIL_PER_DAY = 3.1;
const ALPHA_0_GBP = 38700;
const H_SINGLE_VOICE = 0.028;
const H_TRIBUNAL = 0.0005;
const B_BLAST_RADIUS = 0.85;

// Diamond 5 — free data alpha from vote disagreement patterns
const VOTE_DISAGREEMENT_GBP_PER_WEEK = 110000;
const PROVIDER_BIAS_GBP_PER_WEEK = 95000;
const CONTAMINATION_FREQUENCY_GBP_PER_WEEK = 75000;
const PRECEDENT_HIT_RATE_GBP_PER_WEEK = 140000;
const REGIME_CORRELATION_GBP_PER_WEEK = 85000;
const FREE_DATA_TOTAL_GBP_PER_WEEK =
  VOTE_DISAGREEMENT_GBP_PER_WEEK +
  PROVIDER_BIAS_GBP_PER_WEEK +
  CONTAMINATION_FREQUENCY_GBP_PER_WEEK +
  PRECEDENT_HIT_RATE_GBP_PER_WEEK +
  REGIME_CORRELATION_GBP_PER_WEEK;

export class RiskMeter {
  private freeDataCapturedGbp = 0;

  // The strategic loss formula at a given hallucination rate
  private computeLoss(h: number): number {
    return 7 * R_RAILS * LAMBDA_PATTERNS_PER_RAIL_PER_DAY * ALPHA_0_GBP * h * B_BLAST_RADIUS;
  }

  static getStaticBaselineRiskGbpPerWeek(): number {
    return 7 * R_RAILS * LAMBDA_PATTERNS_PER_RAIL_PER_DAY * ALPHA_0_GBP * H_SINGLE_VOICE * B_BLAST_RADIUS;
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
    const baselineRisk = this.computeLoss(H_SINGLE_VOICE);
    const tribunalResidualRisk = this.computeLoss(H_TRIBUNAL);
    const eliminated = baselineRisk - tribunalResidualRisk;
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
