# GENESIS-TRIBUNAL — Specification v0.1

**Spark:** #045
**Status:** v0.1 BUILD — minimal slice from Round 1 diamonds
**Built:** 2026-04-07 (same day as CHECKSUM v0.2 + OVERWATCH v0.1)
**Lens that produced the design:** Dr. Margaret Hamilton (Apollo triplex computing) + the Petrov Doctrine
**Bound by:** ARIS Decree 222 (CHECKSUM Promotion Gate) + ARIS Decree 223 (Tribunal Voting & Fail-Safe)

## Mission

**Three-AI independent voting tribunal.** Hybrid cognitive cross-verification + time-critical decision authority. When OVERWATCH detects an opportunity that exceeds ARIS's standing-decree authority, the Tribunal asks 3 independent AI providers to vote, oblivious to each other. **3/3 unanimous YES → APPROVED. Anything else → HOLD.** No human in the loop. No 3am wake-up. *"If we have to wake Commander to do it, we don't do it."*

## Carousel Lineage (DO NOT REINVENT)

TRIBUNAL extends infrastructure that already exists in the stack:

| Predecessor | Pattern | Re-used in TRIBUNAL |
|---|---|---|
| **v4.8 Linesman Protocol** (Skunkworks V2.2) | 3-stage AI chain, deterministic code as intermediary, zero AI contact | Voting state machine; sandbox isolation |
| **v4.11 Red Aggressor V6** (Dropbox War Game) | 8-provider pool, Fisher-Yates per-cycle shuffle, 30-day rotation, bidirectional blindness, conflict exclusion, ARIS Layer 2 oversight | Carousel selector, conflict exclusion table, sandbox doctrine |
| **v4.13 8-AI Tournament** (Skunkworks V2.6) | Anonymised slots, contamination scanning (Unicode/injection/base64/acrostic/repetition), CLEAN→SUSPICIOUS→CONTAMINATED verdicts | Contamination scanner |

What TRIBUNAL adds that the predecessors do NOT have:

1. **Conservative Unanimous voting** (3/3 required, anything else = HOLD)
2. **ARIS Pre-Filter** with 6 conditions for auto-authorize
3. **Precedent library compounding flywheel** (22% monthly Tribunal call decline)
4. **HMAC query authentication** (Iron Halo)
5. **£500/day budget cap** with mandatory prompt caching
6. **Constitutional binding** via ARIS Decree 223
7. **Petrov override pathway**

## Cardinal Rules

1. **3/3 unanimous YES required for APPROVED.** Anything else = HOLD. Bound by Decree 223 clause 1.
2. **Default at 2am is HOLD.** No 3am wake-ups, ever. Decree 223 clause 3.
3. **Lost alpha is recoverable. Lost capital is not.** Decree 223 clause 2.
4. **Iron Halo containment.** No wallet access, outbound-only egress, internal-only RPC.
5. **CHECKSUM-wired from day one.** Same discipline as CHECKSUM and OVERWATCH.
6. **External dead-man switch.** On a separate process. Same discipline.
7. **Boring is a feature.** v0.1 ≤ 2200 LOC. No clever-for-clever's-sake.
8. **Single instance v0.1.** Multi-instance Raft + CRDT all deferred to Super Rail.

## Architecture

```
+---------------------------------------------------+
|  GENESIS-TRIBUNAL v0.1 (port 8910)                |
|                                                   |
|  ARIS submits TribunalQuery (HMAC signed)         |
|         ↓                                         |
|  ARIS Pre-Filter (6 conditions)                   |
|         ├─ all green → AUTO-AUTHORIZE             |
|         └─ any fail → escalate                    |
|                ↓                                  |
|         Budget check (£500/day cap)               |
|                ↓                                  |
|         Carousel selects 3 of 8 providers         |
|         (Fisher-Yates, conflict exclusion)        |
|                ↓                                  |
|         Iron Halo wraps outbound calls            |
|         (HMAC signed prompt, 2800ms timeout)      |
|                ↓                                  |
|         3 AIs vote in parallel (oblivious)        |
|                ↓                                  |
|         Contamination scanner (5 detectors)       |
|                ↓                                  |
|         Voting aggregator (Conservative Unanimous)|
|                ↓                                  |
|         APPROVED (3/3 YES) | HOLD (anything else) |
|                ↓                                  |
|         Precedent library indexes the verdict     |
|         (future similar opportunities → cheap)    |
|                                                   |
|  CHECKSUM agent (8898) ←- ticks                   |
|  Dead-man heartbeat → 8911 (out)                  |
+---------------------------------------------------+
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Process liveness (intentionally dumb) |
| POST | `/tribunal/vote` | ARIS submits opportunity for vote (HMAC required) |
| GET | `/tribunal/state` | Full state: counters, voting, ARIS pre-filter, precedents, budget, risk, flywheel, carousel, harvest |
| GET | `/tribunal/risk` | Diamond 1 — £920k/week hallucination risk meter |
| GET | `/tribunal/budget/report` | Diamond 8 — daily budget report (10am only, never 3am) |
| GET | `/tribunal/flywheel/projection` | Diamond 6 — projected Tribunal call rate over N months |
| GET | `/tribunal/deadman/last` | Last outbound dead-man heartbeat status |
| POST | `/tribunal/sign` | Helper: HMAC-sign a payload (for ARIS integration testing) |

## Internal Loops

| Name | Hz | Purpose |
|---|---|---|
| `budget-tick` | 1/60s | Detect daily reset, refresh budget state |
| `flywheel-monthly-tick` | 1/30d | Apply one month's Tribunal call rate decline |
| `deadman-out` | 1/30s | Heartbeat to external dead-man |

## What's NOT in v0.1 (Super Rail backlog)

- BLS12-381 + Dilithium post-quantum signatures (HMAC v0.1, BLS v0.3)
- CRDT P2P sync (Yjs-lite, libp2p-lite) for multi-instance Tribunals
- Cholesky Mahalanobis 5.2σ anomaly detection
- PostgreSQL cold-path audit trail (in-memory v0.1)
- Real Redis backend for precedent library
- Real AI provider API clients (stub-caller.ts in v0.1, Commander wires keys on Server A)
- Interactive 3D Plotly/Three.js Commander dashboards
- HotStuff-2 chained QC for Tribunal verdicts (wrong layer — verdicts go through ARIS)

These are all in git history from Spark #045 Round 1. Each becomes its own focused upgrade as forge moments demand.
