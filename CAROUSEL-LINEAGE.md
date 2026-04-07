# CAROUSEL LINEAGE — Predecessors, Reuse, and Upgrades

**Date:** 2026-04-07
**Filed alongside:** GENESIS-TRIBUNAL v0.1 build
**Purpose:** Document the carousel architecture lineage so we never reinvent it, and identify which patterns from TRIBUNAL should be back-ported to the predecessor services.

---

## The Lineage

GENESIS-TRIBUNAL is the **fourth** application of the multi-AI carousel pattern in the Genesis stack. Each previous application solved a different problem with the same core machinery.

```
v4.8 (2026-03-25)
  Linesman Protocol — 3-stage AI quality gate
       ↓
       ↓ (carousel + sandbox concept introduced)
       ↓
v4.11 (2026-03-26)
  Red Aggressor V6 — Dropbox Integrity War Game
  (8-provider pool, Fisher-Yates shuffle, 30-day rotation,
   bidirectional blindness, conflict exclusion, sandbox doctrine,
   ARIS Layer 2 oversight)
       ↓
       ↓ (carousel pattern formalized)
       ↓
v4.13 (2026-03-27)
  Skunkworks V2.6 — 8-AI Tournament Competition
  (anonymised slots, contamination scanning,
   CLEAN→SUSPICIOUS→CONTAMINATED verdicts)
       ↓
       ↓ (contamination scanning added)
       ↓
v4.95 (2026-04-07)
  GENESIS-TRIBUNAL v0.1 — Three-AI Decision Authority
  (Conservative Unanimous voting, ARIS Decree 223,
   Iron Halo HMAC, precedent library, prompt caching,
   £500/day budget, compound flywheel)
```

---

## Application Matrix

| Service | Use Case | What it asks the AIs |
|---|---|---|
| **Linesman v4.8** | Question quality gate | "Is this question well-formed and useful?" |
| **Red Aggressor V6 v4.11** | Dropbox file integrity verification | "Is this file clean of stego/injection/anomaly?" |
| **8-AI Tournament v4.13** | Best-question selection | "Score this question on 6 dimensions" |
| **TRIBUNAL v0.1 v4.95** | Decision authority | "Should this trade execute? YES or NO" |

**Same machinery. Four different verdict types. Zero reinvention.**

---

## What TRIBUNAL Reuses (Don't Reinvent)

| Pattern | First introduced in | Reused in TRIBUNAL as |
|---|---|---|
| 8-provider pool with anonymised slots | Red Aggressor V6 (v4.11) | `src/providers/pool.ts` — same 8 providers, exact model names |
| Fisher-Yates shuffle | Red Aggressor V6 (v4.11) | `src/carousel/fisher-yates.ts` — but per-vote instead of per-cycle |
| 30-day provider rotation | Red Aggressor V6 (v4.11) | `src/carousel/carousel.service.ts` activations map |
| Conflict exclusion (no provider scores own model) | Red Aggressor V6 (v4.11) | `src/carousel/conflict-exclusion.ts` — full 8-entry table |
| Bidirectional blindness | Red Aggressor V6 (v4.11) | Implicit in TRIBUNAL: each AI receives identical prompt, no awareness of others |
| Sandbox doctrine ("nuclear attack during handover = zero collateral damage") | Red Aggressor V6 (v4.11) | `src/iron-halo/sandbox.service.ts` |
| Contamination scanning (Unicode/injection/base64/acrostic/repetition) | Skunkworks 8-AI Tournament (v4.13) | `src/contamination/scanner.service.ts` — 5 detectors |
| CLEAN/SUSPICIOUS/CONTAMINATED verdicts | Skunkworks 8-AI Tournament (v4.13) | `ContaminationVerdict` type |
| Zero AI contact (deterministic code as intermediary) | Linesman Protocol (v4.8) | TRIBUNAL aggregator never lets AIs see each other |
| ARIS Layer 2 oversight | Red Aggressor V6 (v4.11) | ARIS pre-filter + ARIS Decree 223 binding |

---

## What TRIBUNAL Adds (NEW patterns the predecessors should consider adopting)

These are upgrades TRIBUNAL contributes back to the lineage. They should be back-ported to the older services in v0.2/Super Rail timeline.

### 1. Conservative Unanimous voting rule

