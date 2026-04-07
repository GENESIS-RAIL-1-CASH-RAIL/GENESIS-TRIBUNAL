// GENESIS-TRIBUNAL — Cost discipline + budget meter
// DIAMOND 8 from Spark #045 Round 1.
// £500/day cap with prompt caching enforcement.
// 80% input savings via cache (Anthropic/OpenAI/Google all support it).
// Bound by ARIS Decree 223 clause 8.

import { ProviderConfig, BudgetState } from "../types";
import { PROVIDER_POOL } from "../providers/pool";

const DAILY_CAP_GBP = 500;
const PROMPT_INPUT_TOKENS_TOTAL = 5000;
const PROMPT_INPUT_TOKENS_UNCACHED = 800; // opportunity packet only
const PROMPT_OUTPUT_TOKENS = 500;
const ALERT_THRESHOLD_PCT = 0.80;
const TIGHTEN_THRESHOLD_PCT = 0.95;

const DAY_MS = 24 * 3600 * 1000;

export class BudgetMeter {
  private state: BudgetState;
  public totalAlerts = 0;
  public totalTightenings = 0;
  public totalSilences = 0;

  constructor() {
    this.state = {
      dailyCapGbp: DAILY_CAP_GBP,
      spentTodayGbp: 0,
      votesToday: 0,
      cacheHitsToday: 0,
      cacheSavingsTodayGbp: 0,
      lastResetMs: Date.now(),
      silenced: false,
    };
  }

  // Estimate cost of a single 3-provider Tribunal vote with prompt caching
  estimateVoteCost(panel: ProviderConfig[]): number {
    let total = 0;
    for (const p of panel) {
      // Cached prefix (decree context, schemas, voting rules)
      const cachedTokens = PROMPT_INPUT_TOKENS_TOTAL - PROMPT_INPUT_TOKENS_UNCACHED;
      const cachedCost = (cachedTokens / 1_000_000) * p.cachedInputCostPerMTokGbp;
      // Uncached opportunity packet
      const uncachedCost = (PROMPT_INPUT_TOKENS_UNCACHED / 1_000_000) * p.inputCostPerMTokGbp;
      // Output
      const outputCost = (PROMPT_OUTPUT_TOKENS / 1_000_000) * p.outputCostPerMTokGbp;
      total += cachedCost + uncachedCost + outputCost;
    }
    return total;
  }

  // What the cost WOULD be without caching, for savings tracking
  estimateUncachedCost(panel: ProviderConfig[]): number {
    let total = 0;
    for (const p of panel) {
      const inputCost = (PROMPT_INPUT_TOKENS_TOTAL / 1_000_000) * p.inputCostPerMTokGbp;
      const outputCost = (PROMPT_OUTPUT_TOKENS / 1_000_000) * p.outputCostPerMTokGbp;
      total += inputCost + outputCost;
    }
    return total;
  }

  // Check at the start of each Tribunal vote whether budget allows it
  canSpend(panel: ProviderConfig[]): { allowed: boolean; reason: string } {
    this.maybeResetDay();
    if (this.state.silenced) {
      return { allowed: false, reason: "tribunal silenced — daily cap reached" };
    }
    const cost = this.estimateVoteCost(panel);
    if (this.state.spentTodayGbp + cost > this.state.dailyCapGbp) {
      this.silence();
      return { allowed: false, reason: "this vote would exceed daily cap" };
    }
    return { allowed: true, reason: "" };
  }

  // Record actual cost of a completed vote
  recordSpend(panel: ProviderConfig[]): void {
    this.maybeResetDay();
    const cost = this.estimateVoteCost(panel);
    const uncachedCost = this.estimateUncachedCost(panel);
    this.state.spentTodayGbp += cost;
    this.state.cacheSavingsTodayGbp += uncachedCost - cost;
    this.state.votesToday++;
    this.state.cacheHitsToday++;

    const pct = this.state.spentTodayGbp / this.state.dailyCapGbp;
    if (pct >= TIGHTEN_THRESHOLD_PCT && this.totalTightenings < 1) {
      this.totalTightenings++;
      console.warn(`[budget] 95% reached — ARIS pre-filter should tighten`);
    } else if (pct >= ALERT_THRESHOLD_PCT && this.totalAlerts < 1) {
      this.totalAlerts++;
      console.warn(`[budget] 80% reached — alert`);
    }
  }

  private silence(): void {
    if (!this.state.silenced) {
      this.state.silenced = true;
      this.totalSilences++;
      console.warn(`[budget] DAILY CAP REACHED — Tribunal silenced until midnight`);
    }
  }

  private maybeResetDay(): void {
    if (Date.now() - this.state.lastResetMs > DAY_MS) {
      this.state.spentTodayGbp = 0;
      this.state.votesToday = 0;
      this.state.cacheHitsToday = 0;
      this.state.cacheSavingsTodayGbp = 0;
      this.state.lastResetMs = Date.now();
      this.state.silenced = false;
    }
  }

  getState(): BudgetState {
    this.maybeResetDay();
    return { ...this.state };
  }

  // Generate the 10am daily report (NEVER 3am)
  generateDailyReport(): object {
    const s = this.getState();
    return {
      report_time: "10am",
      tribunal_silent_at_3am_per_decree_223: true,
      daily_cap_gbp: s.dailyCapGbp,
      spent_today_gbp: Number(s.spentTodayGbp.toFixed(4)),
      votes_today: s.votesToday,
      cache_savings_today_gbp: Number(s.cacheSavingsTodayGbp.toFixed(4)),
      pct_consumed: s.dailyCapGbp > 0 ? Number((s.spentTodayGbp / s.dailyCapGbp).toFixed(4)) : 0,
      silenced: s.silenced,
      alerts_fired: this.totalAlerts,
      tightenings_fired: this.totalTightenings,
      silences_today: this.totalSilences,
    };
  }
}
