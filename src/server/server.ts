// GENESIS-TRIBUNAL — Express server factory
// T19 Wave 3: server/server.ts

import express from "express";
import { config } from "../config";
import { mountRoutes } from "./server.router";
import { deadman } from "../router/tribunal.router";
import { startHeartbeat } from "../utils/heartbeat";
import { isUsingGeneratedKey } from "../iron-halo/auth.service";
import { RiskMeter } from "../commercial/risk-meter.service";
import { BudgetMeter } from "../cost/budget-meter.service";
import { CarouselService } from "../carousel/carousel.service";
import { logger } from "../utils/logger";

export function startServer(): void {
  const app = express();
  app.use(express.json({ limit: "256kb" }));

  mountRoutes(app);

  // Dead-man heartbeat OUT
  startHeartbeat(deadman, 30_000);

  // Startup banners on listen
  const budget = new BudgetMeter();
  const carousel = new CarouselService();

  app.listen(config.port, () => {
    logger.info(`GENESIS-TRIBUNAL v${config.version} listening on :${config.port}`);
    logger.info(`dead-man: ${config.deadman.host}:${config.deadman.port}`);
    logger.info(`hallucination risk protected: £${RiskMeter.getStaticBaselineRiskGbpPerWeek().toLocaleString()}/week`);
    logger.info(`vote-disagreement free data: £${RiskMeter.getStaticFreeDataAlphaGbpPerWeek().toLocaleString()}/week`);
    logger.info(`yearly protected: £${RiskMeter.getStaticTotalProtectedGbpPerYear().toLocaleString()}`);
    logger.info(`daily budget cap: £${budget.getState().dailyCapGbp}`);
    logger.info(`active carousel providers: ${carousel.activeProviderCount()}/8`);
    if (isUsingGeneratedKey()) {
      logger.warn("WARNING: using ephemeral HMAC key — set TRIBUNAL_ARIS_HMAC_KEY env var on Server A");
    }
    logger.info(`${config.spark} Round 1 — 10 diamonds shipped, ARIS Decree 223 enforced`);
  });
}
