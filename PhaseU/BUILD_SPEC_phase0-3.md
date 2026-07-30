# Build Spec — Phases 0–3 (Schema · Tempo · Planner two-way sync)

> **Self-contained execution doc.** Follows the approved `PhaseU/COMMAND_CENTER_PLAN.md`. Written so a
> fresh Claude session (any account), the Claude Chrome extension, or a human can execute it end-to-end
> WITHOUT this chat. Build everything in **full `make.powerautomate.com`** (NOT the restricted "workflow
> automation" agent) — there, Compose / Parse JSON / Variables / Do-Until / the SharePoint item trigger
> are all **standard/free**. No AI Builder, no premium connectors anywhere in here.

## Global conventions (read once)
- **SharePoint site (use the FULL URL everywhere):** `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`
- **List A display name:** `Inbox Action Register`.
- **Internal names for OData Filter Query** (critical — display ≠ internal): the Status column's internal
  name is **`Status`** (List B = `Status`). All Filter Queries below use `Status`. Ignore
  `scout_listA_columns.json:25` which wrongly says `Status`. **Verify once live:** List settings → click
  the Status column → read `Field=` in the URL (should be `Status`).
- **Choice columns** returned by *Get items* / trigger come back as objects → reference `?['DigestLane']?['Value']`.
  If your tenant returns a plain string, drop the `?['Value']`. (Test on the first run.)
- **En-dash:** `Business Category` values use an en-dash `–` (not hyphen `-`). Copy exact.
- **Human-in-the-loop:** Claude/the plugin may build and configure, but **you** click *Save & turn on* /
  *Publish* and anything that sends mail. Do the TEST run before the real run where noted.

---

## PHASE 0 — Schema prep (one-time, ~15 min)

**0.1 Add the `PlannerTaskId` column to List A**
- SharePoint → open `Inbox Action Register` → **+ Add column → Single line of text**.
- Name: `PlannerTaskId`. (Internal name will be `PlannerTaskId`.) Save. Leave it off default views if you like.

**0.2 Create the Planner plan + buckets**
- In the **BSSI Team** (Teams → the BSSI channel) → **+** tab → **Tasks by Planner and To Do** → new plan
  named **`BSSI Work Actions`**. (Or planner.cloud.microsoft → New plan in the BSSI group.)
- Create **7 buckets**, one per Digest Lane (exact names):
  `System Exceptions / Workflow Breaks` · `Action Required` · `Waiting On Others` · `Leadership / Reporting`
  · `Ministry / Community` · `FYI / Learning Reference` · `Promotions / Subscriptions / Misc`.
  *(Only Action Required + System Exceptions receive tasks in Phase 2; create all 7 now for consistency.)*

**0.3 Create two document libraries** on the site (Site contents → **+ New → Document library**):
`Meeting Intake` and `Daily Digest`. (Used in later phases; create now.)

**0.4 Create Outlook folders** (for the later Sweep flow): under the mailbox, `BSSI Hub` with subfolders
`Done` and `Reference`.

**0.5 Confirm `Status`** live (the 10-second check in Global conventions). Do not proceed to filters until confirmed.

---

## PHASE 1 — Tempo: set Follow-Up Date from SLA windows (expression-based, no AI)

**Purpose:** for open, owned items with no follow-up date yet, compute `FollowUpDate` from §1a.
**§1a rules (base = Received Date, EXCEPT Waiting On Others = Last Status Change):**
Critical→1 · High→2 · Normal→5 · Low→10 business days. `System Exceptions / Workflow Breaks` → **1, overrides priority**.
`Waiting On Others` → **5 from Last Status Change**. `Due Date Stated` present → **it wins** (Follow-Up = Due Date Stated).
Lanes with no follow-up (Leadership/Reporting, FYI, Promotions) are excluded by the filter below.

**Trigger:** **Recurrence** — every 1 hour.

**Action 1 — Initialize variables** (top of flow, before any loop): create these (types in parens):
`vN` (Integer, 0) · `vBase` (String, "") · `vCursor` (String, "") · `vAdded` (Integer, 0).

**Action 2 — SharePoint → Get items**
- Site Address: the full URL. List Name: `Inbox Action Register`.
- **Filter Query** (uses `Status`; excludes no-follow-up lanes and already-dated rows):
  ```
  FollowUpDate eq null and Status ne 'Done' and Status ne 'Reference' and DigestLane ne 'FYI / Learning Reference' and DigestLane ne 'Promotions / Subscriptions / Misc' and DigestLane ne 'Leadership / Reporting'
  ```
  *(Fallback if the designer rejects the long filter: use `FollowUpDate eq null and Status ne 'Done' and Status ne 'Reference'` and let the branch logic skip the excluded lanes.)*

**Action 3 — Apply to each** (`value` from Get items). Inside:

- **Condition C1:** `DueDateStated` is not empty → expression `@not(empty(items('Apply_to_each')?['DueDateStated']))`
  - **If yes** → **Update item**: `FollowUpDate` = `DueDateStated`. (Done for this row.)
  - **If no** → run the steps below.

- **Set `vN`** (Set variable, advanced/expression):
  ```
  if(equals(items('Apply_to_each')?['DigestLane']?['Value'],'System Exceptions / Workflow Breaks'),1,
    if(equals(items('Apply_to_each')?['DigestLane']?['Value'],'Waiting On Others'),5,
      if(equals(items('Apply_to_each')?['Priority']?['Value'],'Critical'),1,
        if(equals(items('Apply_to_each')?['Priority']?['Value'],'High'),2,
          if(equals(items('Apply_to_each')?['Priority']?['Value'],'Low'),10,5)))))
  ```
- **Set `vBase`:**
  ```
  if(equals(items('Apply_to_each')?['DigestLane']?['Value'],'Waiting On Others'), items('Apply_to_each')?['LastStatusChange'], items('Apply_to_each')?['ReceivedDate'])
  ```
- **Set `vCursor`** = `@variables('vBase')` · **Set `vAdded`** = `0`.
- **Do Until** (business-day walk) — condition in advanced mode: `@greaterOrEquals(variables('vAdded'), variables('vN'))`
  - **Set `vCursor`** = `@addDays(variables('vCursor'),1)`
  - **Condition C2:** `@and(not(equals(formatDateTime(variables('vCursor'),'ddd'),'Sat')), not(equals(formatDateTime(variables('vCursor'),'ddd'),'Sun')))`
    - **If yes** → **Increment variable** `vAdded` by 1. *(If no → do nothing; loop continues.)*
- **Update item** → `FollowUpDate` = `@formatDateTime(variables('vCursor'),'yyyy-MM-dd')`.

> **Simpler-but-approximate alternative** (skip the loop): `FollowUpDate = addDays(vBase, vN)` then bump off
> weekends. Accurate for N≤5, but **under-counts for Low/N=10** across two weekends — use the loop for correctness.

**Save & turn on** (your click). Test: see §Test.

---

## PHASE 2 — Planner forward-sync (Hub → Planner)

**Purpose:** create a Planner task for each genuinely actionable, human-approved row; dedupe via `PlannerTaskId`.

**Trigger:** SharePoint → **When an item is created or modified** (List `Inbox Action Register`, full URL).
- **Trigger condition** (Settings → Trigger Conditions — loop-safe; only fires for eligible rows):
  ```
  @and(equals(triggerOutputs()?['body/ActionOwner/Value'],'Me'),equals(triggerOutputs()?['body/Reviewed/Value'],'Yes'),empty(triggerOutputs()?['body/PlannerTaskId']))
  ```
  *(If choice fields return plain strings in your tenant, use `.../body/ActionOwner` without `/Value`.)*

**Action 1 — Condition (lane + status eligibility):**
```
@and(
  or(equals(triggerOutputs()?['body/DigestLane/Value'],'Action Required'),
     equals(triggerOutputs()?['body/DigestLane/Value'],'System Exceptions / Workflow Breaks')),
  and(not(equals(triggerOutputs()?['body/Status/Value'],'Done')),
      not(equals(triggerOutputs()?['body/Status/Value'],'Reference'))))
```
*(Optional: add `Waiting On Others` as a nudge lane by OR-ing it in.)* Only the **If yes** branch continues.

**Action 2 — Switch on `DigestLane` → Planner "Create a task"** (bucket per lane).
Add a **Switch** on `@triggerOutputs()?['body/DigestLane/Value']` with cases:
- Case `Action Required` → **Planner → Create a task**
- Case `System Exceptions / Workflow Breaks` → **Planner → Create a task**

In each Create-a-task action set:
- **Group Id / Plan Id:** the BSSI group + `BSSI Work Actions`.
- **Bucket Id:** the bucket matching that case's lane.
- **Title:** `Email Subject` (dynamic content `Title`).
- **Start/Due Date Time:** `@if(empty(triggerOutputs()?['body/FollowUpDate']), triggerOutputs()?['body/DueDateStated'], triggerOutputs()?['body/FollowUpDate'])`
  *(If both are empty this yields null — acceptable, task has no due date.)*
- **Assigned User Ids:** the mailbox owner (gthomas@fbcglenarden.org).

**Action 3 — Planner → Update task details** (`Task Id` = the created task's id from the matching case):
- **Description:**
  ```
  @concat('Open email: ', coalesce(triggerOutputs()?['body/WebLink/Url'],''), '
  From: ', coalesce(triggerOutputs()?['body/Sender'],''), '
  Category: ', coalesce(triggerOutputs()?['body/BusinessCategory/Value'],''), '  |  Source: ', coalesce(triggerOutputs()?['body/SourceSystem/Value'],''), '
  Notes: ', coalesce(triggerOutputs()?['body/Notes'],''))
  ```

**Action 4 — Planner → Update task** (optional priority): map `Priority` → Planner priority —
Critical→**Urgent**, High→**Important**, Normal→**Medium**, Low→**Low**.

**Action 5 — SharePoint → Update item** (write the dedupe key back):
- Id = `@triggerOutputs()?['body/ID']`; `PlannerTaskId` = the created **Task Id**.
- *This modify re-fires the trigger, but the trigger condition `empty(PlannerTaskId)` is now false → it stops. No loop.*

> **Standard-only alternative to the event trigger** (if you prefer polling, matching Tempo): Recurrence every
> 15 min → Get items with Filter Query `ActionOwner eq 'Me' and Reviewed eq 'Yes' and PlannerTaskId eq null and Status ne 'Done' and Status ne 'Reference' and (DigestLane eq 'Action Required' or DigestLane eq 'System Exceptions / Workflow Breaks')` → Apply to each → same Create/Update actions.

**Save & turn on** (your click).

---

## PHASE 3 — Planner reverse-sync (task completed → Hub `Done`)

**Purpose:** completing a task in Planner/To Do/Teams closes the matching Hub row.

**Trigger:** Planner → **When a task is completed** (Group Id = BSSI group; Plan Id = `BSSI Work Actions`).

**Action 1 — SharePoint → Get items**
- List `Inbox Action Register`, full URL. **Filter Query:** `PlannerTaskId eq '@{triggerOutputs()?['body/id']}'`. **Top Count:** 1.

**Action 2 — Condition:** `@greater(length(outputs('Get_items')?['body/value']), 0)` (a matching row exists).
- **If yes → Apply to each** (`value`) → **SharePoint → Update item**:
  - Id = current item Id.
  - `Status` field (the `Status` column in the UI) = **`Done`**.
  - `LastStatusChange` = `@utcNow()`.

*(The `Done` status will later trigger Sweep to file the email — Phase 7.)*

**Save & turn on** (your click).

---

## TEST (prove the chain end-to-end)
1. In List A, pick/create a row with `ActionOwner=Me`, `DigestLane=Action Required`, `Status=New`, `Reviewed=No`, no FollowUpDate.
2. Run **Tempo** (or wait an hour) → confirm `FollowUpDate` gets a weekday date per priority.
3. Set `Reviewed=Yes` on that row → within a minute the **forward-sync** should create a Planner task in the
   `Action Required` bucket with the email link in its description, and write `PlannerTaskId` back on the row.
4. Confirm the task also appears in **To Do → Assigned to me** and the **Teams Tasks** app.
5. **Complete** the task in Planner → confirm the row's `Status` flips to `Done` (reverse-sync).
6. **Loop-safety:** confirm no duplicate task is created when `PlannerTaskId` is written (trigger condition holds).

## If you continue this on your other account/computer
- `git pull` first so you have this file + `COMMAND_CENTER_PLAN.md`.
- Everything needed is in these two docs — no chat context required. Resume at whatever phase isn't yet built.
- Next after Phase 3: Phase 4 Watchdog + Teams digest (spec basis: `tempo_watchdog_listB_build.md §6/§1b`),
  then the Power App (Phase 5), then the meeting pipeline (Phase 6).

## Source specs (authoritative)
`PhaseU/COMMAND_CENTER_PLAN.md` (architecture) · `PhaseU/tempo_watchdog_listB_build.md` (§1a windows, §1b) ·
`PhaseU/sorter_output_mapping.md` (field map, en-dash + empty-date gotchas) · `PhaseU/scout_flow0_build.md`
(`Status`/`Status` internal names) · `PhaseU/phaseU_taxonomy_v4.md` (18 categories / 7 lanes / R1–R10).
