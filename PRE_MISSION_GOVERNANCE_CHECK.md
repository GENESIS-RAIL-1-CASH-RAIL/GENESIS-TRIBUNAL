# PRE_MISSION_GOVERNANCE_CHECK — GENESIS-TRIBUNAL

## Service Purpose
Three-AI independent voting tribunal. Spark #045.
Hybrid cognitive cross-verification + time-critical decision authority.
Bound by ARIS Decree 222 (CHECKSUM Promotion Gate) + ARIS Decree 223 (Tribunal Voting).

Port: **8910**

## Role in the Stack
TRIBUNAL sits on the **decision path** between ARIS pre-filter and execution. It is the last safety gate before a trade opportunity is approved. Every vote that escalates past ARIS pre-filter lands here. Its verdict is final.

## Key Diamonds (Spark #045)
1. £920k/week hallucination risk protected (£47.84M/year)
2. ARIS Decree 223 wired
3. 8-provider carousel with conflict exclusion table
4. Full contamination scanner with kill-switch
5. 5 free data sources: £505k/week, £26.3M/year
6. 22% monthly decline / 3% asymptotic floor flywheel
7. Voting state machine <3500ms p99 latency
8. Cost £0.0008–£0.0022/vote with 80% prompt caching
9. 5-detector contamination scanner
10. CHECKSUM behavioural signature (signatures/tribunal.yaml)

## Upstream Dependencies
| Caller        | Endpoint hit              | Purpose                          |
|---------------|--------------------------|----------------------------------|
| ARIS          | POST /tribunal/vote      | Escalate opportunity for vote    |
| MIL           | POST /tribunal/autopsy/intake | Fire-and-forget SEE reject log |
| DEADMAN (8911) | outbound heartbeat      | Dead-man uptime signal           |

## Downstream Dependencies
| Service        | Used for                      |
|----------------|-------------------------------|
| AI Carousel providers (8 pools) | Tribunal votes via iron-halo sandbox |
| DEADMAN (8911) | Periodic beat OUT              |

## Risk Profile
- **Tier**: CRITICAL — on the live trade decision path
- **Failure mode if down**: ARIS cannot escalate; all borderline trades silently HOLD
- **Blast radius**: No capital lost (safe-fail = HOLD), but alpha bleed if prolonged
- **£100 Clip Ceiling**: enforced upstream by ARIS + EE + EG + OO gates — TRIBUNAL does NOT re-enforce
- **Contamination risk**: mitigated by 5-detector scanner + carousel exclusion table

## GO / NO-GO Pre-Build Gate
This service was originally built on 2026-04-07 from Spark #045 Grok Round 1 diamonds.
The T19 refactor (2026-04-11) is a **structural compliance refactor only** — zero logic changes.

| Gate                              | Status |
|-----------------------------------|--------|
| Spark BEDROCK filed               | GO     |
| Model-T19 wave structure          | GO (this refactor) |
| GTC telemetry emission            | DEFERRED (Super Rail) |
| ARIS Decree 223 wired             | GO     |
| Dead-man heartbeat wired          | GO     |
| Contamination scanner wired       | GO     |
| No real AI keys in v0.1           | GO (iron-halo sandbox stubs) |
| £100 clip ceiling                 | GO (enforced upstream)       |
