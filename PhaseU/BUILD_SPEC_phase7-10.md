# Build Spec — Phases 7–10 (Sweep · Courier · List B upsert · Steward)

> **Self-contained execution doc.** Continues `PhaseU/BUILD_SPEC_phase4-6.md` under `PhaseU/COMMAND_CENTER_PLAN.md`.
> Build in full `make.powerautomate.com`, STANDARD connectors only (Outlook, SharePoint, Approvals, Recurrence —
> all verified standard). Same global conventions: full site URL
> `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`, Status internal name = **`Status`**
> (List B = `Status`), choice fields as `?['X']?['Value']`, en-dash in Business Category, **you** click *Save & turn on*.

## ⚠ Two cross-cutting facts these flows are designed around (verified vs Microsoft Learn)
1. **Outlook message IDs are mutable.** `Move email (V2)` gives the message a **new id**. So a `SourceLinkMessageId`
   stored earlier is **stale the moment the email is moved** — a later lookup fails with `ErrorItemNotFound`.
   **Design consequences:** (a) **Courier replies BEFORE Sweep moves** the email (natural order: reply while still
   in Inbox → set Done → Sweep files it). (b) **Sweep writes the refreshed post-move id back** to
   `SourceLinkMessageId`, so Steward's later move still works. (c) every archival move guards against a stale id
   with a run-after-failed note. (Robustness upgrade for later: also store the stable **Internet Message ID** and
   re-resolve the live id before any move — not required for pilot.)
