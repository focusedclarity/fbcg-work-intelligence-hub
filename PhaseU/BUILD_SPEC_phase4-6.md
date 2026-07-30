# Build Spec — Phases 4–6 (Watchdog + Teams digest · Power App · Meeting pipeline)

> **Self-contained execution doc.** Continues `PhaseU/BUILD_SPEC_phase0-3.md` under the approved
> `PhaseU/COMMAND_CENTER_PLAN.md`. Build in **full `make.powerautomate.com`** / **make.powerapps.com`.
> Standard connectors only — no AI Builder, no premium connectors. Same global conventions as the
> Phase 0–3 doc: full site URL `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`,
> Status column internal name = **`Status`**, choice fields referenced as `?['X']?['Value']`,
> **en-dash** in Business Category, and **you** click *Save & turn on* / *Publish*.

---

## PHASE 4 — Watchdog: aging/escalation + twice-daily Teams digest (expression-based, no AI)

**Purpose:** twice a day, age every open item per §1b, act (escalate/nudge/stale/close), then post a Teams
digest and let the Claude layer (Chief) publish the Copilot-groundable digest document.

**§1b rules:** escalate (Blocked past follow-up, or System Exceptions unresolved) → Priority=Critical,
SuggestedFlag=Today, Teams alert. nudge (Waiting On Others idle ≥5 days) → DraftStatus=Draft Ready (nothing
auto-sends). stale (no status change >30 days) → Reviewed=No. close (DraftStatus=Sent) → Status=Done.

**Trigger:** **Recurrence** — twice daily at **10:00** and **17:00**, Time zone = **Eastern Standard Time**
(set "At these hours" = 10,17; "At these minutes" = 0).

**Action 1 — Compose `today`** = `@formatDateTime(convertFromUtc(utcNow(),'Eastern Standard Time'),'yyyy-MM-dd')`.

**Action 2 — SharePoint Get items** (open items only):
- List `Inbox Action Register`. **Filter Query:** `Status ne 'Done' and Status ne 'Reference'`.

**Action 3 — Apply to each** open item → a **Switch/Condition ladder** (evaluate top-down; first match wins).
Compute two helpers inline:
- `daysSinceStatus` = `@div(sub(ticks(outputs('Compose_today')), ticks(items('Apply_to_each')?['LastStatusChange'])), 864000000000)` (ticks/day = 864000000000).
- `pastDue` = FollowUpDate present and `@less(items('Apply_to_each')?['FollowUpDate'], outputs('Compose_today'))`.

Ladder (use nested Conditions):
1. **close** — if `DraftStatus/Value` = `Sent` → Update item: `Status`=`Done`, `LastStatusChange`=`@utcNow()`.
2. **escalate** — else if `@or(and(equals(...Status/Value,'Blocked'), pastDue), and(equals(...DigestLane/Value,'System Exceptions / Workflow Breaks'), greater(daysSinceStatus,2)))`
   → Update item: `Priority`=`Critical`, `SuggestedFlag`=`Today`. Then **Teams → Post message in a chat or channel** to the BSSI channel: *"⚠ Watchdog: '<Email Subject>' is past its follow-up window — needs attention."* (Respect List C `DigestChannel`; pilot default = Teams.)
3. **nudge** — else if `@and(equals(...DigestLane/Value,'Waiting On Others'), greaterOrEquals(daysSinceStatus,5))` → Update item: `DraftStatus`=`Draft Ready`. (You/Claude complete the nudge; nothing sends.)
4. **stale** — else if `@greater(daysSinceStatus,30)` → Update item: `Reviewed`=`No`.
5. else **none**.

**Action 4 — Digest counts** (four cheap Get items, Top 100 each, then use `length(...body/value)`):
| Tile | Filter Query |
|---|---|
| Open actions | `Status ne 'Done' and Status ne 'Reference' and ActionOwner eq 'Me'` |
| Overdue | `FollowUpDate lt '@{outputs('Compose_today')}' and Status ne 'Done' and Status ne 'Reference'` |
| Needs Review | `Reviewed eq 'No' and Status ne 'Done' and Status ne 'Reference'` |
| Drafts ready | `DraftStatus eq 'Draft Ready'` |

**Action 5 — Teams → Post adaptive card in a chat or channel** (BSSI channel). Card body (paste; `@{...}` are the counts):
```json
{ "type":"AdaptiveCard","$schema":"http://adaptivecards.io/schemas/adaptive-card.json","version":"1.4",
  "body":[
    {"type":"TextBlock","size":"Large","weight":"Bolder","text":"BSSI Work Actions — @{outputs('Compose_today')}"},
    {"type":"FactSet","facts":[
      {"title":"Open actions","value":"@{length(outputs('Get_open')?['body/value'])}"},
      {"title":"Overdue","value":"@{length(outputs('Get_overdue')?['body/value'])}"},
      {"title":"Needs review","value":"@{length(outputs('Get_needsreview')?['body/value'])}"},
      {"title":"Drafts awaiting approval","value":"@{length(outputs('Get_drafts')?['body/value'])}"}
    ]},
    {"type":"TextBlock","wrap":true,"isSubtle":true,"text":"Open the Command Center tab for detail."}
  ] }