**TRIBUNAL:** 3/3 YES required for action. Anything else = HOLD.
**Predecessors:** Linesman uses linear scoring, 8-AI Tournament uses ranking, Red Aggressor uses majority verdict.
**Why back-port:** For high-stakes verdicts (e.g., Red Aggressor's "is this Dropbox file safe to ingest?") the same fail-closed discipline applies. *Lost alpha is recoverable. Lost data is not.* (See `data-doctrine-keys-to-kingdom.md`.)
**Recommendation:** Red Aggressor V6 should add a `STRICT` mode that requires unanimous agreement from all 9 inspectors before declaring a file CLEAN. The default mode can stay majority.

### 2. ARIS Decree 223 voting binding

**TRIBUNAL:** Voting rules constitutionally bound by Decree 223.
**Predecessors:** No constitutional binding — verdict logic is in code, can be silently changed.
**Why back-port:** Constitutional binding prevents silent amendment. The carousel verdict logic is the most security-critical code path in any of these services.
**Recommendation:** File ARIS Decree 224 (next available number) — "Carousel Verdict Integrity Doctrine" — that constitutionally binds the verdict-aggregation logic of Linesman, Red Aggressor V6, 8-AI Tournament, and TRIBUNAL.

### 3. HMAC query authentication (Iron Halo auth)

**TRIBUNAL:** Every query is HMAC-signed by ARIS. Tribunal verifies before processing.
**Predecessors:** No query authentication. Anyone with internal network access can spoof a Linesman question or Red Aggressor scan request.
**Why back-port:** Defence-in-depth. If an attacker gets a foothold in any internal service, they should not be able to manipulate the carousel verdicts by submitting fake queries.
**Recommendation:** Add HMAC query auth to Linesman, Red Aggressor V6, and Skunkworks 8-AI Tournament in v0.2. The pattern is in `src/iron-halo/auth.service.ts` (~60 LOC).

### 4. Per-vote Fisher-Yates shuffle (instead of per-cycle)

**TRIBUNAL:** Shuffle on every single vote — no two votes see the same panel.
**Red Aggressor V6:** Shuffle per-cycle (cycle = 1 inspection round of multiple files).
**Why back-port:** Per-vote shuffle is strictly more adversary-inference-resistant. An attacker observing a sequence of inspection results cannot infer which providers are currently active because the panel changes every time.
**Recommendation:** Red Aggressor V6 should adopt per-vote shuffle in v0.2.

### 5. £/day budget cap with prompt caching

**TRIBUNAL:** £500/day cap, 80% input cost reduction via prompt caching, daily 10am report.
**Predecessors:** No budget discipline — could rack up arbitrary spend on AI calls.
**Why back-port:** Cost runaway is a real attack vector. An attacker who can submit unlimited queries to Linesman or Red Aggressor could exhaust the API budget. Budget discipline + prompt caching cuts this risk.
**Recommendation:** All three predecessor services should adopt the budget meter pattern from `src/cost/budget-meter.service.ts` (~100 LOC). Different cap values per service based on volume.

### 6. Precedent library + compound flywheel

**TRIBUNAL:** Every verdict becomes a precedent. Future similar queries hit the precedent layer instead of paying for a fresh vote. 22% monthly decline in vote count.
**Predecessors:** Every query gets a fresh vote — no caching of prior verdicts.
**Why back-port:** Massive cost reduction over time. For Linesman/Red Aggressor/8-AI Tournament, a precedent library would mean repeat queries (which are common) get instant verdicts at zero AI cost.
**Recommendation:** Adopt the precedent library pattern from `src/aris/precedent-library.service.ts` (~120 LOC). Each service tunes its own similarity threshold (TRIBUNAL uses 0.95).

### 7. Daily 10am report (NEVER 3am wake-up)

**TRIBUNAL:** All alerting is consolidated into a 10am daily report. Zero 3am wake-ups, ever. Bound by Decree 223 clause 3.
**Predecessors:** Some have ad-hoc alerting that could fire at any hour.
**Why back-port:** Standing Order #7 (Safety > Alpha) and the data doctrine both demand we engineer past human reliance on cognitive availability.
**Recommendation:** All three predecessor services should consolidate alerting into a 10am report. Critical incidents go into a quarantine queue for the morning, not an immediate page.

---

## Discipline Reminder

**Don't reinvent. Extend.**

When the next sibling of CHECKSUM is born (and there will be more — the doctrine table in `training-doctrine.md` predicts at least four more), the first question should always be: *"What carousel pattern from TRIBUNAL/Red Aggressor/Linesman/8-AI Tournament does this extend?"* Building on existing battle-tested infrastructure is what kept TRIBUNAL at 1,724 LOC instead of 5,000+.

The Genesis stack is now 4-deep on the carousel pattern. By the time we're 8-deep, this lineage document should still be the reference.

---

## Cross-References

- `GENESIS-RAIL-1-CASH-RAIL/GENESIS-SOP-AI-ROADMAP-RAIL-1/RAIL_WIRING_GOVERNANCE.md` — Addendums v4.8, v4.11, v4.13, v4.95
- `GENESIS-RED-AGGRESSOR-FORCE/TRIBUNAL_CROSSREF.md` — short cross-reference note inside Red Aggressor
- `GENESIS-CENTRAL-LIBRARY/notepad.md` — original Spark #045 Round 1 drill output
- `~/.claude/projects/-home-ubuntu/memory/training-doctrine.md` — siblings of CHECKSUM table
- `GENESIS-ARIS-SUPREME-COURT/src/services/tribunal-decree.ts` — Decree 223 text
