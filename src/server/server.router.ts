// GENESIS-TRIBUNAL — Route mounting
// T19 Wave 3: server/server.router.ts

import { Application } from "express";
import { healthHandler } from "../controller/health.controller";
import { tribunalRouter } from "../router/tribunal.router";

export function mountRoutes(app: Application): void {
  // /health is INTENTIONALLY DUMB — never call into the verifier (Forge bug lesson)
  app.get("/health", healthHandler);

  // All tribunal routes under /tribunal prefix
  app.use("/tribunal", tribunalRouter);
}
