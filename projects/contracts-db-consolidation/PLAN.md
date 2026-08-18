# Consolidate CMO Contracts Database → Contracts Database (master)

## Context

Contract requests arrive through a Smartsheet form into **Contracts Database** (`/CBO/Contracts Database`, sheet id `1551069754642308`, owner: G. Thomas). A copy-row automation duplicates every `Division = CMO` submission into **CMO Contracts Database** (`/CMO TEAM ONLY/Contracts/CMO Contracts Database`, sheet id `8818557085241220`, owner: CMO Team, Gina = Admin). All CMO approval routing, attachments, and commentary then happen in the *copy*, not the master.

The CMO process now has a stable rhythm, so the goal is one system of record: the master. What makes this non-trivial is that the copy is currently **richer than the original**.

### Verified current state (read live, 2026-08-18)

| | Contracts Database (master) | CMO Contracts Database |
|---|---|---|
| Rows | 1,111 (611 `Division=CMO`, 500 other divisions) | 379 (100% CMO) |
| Columns | 135 | 154 |
| Attachments | 1,279 | 783 |
| Comment threads | 96 | 172 |
| Direct shares | 19 | 20 |
| Status of CMO rows | **430 of 611 are BLANK** | 0 blank; full lifecycle values |

**Root finding:** matched twin pairs share an identical `Created` timestamp, and the master twin's `Status` is blank while the CMO twin reads `Executed` / `Legal Approved` / etc. The master's CMO rows are largely **stale shells**; the CMO copy is the de facto system of record. Consolidation is therefore a *merge*, not an import — and both sides hold attachments for the same contracts (e.g. the Chesapeake Bay Beach Club 8/27/26 agreement has a file on the master row from S. May and a different, newer file on the CMO row from L. Carr).

### Downstream dependencies on the CMO sheet
- **CMO Contracts Executive Dashboard** (`3579778738481028`) — a metric widget reads a cell directly from the CMO sheet; other tiles read a metrics sheet (`6133771585671044`, "Contract Count" = 277, "CMO Value - Summary" = $4,117,760) whose cross-sheet formulas point at the CMO sheet.
- **CMO Contracts** report (`7755998752100228`) in the same folder; plus legacy `Contracts Value - CMO` report in the `(LEGACY DNU)` workspace.
- 20 direct shares including Rev. Carr, CMO Team, Rachelle Patterson, Stefanie May, Aja Thomas, Tomiko Hankerson, Carl Bartee.

### Decisions taken
1. **Access model:** approval-by-email + a small named group. Only Contracts/CBO staff and 3–5 CMO leads get sheet access; other CMO participants keep working through the form, automated **approval requests** and **update requests**, which do not require sheet sharing.
2. **Twin conflicts:** resolved **case-by-case from a reconciliation audit sheet**, not by a blanket rule.
3. **Cutover:** one weekend freeze (Fri PM → live Monday).

---

## Double review: is consolidation into the master the right call?

| Option | Verdict |
|---|---|
| **A. Consolidate into master (chosen)** | Correct. One record per contract, one form, one approval chain, one audit trail; CBO already owns the master and 500 non-CMO rows are healthy there. Cost is a real one-time merge and an access-control redesign. |
| B. Make the CMO sheet the new master | Rejected. It carries 19 CMO-only/legacy columns, a duplicate `CBO Status` picklist, a narrower `Status` list (28 vs 34 options), and lives in `CMO TEAM ONLY` owned by a shared `cmo@` account. Moving 500 non-CMO rows *in* is strictly more work than moving 379 CMO rows *out*. |
| C. Build a brand-new third sheet | Rejected. Doubles the migration (two sources, two sets of automations, two dashboards to repoint) for no gain the master doesn't already give. |
| D. Keep both, fix the sync | Rejected as an end state, but note it is the only *reversible* option — hence the rollback plan below. Smartsheet has no two-way row sync; cell links are one-way per cell and cannot carry attachments, comments, or new rows. Any "fix" reproduces today's drift. |

### Risk lenses

