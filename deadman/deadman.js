#!/usr/bin/env node
// GENESIS-TRIBUNAL Dead-Man's Switch — external watchdog.
// ~85 lines. Pure Node. Zero dependencies. Different process from TRIBUNAL.
// Same discipline as CHECKSUM and OVERWATCH dead-mans. Read once, trust forever.

const http = require("http");

const PORT = Number(process.env.DEADMAN_PORT || 8911);
const TIMEOUT_MS = Number(process.env.DEADMAN_TIMEOUT_MS || 90_000);
const CHECK_HZ_MS = 5_000;

let lastHeartbeat = Date.now();
let lastSource = null;
let triggered = false;
let heartbeatCount = 0;

function trigger() {
  if (triggered) return;
  triggered = true;
  const sinceMs = Date.now() - lastHeartbeat;
  console.error("=================================================");
  console.error(`[TRIBUNAL-DEADMAN] HEARTBEAT MISSING for ${sinceMs}ms`);
  console.error(`[TRIBUNAL-DEADMAN] BATTLE STATIONS CHARLIE`);
  console.error(`[TRIBUNAL-DEADMAN] LAST HEARTBEAT: ${new Date(lastHeartbeat).toISOString()}`);
  console.error(`[TRIBUNAL-DEADMAN] LAST SOURCE: ${lastSource}`);
  console.error(`[TRIBUNAL-DEADMAN] DAILY REPORT FLAG SET (10am, never 3am per Decree 223)`);
  console.error("=================================================");
}

function untrigger() {
  if (!triggered) return;
  triggered = false;
  console.log(`[TRIBUNAL-DEADMAN] [RECOVERY] heartbeat resumed`);
}

setInterval(() => {
  const since = Date.now() - lastHeartbeat;
  if (since > TIMEOUT_MS) trigger();
  else if (triggered) untrigger();
}, CHECK_HZ_MS);

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/deadman/ping") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const j = JSON.parse(body);
        lastHeartbeat = Date.now();
        lastSource = j.from || "unknown";
        heartbeatCount++;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }
  if (req.method === "GET" && req.url === "/deadman/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      last_heartbeat_ts: lastHeartbeat,
      last_source: lastSource,
      seconds_since_last: Math.floor((Date.now() - lastHeartbeat) / 1000),
      timeout_ms: TIMEOUT_MS,
      triggered,
      heartbeat_count: heartbeatCount,
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[TRIBUNAL-DEADMAN] listening on :${PORT}`);
  console.log(`[TRIBUNAL-DEADMAN] timeout: ${TIMEOUT_MS}ms`);
  console.log(`[TRIBUNAL-DEADMAN] PID: ${process.pid}`);
});
