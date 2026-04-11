// GENESIS-TRIBUNAL — Periodic heartbeat utility
// T19 Wave 5: utils/heartbeat.ts
// Dead-man heartbeat OUT — every 30s (same discipline as CHECKSUM/OVERWATCH)

import { DeadmanService } from "../deadman.service";
import { logger } from "./logger";

export function startHeartbeat(deadman: DeadmanService, intervalMs: number = 30_000): void {
  setInterval(() => {
    deadman.beat().catch((e) => logger.error("[deadman]", e));
  }, intervalMs);
}