| Lens | Risk | Mitigation in the plan |
|---|---|---|
| **Confidentiality** | Sharing master to all 20 CMO collaborators exposes 500 CBO / Pastor / CFO / PGCA contracts and dollar values. Master also has `Account User Name` / `Account Password` columns — *hidden is not secure*, any Editor can unhide. | Chosen access model (few leads + approval-by-email). **Prerequisite:** move credentials out of the sheet before any new share (Step 1). |
| **Data integrity** | Twin merge picks the wrong survivor and a signed PDF or approval trail is lost. | Reconciliation audit sheet + human survivor choice + full pre-cutover backups; nothing is deleted until the audit is signed off. |
| **Attachments** | 783 CMO + 1,279 master attachments. Smartsheet **cannot merge attachments into an existing row** — files travel only with a row Move/Copy. Deleting a master twin destroys its files. | Move (not re-key) the surviving CMO rows so attachments + comments travel automatically; for the minority of pairs where the *master* row also holds files, download and re-upload those files onto the survivor via a short API script. |
| **Automations** | A Move/Copy counts as *rows added*: dropping 379 rows into master can fire every master alert/approval workflow at once (email storm to executives, spurious approval requests). CMO's workflows also must be rebuilt with `Division=CMO` conditions or they will fire on CBO rows. | Deactivate **all** workflows on both sheets during the window; migrate; rebuild/scope; reactivate one at a time with a test row. |
| **Formulas** | Moved rows have their row formulas flattened to static values; the two sheets' formulas disagree (`Days to Terminate By`, `Days (Start/End)`, `Year Created`, `Month Created`, `Days until Contract End Date`). | Convert master's calculated fields to **column formulas** first, so they re-apply to arriving rows automatically. |
| **Column mapping** | Move matches columns **by name**; any CMO column missing in master is auto-created with CMO's name — silently producing near-duplicates (`Is this an event?` vs master's `Is this an Event?`). | Pre-align names/types in master *before* moving (Step 2), so mapping is deterministic. |
| **Reporting** | CMO dashboard + report + metrics-sheet cross-sheet formulas break the moment rows leave. | Repoint before reactivating; validate the two headline numbers (277 count / $4.12M value) against the master after migration. |
| **Sheet limits** | Master at 155 columns hits the 500,000-cell cap at roughly **3,200 rows**; it will be ~1,490 rows / ~231k cells after this merge (≈46%). | Adopt an annual archive rule now (Step 8) and resist adding more columns; prune legacy columns during Step 2. |
| **Ownership / continuity** | CMO sheet is owned by the shared `cmo@` login; master is owned by a personal account (`gthomas`). | Per BSS architecture standard, move master ownership to a group/service account as part of Step 8. |
| **Change management** | CMO staff lose the sheet they've used daily; approvals arrive as email requests instead. | One-page "what changes Monday" note + the existing dashboard preserved (repointed) so their entry point looks the same. |
| **Audit / retention** | Deleting the CMO sheet destroys cell history (history does **not** travel with moved rows). | Never delete: rename to `(ARCHIVE DNU) CMO Contracts Database`, strip edit shares, lock, keep in place. |
| **Reversibility** | If the merge goes wrong mid-window. | Backups + rollback in Step 7; the archived CMO sheet remains a complete pre-cutover snapshot. |

---

## Plan

### Step 0 — Inventory what the API can't see (before the window; ~2 hrs)
The Smartsheet MCP tools expose rows, columns, shares, attachments, discussions, reports and dashboards — **not** automations, forms, conditional formatting, or the cross-sheet-reference list. Capture these manually and record them in the migration doc:
- Both sheets: Automation panel → every workflow (name, trigger, condition, action, recipients, active?). Note especially the CMO approval chain (`CMO Initial CMO Approved`, `Legal Review`, `Keith Dukes approval`, `Diane initial review`, `CMO Approver >10K`, `Aja Reviewed Date`) and the copy-row automation that feeds the CMO sheet.
- Both sheets: Forms (which sheet owns the "Contracts Submission Form" `62e59443…` and "New Vendor Request" `d3b8470a…` linked from the CMO dashboard), field order, logic, confirmations.
- Both sheets: `⋯ → Sheet used by / Cross-sheet references` (expect the metrics sheet `6133771585671044`).
- Conditional formatting rules and saved filters/views on the CMO sheet.

