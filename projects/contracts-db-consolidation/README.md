# Contracts DB consolidation — CMO Contracts Database → Contracts Database

**Status:** planned and approved 2026-08-18. Nothing has been changed in Smartsheet yet.

Goal: end the two-sheet split. Today the intake form lands in the master
([Contracts Database](https://app.smartsheet.com/sheets/VVgV8vQpgRmJ3hfQCx5WqVFmc3WVV9F2pW9F6931),
id `1551069754642308`) and a copy-row automation duplicates every `Division = CMO` row into
[CMO Contracts Database](https://app.smartsheet.com/sheets/M87vWg79gr8GCh7hJ39g9hV2xWFvFrPHxXjvcGg1)
(id `8818557085241220`), where the approvals, files and comments actually happen.

## The finding that shapes the work

**430 of the master's 611 `Division=CMO` rows have a blank `Status`.** Twin rows share an identical
`Created` timestamp, and the CMO twin carries the real lifecycle value. The CMO copy is the de facto
system of record, so this is a **merge with survivor selection**, not an import. Both sides also hold
attachments for the same contracts, and Smartsheet cannot merge attachments into an existing row —
files travel only with a row Move/Copy.

| | master | CMO |
|---|---|---|
| rows | 1,111 (611 CMO / 500 other) | 379 (all CMO) |
| columns | 135 | 154 |
| attachments | 1,279 | 783 |
| comment threads | 96 | 172 |
| direct shares | 19 | 20 |

## Files here

| File | What it is |
|---|---|
| `PLAN.md` | The approved plan: alternatives review, 12-lens risk register, Steps 0–8, rollback, verification checklist |
| `STEP0-INVENTORY.md` | Template to capture what the API cannot read — automations, forms, cross-sheet refs, formatting |
| `audit_pairs.py` | **Read-only.** Builds the Step 3 reconciliation audit: twin pairs, attachment/comment counts each side, recommended survivor |

## Running the audit

```bash
python projects/contracts-db-consolidation/audit_pairs.py --outdir ./audit
```

Needs `SMARTSHEET_ACCESS_TOKEN` (Smartsheet → Account → Personal Settings → API Access). Pure GETs
against two sheets; writes `audit_pairs.csv`, `audit_master_only.csv`, `audit_summary.txt`. Import
`audit_pairs.csv` into Smartsheet as the audit sheet, then Contracts staff fill the
`Survivor (confirm)` column. Migration does not start until that column is signed off.

## Decisions taken

1. **Access model** — approval-by-email plus a small named group. Only Contracts/CBO staff and 3–5
   CMO leads get access to the master; everyone else uses the form and email approval/update
   requests, which need no sheet share. Prerequisite: strip `Account User Name` / `Account Password`
   from the master before any new share.
2. **Twin conflicts** — resolved case-by-case from the audit sheet, not by a blanket rule.
3. **Cutover** — one weekend freeze (Fri PM → live Monday), all workflows on both sheets deactivated
   during the window so a 379-row Move does not fire the master's alert/approval automations.

## Next actions

- [ ] Sign in to Smartsheet in the Claude Browser pane so Step 0 (automations + forms inventory) can be captured
- [ ] Run `audit_pairs.py`, import `audit_pairs.csv` as the audit sheet
- [ ] Contracts sign-off on the `Survivor (confirm)` column
- [ ] Step 1 (harden master: credentials out, column formulas) and Step 2 (schema reconcile)
- [ ] Schedule the cutover weekend
