# WAIH Command Center — Execution Checklist

> Track the whole build here. Do **Part 0 once, up front**, then work **Part 1** phase by phase.
> Check items off and commit this file after each session so the other computer sees progress
> (see `PhaseU/SYNC_BOTH_COMPUTERS.md`). Full detail for each phase is in the BUILD_SPEC docs.
> Site (full URL everywhere): `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`.

---

## PART 0 — One-time setup (create EVERYTHING up front)

### 0.1 Verify the Status internal name (do this FIRST)
- [x] List A `Status` internal name = **`Status`** — ✅ confirmed live 2026-07-29 (REST).
- [x] List B `Status` internal name = **`Status`** — ✅ confirmed live. (Both lists; the planned `HubStatus`/`SubStatus` overrides were never applied — lists were built manually, so internal = display.)
  *(Every OData Filter Query uses `Status`. `scout_listA_columns.json` was correct. Also: no `ConfidenceBand` column exists — only `Confidence`; message-id field internal name = `SourceLinkMessageID`.)*

### 0.2 SharePoint columns to add to List A (`Inbox Action Register`)
- [x] `PlannerTaskId` — Single line of text — *(Phase 2 dedupe key)* ✅ created live 2026-07-29
- [x] `SweptDate` — Date and Time — *(Phase 7 marker)* ✅ created live 2026-07-29
- [x] `DraftBody` — Multiple lines of text, Enhanced rich text — *(Phase 8)* ✅ created live 2026-07-29
- [x] `DraftTo` — Single line of text — *(Phase 8)* ✅ created live 2026-07-29
- [x] `SubLoggedDate` — Date and Time — *(Phase 9)* ✅ created live 2026-07-29
- [x] `ArchivedDate` — Date and Time — *(Phase 10)* ✅ created live 2026-07-29
- [x] `ArchiveSnoozeUntil` — Date and Time — *(Phase 10)* ✅ created live 2026-07-29
  *(All 7 List A columns now exist — REST-verified 2026-07-29.)*

### 0.3 SharePoint document libraries (Site contents → New → Document library)
- [x] `Meeting Intake` — *(Phase 6 JSON drop)* ✅ created live 2026-07-29
- [x] `Daily Digest` — *(Phase 4 Copilot-groundable brief)* ✅ created live 2026-07-29