```
(Rename the four Get-items actions to `Get_open` / `Get_overdue` / `Get_needsreview` / `Get_drafts` so the references resolve.)

**Daily digest DOCUMENT for Copilot (two-brain split):** the Teams card above is the push. The
Copilot-groundable *document* is produced by **Chief (Claude)** — it reads the same open items and writes a
clean `.docx`/`.md` daily brief into the **`Daily Digest`** library. Copilot Business Chat then grounds on
that document ("what's my most urgent item today?"). Keep this on the Claude side; do not try to generate a
rich document from the flow.

**Save & turn on** (your click).

---

## PHASE 5 — Command-center Power App (canvas, SharePoint-only, Teams tab)

**Build in `make.powerapps.com` → + Create → Canvas app (Tablet).** **License rule:** add **only** the
SharePoint data source — no premium/custom connectors, or every user needs premium.

**Data sources (Data → Add data → SharePoint, the full site):** `Inbox Action Register` (primary),
`Subscription Register`, `User Profile Register`.

**App.OnStart** (optional, cache the working set):
```
ClearCollect(colWork, Filter('Inbox Action Register', Status.Value <> "Done" && Status.Value <> "Reference"))
```

**Screen layout (top → bottom):**

**1) KPI tile row** — four Label controls, `Text` =
- Open: `CountRows(Filter('Inbox Action Register', Status.Value<>"Done" && Status.Value<>"Reference" && ActionOwner.Value="Me"))`
- Overdue: `CountRows(Filter('Inbox Action Register', !IsBlank(FollowUpDate) && FollowUpDate<Today() && Status.Value<>"Done" && Status.Value<>"Reference"))`
- Needs review: `CountRows(Filter('Inbox Action Register', Reviewed.Value="No" && Status.Value<>"Done" && Status.Value<>"Reference"))`
- Drafts: `CountRows(Filter('Inbox Action Register', DraftStatus.Value="Draft Ready"))`

**2) Filter controls** — a Dropdown `drpLane` (Items = the 7 lane strings + "All"), a Dropdown `drpPriority`
(Critical/High/Normal/Low/All), and a Text input `txtSearch`.

**3) Main gallery `galItems`** (vertical), grouped by lane. `Items`:
```
SortByColumns(
  Filter('Inbox Action Register',
     (drpLane.Selected.Value="All" || DigestLane.Value=drpLane.Selected.Value)
     && (drpPriority.Selected.Value="All" || Priority.Value=drpPriority.Selected.Value)
     && (IsBlank(txtSearch.Value) || StartsWith(Title, txtSearch.Value) || StartsWith(Sender, txtSearch.Value))
     && Status.Value<>"Done" && Status.Value<>"Reference"),
  "DigestLane", Ascending, "Priority", Ascending)
