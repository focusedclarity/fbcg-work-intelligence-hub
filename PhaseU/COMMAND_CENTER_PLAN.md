# WAIH — Best-in-Class Automation Command Center (Approved Plan)

> **Owner:** G. Thomas (Business Systems & Solutions Mgr, FBCG) · **Date:** 2026-07-29
> **Status:** APPROVED. This is the git-tracked copy (source of truth for chat/machine migration).
> A mirror lives at `~/.claude/plans/best-best-in-class-calm-sonnet.md`. Purpose: a self-contained
> record of the recommended architecture + build sequence for the M365 "work intelligence command
> center", using only license-included tooling (no paid AI).

---

## 🔒 Locked Decisions (user, 2026-07-29)
1. **Standard connectors ONLY in the core** — SharePoint, Outlook, Teams, Planner, Approvals, plus
   free built-ins (Compose, Parse JSON, Select, Variables, Condition/Control). No premium connectors
   (HTTP/Graph, Dataverse), no AI Builder, no Copilot Studio on the critical path. *Rationale:* free
   for all users, no per-use cost, unaffected if the Power Apps Premium trial ends.
2. **Power BI is NOT used** (user directive) — analysis/reporting handled by Claude + the Power App.
3. **Two-brain split** — deterministic M365 does the plumbing; Claude does the judgment work.

---

## 1. Context — why this build

FBCG wants a single command center that pulls **emails onto a dashboard**, routes **action items into
Planner**, and turns **meeting notes into tracked actions** — automated, but human-in-the-loop. The
assumed blocker was missing AI: no AI Builder credits, no Copilot Studio pay-as-you-go credits, and
the live email classifier (Sorter) already fell back to rules when its AI Builder credits ran out.

The key realization: **the missing AI credits don't block anything.** (a) High-volume classification
is rule-decidable and already running for free; (b) the genuinely AI-shaped work (re-classifying
ambiguous items, extracting actions from meeting transcripts, drafting, analytics) is done by
**Claude — the AI the user already pays for** — not by metered M365 AI. Second realization: the
"no Compose / no HTTP / no triggers" wall was a limit of the *AI-built* restricted flow tool, **not**
the free tier. In full `make.powerautomate.com`, Compose, Parse JSON, Variables, and the SharePoint
"When an item is created/modified" trigger are all standard.

Outcome: a Teams-embedded command center every staffer can open for free, actionable items flowing to
Planner (and thus To Do + the Teams Tasks app), and meetings feeding the same rails as email — all
surviving the Power Apps Premium trial whether or not it's kept.

---

## 2. Verified licensing facts (Microsoft Learn, Jul 2026 — all TRUE)

| # | Fact | Consequence |
|---|------|-------------|
| 1 | Seeded "Power Apps for M365" rights run **canvas apps on standard connectors** for all M365 users, no premium seat | Teams command-center app is free for everyone — **as long as it uses only the SharePoint connector**. Dataverse/premium/custom connectors flip every user to needing premium. |
| 2 | A canvas app can be pinned as a **Teams tab** under those seeded rights | Embed in the BSSI Teams channel; licensing unchanged. |
| 3 | Power BI viewers each need Pro unless on **Fabric F64/P1+** capacity | Confirms dropping Power BI as a shared surface. |
| 4 | **M365 Copilot per-user is un-metered**; Copilot Studio agent consumption is metered | Use the Copilot the user has (Outlook/Teams/BizChat). Full add-on → a declarative agent over SharePoint is un-metered, but see #5. |
| 5 | Copilot grounds well on **documents**, poorly on **SharePoint list rows** | Route list analytics/Q&A to **Claude**; give Copilot a clean **daily digest document**. |
| 6 | Outlook/SharePoint/Teams/Planner/Approvals **standard**; HTTP·Graph·Dataverse **premium**; Compose/Parse JSON/Variables **free built-ins** | Entire flow design is license-safe. |
| 7 | Premium **trial expiry suspends** premium apps/flows | Standard-only core mandatory. Power **Automate** trial = 90d; Power **Apps** = 30d (extendable to 90). |
| 8 | Teams **recording + live transcription** in Business Standard/Premium/E3/E5 — not an AI credit | Meeting capture is free; transcripts land in OneDrive/SharePoint. |

