# Step 0 — Inventory of what the Smartsheet API cannot read

Captured 2026-08-18 by driving the Smartsheet UI in the Claude Browser pane (read-only: opened
`Automation → Manage automation workflows`, `Forms → Manage forms`, and the CMO workspace items).
The API exposes rows, columns, shares, attachments, discussions, reports and dashboards — but not
automations, forms, or conditional formatting, so this had to come from the UI.

Sheets in scope:
- **Master** — Contracts Database, id `1551069754642308`, `/CBO/Contracts Database`
- **Source** — CMO Contracts Database, id `8818557085241220`, `/CMO TEAM ONLY/Contracts/CMO Contracts Database`

---

## A. Automations — CMO Contracts Database (11 workflows, all active)

| # | Workflow | Trigger | Actions | Recipients | Last ran |
|---|---|---|---|---|---|
| 1 | CBO PGCA 3D Originator status update notification | rows changed AND `Status` changes to Any Value | Alert someone | Contacts in `Originator`, Gina Thomas | Dec 10 2025 |
| 2 | CMO Approval | rows added **or** changed AND `Status` → `Legal Approved` | Alert, **Request an approval**, Change a cell | Rachelle Patterson, Gina Thomas, Contacts in `Originator`, Contacts in `Originating Department Director` | Aug 17 2026 |
| 3 | CMO Executed contract flagged and attached | rows added **or** changed AND `Status` → `Approved and Signed` | Request an update, Change a cell | Gina Thomas, Lettie Carr Contracts | Aug 16 2026 |
| 4 | CMO Initial Review | **rows added AND an attachment is added** | Alert, **Request an approval**, Change a cell | Gina Thomas, Lettie Carr Contracts, Rachelle Patterson, Loleta Holmes, Contacts in `Originator`, Contacts in `Originating Department Director` | Aug 13 2026 |
| 5 | CMO Legal Resubmit to Originator | rows changed AND `Status` → `Legal Resubmit to Originator` | Alert, Request an update, Change a cell | Gina Thomas, Lettie Carr Contracts, Rachelle Patterson, Loleta Holmes, FBCG Procurement, Contacts in `Originator`, Contacts in `Originating Department Director` | Aug 1 2024 |
| 6 | CMO Legal Review | rows changed AND `Status` → `CMO Initial Review Approved` | **Request an approval**, Change a cell | Gina Thomas, Lettie Carr Contracts, Stefanie May | Aug 13 2026 |
| 7 | CMO Resubmission Back to Legal | rows changed AND `Status` → `Resubmission to Legal` | **Request an approval**, Change a cell | Lettie Carr Contracts, Rachelle Patterson, Gina Thomas, Loleta Holmes, FBCG Procurement | Aug 1 2024 |
| 8 | Events - (CMO) Initial Review Approve / Decline | rows added **or** changed AND `Status` → `Events Initial Review` | Alert, **Request an approval**, Change a cell | Stacey Fleming, Gina Thomas, Contacts in `Originator` | never |
| 9 | If event, change required renew date to No | rows added AND `Is this an event?` is `Yes` | Change a cell | — | Aug 11 2026 |
| 10 | Reminder Legal Review | rows changed AND `Status` → `CMO Initial Review Approved` | Alert someone | Gina Thomas, Lettie Carr Contracts | Aug 14 2026 |