```
*Lane header technique:* in the gallery template add a Label `lblLaneHeader` (Text = `ThisItem.DigestLane.Value`)
with `Visible = (ThisItem.DigestLane.Value <> First(...)...)` — simplest reliable version: show the header when
the current item's lane differs from the previous item's lane. If that formula is fiddly for the plugin, ship
v1 grouped only by sort (lane label on every card) and add sticky headers later.

Card contents per item: `Title`, `Sender`, `BusinessCategory.Value`, `Priority.Value`, `FollowUpDate`,
`ConfidenceBand`, and buttons below.

**4) Write-back buttons (all `Patch` — standard):**
- **Open email:** `Launch(ThisItem.WebLink)`
- **Mark In Progress:** `Patch('Inbox Action Register', ThisItem, {Status:{Value:"In Progress"}, LastStatusChange:Now()})`
- **Set follow-up** (DatePicker `dpFU`): `Patch('Inbox Action Register', ThisItem, {FollowUpDate: dpFU.SelectedDate})`
- **Confirm classification / send to Planner** (this is the human gate that Phase 2 watches):
  `Patch('Inbox Action Register', ThisItem, {Reviewed:{Value:"Yes"}, ActionOwner:{Value:"Me"}})`
  → for an eligible lane this triggers the forward-sync and a Planner task appears. *(No extra "marker" column
  needed — `Reviewed=Yes` + `ActionOwner=Me` IS the push, per Phase 2's trigger condition.)*
- **Correct lane/category** (Dropdowns `drpFixLane`, `drpFixCat`): `Patch('Inbox Action Register', ThisItem, {DigestLane:{Value:drpFixLane.Selected.Value}, BusinessCategory:{Value:drpFixCat.Selected.Value}})`
- **Approve draft:** `Patch('Inbox Action Register', ThisItem, {DraftStatus:{Value:"Approved to Send"}})` (Courier then sends — Phase 8.)
- After any Patch: `Refresh('Inbox Action Register')`.

**Publish & surface:** Publish the app → Share with the BSSI team (or a security group). In the **BSSI Teams
channel → + → Power Apps → Add** the app as a **tab**. Confirm a non-premium teammate can open it and Patch
works (proves SharePoint-only).

---

## PHASE 6 — Meeting pipeline (transcript → Claude/Recap → List A, human-gated)

**Purpose:** turn any meeting transcript (Teams/Zoom/in-person — you always have a transcript) into
List A action rows, without premium HTTP. Claude/Recap does the extraction; a standard flow ingests it.

**Step A — Recap (Claude) writes one JSON per meeting** into the SharePoint **`Meeting Intake`** library,
matching this contract (already-classified against the frozen taxonomy):
```json
{ "meeting": { "title": "", "organizer": "", "date": "YYYY-MM-DDThh:mm:ssZ", "source": "Teams|Zoom|InPerson" },
  "actionItems": [
    { "subject": "", "context": "", "businessCategory": "one of the 18 (en-dash)", "digestLane": "one of the 7",
      "sourceSystem": "Meeting", "actionOwner": "Me|Someone Else|None", "owner": "", "priority": "Critical|High|Normal|Low",
      "dueDateStated": "YYYY-MM-DD or empty", "confidence": 0 } ] }
```

**Step B — Flow "Meeting Intake → List A":**
- **Trigger:** SharePoint **When a file is created (properties only)** on library `Meeting Intake`.
- **SharePoint → Get file content** (Identifier = trigger file id).
- **Data Operation → Parse JSON.** Content = `body('Get_file_content')`. **Schema:**
```json
{ "type":"object","properties":{
  "meeting":{"type":"object","properties":{"title":{"type":"string"},"organizer":{"type":"string"},"date":{"type":"string"},"source":{"type":"string"}}},
  "actionItems":{"type":"array","items":{"type":"object","properties":{
    "subject":{"type":"string"},"context":{"type":"string"},"businessCategory":{"type":"string"},"digestLane":{"type":"string"},
    "sourceSystem":{"type":"string"},"actionOwner":{"type":"string"},"owner":{"type":"string"},"priority":{"type":"string"},
    "dueDateStated":{"type":"string"},"confidence":{"type":"integer"}},
    "required":["subject","businessCategory","digestLane"]}}}}
