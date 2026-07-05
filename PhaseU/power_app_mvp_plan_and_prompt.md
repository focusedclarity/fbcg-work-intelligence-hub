# Power App MVP — Plan, Build Prompt, and Solution Template (for later client rollout)
_As of 2026-07-05_

## 1. Recommendation recap
The Power App is a thin UI layer, not the real encapsulation boundary. What actually makes this reusable across other users/clients later is packaging **Lists + Flows + App** as a Power Platform **Solution**, with **environment variables** for anything client-specific (site URL, list IDs, mailbox, Teams channel) instead of hardcoded values. Gina's decision: build **one shared app now, with per-user views** (not per-client app copies), and defer the Solution/templating work — "template client later." Section 4 below scaffolds that later step now, using Gina's current pilot values as the defaults, so nothing has to be rebuilt when the time comes — just re-pointed.

No browser/Power Platform access exists in this session, so nothing here is actually built or exported — this is the plan + the exact prompt/config to use when building it.

---

## 2. MVP scope — screens mapped to real columns/views
Schema and view names below are the actual ones from `PhaseU/scout_manual_setup_checklist.md` — not placeholders.

| Screen | Data source | Default view/filter | Key columns shown | Actions |
|---|---|---|---|---|
| **Home / Dashboard** | List A (counts) | Open Actions, Overdue, Needs Review, Drafts Awaiting Approval | Tile counts only | Navigate to each register |
| **Inbox Action Register** | List A | Open Actions (default); switchable to By Lane, By Mailbox Source, Dead-Letter, Stale — Review to Close | Email Subject, Sender, Priority, Status, Digest Lane, Follow-Up Date, Days Since Received, Web Link | Open detail; open email (Web Link) |
| **Item detail** | List A (single row) | — | All columns; Notes editable | Update Status/Priority/Notes |
| **Approvals** | List A | Drafts Awaiting Approval (Draft Status = Draft Ready) | Email Subject, Sender, Draft Status, Notes | **Approve** button → sets Draft Status = Approved to Send (Courier picks it up from there; the app never sends mail itself) |
| **Settings / Profile** | List C (signed-in user's row) | `Filter('User Profile Register', 'UPN / Email' = User().Email)` | Digest Channel, Digest Time, Business-Hours Start/End, Department | Edit own preferences |

**Cut from MVP:** a Subscriptions screen (List B) — per today's decision, List B is not being built; its Buyback-gate signal is folding into Sweep instead, so there's no Subscription Register to surface yet.

**Per-user filtering (the "one shared app" mechanism):** the Settings screen's `Filter` on List C by `User().Email` is also the pattern to reuse anywhere the app needs "my" vs. "everyone's" data. **Known gap, not solved in MVP:** List A's `Action Owner` column is Me/Someone Else/None, not a per-person email — a true multi-user "My Items" filter needs a real owner-email column on List A, which only matters once more than one mailbox/person feeds the register. Flagging this now so it isn't a surprise later.

---

## 3. Ready-to-paste MVP build prompt
Paste this into Power Apps' "Describe the app you want to build" AI app-creation entry point:

> Build a canvas app called "Intelligence Hub" connected to the SharePoint site `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`. Use three existing lists: "Inbox Action Register" (main data), "Subscription Register", and "User Profile Register" — but for this first version only use "Inbox Action Register" and "User Profile Register".
>
> Screens:
> 1. A Home screen with four count tiles reading from "Inbox Action Register": Open Actions (Status not equal to Done or Reference), Overdue (Follow-Up Date on or before today and Status not Done/Reference), Needs Review (Reviewed = No), and Drafts Awaiting Approval (Draft Status = Draft Ready). Tapping a tile navigates to the Register screen filtered accordingly.
> 2. A Register screen showing a sortable, filterable gallery of "Inbox Action Register" items with columns Email Subject, Sender, Priority, Status, Digest Lane, Follow-Up Date, and Days Since Received. Include a dropdown to switch the active filter between: Open Actions, Overdue, Needs Review, By Lane (grouped by Digest Lane), By Mailbox Source (grouped by Mailbox Source), Dead-Letter (Status = Blocked), and Stale — Review to Close (Reviewed = No and Status not Done/Reference, oldest Last Status Change first). Tapping a row opens a detail screen showing all fields for that item, with Notes editable and a Save button that patches the SharePoint item.
> 3. An Approvals screen showing only items where Draft Status = "Draft Ready", with an Approve button per row that updates that item's Draft Status to "Approved to Send".
> 4. A Settings screen that looks up the signed-in user's row in "User Profile Register" by matching UPN / Email to the current user's email, and shows/edits Digest Channel, Digest Time, Business-Hours Start, and Business-Hours End for that row only.
>
> Use the SharePoint connector directly (no Dataverse). Keep the app read-mostly except for the two write actions described (Approve button, Notes save, Settings edit).

---

## 4. Solution template for later client rollout (scaffolded now, not built)
When "later" arrives, this is the path — reusing what already exists rather than rebuilding:

**What packages into the Solution:** the canvas app (above) + the operational flows (Sorter, Tempo, Watchdog, Sweep, Courier) + connection references (Office 365 Outlook, SharePoint, Teams, Approvals, AI Builder) + the environment variables below. SharePoint lists themselves are *not* part of a Solution — they're external data the flows/app point at — so a new client still needs their own site/lists provisioned first, using the schema files that already exist for exactly this purpose: `scout_listA_columns.json`, `scout_listB_columns.json`, `scout_listC_columns.json`, and `scout_provisioning_payloads.json` (per `scout_manual_setup_checklist.md`).

**Environment variables to define (current pilot values become the defaults — nothing changes for Gina today):**

| Environment variable | Current (default) value | What changes per new client |
|---|---|---|
| SharePoint Site URL | `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155` | New client's site URL |
| List A internal name/GUID | "Inbox Action Register" | New client's list ID after re-provisioning |
| List B internal name/GUID | "Subscription Register" (currently unused — folded into Sweep) | New client's list ID, if List B is ever built |
| List C internal name/GUID | "User Profile Register" | New client's list ID |
| Mailbox | Gina's primary mailbox | New client's monitored mailbox |
| Teams Channel (Digest destination) | BSSI Hub channel | New client's channel |
| Digest Channel default | Teams | Per client preference |
| Digest Time default | 7:00 AM / 5:00 PM pass times | Per client preference |
| Business Hours default | 9:00 AM–5:00 PM | Per client timezone/hours |

**Rollout steps when this gets picked up:**
1. Export an **unmanaged Solution** from the current environment containing the app, all flows, connection references, and the environment variables above (with current values as defaults).
2. For a new client: provision a new SharePoint site + Lists A/B/C using the existing `scout_*` JSON schema files (no new schema design needed).
3. Import the Solution into the new client's environment; update the environment variable values to point at the new site/list IDs/mailbox/Teams channel; remap connection references to that environment's connections.
4. Add a List C profile row for the new client (the existing "Onboarding Complete" flag is already the activation gate — no new mechanism needed).

Nothing above needs to happen now — it's here so the MVP build in Sections 2–3 doesn't accidentally hardcode anything that would make this harder later (e.g., prefer referencing the site/list names once rather than re-typing the full URL in every screen's formulas).
