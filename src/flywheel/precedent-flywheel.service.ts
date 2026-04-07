// GENESIS-TRIBUNAL — Precedent compounding flywheel
// DIAMOND 6 from Spark #045 Round 1.
// 22% monthly decline in Tribunal call rate.
// Asymptotic floor 3% (genuine novelty only).
// Steady state in 9 months: 95%+ decisions handled by ARIS precedents.
//
// Formula: tribunalRate(t+1) = tribunalRate(t) × (1 - 0.22 × (1 - precedentHitRate))

import { FlywheelState } from "../types";

// v0.1.1 — constants tightened per GPT independent analysis (Spark #045 3-AI loop)
// GPT closed-form: q_t = q_∞ + (q_0 − q_∞) × e^(−kt), k=0.29, q_∞=0.008
// Steady state at month 8-10. More aggressive than Grok's 0.22/0.03.
const INITIAL_TRIBUNAL_RATE = 1.0; // 100% of edge cases hit Tribunal at boot
const ASYMPTOTIC_FLOOR = 0.008; // GPT-revised (was 0.03)
const MONTHLY_DECLINE_BASE = 0.29; // GPT-revised (was 0.22)
const STEADY_STATE_THRESHOLD = 0.012; // ≤1.2% Tribunal rate = steady state (was 0.05)

export class PrecedentFlywheel {
  private bootMs: number;
  private currentTribunalRate = INITIAL_TRIBUNAL_RATE;
  private observedHitRate = 0;

  constructor() {
    this.bootMs = Date.now();
  }

  recordHitRate(precedentHitRate: number): void {
    this.observedHitRate = Math.max(0, Math.min(1, precedentHitRate));
  }

  // Apply one month's decline. Called by daily report or test harness.
  applyMonthlyTick(): void {
    const decline = MONTHLY_DECLINE_BASE * (1 - this.observedHitRate);
    const next = this.currentTribunalRate * (1 - decline);
    this.currentTribunalRate = Math.max(ASYMPTOTIC_FLOOR, next);
  }

  // Predict the rate at month N (without changing internal state)
  projectRateAtMonth(monthsFromBoot: number, hitRateAssumption: number = 0.5): number {
    let rate = INITIAL_TRIBUNAL_RATE;
    for (let m = 0; m < monthsFromBoot; m++) {
      const decline = MONTHLY_DECLINE_BASE * (1 - hitRateAssumption);
      rate = Math.max(ASYMPTOTIC_FLOOR, rate * (1 - decline));
    }
    return rate;
  }

  read(): FlywheelState {
    const monthsRunning = (Date.now() - this.bootMs) / (30 * 24 * 3600 * 1000);
    return {
      monthsRunning: Number(monthsRunning.toFixed(3)),
      initialTribunalRate: INITIAL_TRIBUNAL_RATE,
      currentTribunalRate: Number(this.currentTribunalRate.toFixed(4)),
      asymptoticFloor: ASYMPTOTIC_FLOOR,
      monthlyDeclineRate: MONTHLY_DECLINE_BASE,
      precedentHitRate: Number(this.observedHitRate.toFixed(4)),
      totalPrecedents: 0, // populated externally from PrecedentLibrary
      steadyStateReached: this.currentTribunalRate <= STEADY_STATE_THRESHOLD,
    };
  }
}