```
- **Apply to each** `body('Parse_JSON')?['actionItems']` → **SharePoint → Create item** in `Inbox Action Register`:

| List A field | Value |
|---|---|
| Email Subject (Title) | `items('Apply_to_each')?['subject']` |
| Notes | `items('Apply_to_each')?['context']` |
| Business Category | `items('Apply_to_each')?['businessCategory']` (en-dash exact) |
| Digest Lane | `items('Apply_to_each')?['digestLane']` |
| Source System | `items('Apply_to_each')?['sourceSystem']` (= `Meeting`; allowed via fillInChoice) |
| Action Owner | `items('Apply_to_each')?['actionOwner']` |
| Owner | `items('Apply_to_each')?['owner']` |
| Priority | `items('Apply_to_each')?['priority']` |
| Due Date Stated | `@if(empty(items('Apply_to_each')?['dueDateStated']), null, items('Apply_to_each')?['dueDateStated'])` **(empty-date guard)** |
| Received Date | `body('Parse_JSON')?['meeting']?['date']` (so aging clocks start at meeting time) |
| Reviewed | `No` (**forced** — human gate) |
| Confidence | `items('Apply_to_each')?['confidence']` |
| Status (Status) | `New` |
| Classified Date | `@utcNow()` |

- **(Optional) prevent reprocessing:** after the loop, **Move file** to a `Meeting Intake/processed` subfolder.

**Human gate (unchanged rails):** rows land `Reviewed=No` → appear in the **Needs Review** view and the Power
App's review lane → you flip `Reviewed=Yes` (+ `ActionOwner=Me`) → Tempo sets the follow-up → the Phase 2
forward-sync creates the Planner task. **Meetings ride the exact same rails as email; nothing becomes a task
until you approve it.**

**Save & turn on** (your click).

---

## TEST
- **Watchdog:** create an open row with `FollowUpDate` = yesterday and `Status=Blocked` → run Watchdog →
  confirm Priority→Critical, SuggestedFlag→Today, a Teams alert, and the digest card with correct counts.
- **Power App:** open the app in Teams → confirm tiles/gallery render, "Confirm classification" sets Reviewed=Yes
  and a Planner task appears, "Open email" launches OWA. Check a non-premium teammate can use it.
- **Meeting pipeline:** drop a sample JSON (above shape, 2–3 action items) into `Meeting Intake` → confirm
  rows created `Reviewed=No` in Needs Review → approve one → confirm it flows to Planner like email.

## If you continue on your other account/computer
`git pull`, then everything is in `COMMAND_CENTER_PLAN.md` + the two BUILD_SPEC docs. Resume at the first
unbuilt phase. Remaining after Phase 6: **Phase 7 Sweep** (Outlook Move on Done/Reference), **Phase 8 Courier**
(send `Approved to Send` drafts), **Phase 9 List B upsert**, **Phase 10 Steward** (Approvals-based archival) —
all specced in `PhaseU/tempo_watchdog_listB_build.md` and summarized in `COMMAND_CENTER_PLAN.md §6`.

## Source specs (authoritative)
`PhaseU/COMMAND_CENTER_PLAN.md` · `PhaseU/BUILD_SPEC_phase0-3.md` · `PhaseU/tempo_watchdog_listB_build.md`
(§1b, §6) · `PhaseU/sorter_output_mapping.md` (field map + en-dash/empty-date gotchas) ·
`PhaseU/scout_listA_columns.json` (List A columns) · `PhaseU/phaseU_taxonomy_v4.md` (taxonomy + R1–R10).
