# Phase U — "Understand": Run Summary & Exit-Gate Status

**Executed:** 2026-07-03, in Claude Code, against Gina Thomas's Primary mailbox via the M365 (Graph) connector.
**Window:** 2026-01-01 → 2026-07-03 (~6 months, ~10,739 Inbox messages).
**AI Builder credits spent:** 0 (runs entirely in Claude Code; does not replace the Step 0.5 credit gate — §3b).
**Persistence rule honored:** aggregates and findings only; no email bodies, no verbatim excerpts, no bulk subject listings saved (§3c). Subject fragments appear only as anonymized pattern examples.

## Deliverables produced (this folder)
1. `phaseU_sender_map.md` — sender/domain clusters, volume ranks, onboarding-card evidence.
2. `phaseU_volume_histogram.csv` (+ `.md` narrative) — monthly totals & cluster counts (reliable); category/lane mix (sample-extrapolated). Excel-ready; Save-As .xlsx if a workbook is needed.
3. `phaseU_trigger_words.md` — priority triggers, system-exception signatures, anti-triggers.
4. `phaseU_outlook_audit.md` — folder/rule/category findings + connector-limit self-report checklist.
5. `phaseU_taxonomy_v4.md` — **DRAFT** revised categories & lanes with evidence-based merge/split decisions and R1–R5 disambiguation rules.
6. `phaseU_stress_test_protocol.md` — §3f procedure & scoresheet (sample drawn live, not persisted).

## Headline findings
- **Volume is ~10,700 over 6 months (~60–65/day), not "a few hundred."** Directly resizes Echo (~10,700 rows) and the Step 0.5 credit math (§3h cross-check).
- **~55–60% of mail is FYI/Promotions/Ministry noise; the BSD action surface is ~30%; System Exceptions are ~1–2% but highest value.** Sorter's precision on the *noise tail* is the make-or-break design factor.
- **The taxonomy needs 4 structural changes** (Deliverable 5): retire **SMARTSHEET** as a category (it's a transport carrying 5 other categories), promote **PROMOTIONS/SUBSCRIPTIONS/MISC** to a first-class category, and add **MINISTRY / CHURCH-COMMUNITY** (~1,200 unhoused msgs) and **FACILITIES – Inspection Reports** (~700 high-volume/low-action). Add rules R1–R5.
- **System-exception signatures are learnable** (Deliverable 3B) — this is the class the whole spec exists to stop from "sitting three days."

## Decisions confirmed by Gina (2026-07-03)
- **Role/title:** **Business Systems & Solutions Manager** (M365 profile to be updated later). Card #1 set.
- **Teams (§3b):** use the **new BSSI Teams channel** (new/low-volume) as the Teams touchpoint of record — no full Teams pull needed. (Calendar context remains: heavy standing meetings — BSD Weekly Check-In, WIN Team/Staff Hub, Finance/Procurement, NetSuite/Oracle sessions, CBO Directors, 1:1 w/ Lettie Carr; ~149 events in June.)
- **Shared mailboxes:** **do NOT use at this time.** `Additional Mailboxes` empty for pilot; Scout/Sweep target Primary only. Procurement mailbox stays tabled.

## §3f stress test — COMPLETE
- **First 50** (Gina hand-classified): 40/48 clean = 83%. Failures were not random — 4 systematic gaps → rules R1 (platform≠category, use Source System), R5-refined, R6 (owner-vs-informed), R7 (finance/system/contract tie-break), R8 (process-request).
- **Fresh, non-overlapping 50** (mid-Jan/Mar/May, rule-classified then Gina-audited): **45/50 agreed = 90% → gate met.** Residual 5 → R9 (learning vs promotions), R10 (IT-support/equipment ownership), and the Needs-Review disposition for ambiguous system items.
- **Richest finding:** Gina's mental model is **owner-vs-informed first** — the same content is Action if she owns the next step, FYI if she's only cc'd. R6 is now the backbone of Sorter's lane/priority logic.

## Exit-gate status (§3g) — ✅ CLEARED 2026-07-03
| # | Criterion | Status |
|---|---|---|
| 1 | ≥90% of ~50-email stress test classifies cleanly | ✅ **Met** — fresh 50 cleared at 45/50 = 90% (first 50 drove the rule fixes) |
| 2 | All 5 onboarding cards fillable with real data | ✅ **Met** — evidence in Deliverables 1 & 3 |
| 3 | Taxonomy frozen (Deliverable 5 final → authoritative for Scout/Sorter) | ✅ **Met** — Deliverable 5 frozen with 18 categories, 7 lanes, rules R1–R10 + Needs-Review |

**→ Step 0 (Scout) is AUTHORIZED.** All three gate criteria met. Frozen taxonomy (Deliverable 5) is the source for Scout's `businessCategory` / `Digest Lane` / `Source System` column JSON and Sorter's classifier prompt (§3h). Remember: R1 must sit at the top of Sorter's prompt (the platform-first human default fights it), and the `Source System` field is what lets you keep the Smartsheet/NetSuite view without polluting the category.
