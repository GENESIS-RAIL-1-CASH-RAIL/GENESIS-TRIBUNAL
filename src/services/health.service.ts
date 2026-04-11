// GENESIS-TRIBUNAL — Health aggregation service
// T19 Wave 4: services/health.service.ts

import { config } from "../config";

export interface HealthReport {
  ok: boolean;
  service: string;
  version: string;
  ts: number;
  uptime: number;
}

export class HealthService {
  private readonly startedAt: number = Date.now();

  getHealth(): HealthReport {
    return {
      ok: true,
      service: config.service,
      version: config.version,
      ts: Date.now(),
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }
}
