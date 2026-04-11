// GENESIS-TRIBUNAL — Centralised configuration
// T19 Wave 2: config.ts

export const config = {
  service: "GENESIS-TRIBUNAL",
  version: "0.1.0",
  port: Number(process.env.TRIBUNAL_PORT ?? 8910),
  deadman: {
    host: process.env.DEADMAN_HOST ?? "localhost",
    port: Number(process.env.DEADMAN_PORT ?? 8911),
  },
  budget: {
    dailyCapGbp: Number(process.env.TRIBUNAL_DAILY_CAP_GBP ?? 5),
  },
  hmacKey: process.env.TRIBUNAL_ARIS_HMAC_KEY ?? "",
  spark: "Spark #045",
} as const;
