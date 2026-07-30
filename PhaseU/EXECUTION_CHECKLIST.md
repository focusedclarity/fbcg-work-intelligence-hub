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
- [x] Buckets: **7 of 7 done** ✅ 2026-07-29 — `System Exceptions / Workflow Breaks`, `Action Required`, `Waiting On Others`, `Leadership / Reporting`, `Ministry / Community`, `FYI / Learning Reference`, `Promotions / Subscriptions / Misc`. *(Note: in the new planner.cloud.microsoft board, "Add a new bucket" → type → **click a blank board area to commit** was more reliable than Enter; verify each via read_page before moving on.)*

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
| [x] | 1 | **Tempo** — Follow-Up dates | Recurrence hourly | phase0-3 | ✅ **DONE & TEST-SUCCEEDED 2026-07-30** — a New/owned row with no FollowUpDate gets a weekday date per priority. (See "Phase 1 COMPLETE" note below for the self-reference design fix.) |
| [x] | 2 | **Planner forward-sync** | SP item created/modified (loop-safe) | phase0-3 | ✅ **BUILT & LIVE-TESTED PASS 2026-07-30** (flow "Planner Forward-Sync"). Test row → task created in Action Required bucket + `PlannerTaskId` written back (run Succeeded, full True branch). |
| [x] | 3 | **Planner reverse-sync** | Planner task completed | phase0-3 | ✅ **BUILT & LIVE-TESTED PASS 2026-07-30** (flow "Planner Reverse-Sync"). Completed the task → row flipped to `Status=Done` + `LastStatusChange` stamped (REST-verified). |
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
- 2026-07-29 — **All 7 Planner buckets now committed** (added the final 5). Phase 0 fully complete.
- 2026-07-30 — **Phase 1 (Tempo) COMPLETE & Test-succeeded.** Reworked the business-day loop to avoid Power Automate's Set-variable self-reference ban: added `vDayOffset` (int) + Increment, `vCursor=addDays(vBase,vDayOffset)`, weekday Condition, Update item FollowUpDate. Manual test run = "Test succeeded" (1:03, no errors).
- 2026-07-30 — **Phases 2 & 3 (Planner sync) BUILT & SAVED.** See "Phase 2 & 3 build notes" below.
- 2026-07-30 (session 4) — **Phase 4 (Watchdog) STARTED — flow created & saved server-side.** Flow **`Watchdog - Aging & Digest`**, ID **`62b75e6e-21e2-4a8f-a77d-b45f3ffd8387`** (env Default-7980b399…). Built so far: (1) **Recurrence** trigger — Frequency=Day, Interval=1, Time zone=**(UTC-05:00) Eastern Time (US & Canada)**, At these hours=**10,17**, At these minutes=**0** → designer preview reads *"Runs at 10:00 - 17:00 every day"*. (2) **Compose today** action — Inputs expr `formatDateTime(convertFromUtc(utcNow(),'Eastern Standard Time'),'yyyy-MM-dd')`. **SAVED** (URL flipped to /flows/{id}). **Get_openitems ADDED & saved** (SharePoint Get items; Site=Inbox Intelligence App /sites/m365appbuilder-app-3155; List=Inbox Action Register; Filter Query=`Status ne 'Done' and Status ne 'Reference'`; renamed "Get openitems" → ref `Get_openitems`). **Still to build:** Apply to each ladder (close/escalate/nudge/stale) → 4 count Get-items (Get_open/Get_overdue/Get_needsreview/Get_drafts) → Teams adaptive card. **Then Save & turn on + test.**
  - **v3 designer UI method (hard-won, reuse next session):** (a) add an operation from the picker = **DOUBLE-click** the result card (single click doesn't take). (b) Enter an expression in any field = click field → type **`/`** → **Insert expression** → type in the Monaco box → click **Add** (bottom of popup). (c) Frequency/Time zone comboboxes: click to open, then click the option (typeahead/arrows unreliable). (d) **Screenshot capture renders the app squished into the top-left ~333×205 of an 800×500 image** — manual `coordinate` clicks are in that squished screenshot space (scale ≈**0.235 x, 0.221 y** vs CSS px), while **ref-clicks use raw CSS coords so anything past x≈800 clicks off-screen** (that's why the toolbar **Save** must be clicked at screenshot ≈**(258,15)**, not via ref). Use `read_page`/JS to get CSS rects, multiply by ~0.23 for the manual click.
