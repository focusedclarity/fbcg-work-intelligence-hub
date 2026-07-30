# WAIH Command Center — Build Progress (memory)

Durable progress log for the Work Action Intelligence Hub "Command Center" build.
Committed to the repo so it syncs across machines via GitHub (the Claude Desktop
`[[wikilink]]` memory lives externally; this is the in-repo mirror of record).

Last updated: 2026-07-30

## Layer model (North Star)
- **Hub flows = the hands** — classify / route / act (Power Automate over SharePoint Lists A/B/C).
- **Claude Code repo = the brain** — principles / SOPs / templates / specs (this repo).
- **Dashboard = the single pane of glass** — Power Apps over the lists + a Copilot Q&A layer.

## Phase status

### ✅ Phase 1 — Foundation & classification (DONE)
- Phase U mailbox analysis complete (Jan 1–Jul 3 2026, ~10,700 msgs).
- Taxonomy **frozen**: `phaseU_taxonomy_v4.md` (18 business categories, 7 digest lanes, rules R1–R10 + Needs-Review). Stress test passed 90% on a fresh 50-email sample.
- Lists A/B/C created on site `m365appbuilder-app-3155`; List A calculated columns (`Days Since Received`, `Confidence Band`) added.
- **Sorter (Flow 1) LIVE / published / tested / credit-resilient**: Outlook trigger → `Run a prompt` (AI Builder, GPT-4.1 mini, 13-key JSON) → `Parse JSON` → `Create item` (22 cols). Rule-based fallback path fires when AI Builder credits are exhausted (`Forbidden`). Web Link (Outlook Web deep link) populated on Create.

### ✅ Phase 2 — Views layer (DONE)
- All list views built & verified live: List A (8), List B (4), List C (4).
- Known data note: List A has no literal `Confidence Band` column — Needs-Review view uses `Confidence`. Flag if dashboard needs a band field.

### ✅ Phase 3 — Roadmap lock + playbook benchmarking (DONE)
- Triage-layer plan refined against best-in-class playbooks (Martell AI Operating System + Exec Admin; Herk Inbox Agent) — `references/playbooks/`.
- Finalization decisions LOCKED: build order, SLA windows, Watchdog cadence, Steward archive ages, dashboard metrics (Time Saved · Cost · Output Consistency · ROI).

### 🔨 Phase 4 — Tempo (Flow 5a) — SLA-driven follow-up windows (IN PROGRESS)
- Spec: `PhaseU/tempo_flow5a_build.md` (this session, 2026-07-30).
- Sets `Follow-Up Date` on List A rows from Priority + Recipient Scope + Received/Last Status Change, honoring `Due Date Stated` override. Fully deterministic (no AI Builder) → not blocked by credit exhaustion.

## Next after Phase 4 (locked build order)
5. List B upsert branch inside Sorter (Buyback gate).
6. Watchdog (Flow 6) — two digest passes/day (~10 AM & 5 PM ET) + immediate High / Direct-to-Me pings.
7. Sweep (Flow 8) — on Status→Done/Reference, move Outlook mail to Hub/Done or /Reference.
8. Courier (Flow 9) — send-only (Gina writes drafts); Draft Status=Approved → send + stamp.
9. Steward — M365-native reversible archive via Approvals cards (no PST, no hard delete).
10. Dashboard polish + Copilot Q&A layer.

## Open items needing Gina (⧗)
- Copilot Q&A layer: M365 Copilot vs Copilot Studio agent over the SharePoint data.
- AI middle tier: OpenRouter key (recommended) — else stay on rule-based fallback.
- Watchdog timezone confirm (assumed ET).
- Future-phase sources: what feeds *transactions* (NetSuite?) and *meeting summaries* (Teams/Zoom/Copilot?).
