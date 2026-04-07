// GENESIS-TRIBUNAL — Outbound dead-man's switch heartbeat.
// Same discipline as CHECKSUM and OVERWATCH. Heartbeats every 30s to a separate
// process. If silent for 90s, dead-man fires CHARLIE alert. Watching the watchman
// is non-negotiable.

import * as http from "http";

export class DeadmanService {
  private lastSendTs = 0;
  private lastSendOk = false;

  constructor(
    private host: string,
    private port: number,
    private path: string = "/deadman/ping"
  ) {}

  async beat(): Promise<void> {
    const payload = JSON.stringify({ from: "GENESIS-TRIBUNAL", ts: Date.now() });
    return new Promise((resolve) => {
      const req = http.request(
        {
          host: this.host,
          port: this.port,
          path: this.path,
          method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
          timeout: 5000,
        },
        (res) => {
          this.lastSendTs = Date.now();
          this.lastSendOk = (res.statusCode ?? 0) === 200;
          res.resume();
          resolve();
        }
      );
      req.on("error", () => {
        this.lastSendOk = false;
        resolve();
      });
      req.on("timeout", () => {
        this.lastSendOk = false;
        req.destroy();
        resolve();
      });
      req.write(payload);
      req.end();
    });
  }

  status(): { last_send_ts: number; last_send_ok: boolean } {
    return { last_send_ts: this.lastSendTs, last_send_ok: this.lastSendOk };
  }
}