- 2026-07-30 — **Phases 2 & 3 LIVE-TESTED — BOTH PASS.** Created a test row (Action Required / ActionOwner=Me / Reviewed=Yes) → forward-sync fired (~40s), Succeeded, full True branch (Create task ✓ Update details ✓ Update item ✓); task appeared in Action Required bucket; `PlannerTaskId=dO2Cf19j00O6Nns-lCtNSWQAPv6z` written back. Completed the task in Planner → reverse-sync fired (~10 min later; Planner trigger polls slowly), Succeeded (For each → 1 Update item); REST-verified the row: `Status=Done`, `LastStatusChange=2026-07-30T16:00:34Z`. Choice-field `/Value` convention confirmed correct. Test row "TEST - Planner sync (safe to delete)" left in the list (Status=Done) — safe to delete. **Next: Phase 4 (Watchdog + Teams digest).**

### Phase 2 & 3 build notes — 2026-07-30 (session 3)
Both saved server-side in the FBCG tenant (env `Default-7980b399-a235-46a9-85e4-294f51bdba15`); open from make.powerautomate.com → My flows.
- **`Planner Forward-Sync`** (Phase 2): Trigger = SharePoint *When an item is created or modified* on Inbox Intelligence App / Inbox Action Register. **Trigger condition** (Settings, loop-safe) = `@and(equals(triggerOutputs()?['body/ActionOwner/Value'],'Me'),equals(triggerOutputs()?['body/Reviewed/Value'],'Yes'),empty(triggerOutputs()?['body/PlannerTaskId']))`. Then **Condition** (verified in Code view): `(Status≠Done) AND (Status≠Reference) AND (DigestLane=Action Required OR DigestLane=System Exceptions / Workflow Breaks)`. **If yes →** Planner *Create a task* (Group=Gina, Plan=BSSI Work Actions, Bucket=**Action Required**, Title=`Title`, Due=`if(empty(FollowUpDate),DueDateStated,FollowUpDate)`, Assigned=gthomas@) → Planner *Update task details* (Description=concat of Sender/BusinessCategory/SourceSystem/SourceLinkMessageID/Notes, all coalesced) → SharePoint *Update item* (Id=`triggerOutputs()?['body/ID']`, `PlannerTaskId`=created task Id). Save gave **0 errors, 1 warning** (circular-loop heads-up) — expected & handled by the `empty(PlannerTaskId)` trigger condition.
  - **SIMPLIFICATION vs spec:** used a single Create-task path into the **Action Required** bucket for BOTH eligible lanes (no per-lane Switch). System-Exceptions rows currently land in the Action Required bucket. To restore per-lane buckets later: replace the single Create-task with a Switch on `DigestLane` (cases: Action Required, System Exceptions / Workflow Breaks) each with its own Create-task + Update-details + Update-item.
  - **Gotcha:** Planner *Update task details* Task Id is a combobox — click **"Enter custom value"** first to expose the `/`→dynamic-content option, then pick Create-a-task → **Id**.
- **`Planner Reverse-Sync`** (Phase 3): Trigger = Planner *When a task is completed* (Group=Gina, Plan=BSSI Work Actions). Then SharePoint *Get items* (Inbox Action Register; **Filter Query** expr = `concat('PlannerTaskId eq ''', triggerOutputs()?['body/id'], '''')`; Top Count=1) → **Update item** (auto-wrapped in Apply to each via Get-items ID; Id=Get items ID, `Status`=**Done**, `LastStatusChange`=`utcNow()`). Saved clean ("ready to go").
- **⚠️ Both flows are ON but UNTESTED.** Verify per §TEST: set `Reviewed=Yes` on an eligible row → task appears in Action Required bucket + PlannerTaskId written back; complete that task → row flips to `Status=Done`. Watch for choice-field `/Value` mismatches in the trigger condition (if the forward-sync never fires, drop `/Value` on ActionOwner/Reviewed).
- **▶ RESUME HERE (safe to /clear context first — everything below is captured):**
  1. ✅ DONE — all 7 buckets committed.
  2. Build **Phase 1 (Tempo)** + **Phase 2/3 (Planner sync)** per `PhaseU/BUILD_SPEC_phase0-3.md` in full `make.powerautomate.com`.
  - Key facts: List A = `Inbox Action Register`, GUID `{8be53de2-780e-46e6-a288-c8dc1f984c32}`, site `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`. **Filters use `Status`** (not HubStatus). All 7 List A columns + both libraries (`Meeting Intake`, `Daily Digest`) already exist. Planner plan `BSSI Work Actions` (Gina group) has all 7 buckets matching the Digest Lane names. Browser create-column form: `.../_layouts/15/FldNew.aspx?List=%7B8be53de2-...%7D`.
- 2026-07-29 — **Phase 0 fully done (all 7 buckets).** Then began **Phase 1 (Tempo) live build in make.powerautomate.com** (new designer). Flow is **saved server-side in the FBCG tenant** (env `Default-7980b399-a235-46a9-85e4-294f51bdba15`) — open it from ANY computer at make.powerautomate.com → My flows → **"Tempo - Follow-Up Dates"**. Nothing about the flow lives in git; this note is the only handoff needed.

