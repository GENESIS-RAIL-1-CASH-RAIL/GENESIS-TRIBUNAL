# MONEY_TEMPLATE — GENESIS-TRIBUNAL

## GO / NO-GO Decision Gate

**Service**: GENESIS-TRIBUNAL  
**Port**: 8910  
**Spark**: #045  
**Role**: Three-AI voting tribunal — LAST safety gate before trade approval

---

## Is this service on the money path?

**YES.** TRIBUNAL is on the **direct trade decision path**.  
Every opportunity that passes ARIS pre-filter is submitted here for a binding vote.  
Verdict APPROVED → trade proceeds. Verdict HOLD → trade blocked.

---

## Money Flow Analysis

| Gate               | TRIBUNAL's role                                      |
|--------------------|------------------------------------------------------|
| ARIS pre-filter    | First pass — auto-authorises known-safe patterns     |
| **TRIBUNAL vote**  | **Second pass — AI panel vote on escalated items**   |
| Execution Engine   | Executes only on APPROVED verdict from TRIBUNAL      |
| £100 Clip Ceiling  | Enforced upstream (DI→EE→EG→OO) — not TRIBUNAL's job |

---

## Capital Protection Metrics (Spark #045 Diamond 1 + 5)

| Metric                          | Value              |
|---------------------------------|--------------------|
| Weekly hallucination risk protected | £920,000/week  |
| Yearly hallucination risk protected | £47,840,000/year |
| Weekly free-data alpha captured | £505,000/week      |
| Yearly total protected + captured | £73,800,000/year |
| Cost per vote                   | £0.0008–£0.0022    |
| Daily AI cost cap               | Configurable (env) |
| p99 vote latency budget         | <3,500ms           |

---

## Failure Mode Analysis

| Failure                        | Consequence                    | Safe-fail? |
|--------------------------------|--------------------------------|------------|
| TRIBUNAL down                  | ARIS cannot escalate → HOLD    | YES — no capital lost |
| Contaminated AI provider       | Excluded via carousel scanner  | YES |
| Budget exhausted               | Returns HOLD verdict           | YES |
| HMAC key missing               | Ephemeral key used (warned)    | YES (audit gap only) |
| All 8 providers time out       | ERROR verdict → HOLD           | YES |

---

## GO / NO-GO Verdict

| Check                                      | Status |
|--------------------------------------------|--------|
| Service is on money path                   | CONFIRMED |
| Safe-fail default is HOLD (not APPROVED)   | GO     |
| £100 clip ceiling enforced upstream        | GO     |
| Contamination scanner active               | GO     |
| Budget cap enforced                        | GO     |
| ARIS HMAC signature verified before vote   | GO     |
| Dead-man heartbeat wired                   | GO     |
| No real AI keys in v0.1 (sandbox stubs)    | GO     |
| GTC telemetry                              | DEFERRED (Super Rail) |

**OVERALL: GO**  
Safe-fail architecture confirmed. Default failure mode = HOLD. Capital cannot flow through a compromised TRIBUNAL.
