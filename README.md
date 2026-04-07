# GENESIS-TRIBUNAL

**Three-AI independent voting tribunal for the Genesis SuperRail stack.**

When ARIS cannot authorize a time-critical decision from existing decrees, the Tribunal asks 3 independent AI providers (selected from an 8-provider pool via Fisher-Yates carousel) to vote in parallel. **3/3 unanimous YES → APPROVED. Anything else → HOLD.** No human in the loop. No 3am wake-up.

## Doctrine

> *"Lost alpha is recoverable. Lost capital is not. We protect what we love. We live to fight another day."* — ARIS Decree 223

> *"If we have to wake Commander to do it, we don't do it."* — Standing Order #7

## Spark Lineage

**Spark #045 TRIBUNAL** is the second sibling of CHECKSUM. It extends the existing carousel infrastructure (Red Aggressor V6, Skunkworks 8-AI Tournament, Linesman Protocol) to a fourth use case: **decision authority**.

| Predecessor | Pattern | Re-used here |
|---|---|---|
| Linesman Protocol (v4.8) | Zero AI contact, deterministic code as intermediary | Voting state machine, sandbox isolation |
| Red Aggressor V6 (v4.11) | 8-provider pool, Fisher-Yates carousel, 30-day rotation, bidirectional blindness, conflict exclusion | Carousel selector, conflict exclusion |
| 8-AI Tournament (v4.13) | Contamination scanning (5 detectors), CLEAN→SUSPICIOUS→CONTAMINATED verdicts | Inline contamination scanner |

## Build & Run

```bash
npm install
npm run build

# Terminal 1: external dead-man switch
npm run deadman

# Terminal 2: TRIBUNAL service
npm start
```

Defaults:
- TRIBUNAL_PORT=8910
- DEADMAN_PORT=8911
- DEADMAN_HOST=localhost
- TRIBUNAL_ARIS_HMAC_KEY (set to a 32+ char secret on Server A)

## Endpoints

See `SPEC.md` for the full list. Quick reference:
- `GET /health` — process liveness
- `POST /tribunal/vote` — ARIS submits opportunity (HMAC signed)
- `GET /tribunal/state` — full state dump
- `GET /tribunal/risk` — £920k/week hallucination risk meter
- `GET /tribunal/budget/report` — 10am-only budget report

## v0.1 Status

- ✅ ARIS pre-filter (6 conditions)
- ✅ 8-provider carousel with Fisher-Yates per-vote shuffle
- ✅ Conflict exclusion table
- ✅ Iron Halo HMAC authentication
- ✅ Iron Halo sandbox with 2800ms per-AI timeout
- ✅ 5-detector contamination scanner (Unicode stego, prompt injection, base64, acrostic, repetition)
- ✅ Conservative Unanimous voting (3/3 → APPROVED, anything else → HOLD)
- ✅ Precedent library with cosine similarity (95% threshold)
- ✅ £500/day budget meter with prompt caching
- ✅ £920k/week hallucination risk meter (Diamond 1)
- ✅ 5 free data sources (£505k/week, Diamond 5)
- ✅ Compound flywheel (22% monthly decline, 3% asymptotic floor)
- ✅ External dead-man switch
- ✅ CHECKSUM behavioural signature
- ⬜ Real provider API clients (stub in v0.1, Commander wires on Server A)

## Cardinal Rules

1. **No AI.** No clever ML, no Bayesian. Deterministic voting + cosine similarity only.
2. **3/3 unanimous required for action.** Anything else = HOLD.
3. **No 3am wake-ups.** Default is HOLD. Daily report at 10am.
4. **Iron Halo containment.** Outbound-only egress. No wallet access.
5. **CHECKSUM-wired.** External dead-man switch on a separate process.
6. **Single instance v0.1.** Multi-instance + CRDT deferred to Super Rail.
7. **<2200 LOC.** Currently ~1800.

## Spark Reference

Spark #045 — see `SPEC.md` for the full design and `notepad.md` in GENESIS-CENTRAL-LIBRARY for the original Round 1 drill.