### ▶▶ RESUME HERE — Tempo flow (Phase 1), what's already built & what's left
**Flow name:** `Tempo - Follow-Up Dates` (Scheduled cloud flow, Recurrence = every **1 hour**). Already SAVED.
**Built & verified so far (top → bottom):**
1. **Recurrence** trigger — every 1 hour. ✅
2. **Initialize variable** `vN` = Integer, 0. ✅
3. **Initialize variable 1** `vBase` = String, (empty). ✅
4. **Initialize variable 2** `vCursor` = String, (empty). ✅
5. **Initialize variable 3** `vAdded` = Integer, 0. ✅
6. **Get items** (SharePoint) ✅ — Site = **Inbox Intelligence App** (`.../sites/m365appbuilder-app-3155`), List = **Inbox Action Register**, **Filter Query** =
   `FollowUpDate eq null and Status ne 'Done' and Status ne 'Reference' and DigestLane ne 'FYI / Learning Reference' and DigestLane ne 'Promotions / Subscriptions / Misc' and DigestLane ne 'Leadership / Reporting'`
7. **Apply to each** over `Get items → body/value`. ✅
8. Inside it: **Condition** (C1) ✅ — compiled (verified in Code view) to `equals( empty(items('Apply_to_each')?['DueDateStated']), false )`. So **True branch = DueDateStated IS present**, False branch = absent.

**PROGRESS UPDATE 2026-07-30 (paused mid-build; all below is SAVED server-side):**
- ✅ **True branch DONE** → SharePoint **Update item**: Site=Inbox Intelligence App, List=Inbox Action Register, Id=`ID` (dynamic content from Get items), Follow-Up Date=`Due Date Stated` (dynamic content). (Removed the auto-added "Has Attachments" field.)
- ✅ **False branch — 4 Set variables + Do until condition DONE:**
  - Set variable `vN` = the nested-if `if(equals(...DigestLane...'System Exceptions / Workflow Breaks'),1, ...'Waiting On Others'),5, ...Priority 'Critical'),1,'High'),2,'Low'),10,5)` — **verified in Code view**.
  - Set variable 1 `vBase` = `if(equals(items('Apply_to_each')?['DigestLane']?['Value'],'Waiting On Others'),items('Apply_to_each')?['LastStatusChange'],items('Apply_to_each')?['ReceivedDate'])`
  - Set variable 2 `vCursor` = `vBase` (dynamic content)
  - Set variable 3 `vAdded` = `0`
  - **Do until** — Loop until (advanced expr) `@greaterOrEquals(variables('vAdded'),variables('vN'))` (renders in basic mode as `vAdded` **is greater or equal to** `vN`). Count 60 / Timeout PT1H = fine (safety bounds).

### ✅ PHASE 1 (Tempo) COMPLETE — 2026-07-30 (session 3). Saved + **Test succeeded** (1:03, no errors).
**IMPORTANT design fix vs the original plan:** Power Automate **forbids Set-variable self-reference** ("Self reference is not supported when updating the variable 'vCursor'"), so `vCursor = addDays(vCursor,1)` is illegal. Reworked the Do-until body to use an integer offset counter instead:
- **Added a new top-level `Initialize variable` → `vDayOffset` (Integer, 0)** (sits between Initialize variable 3 and Get items).
- **Do-until body (in order):** (1) **Increment variable** `vDayOffset` by `1`; (2) **Set variable** `vCursor` = `addDays(variables('vBase'),variables('vDayOffset'))` (no self-ref); (3) **Condition 1** `formatDateTime(variables('vCursor'),'ddd')` ≠ `Sat` **And** ≠ `Sun` → True: **Increment** `vAdded` by `1`.
- **After Do-until (False branch):** **Update item** — Site=Inbox Intelligence App, List=Inbox Action Register (GUID `8be53de2-780e-46e6-a288-c8dc1f984c32`), Id=`@items('Apply_to_each')?['ID']`, advanced field **Follow-Up Date** (`item/FollowUpDate`) = `@formatDateTime(variables('vCursor'),'yyyy-MM-dd')`. (Removed auto-added Has Attachments.)
- Verified in Code view; PatchItem runs after `Do_until` Succeeded. Flow Status = On.
- **Gotcha reconfirmed:** in the Condition row builder, click the operator's **text label** ("is equal to") to open its dropdown — clicking the chevron area adds a phantom row instead. The trailing empty phantom row is ignored on compile.
- **Next:** Phases 2 & 3 (Planner forward/reverse sync) — full spec in `PhaseU/BUILD_SPEC_phase0-3.md`.

<details><summary>Historical: session-2 build notes (superseded by the completion note above)</summary>