(#1 is a stray CBO/PGCA-style workflow sitting on the CMO sheet — retire, do not rebuild.)

**No copy-row automation lives here** — the copy is driven from the master (see B, `00.`).

## B. Automations — Contracts Database (master) — 27 workflows

The copy-row automation, recorded in full because Step 6 deletes it and rollback must recreate it:

> **`00. New CMO entries copied to CMO Smartsheet`**
> Trigger: when rows are **added or changed** AND when `Division` changes to `CMO`
> Actions: Alert someone, **Copy a row** (→ CMO Contracts Database)
> Recipients: Gina Thomas · Last ran Aug 12 2026, 3:54 PM · Last modified Jul 20 2026

### 🔴 Fires on EVERY row added — these are the migration landmines

| Workflow | Trigger | Actions | Recipients | Why it matters |
|---|---|---|---|---|
| **CFO** | rows added AND `Row ID` is **Any Value** | Alert, **Request an approval**, Change a cell | Lettie Carr Contracts, Contacts in `Originator` | Unconditional. A 379-row Move = 379 approval requests plus 379 cell changes. |
| **0. CBO Initial Review** | rows added AND `Originator` is **Any Value** | Change a cell | — | Unconditional; would rewrite a cell on every migrated row, potentially clobbering the CMO status we just merged. |
| **Events - Pending Stacey Initial Review** | rows added AND an attachment is added or changed | Change a cell | — | Every migrated row arrives *with* attachments. |
| **PGCA Reviewed and Signed** | rows added AND an attachment is added or changed | Alert, **Request an approval**, Change a cell | Gina Thomas, Sherline Lawson, Lettie Carr Contracts, Dr. Tujuana White, Dr. Eleanor White, Contacts in `Originator` | Same trigger, and it blasts approval requests to senior recipients. |

### 🔴 Status-trigger collisions after consolidation

Both divisions' chains key off the same `Status` column, so once CMO rows live in the master these
pairs fire together unless each is gated on `Division`:

| `Status` value | Master workflow | CMO workflow to be rebuilt | Result if unscoped |
|---|---|---|---|
| `Legal Approved` | `3. CBO Approval` → Junae Orendoff, Lettie Carr, Originator, Dept Director | `CMO Approval` → Rachelle Patterson, Loleta Holmes… | Both approver sets get requests for every contract |
| `Legal Approved` | `Construction Approval` → Pam Virgil, **Pastor Jenkins**, Originator | (same value) | Pastor gets approval requests for CMO catering contracts |
| `Legal Resubmit to Originator` | `CBO Legal Resubmit to Originator` | `CMO Legal Resubmit to Originator` | Duplicate alerts |
| `Events Initial Review` | `Events - (CBO) Initial Review Approve / Decline` | `Events - (CMO) Initial Review…` | Duplicate approvals to Stacey Fleming |
| `Executed` | `CBO Executed contract flagged and attached` | `CMO Executed contract flagged and attached` (on `Approved and Signed`) | Overlapping update requests |

### Other master workflows (rebuild targets unaffected by the move)

- Approval chain: `1. CBO`, `2. CBO Legal Review`, `Reminder CBO Initial Review`, `Reminder Legal`, `0. Originator - row changes`
- `Construction Intake Route` (rows added AND `Originating Department` is Construction, or Originator ∈ Jerry Overbey / Robert L George Jr / Nicole Wells)
- **Renewal reminder ladder — 5 / 14 / 30 / 60 / 90 days before `Required Notification to Renew by Date`** → Alert + Request an update to Gina Thomas, Lettie Carr Contracts, Vincent Miller, Originator, Dept Director
- `Renew or Terminate Notification`, `If Event or Artist or Non renewal contract - update if renewable column to No`
- **Dead / suspect:** `CFO Approval Route to Elder Barham then to Pastor` is *active* but triggers on `Division` changing to `CFO` — the master's `Division` picklist has no `CFO` option (`CBO`, `CMO`, `Office of the Pastor`, `PGCA`), so it can never fire. Same for the inactive `CFO Approval Route to Pastor`. Retire during Step 6.
- **Inactive:** `Automation 1/2 - to update TODAY() formula daily` (lock/unlock rows, last ran Mar 2025).

## C. Forms

| Form | Owning sheet | State |
|---|---|---|
| **Contracts Submission Form** | **master** | Active, **364 submissions** — this is the single intake |
| Artist Rider InTake Form | master | Active, 0 submissions |
| — | CMO Contracts Database | **No forms at all** |

**Consequence for the plan:** there is no CMO form to merge or retire — good news. But it also means
the CMO-only fields (artist deposits/balances, event fields, `Legal Review`, `CMO Initial CMO
Approved`) are **typed directly into the CMO grid today**, since the master's form never collected
them. After cutover those fields must be reachable either on the master form (conditional on
`Division = CMO`) or as editable fields in the CMO Dynamic View — otherwise CMO staff lose the only
place they can enter them.

## D. Cross-sheet references, reports, dashboards

| Asset | Type / location | Points at | Action |
|---|---|---|---|
| `Metrics` (`6133771585671044`) | sheet, `/Workspace: Contracts & Applications/Metrics` | CMO sheet via cross-sheet formulas; feeds dashboard tiles | Repoint to master + `Division = CMO` |
| `User Database` (`4810942831349636`) | sheet, same workspace | dashboard leadership name/photo tiles | Unaffected |
| CMO Contracts Executive Dashboard (`3579778738481028`) | dashboard, CMO TEAM ONLY | one METRIC widget reads the CMO sheet directly (`Originating Department`) | Repoint |
| `CMO Contracts` (`7755998752100228`) | report, CMO TEAM ONLY > Contracts | CMO sheet, 49 columns, 1 filter, 1 sort | **Currently returns 0 rows** — rebuild against master, don't port the broken filter |
| `CMO Metrics` | report, CMO TEAM ONLY > Contracts | CMO sheet — shows Counts **378**, Value **$8,631,500** | Rebuild against master |
| `Contracts Value - CMO` (`8254086566596484`) | report, `(LEGACY DNU) Contracts & Applications` | legacy | Leave / retire |

**⚠️ Reporting numbers already disagree**, before any migration: the dashboard tile reads **277
contracts / $4,117,760** while the CMO Metrics report reads **378 / $8,631,500**, and the CMO
Contracts report returns nothing. Do **not** use "dashboard tiles still match" as the post-migration
correctness test (plan verification step 4) — the tiles are already wrong. Rebuild the CMO reporting
from the master and validate against `get_sheet_aggregates` counts instead.

## E. Conditional formatting, saved filters, views (CMO sheet)

Not yet captured — needs `Conditional Formatting` and the filter dropdown opened on the CMO sheet.

| Rule / filter name | Definition | Recreate in master? |
|---|---|---|
| | | |

---

## Sign-off

- Automations + forms captured: **2026-08-18** (Claude, browser pane)
- Conditional formatting / saved filters: ______
- Reviewed with Contracts (Rev. Carr / Contracts): ______ date ______