---

## 3. The two-brain split

**Rule of thumb: keywords/dates/thresholds → M365 owns it; reading comprehension or writing → Claude
owns it.** Neither layer costs a per-use credit.

| Concern | M365 ("the hands") | Claude ("the brain") |
|---|---|---|
| Clean/pattern email classification (~90%) | **Owns** (Sorter rules fallback) | — |
| Ambiguous (`Reviewed=No`, `Confidence<60`) | Flags + parks in Needs Review | **Owns re-decision** (R1–R10; Gina confirms) |
| Follow-up date math (SLAs) | **Owns** (Tempo) | — |
| Aging / escalation / digests | **Owns** (Watchdog → Teams) | — |
| Actionable → Planner; filing; sending approved drafts | **Owns** (Planner-sync, Sweep, Courier) | — |
| Meeting transcript → structured action rows | Provides intake bridge | **Owns extraction** (Recap) |
| Draft writing | Provides `DraftStatus` state machine + send | **Owns the words** (or Copilot in Outlook) |
| Daily brief / monthly report | Surfaces rows/numbers | **Owns synthesis** (Chief / Reporter) |
| Analytics & Q&A over list rows | Stores data | **Owns it** (Copilot weak here — #5) |

---

## 4. Architecture — three surfaces

### Surface 1 — Emails → command center (Power App in Teams)
- **Primary shared surface:** canvas **Power App over the three SharePoint lists, pinned as a Teams tab.** SharePoint connector only → free for every M365 user, trial-proof.
- **Home = gallery grouped by the 7 DigestLanes.** Top KPI tiles (client-side): Open actions · Overdue · Needs Review · Drafts awaiting approval. Filter chips (SourceSystem/Pillar/Priority); each card has "Open email" bound to the `WebLink` OWA deep link.
- **Write-backs (`Patch()` to SharePoint):** change `Status` (+ stamp `LastStatusChange=Now()`), set/clear `FollowUpDate`, confirm classification (flip `Reviewed`, correct category/lane/owner), approve draft (`DraftStatus='Approved to Send'`), and **"Push to Planner"** = set a marker field a flow watches (**app never calls Planner directly** → premium-free).
- **Fallback:** the 16 list views + free JSON column/view formatting.

### Surface 2 — Action items → Planner (standard connector, two-way)
- One schema add: **`PlannerTaskId`** (Text) on List A. One Planner plan **"BSSI Work Actions"** in the BSSI Team, **7 buckets = 7 lanes**. Tasks auto-surface in To Do + Teams Tasks app.
- **Eligibility:** `ActionOwner='Me'` AND `DigestLane ∈ {Action Required, System Exceptions}` (optionally Waiting On Others) AND `Reviewed='Yes'` (human gate) AND `Status ∉ {Done, Reference}` AND `PlannerTaskId` empty. FYI/Promotions/Ministry never generate tasks.
- **Forward-sync (Hub→Planner):** SharePoint "When an item is created or modified" + loop-safe trigger condition (`ActionOwner='Me' AND empty(PlannerTaskId) AND Reviewed='Yes'`), or a Recurrence poll. Runs **after Tempo**. Actions: Planner **Create a task** (title=Subject, bucket=lane, due=`coalesce(FollowUpDate,DueDateStated)`, priority mapped) → **Update task details** (WebLink + Sender + Category + SourceSystem + Notes) → SharePoint **Update item** writing `PlannerTaskId`.
- **Reverse-sync (Planner→Hub):** Planner **"When a task is completed"** → SharePoint Get items (`PlannerTaskId eq …`) → Update item `Status='Done'`, `LastStatusChange=utcNow()`. Cascades into Sweep.

### Surface 3 — Meeting notes → action items (transcript-in, source-agnostic)
- **Capture:** Teams (built-in transcription, free), Zoom (Recap pulls transcript), in-person (local Whisper via Recap). Whatever the source, **a transcript is the entry point.**
- **Extraction by Claude/Recap** (not M365 AI): transcript → structured, classified action rows (`sourceSystem="Meeting"`).
- **License-safe bridge (no premium HTTP):** Recap writes one **JSON per meeting** into a SharePoint **`Meeting Intake`** library → standard flow **"When a file is created"** → **Get file content** → **Parse JSON** → Apply to each → **Create item** (`Reviewed=No`) → Needs Review → Gina approves → existing Tempo → Planner chain picks it up.
- **Intake JSON contract:** `{ meeting:{title,organizer,date,source}, actionItems:[{subject,context,businessCategory,digestLane,sourceSystem,actionOwner,owner,priority,dueDateStated,confidence}] }`. Gotchas: empty-date guard (`if(empty(dueDateStated),null,…)`), exact **en-dash** category/lane strings.

### Copilot angle (use the seat the user has)
- **Copilot for:** Outlook drafting, Teams meeting recap (first pass), Business Chat over email/files.
- **Claude for:** all list analytics/Q&A (Copilot can't query list rows reliably — #5).
- **Bridge:** Watchdog/Chief publishes a clean **daily digest document** to a `Daily Digest` library so Copilot Business Chat has a groundable artifact.

---

## 5. New objects required (everything else is reuse)
- **1 column:** `PlannerTaskId` (Text) on List A.
- **2 document libraries:** `Meeting Intake`, `Daily Digest`.
- **1 Planner plan:** "BSSI Work Actions" (7 lane buckets).
- **Outlook folders:** `BSSI Hub/Done`, `BSSI Hub/Reference` (for Sweep).

---

## 6. Ordered build sequence (all standard unless flagged)

| Phase | Build | Trigger | Key actions | Notes |
|---|---|---|---|---|
| **0** | Schema prep | — | Add `PlannerTaskId`; create 2 libraries + Planner plan/buckets + Outlook folders | Internal names: **`Status`** (A), **`Status`** (B) — use in ALL filters. |
| **1** | **Tempo** (FollowUpDate from SLA) | Recurrence hourly (or SP trigger) | SP Get/Update + Compose date math | First — Planner due dates depend on it. `tempo_watchdog_listB_build.md §5a`. |
| **2** | **Planner forward-sync** | SP created/modified + loop-safe condition (or poll) | Planner Create + Update details; SP Update (`PlannerTaskId`) | §4 Surface 2. |
| **3** | **Planner reverse-sync** | Planner "task completed" | SP Get + Update (`Status=Done`) | §4 Surface 2. |
| **4** | **Watchdog** + Teams digest + daily digest doc | Recurrence twice daily (~10/17 ET) | SP Get; Teams Post; SP Create file | Compute aging in-flow (TODAY() doesn't refresh). §6. |
| **5** | **Command-center Power App** + view formatting | — | Canvas app, **SharePoint only**; `Patch()`; Teams tab | Keep SharePoint-only. Fallback = views + JSON formatting. |
| **6** | **Meeting pipeline** | SP "file created" on `Meeting Intake` | Get file content; Parse JSON; Create item | Rows `Reviewed=No` → approve → Tempo → Planner. |
| **7** | **Sweep** | SP modified (Status→Done/Reference) or Recurrence | Outlook Move email | Create folders first. |
| **8** | **Courier** | SP modified (`DraftStatus='Approved to Send'`) | Outlook Send/Reply; stamp Sent/WaitingOn/Done | Never auto-sends. |
| **9** | **List B upsert** | inside Sorter or Recurrence | SP Get/Update/Create | Nice-to-have. |
| **10** | **Steward** disposition | Recurrence | Approvals batch card → Outlook move | Reversible; no hard delete/PST. |

**Claude-layer agents run in parallel, credit-free:** Recap (Phase 6), Chief (daily brief), Reporter (monthly), + continuous Needs-Review re-classification.

---

## 7. Premium temptations → standard-only substitutes
| Premium reach | Standard substitute |
|---|---|
| HTTP/Graph for meeting ingest | `Meeting Intake` library + "file created" + Parse JSON |
| AI Builder "Run a prompt" | Sorter rules (email) + Claude/Recap (ambiguous + meetings) |
| Copilot Studio agent for list Q&A | Claude analytics + Copilot-groundable daily digest doc |
| Power App w/ premium connector | Canvas app on SharePoint connector only; Planner via a flow |
| Power BI shared to others | Not used; app KPI tiles + views |
| Dataverse | The three SharePoint lists stay the system of record |

---

## 8. Verification / how to test end-to-end
- **Email → dashboard → Planner:** test email → List A row (Sorter) → set `Reviewed=Yes` in app → Tempo sets `FollowUpDate` → Planner task appears (+ Teams Tasks) → complete task → `Status=Done` + email filed (Sweep).
- **Loop-safety:** the `PlannerTaskId` write-back must NOT create a duplicate task.
- **Meeting:** drop sample transcript JSON in `Meeting Intake` → rows created `Reviewed=No` → approve one → flows to Planner.
- **Copilot bridge:** open latest `Daily Digest` doc in Copilot Business Chat, ask "what's my most urgent item today?" → grounded answer.
- **License-safety:** view the app as a non-premium user → opens and write-backs work.

---

## 9. Open items / pre-build checks
- [x] **Status internal name — CONFIRMED LIVE 2026-07-29: `Status` for BOTH lists** (REST-verified). `scout_listA_columns.json` was correct; the `HubStatus`/`SubStatus` override in `scout_flow0_build.md` was never applied. All filters use `Status`.
- [ ] Planner bucketing: **DigestLane** (recommended) vs Pillar (better for the monthly pillar report).
- [ ] Keep the Power Apps Premium trial? (affects only optional polish, never the core).
- [ ] Extend `recap.md` hand-off contract to emit the intake JSON field set.

## 10. Critical files
- `PhaseU/scout_listA_columns.json` — List A schema (add `PlannerTaskId`; note the `Status`/`Status` doc bug).
- `PhaseU/tempo_watchdog_listB_build.md` — Tempo/Watchdog/List B specs + OData filter patterns.
- `PhaseU/sorter_output_mapping.md` — 13-key contract + en-dash / empty-date gotchas.
- `PhaseU/phaseU_taxonomy_v4.md` — frozen 18-category / 7-lane taxonomy + rules R1–R10.
- `PhaseU/sorter_flow1_rulesbased_build.md` — the credit-free rules Sorter (live intake).
- `PhaseU/scout_flow0_build.md` — provisioning + the `Status`/`Status` internal-name map.
- `.claude/agents/recap.md`, `chief.md`, `reporter.md`, `sorter.md` (on `master`) — Claude-layer roles.

---

## 11. Conversation decisions log (for chat migration)
- Ask: best-in-class M365 command center — emails→dashboard, actions→Planner, meeting notes; no AI Builder / Copilot Studio credits.
- Licensing: 1 Power BI seat (org none) → **don't use Power BI**; **has M365 Copilot per-user (full add-on)**; **Power Apps Premium = trial, may keep**.
- Meetings: Teams + Zoom + in-person, **always a transcript**.
- Locked: **standard-connector-only core**; **two-brain split**; Copilot for Outlook/Teams recap, Claude for list analytics.
- Sub-agents (architecture design + licensing fact-check) completed; all 8 licensing claims verified TRUE.
- Pre-build check resolved from repo: Status internal name = `Status`/`Status`.