### Step 1 — Harden the master before anyone new is added
- Remove `Account User Name`, `Account Password`, `Legacy Subscription Account …` from the master (export values to a proper secrets store first). This is the single highest-severity finding in the review.
- Confirm the master's 19 existing shares are all still appropriate; convert individual shares to a group where possible.
- Convert master's calculated columns (`Year Created`, `Month Created`, `Days (Contract Start and End Date)`, `Days until Contract End Date`, `Days to Terminate By`, `End (Month/Year)`, `Current Date`) to **column formulas**.

### Step 2 — Reconcile the schema in the master (155 columns, not 174)
Create in master only what is genuinely needed; map the rest onto existing master columns by **renaming the CMO column to the master's name before the move**.

*Create (CMO-only, keep):* `Name of Event`, `Is this an Artist / Speaker Agreement?`, `Is this an Artist Agreement?`, `Artist Deposit Amount`, `Artist Deposit Due Date`, `Artist Balance Amount`, `Artist Balance Due Date`, `Legal Review`, `CMO Initial CMO Approved`, `CMO Approver >10K`, `Keith Dukes approval`, `Diane initial review`, `Aja Reviewed Date`, `Quote / Proposal Expiration Date (n/a)`, `Monthly Payment - Subscription`.

*Map, do not create:* `Is this an event?` → master `Is this an Event?`; `Month to Month Subscription (Y/N)` → `Month to Month Subscription`; `Required Notification of Renewal Date` (text) → `Required Notification to Renew by Date` (date); `Is There a Required Renew By Date` → `Is this Renewable?` / `Quote / Proposal Expiration Date (yes/no)` pattern; `CBO Status` → drop (legacy duplicate of `Status`).

*Also fix:* type mismatches `Event Name` (CMO text vs master picklist), `CMO Approver <5K` and `CMO Approver 5K-10K` (CMO picklist vs master text); and reconcile `Division` options — master has `Office of the Pastor`, `PGCA`; CMO has `Office of the Pastor: Construction`, `Office of the Pastor: CFO`. Pick one canonical list.

### Step 3 — Build the reconciliation audit sheet (the decision record)
One row per contract found in the CMO sheet, with: CMO row link, matched master row link (match on `Created` timestamp, then Description+Value), CMO `Status` vs master `Status`, attachment count each side, comment count each side, last-modified each side, and a `Survivor` picklist (`CMO` / `Master` / `Both — merge files`) plus `Reviewed by`.
- Generate it with a short Python script using the Smartsheet API (token + `smartsheet-python-sdk`): `list_attachments`, `list_discussions`, and row data per sheet. The MCP tools can read all of this but cannot upload files, so the script is also the vehicle for Step 5.
- Expected shape from sampling: ~379 CMO rows, the large majority matching a blank-status master shell (430 blank shells exist), plus a residue of CMO rows with no master twin (pre-automation era, back to 2024-06-18) and ~181 master CMO rows with real status and no CMO twin — those stay untouched.
- Contracts staff (Rev. Carr / Contracts) sign off the `Survivor` column **before** the freeze.

### Step 4 — Freeze (Friday PM)
1. Turn off the form(s) feeding new CMO rows, or post a maintenance notice.
2. Deactivate **every** workflow on both sheets — including the copy-row automation that creates the CMO duplicates. This is what prevents an approval/alert storm when rows land.
3. Backups: `File → Save as New` on both sheets (keeps attachments/comments) **and** an Excel export of each, plus a dashboard screenshot. Label them `PRE-CONSOLIDATION 2026-xx-xx`.