**PROGRESS UPDATE 2026-07-30 (session 2) — steps 1a & 1b BUILT; step 2 blocked by a Microsoft backend outage mid-build:**
- ✅ **1a DONE** — INSIDE the Do until, **Set variable 4**: Name `vCursor`, Value expression `addDays(variables('vCursor'),1)` (tooltip-verified).
- ✅ **1b DONE** — INSIDE the Do until, after Set variable 4, **Condition 1** built via the row builder (top op = **And**):
  - Row 1: `formatDateTime(variables('vCursor'),'ddd')` **is not equal to** `Sat`
  - Row 2: `formatDateTime(variables('vCursor'),'ddd')` **is not equal to** `Sun`
  - (a 3rd auto-added empty phantom row is present — ignored on compile)
  - **True** branch → **Increment variable**: Name `vAdded`, Value `1`. False branch = empty ("No Actions").
- ⚠️ **BACKEND OUTAGE HIT.** While adding step 2's Update item, the designer's action-catalog service (ECS) started returning no response (console: repeated "ECS - Service request failed to return a response"). The "Add an action" panel hangs on a spinner; a subsequent **Save** also hung on "Saving…" indefinitely. **Unknown whether 1a/1b persisted server-side.**
- **▶▶ NEXT RESUME — do this first:** reopen the flow fresh (make.powerautomate.com → My flows → *Tempo - Follow-Up Dates*) and **verify** Set variable 4, Condition 1 (2 rows, And, Sat/Sun ≠), and the True-branch Increment variable `vAdded=1` are all present INSIDE the Do until. Rebuild any that didn't persist (all specs above).

**◀ THEN FINISH — 2 actions left in Phase 1:**
2. **AFTER the Do until, still in the False branch** — the correct insert is the "+" **directly below the "Do until" footer, on the loop's vertical axis** (hover shows *"Insert a new action after Do until"*). ⚠️ Do NOT use the "+" lower/left of it — that one lands *after the whole Condition at the Apply-to-each level*, which is WRONG (it would run for True-branch items too, overwriting FollowUpDate with a stale `vCursor`). Add **Update item**: Site=Inbox Intelligence App, List=Inbox Action Register, Id=`items('Apply_to_each')?['ID']` (or ID dynamic content), add advanced field **Follow-Up Date** = expression `formatDateTime(variables('vCursor'),'yyyy-MM-dd')`. Remove the auto-added "Has Attachments" field.
3. **Save.** Phase 1 (Tempo) complete. Test per BUILD_SPEC_phase0-3 §TEST (create a row ActionOwner=Me, DigestLane=Action Required, Status=New, no FollowUpDate → run flow → FollowUpDate gets a weekday date).
- **Then Phases 2 & 3** (Planner forward/reverse sync) — not started; full spec in `PhaseU/BUILD_SPEC_phase0-3.md`.

</details>

**Tip for finding branch insert points:** the small on-canvas "+" glyphs are unreliable to click; instead use `read_page` (filter:interactive) and click the button labeled "Insert a new action in <scope>" / "...after <action>". Empty condition branches start COLLAPSED — expand the branch first (its Expand/Collapse button) to reveal the insert "+".

### Designer gotchas learned this session (save yourself the pain)
- **Code view is READ-ONLY** in BOTH new and classic web designer ("Cannot edit in read-only editor"). No paste-JSON path in-browser; would need a solution export/import or the CLI. Build via the visual UI.
- Inside Apply to each, reference the current item as **`items('Apply_to_each')?['Field']`** — the validator flags `item()` as "has a problem".
- **Expression-editor "Add" button is at the very BOTTOM of the popup.** Clicking mid-popup hits a function-list row (e.g. `substring()`) and appends garbage. If that happens, don't try to backspace (the Monaco box ignores Ctrl+A / Backspace when focus drifts) — click the popup **X** to discard and re-enter cleanly.
- **Do until "Loop until" advanced field:** click **Edit in advanced mode**, then **triple-click** the field to select all before typing (Ctrl+A/Backspace don't work there either). After Save it auto-renders back into the 3-part basic builder — that's expected/correct.
- Do until defaults **Count 60 / Timeout PT1H** are fine to leave.
- Choice columns come back as objects → use `?['DigestLane']?['Value']`, `?['Priority']?['Value']`, `?['Status']?['Value']`.
- To enter an expression in a field: click it → type **`/`** → **Insert expression** → type → **Add**. The expression box is Monaco and **Ctrl+A does NOT select-all** (it appends garbage). To redo an expression, click the popup **X** to discard, then reopen fresh.
- For a boolean compare in the Condition builder, type **`false`** as a **plain value** in the right box (NOT via the expression editor — bare `false` there errors). It compiles to a real boolean. The builder also shows a phantom empty 2nd row; it's ignored on compile (confirmed in Code view).
- Planner buckets: type the name then **click a blank board area to commit** (more reliable than Enter).
