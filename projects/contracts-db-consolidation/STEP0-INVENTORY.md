# Step 0 — Inventory of what the Smartsheet API cannot read

The Smartsheet API (and the MCP tools) expose rows, columns, shares, attachments, discussions,
reports and dashboards. They do **not** expose automations, forms, conditional formatting, or the
cross-sheet-reference list. Those have to be captured from the UI — either by G. Thomas, or by
Claude driving the Browser pane once signed in to Smartsheet.

Sheets in scope:
- **Master** — Contracts Database, id `1551069754642308`, `/CBO/Contracts Database`
- **Source** — CMO Contracts Database, id `8818557085241220`, `/CMO TEAM ONLY/Contracts/CMO Contracts Database`

Capture order: CMO automations → master automations → forms → cross-sheet refs → formatting/views.

---

## A. Automations — CMO Contracts Database

For each workflow: `Automation → Manage workflows`, open it, record every branch.

| # | Workflow name | Active? | Trigger (event + when) | Conditions | Action(s) | Recipients | Rebuild in master? | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |

Watch specifically for the workflows behind these CMO-only columns, since they drive the approval
chain that has to be reproduced in the master with a `Division = CMO` condition:
`CMO Initial CMO Approved`, `Legal Review`, `Keith Dukes approval`, `Diane initial review`,
`CMO Approver >10K`, `Aja Reviewed Date`, `Quote / Proposal Expiration Date (n/a)`.

## B. Automations — Contracts Database (master)

Same table. Two things to flag per workflow:
1. **Will it fire when 379 rows arrive?** (a Move counts as *rows added*)
2. **Is it scoped so it will not now fire on CMO rows unintentionally?**

| # | Workflow name | Active? | Trigger | Conditions | Action(s) | Recipients | Fires on bulk arrival? | Needs Division scope? |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |

**The copy-row automation** that duplicates `Division = CMO` submissions into the CMO sheet —
record it in full here, because Step 6 deletes it and the rollback plan has to be able to recreate it:

- Name:
- Trigger:
- Condition:
- Action / destination sheet:
- Active:

## C. Forms

The CMO dashboard links two forms; confirm which sheet each belongs to.

| Form | URL | Owning sheet | Fields / logic notes | Action at cutover |
|---|---|---|---|---|
| Contracts Submission Form | `https://app.smartsheet.com/b/form/62e59443fb694d97bea7494c082d4d18` | | | |
| New Vendor Request Submission Form | `https://app.smartsheet.com/b/form/d3b8470a0af8461181fff0a78d4af02c` | | | |

For the surviving master form, list the CMO-only questions to add with conditional logic on
`Division = CMO` (artist/speaker fields, deposits/balances, event fields).

## D. Cross-sheet references and inbound links

`⋯ (sheet menu) → Cross-sheet references` on each sheet, plus `Sheet used by` where available.

| Source of the reference | Points at | Used for | Repoint to |
|---|---|---|---|
| metrics sheet `6133771585671044` | CMO Contracts Database | dashboard tiles: Contract Count = 277, CMO Value = $4,117,760 | master, filtered `Division = CMO` |
| | | | |

Known dashboard/report dependencies (already confirmed via API):
- CMO Contracts Executive Dashboard `3579778738481028` — one METRIC widget reads a cell directly
  from the CMO sheet (`Originating Department`); other tiles read metrics sheet `6133771585671044`;
  two more tiles read sheet `4810942831349636` (leadership names/photos — unaffected).
- Report `7755998752100228` "CMO Contracts" in `CMO TEAM ONLY > Contracts`.
- Legacy report `8254086566596484` "Contracts Value - CMO" in `(LEGACY DNU) Contracts & Applications`.

## E. Conditional formatting, saved filters, views (CMO sheet)

| Rule / filter name | Definition | Recreate in master? |
|---|---|---|
| | | |

---

## Sign-off

- Inventory complete (all workflows opened and recorded): ______ date ______
- Reviewed with Contracts (Rev. Carr / Contracts): ______ date ______