2. **Seeded plan cap = 6,000 Power Platform requests / user / 24h** (every action counts, success or fail, incl.
   retries/pagination; pooled across all the user's flows). **So:** batch (one approval card, not one per item),
   filter Get items hard, keep recurrences modest, avoid needless Compose/variable actions inside loops.

## Schema additions for Phases 7–10 (do these first, like Phase 0)
Add these **nullable DateTime** markers + text fields to List A (`Inbox Action Register`). *Markers are DateTime,
not Boolean, on purpose:* the SharePoint OData connector filters Booleans unreliably and a new Boolean is **null
(not 0)** on existing rows, so `eq 0` silently misses them; a nullable DateTime filtered with `eq null` is
unambiguous and doubles as an audit timestamp.

| Column | Type | Flow | Purpose |
|---|---|---|---|
| `SweptDate` | DateTime (nullable) | Sweep | exactly-once filing marker |
| `DraftBody` | Note, **richText=true** | Courier | the reply body (no home exists today — do NOT reuse `Notes`) |
| `DraftTo` | Text (single line) | Courier | explicit recipient for the send-fallback path only |
| `SubLoggedDate` | DateTime (nullable) | List B upsert | exactly-once counting marker |
| `ArchivedDate` | DateTime (nullable) | Steward | prevents re-archiving |
| `ArchiveSnoozeUntil` | DateTime (nullable) | Steward | suppresses re-proposing a rejected item for 30 days |

**New Outlook folder:** `BSSI Hub/Archive` (alongside the Phase 0 `Done`/`Reference`).

---

## PHASE 7 — Sweep: file handled mail (idempotent, meeting-safe, id-refreshing)

**Trigger:** **Recurrence** — every 1 hour (polling avoids the modified-trigger loop; sidesteps cap #2).

**Get items:** List `Inbox Action Register`. **Filter Query:**
```
(Status eq 'Done' or Status eq 'Reference') and SweptDate eq null
```

**Apply to each** returned row:
- **Condition A — `SourceLinkMessageId` empty?** (`@empty(items('Apply_to_each')?['SourceLinkMessageId'])`)
  - **Yes** (meeting-origin or no email) → Update item: `SweptDate=@utcNow()`. **Skip — no move, no "not found" note.**
  - **No** → continue.
- **Switch on `Status/Value`:** `Done` → target folder `BSSI Hub/Done`; `Reference` → `BSSI Hub/Reference`.
- **Scope "Move"** containing **Office 365 Outlook → Move email (V2)**: Message Id = `SourceLinkMessageId`, Folder = the switch target.
  - On **success**: Update item → `SourceLinkMessageId` = **the Move action's returned new `Id`** (keeps it valid for Steward), and `SweptDate=@utcNow()`.
  - **Parallel "Update item (not found)"** action with **Configure run after = has failed**: `Notes` = `"original email not found — may have been moved manually"`, and **`SweptDate=@utcNow()`** (so a genuinely-missing email is not retried forever).

**Save & turn on.**

---

## PHASE 8 — Courier: send Gina-approved replies (reply-to-thread, with fallback)

**Precondition:** the drafter (Quill/Claude, or Copilot-in-Outlook pasted in) fills **`DraftBody`** and sets
`DraftStatus='Draft Ready'`; **you** set `DraftStatus='Approved to Send'` (the human gate — nothing sends otherwise).

**Trigger:** **Recurrence** every 15 min (or event trigger with condition
`@equals(triggerOutputs()?['body/DraftStatus/Value'],'Approved to Send')`). **Get items** Filter Query:
```
DraftStatus eq 'Approved to Send'
```
Loop-safe: the post-send write flips `DraftStatus` to `Sent`, which no longer matches.

**Apply to each:**
- **Condition — `DraftBody` empty?** If empty → post a Teams warning and **do not send** / leave `DraftStatus` unchanged. Else continue. *(Prevents a blank reply.)*
- **Branch on `@empty(...SourceLinkMessageId)`:**
  - **Not empty (primary) → Reply to email (V3):** Message Id = `SourceLinkMessageId`, Body = `DraftBody`.
    Threads the reply, auto-fills To from the original sender, auto-prefixes `RE:`. (Set *Reply to all* = true only if needed.)
  - **Empty (fallback) → Send an email (V2):** To = `DraftTo`, Subject = `@concat('RE: ', items('Apply_to_each')?['Title'])`, Body = `DraftBody`. (Meeting-origin rows or nudges to someone other than the original sender.)
- **Immediately after a successful send** (single next action, no long branch — protects against re-send on partial failure) → **Update item:**
  - `DraftStatus`=`Sent`.
  - **Closure decision (pick one; default for pilot = A):**
    - **A. Fire-and-forget:** `Status`=`Done`, `LastStatusChange`=`@utcNow()`. (Sweep then files it.)
    - **B. Expects a response:** `Status`=`Waiting`, `WaitingOn`=<recipient>, `LastStatusChange`=`@utcNow()` — keeps Watchdog's "Waiting On Others" 5-day nudge clock alive. Use when the reply awaits an answer. *(Could be driven by a Boolean the drafter sets; pilot defaults to A.)*

> **Ordering note:** Courier must run before Sweep moves the email (fresh id). It does — Courier ends by setting
> `Done`, which is what Sweep polls for. Don't let a row be swept before it's couriered.

**Save & turn on.**

---

## PHASE 9 — List B upsert: subscription/sender tracker (race-safe, exactly-once)

**Trigger:** **Recurrence** every few hours. **Get items (List A)** Filter Query (note the **en-dash** in the FYI value):
```
(BusinessCategory eq 'PROMOTIONS / SUBSCRIPTIONS / MISC' or BusinessCategory eq 'FYI – Reference / Learning') and SubLoggedDate eq null
```
*(Alternative keyed on lane: `DigestLane eq 'Promotions / Subscriptions / Misc' or DigestLane eq 'FYI / Learning Reference'` — pick one, be consistent. Existing Flow-2 spec uses BusinessCategory.)*

**Apply to each — set Concurrency Control OFF (Degree = 1).** *(Critical: default concurrency lets two rows for
the same sender read the same count and both write +1 → undercount / duplicate List B rows.)*
- **Get items (List B)** → name it `Get_ListB`. Filter Query `SenderEmail eq '@{items('Apply_to_each')?['Sender']}'`, Top 1.
- **Condition** `@greater(length(outputs('Get_ListB')?['body/value']),0)`:
  - **Found** → Update the List B row: `MessageCount = @add(int(first(outputs('Get_ListB')?['body/value'])?['MessageCount']),1)`, `LastSeen = ReceivedDate`, refresh SenderName/Email.
  - **Not found** → Create List B row: SenderDomain=(Sender for pilot), SenderEmail=Sender, SenderName=Sender, SubscriptionType=`Unknown`, FirstSeen=LastSeen=ReceivedDate, MessageCount=`1`, **`Status`**=`Active`, Pillar=`N/A`.
- **After the branch (both paths)** → Update the **List A** row: `SubLoggedDate=@utcNow()`. *(This guarantees exactly-once counting.)*

*(Inline `add()`/`int()` are standard in full Power Automate — the "restricted agent rejects expressions" caveat in `tempo_watchdog_listB_build.md §Flow 2` no longer applies.)*

**Save & turn on.** (Nice-to-have; test before relying on counts.)

---

## PHASE 10 — Steward: reversible archival via one Approvals card per category

**Trigger:** **Recurrence** weekly (e.g., Monday 06:00 ET). *(No hard delete, no PST — reversible Outlook moves only.)*

**Compose cutoffs** (OData has no relative dates): `cut30=@addDays(utcNow(),-30)` · `cut60=@addDays(utcNow(),-60)` · `cut90=@addDays(utcNow(),-90)`.

**Three Get-items buckets** (age basis differs; buckets are mutually exclusive; markers exclude already-archived/snoozed):
```
# Promo/FYI — 30d, aged on ReceivedDate, excluded from Done/Reference:
(BusinessCategory eq 'PROMOTIONS / SUBSCRIPTIONS / MISC' or BusinessCategory eq 'FYI – Reference / Learning')
  and ReceivedDate lt '@{outputs('cut30')}' and Status ne 'Done' and Status ne 'Reference'
  and ArchivedDate eq null and (ArchiveSnoozeUntil eq null or ArchiveSnoozeUntil lt '@{utcNow()}')

# Reference — 90d, aged on LastStatusChange:
Status eq 'Reference' and LastStatusChange lt '@{outputs('cut90')}'
  and ArchivedDate eq null and (ArchiveSnoozeUntil eq null or ArchiveSnoozeUntil lt '@{utcNow()}')

# Done — 60d, aged on LastStatusChange:
Status eq 'Done' and LastStatusChange lt '@{outputs('cut60')}'
  and ArchivedDate eq null and (ArchiveSnoozeUntil eq null or ArchiveSnoozeUntil lt '@{utcNow()}')
```
*(If the designer rejects the compound `or` on `ArchiveSnoozeUntil`, drop that clause from the query and filter it out inside the loop.)*

**Per non-empty bucket:**
- **Approvals → Start and wait for an approval**, type **"Approve/Reject – First to respond"**. Title: *"Archive N [Category] items older than X days?"*. Details (Markdown) = the concatenated candidate subjects (or a link to a filtered List view if N is large). **One batch card per category** — never one per item (respects the 6k/day cap and avoids approval spam).
- **Condition on Outcome:**
  - **Approve** → Apply to each candidate → **Scope**: Outlook **Move email** (Message Id = the row's `SourceLinkMessageId` — valid because Sweep wrote the refreshed id back) to `BSSI Hub/Archive`; on success Update item `ArchivedDate=@utcNow()` (+ write the new returned id back to `SourceLinkMessageId`); run-after-failed → note + still stamp `ArchivedDate` so it isn't retried forever.
  - **Reject** → Apply to each candidate → Update item `ArchiveSnoozeUntil=@addDays(utcNow(),30)` (drops them from selection for 30 days — no re-proposal next week).

**Save & turn on.**

---

## TEST
- **Sweep:** set a row `Status=Done` with a valid `SourceLinkMessageId` → run → email moves to `BSSI Hub/Done`, `SweptDate` stamped, `SourceLinkMessageId` updated to the new id, and it isn't re-processed next cycle. Then test a `SourceSystem=Meeting` row → `SweptDate` stamped, no note, no move.
- **Courier:** put text in `DraftBody`, set `DraftStatus='Approved to Send'` on a row with a valid message id → a threaded reply sends to the original sender → `DraftStatus=Sent`, `Status=Done`. Test the empty-`DraftBody` guard (no send) and the no-message-id fallback (Send V2 to `DraftTo`).
- **List B:** two unlogged Promo rows from the same sender → after a run, one List B row with `MessageCount=2` (not two rows, not count=1), and both List A rows stamped `SubLoggedDate`.
- **Steward:** age a couple of rows past a cutoff → one approval card per category lists them → Approve moves them to Archive + stamps `ArchivedDate`; Reject stamps `ArchiveSnoozeUntil` and they don't reappear next run.

## If you continue on your other account/computer
`git pull`; the full build is now in `COMMAND_CENTER_PLAN.md` + `BUILD_SPEC_phase0-3.md` + `BUILD_SPEC_phase4-6.md`
+ this file. All 10 phases are specced end-to-end, standard-connector only, executable unsupervised.

## Source specs (authoritative)
`PhaseU/COMMAND_CENTER_PLAN.md` · `PhaseU/BUILD_SPEC_phase0-3.md` · `PhaseU/BUILD_SPEC_phase4-6.md` ·
`PhaseU/tempo_watchdog_listB_build.md` (§Flow 2, §1b) · `PhaseU/sorter_output_mapping.md` (field map, gotchas) ·
`PhaseU/scout_listA_columns.json` (List A columns) · `PhaseU/phaseU_taxonomy_v4.md` (taxonomy + R1–R10).
Connector facts + limits verified against learn.microsoft.com/connectors/{office365,sharepointonline,approvals}
and /power-platform/admin/api-request-limits-allocations (6,000 requests/user/day on the seeded plan).
