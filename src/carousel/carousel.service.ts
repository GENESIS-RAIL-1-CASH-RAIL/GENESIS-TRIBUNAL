// GENESIS-TRIBUNAL — Carousel selector
// DIAMOND 3 from Spark #045 Round 1.
// Selects 3 of 8 providers per vote via Fisher-Yates, applying conflict exclusion.
// 30-day rolling provider activation tracked for governance.

import { ProviderConfig } from "../types";
import { PROVIDER_POOL } from "../providers/pool";
import { isExcluded } from "./conflict-exclusion";
import { selectN } from "./fisher-yates";

interface ProviderActivation {
  providerName: string;
  activatedAtMs: number;
  contaminationRate24h: number;
  excludedUntilMs: number; // 0 if not excluded
}

const TRIBUNAL_PANEL_SIZE = 3;
const PROVIDER_EXCLUSION_DURATION_MS = 24 * 3600 * 1000; // 24h kill-switch
const CONTAMINATION_RATE_TRIGGER = 0.02; // 2% per Decree 223 clause 7

export class CarouselService {
  private activations: Map<string, ProviderActivation> = new Map();

  constructor() {
    const now = Date.now();
    for (const p of PROVIDER_POOL) {
      this.activations.set(p.name, {
        providerName: p.name,
        activatedAtMs: now,
        contaminationRate24h: 0,
        excludedUntilMs: 0,
      });
    }
  }

  // Per-vote selection. Returns 3 providers excluding any:
  //  - currently in 24h contamination kill-switch
  //  - conflicting with the subject model hint (if any)
  selectPanel(subjectModelHint?: string): ProviderConfig[] {
    const now = Date.now();
    return selectN(PROVIDER_POOL, TRIBUNAL_PANEL_SIZE, (p) => {
      const a = this.activations.get(p.name);
      if (a && a.excludedUntilMs > now) return true; // killed
      if (isExcluded(p.name, subjectModelHint)) return true;
      return false;
    });
  }

  // Called by contamination scanner when a provider's vote is found contaminated
  recordContamination(providerName: string, contaminated: boolean): void {
    const a = this.activations.get(providerName);
    if (!a) return;
    // Simple EMA with alpha 0.05 (~last 20 votes)
    a.contaminationRate24h = a.contaminationRate24h * 0.95 + (contaminated ? 0.05 : 0);
    if (a.contaminationRate24h > CONTAMINATION_RATE_TRIGGER) {
      a.excludedUntilMs = Date.now() + PROVIDER_EXCLUSION_DURATION_MS;
      console.warn(`[carousel] PROVIDER EXCLUDED 24h: ${providerName} contamination=${a.contaminationRate24h.toFixed(4)}`);
    }
  }

  getActivations(): ProviderActivation[] {
    return Array.from(this.activations.values());
  }

  activeProviderCount(): number {
    const now = Date.now();
    return Array.from(this.activations.values()).filter((a) => a.excludedUntilMs <= now).length;
  }
}