### 0.4 Planner
- [x] Plan **`BSSI Work Actions`** created ✅ 2026-07-29 — hosted in the **Gina** M365 group (user's choice; personal-group, noted vs group-ownership default).
- [~] Buckets: **2 of 7 done** (`System Exceptions / Workflow Breaks`, `Action Required`). **Remaining 5:** `Waiting On Others` · `Leadership / Reporting` · `Ministry / Community` · `FYI / Learning Reference` · `Promotions / Subscriptions / Misc`. Add via Planner → BSSI Work Actions → Board → "Add a new bucket" → type name → **Enter** (Enter commits reliably).

### 0.5 Outlook folders
- [ ] `BSSI Hub/Done`
- [ ] `BSSI Hub/Reference`
- [ ] `BSSI Hub/Archive`

### 0.6 Power Automate connections (all STANDARD — no premium)
- [ ] Office 365 Outlook · [ ] SharePoint · [ ] Planner · [ ] Microsoft Teams · [ ] Approvals

---

## PART 1 — Build phases (in order). Each phase: build → **you** click *Save & turn on* → run its test.

| ✔ | Phase | Flow / artifact | Trigger | Spec | Done when… |
|---|---|---|---|---|---|
| [ ] | 1 | **Tempo** — Follow-Up dates | Recurrence hourly | phase0-3 | a New/owned row with no FollowUpDate gets a weekday date per priority |
| [ ] | 2 | **Planner forward-sync** | SP item created/modified (loop-safe) | phase0-3 | setting `Reviewed=Yes` on an eligible row creates a Planner task + writes `PlannerTaskId` |
| [ ] | 3 | **Planner reverse-sync** | Planner task completed | phase0-3 | completing the task flips the row to `Status=Done` |
| [ ] | 4 | **Watchdog** + Teams digest | Recurrence 10:00 & 17:00 ET | phase4-6 | overdue/blocked rows escalate; a digest card posts with correct counts |
| [ ] | 5 | **Power App** command center | — (canvas app) | phase4-6 | app opens as a Teams tab, tiles + lane gallery render, `Patch` write-backs work; a non-premium teammate can use it |
| [ ] | 6 | **Meeting pipeline** | SP file created on `Meeting Intake` | phase4-6 | a dropped JSON creates List A rows `Reviewed=No`; approving one flows it to Planner |
| [ ] | 7 | **Sweep** — file handled mail | Recurrence hourly | phase7-10 | a `Done` row's email moves to `BSSI Hub/Done`, `SweptDate` stamped, id refreshed, not re-processed; meeting rows skip cleanly |
| [ ] | 8 | **Courier** — send approved replies | Recurrence 15 min | phase7-10 | `Approved to Send` + `DraftBody` sends a threaded reply → `Sent` → `Done`; empty body doesn't send |
| [ ] | 9 | **List B upsert** — sender tracker | Recurrence few hours | phase7-10 | two Promo rows from one sender → one List B row `MessageCount=2`; both stamped `SubLoggedDate` |
| [ ] | 10 | **Steward** — reversible archival | Recurrence weekly | phase7-10 | one approval card per category; Approve moves to `BSSI Hub/Archive` + stamps `ArchivedDate`; Reject snoozes 30 days |

*(Sorter — email intake — is already LIVE on the rule-based classifier; no build needed.)*

---

## PART 2 — Claude layer (runs in parallel, credit-free; no M365 build)
- [ ] **Recap** — transcript → action-item JSON into `Meeting Intake` (contract in phase4-6 §Phase 6).
- [ ] **Chief** — daily "what needs my attention" brief → `.docx`/`.md` into `Daily Digest` (Copilot grounds on it).
- [ ] **Reporter** — monthly leadership report from List A + recaps.
- [ ] **Re-classify Needs-Review** — Claude re-decides ambiguous `Reviewed=No` rows; you confirm.

---

## PART 3 — Progress log (append one line per session, then commit)
- 2026-07-29 — Plan approved; all 5 spec docs written.
- 2026-07-29 — **Live build begun (Account A, SharePoint).** Verified internal name = `Status` (both lists; not HubStatus). Created columns `PlannerTaskId`, `SweptDate`. Created libraries `Meeting Intake`, `Daily Digest`. Specs patched HubStatus/SubStatus→Status. **Next:** confirm Planner plan+buckets (Account B), then build Phase 1 (Tempo) + Phase 2 (Planner sync). Deferred: 5 Phase 8–10 marker columns.
- 2026-07-29 — **Phase 0 SharePoint side COMPLETE.** All 7 List A columns created & REST-verified; both libraries (`Meeting Intake`, `Daily Digest`) live; `Status` internal name confirmed. **Next:** Planner plan + 7 buckets (Account B) → build Phase 1 (Tempo).
- 2026-07-29 — **Planner plan `BSSI Work Actions` created (Gina group).** Buckets 2/7 done (System Exceptions / Workflow Breaks, Action Required).
- **▶ RESUME HERE (safe to /clear context first — everything below is captured):**
  1. Planner → **BSSI Work Actions** (Gina group) → Board → add the **5 remaining buckets**: Waiting On Others, Leadership / Reporting, Ministry / Community, FYI / Learning Reference, Promotions / Subscriptions / Misc (Add a new bucket → type → Enter).
  2. Then build **Phase 1 (Tempo)** + **Phase 2/3 (Planner sync)** per `PhaseU/BUILD_SPEC_phase0-3.md`.
  - Key facts: List A = `Inbox Action Register`, GUID `{8be53de2-780e-46e6-a288-c8dc1f984c32}`, site `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`. **Filters use `Status`** (not HubStatus). All 7 List A columns + both libraries (`Meeting Intake`, `Daily Digest`) already exist. Browser create-column form: `.../_layouts/15/FldNew.aspx?List=%7B8be53de2-...%7D`.
- _(add: date — what you built/tested — next step)_
