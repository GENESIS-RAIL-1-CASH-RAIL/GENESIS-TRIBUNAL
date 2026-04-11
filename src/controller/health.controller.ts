// GENESIS-TRIBUNAL — Health endpoint controller
// T19 Wave 4: controller/health.controller.ts
// INTENTIONALLY DUMB — never calls into the verifier (Forge bug lesson)

import { Request, Response } from "express";
import { HealthService } from "../services/health.service";

const healthService = new HealthService();

export function healthHandler(_req: Request, res: Response): void {
  res.json(healthService.getHealth());
}