### Step 5 — Migrate (Saturday)
Work strictly from the signed audit sheet, in batches of ~50 with a count check after each:
1. **Survivor = CMO:** rescue any master-side attachments/comments first (script: download master row files → re-upload to the CMO row; paste any master comment text into the CMO row as a comment noting original author/date), then **delete the master shell**, then **Move** the CMO row into the master. Attachments and comments travel with the move; formulas flatten to values (Step 1's column formulas re-apply).
2. **Survivor = Master:** copy CMO's field values onto the master row (script), rescue CMO attachments/comments onto the master row via the script, then delete the CMO row.
3. **CMO row with no master twin:** straight **Move** into master; set `Division = CMO`.
4. **Master row with no CMO twin:** leave alone.
5. Do not delete the source rows until the destination count reconciles: expect master ≈ **1,490 rows** and `Division=CMO` ≈ **990**, with **0** blank-`Status` rows among migrated items.

### Step 6 — Rebuild automations, form, reporting (Saturday–Sunday)
- Rebuild each CMO workflow on the master from the Step 0 inventory, every one gated by a `Division = CMO` condition. Verify the reverse too: every pre-existing master workflow must be scoped so it does not now fire on CMO rows unintentionally. Watch the per-sheet workflow count and consolidate near-duplicate approval rules where the same trigger/recipients repeat.
- Approvals for non-shared CMO participants: use **Request an approval** / **Request an update** actions (email-based, no sheet share required) — this is what makes the chosen access model work.
- Fold the CMO-only form questions into the master's form with conditional logic on `Division = CMO`; retire the CMO form (leave a redirect note on the dashboard shortcut).
- **Delete the copy-row automation permanently** — this is the change that ends the drift.
- Repoint the CMO report, the metrics sheet's cross-sheet formulas, and the dashboard's CMO-sheet metric widget at the master, filtered to `Division = CMO`. Validate the headline tiles still read ~277 contracts / ~$4.12M (or explain the delta deliberately).
- Reactivate workflows one at a time, each verified with a single test row that is then deleted.

### Step 7 — Verify, then rollback criteria (Sunday)
Verify: row counts by `Division`; zero blank `Status` among migrated rows; attachment total on master ≈ 1,279 + migrated CMO files; comment threads present on migrated rows; dashboard tiles correct; submit one live test request end-to-end through the form and confirm approval emails reach a non-shared test user.
**Roll back if** counts don't reconcile, attachments are missing on spot-checked rows, or approval emails misroute: restore the two `PRE-CONSOLIDATION` copies, re-enable the original workflows and the copy-row automation, and reschedule. The archived CMO sheet remains a complete snapshot regardless.

### Step 8 — Close out (Monday+)
- Rename the old sheet `(ARCHIVE DNU) CMO Contracts Database`, remove all Editor shares, lock all columns, leave it in `CMO TEAM ONLY` for audit history (cell history does not migrate — this sheet *is* the pre-cutover record).
- Reduce CMO shares on the master to the agreed 3–5 leads; everyone else on form + email approvals.
- Move master ownership to a group/service account per the BSS solution architecture standard; register the consolidated solution in the solutions register.
- Adopt an annual archive rule (roll `Executed`/`Expired` rows older than N years into a `Contracts Archive` sheet) to stay well clear of the 500k-cell cap at 155 columns.
- Have Scribe document the migration: prompts, scripts, the audit sheet, and the "what changed Monday" one-pager.

---

## Files / assets touched
- Master: [Contracts Database](https://app.smartsheet.com/sheets/VVgV8vQpgRmJ3hfQCx5WqVFmc3WVV9F2pW9F6931) (`1551069754642308`)
- Source: [CMO Contracts Database](https://app.smartsheet.com/sheets/M87vWg79gr8GCh7hJ39g9hV2xWFvFrPHxXjvcGg1) (`8818557085241220`)
- [CMO Contracts Executive Dashboard](https://app.smartsheet.com/dashboards/7PfXFqgCVJmV6JjJgq75WQ4mWqCCmcWFFpXF5wJ1) (`3579778738481028`); metrics sheet `6133771585671044`; CMO Contracts report `7755998752100228`
- New: reconciliation audit sheet; migration script (Smartsheet Python SDK); `(ARCHIVE DNU)` renamed source sheet

## Verification checklist
1. `get_sheet_aggregates` on master grouped by `Division` → CMO ≈ 990, total ≈ 1,490.
2. `get_sheet_aggregates` on master grouped by `Status`, filtered `Division=CMO` → no `(blank)` among migrated rows.
3. `list_attachments` / `list_discussions` on master → totals increased by the migrated volume; spot-check 10 audited rows for their expected PDFs and comment threads.
4. Dashboard tiles and the CMO report render from the master with the `Division=CMO` filter.
5. One end-to-end live form submission routes approvals correctly to a user who has **no** share on the master.
