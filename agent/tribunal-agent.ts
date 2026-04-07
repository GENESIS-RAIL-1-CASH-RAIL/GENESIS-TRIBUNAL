// GENESIS-TRIBUNAL agent — embed in ARIS to send TribunalQuery via internal RPC.
// ~50 lines. Drop-in. Zero dependencies beyond Node http.
//
// Usage in ARIS:
//   import { TribunalAgent } from "./tribunal-agent";
//   const agent = new TribunalAgent();
//   const verdict = await agent.requestVote(opportunityPacket, hmacSignature);
//   if (verdict.finalVerdict === "APPROVED") executeAction();

import * as http from "http";

export class TribunalAgent {
  constructor(
    private host: string = process.env.TRIBUNAL_HOST ?? "localhost",
    private port: number = Number(process.env.TRIBUNAL_PORT ?? 8910)
  ) {}

  // Submit an opportunity for Tribunal vote. Returns the verdict.
  async requestVote(opportunityPacket: object, arisSignature: string): Promise<any> {
    const body = JSON.stringify({ opportunityPacket, arisSignature });
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: this.host,
          port: this.port,
          path: "/tribunal/vote",
          method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
          timeout: 5000,
        },
        (res) => {
          let chunks = "";
          res.on("data", (c) => (chunks += c));
          res.on("end", () => {
            try {
              resolve(JSON.parse(chunks));
            } catch (e) {
              reject(e);
            }
          });
        }
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("tribunal request timeout"));
      });
      req.write(body);
      req.end();
    });
  }
}
