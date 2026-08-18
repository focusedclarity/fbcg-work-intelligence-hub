# FBCGI Contracts — Complete Plan

**One document, five stages: harden → restructure → merge → govern → automate.**
Detail lives in [PLAN.md](PLAN.md) (migration mechanics), [RESTRUCTURE.md](RESTRUCTURE.md) (schema +
renewal engine), [STEP0-INVENTORY.md](STEP0-INVENTORY.md) (automations, forms, dependencies).
Status as of 2026-08-18: **planned and approved; nothing in Smartsheet has been changed yet.**

---

## 1. Why

Contract requests land via one form in **Contracts Database** (master, `/CBO/`, id `1551069754642308`).
A copy-row automation duplicates every `Division = CMO` submission into **CMO Contracts Database**
(`/CMO TEAM ONLY/Contracts/`, id `8818557085241220`). All CMO approvals, attachments and commentary
then happen in the *copy*. The copy became the real system of record while the master's CMO rows went
stale — so staff maintain two sheets and neither is fully true.

Goal: one system of record (the master), with row-level access for CMO, an archive for finished work,
and automated checking of what people key in.

### Current state (read live, 2026-08-18)

| | Master | CMO copy |
|---|---|---|
| Rows | 1,111 (611 CMO / 500 other) | 379 (all CMO) |
| Columns | 135 | 154 |
| Attachments | 1,279 | 783 |
| Comment threads | 96 | 172 |
| Direct shares | 19 | 20 |
| Workflows | 27 | 11 |
| Forms | 2 (`Contracts Submission Form`, 364 submissions) | **none** |
| CMO rows with blank `Status` | **430 of 611** | 0 |

**Root finding:** twin rows share an identical `Created` timestamp; the CMO twin holds the real
lifecycle value while the master twin is blank. This is a **merge with survivor selection**, not an
import. Both sides hold attachments for the same contracts, and Smartsheet cannot merge attachments
into an existing row — files travel only with a row Move/Copy.

---

## 2. What the audit found

| # | Finding | Severity |
|---|---|---|
| 1 | **Master published publicly**: `Read Only – Full` is ON — anyone with the URL views all 1,111 contracts and downloads attachments, no login | 🔴 |
| 2 | **CMO sheet published publicly**: `Edit by Anyone` is ON — anyone with the URL can edit cells, manage attachments, comment | 🔴 |
| 3 | Master holds `Account User Name` / `Account Password` columns; hidden ≠ secure for Editors | 🔴 |
| 4 | Four master workflows fire on **every row added**: `CFO` (`Row ID is Any Value` → request an approval), `0. CBO Initial Review` (→ change a cell), `Events - Pending Stacey Initial Review` and `PGCA Reviewed and Signed` (→ triggered by *an attachment being added*, which every migrated row satisfies; PGCA notifies Dr. Tujuana White, Dr. Eleanor White, Sherline Lawson). A 379-row Move fires hundreds of approval requests | 🔴 |
| 5 | **Status-trigger collision**: both divisions' chains key off one `Status` column. `Legal Approved` fires `3. CBO Approval` *and* `Construction Approval` (recipients include **Pastor Jenkins**) *and* the rebuilt `CMO Approval` | 🔴 |
| 6 | **Primary key rewrites itself annually**: `Contract or Application ID` = `RIGHT(YEAR(TODAY()),2) + …`, so a 2025 contract now reads `26-…`. This also breaks the `fbcgi-contract-analysis` skill's own lookup-by-ID, and every summary PDF filed under an older ID | 🟠 |
| 7 | **CMO contracts have had no renewal reminders.** The 5/14/30/60/90-day ladder exists only on the master, keyed to `Required Notification to Renew by Date`; the CMO side kept that as *text* | 🟠 |
| 8 | `Value ($)` is TEXT and holds multi-values (`96.50,132.00,165.00`) — breaks sums, dollar-threshold routing, and dashboards | 🟠 |
| 9 | **~50 of 135 columns are dead**: `Approval Status2/4/6/7/8` blank across all 1,111 rows; `3/5/9/10` hold 44 stray values total; `PGCA`, `Contract`, `Business Services Contract Received`, threshold approver columns empty | 🟡 |
| 10 | Renewal inputs empty: `Is this Renewable?` blank on 266/500 non-CMO rows; `Renew or Terminate` 498/500; `Setup for Auto Renew` 494/500; `Fully Executed Contract On File` true on only 63/500 despite 441 Executed | 🟡 |
| 11 | **CMO reporting already disagrees with itself**: dashboard tile 277 contracts / $4,117,760 vs `CMO Metrics` report 378 / $8,631,500, and the `CMO Contracts` report returns 0 rows | 🟡 |
| 12 | `Status` picklist lists "Legal Approved" **twice**; `Division` has no `CFO` option yet two active workflows trigger on `Division → CFO` and can never fire | 🟡 |
| 13 | Master owned by a personal account (`gthomas`); CMO sheet by the shared `cmo@` login | 🟡 |

## 3. Decisions locked

| Decision | Choice |
|---|---|
| Direction | Consolidate into the **master**; archive the CMO sheet, never delete it (cell history does not travel with moved rows) |
| CMO access | **Dynamic View** filtered `Division = CMO` (provisioned, confirmed). Direct sheet access for Contracts/CBO + 3–5 CMO leads only. Form + email approval/update requests are the fallback |
| Twin conflicts | Case-by-case from a **signed reconciliation audit sheet** |
| Cutover | **One weekend freeze**, Fri PM → live Monday, all workflows on both sheets deactivated |
| Public links | **Off now** |
| Dead columns | **Export, then delete** |
| `Value ($)` | Convert to numeric + `Value Notes` companion |
| Entry QC | Formulas + a legal-review **gate** + a scheduled Claude review |
| Claude writes | **None.** Daily digest to Gina; anything landing on a row needs her per-item approval |
| Review depth | Verification **and** full memo for every contract; ping for approval before attaching |
| Renewal comparison | Separate **"Renewal delta review"** mode — the skill's independence rule stays intact |

---

## 4. The five stages

### Stage 1 — Security and truth *(this week, ~2 hrs)*
1. Turn **off** both public publish links.
2. Excel export + `Save as New` snapshots of both sheets, labelled `PRE-RESTRUCTURE 2026-08-18`.
3. Move credentials out of the sheet, then delete `Account User Name` / `Account Password` /
   `Legacy Subscription Account …`.
4. Capture the last inventory gap: **conditional formatting rules and saved filters** on both sheets
   → `STEP0-INVENTORY.md` section E.
5. Audit the master's 19 existing shares; convert individuals to a group where possible.

### Stage 2 — Restructure the master *(before the cutover weekend)*
Full detail in [RESTRUCTURE.md](RESTRUCTURE.md). Order matters: Move matches columns **by name**, so
the schema must be final before 379 rows arrive.

6. **Freeze the primary key** — static `YY-DEPT-nnnnn` from `Created`; adopt `Row ID` (auto-number,
   immutable) as the key for chaining and cross-sheet references.
7. **`Value ($)` → currency**, with `Value Notes` for rate cards; dollar thresholds become *conditions*,
   not columns.
8. **Picklist hygiene** — drop the duplicate `Legal Approved`; one canonical `Division` list; retire the
   two dead `Division → CFO` workflows.
9. **Prune ~50 dead columns** (stray values → `Legacy Notes` first).
   **Do not delete** — the `fbcgi-contract-analysis` skill reads these: `Date Carr Initialed`,
   `CFO Legal Review`, `Approval Status`, `Latest comment`, `Confirmed Tax Exemption (Yes)`,
   `Type of Document`, `Value ($) Period`, `Is this Renewable?`,
   `Required Notification to Renew by Date`. Renaming any of them means updating the skill's
   `references/data-sources.md` in the same session.
10. **Collapse approvals to one pattern per stage** — `Decision – Initial Review` / `– Legal` /
    `– Final Approval`, each with `Approver` + `Decision Date`, replacing `Approval Status2–15`.
11. **Add the CMO-only columns** the migration needs (artist/speaker, deposits/balances, event fields,
    `Legal Review`, `CMO Initial CMO Approved`, `Keith Dukes approval`, `Diane initial review`,
    `Aja Reviewed Date`).
12. Convert all calculated fields to **column formulas** so they re-apply to arriving rows.
13. Add the QC / renewal / chaining columns: `Data Quality Flag`, `QC Status`, `QC Grandfathered`,
    `Renewal Decision` + date, `Supersedes (Row ID)`, `Superseded By (Row ID)`, `Successor Status`,
    `Predecessor Status`, `Archive Ready`.

Result: **135 → ~105 columns**; ~1,490 rows after the merge ≈ 156k cells, 31% of the 500k cap
(versus ~231k if we migrated without pruning).

### Stage 3 — Merge the CMO sheet *(one weekend)*
Full detail in [PLAN.md](PLAN.md).

14. **Pre-align CMO column names** to the master's so Move maps deterministically
    (`Is this an event?` → `Is this an Event?`, the text renew-by → the date column, drop `CBO Status`).
15. **Build the reconciliation audit** — `python audit_pairs.py --outdir ./audit` (read-only) →
    import `audit_pairs.csv` as the audit sheet → **Contracts signs off the `Survivor` column**.
16. **Friday PM freeze** — pause the form, deactivate **every** workflow on both sheets (including the
    copy-row automation), take `PRE-CONSOLIDATION` snapshots + exports.
17. **Saturday migrate**, batches of ~50 with a count check after each:
    - *Survivor = CMO*: rescue master-side attachments/comments via the script → delete the master
      shell → **Move** the CMO row in (files and comments travel with it).
    - *Survivor = Master*: script CMO values onto the master row, rescue CMO files/comments, delete the
      CMO row.
    - *No master twin*: straight Move in.
    - *No CMO twin*: leave alone.
    - Set `QC Grandfathered` on every pre-cutover row.
18. **Sat–Sun rebuild**: every workflow gets an explicit `Division` condition (both the rebuilt CMO ones
    **and** the pre-existing CBO/Construction/PGCA ones — finding #5); fix the unconditional triggers
    permanently (#4); add the CMO-only questions to the master form with `Division = CMO` logic;
    **delete the copy-row automation**; build and test the **CMO Dynamic View** with a real CMO account;
    repoint the `Metrics` sheet and dashboard widget; **rebuild** the two broken CMO reports;
    reactivate workflows one at a time with a test row.
19. **Sunday verify** (§6). Roll back to the `PRE-CONSOLIDATION` copies if counts don't reconcile,
    attachments are missing on spot-checks, or approvals misroute.

### Stage 4 — Govern *(Monday onward)*
20. Rename the source `(ARCHIVE DNU) CMO Contracts Database`; strip Editor shares; lock columns; leave
    it in place as the pre-cutover audit record.
21. Reduce direct CMO shares on the master to the 3–5 leads — **removing the direct shares is what
    actually enforces the row boundary**; a Dynamic View beside a live share protects nothing.
22. Create **`Contracts Archive`** from the finalized schema (identical column names/order) + a monthly
    *Move row when `Archive Ready`* automation, and an **`All Contracts (incl. archive)`** report so
    search never depends on knowing which sheet a contract lives in.
23. Move master ownership to a group/service account; register the solution (and the Dynamic View
    add-on dependency, so it surfaces at renewal) in the solutions register.

### Stage 5 — Automate *(built during Stage 2–4, activated after cutover)*
24. **Renewal ladder, split by audience** — replaces five identical alerts to the same five people:

    | Trigger | Action | To |
    |---|---|---|
    | 90 / 60 / 30 days before renew-by | **Request an update** on `Renewal Decision` | Originator + Dept Director |
    | 14 days, still blank | Escalation alert | Contracts, Gina, division director |
    | 5 days, still blank | Final escalation | Rev. Carr + Gina |
    | `Renewal Decision = Renew` | Task to submit the renewal, filling `Supersedes (Row ID)` | Originator, Contracts |
    | `Supersedes` set **and** `Status = Executed` | Confirm the link; `Archive Ready` trips on the predecessor | Contracts |

25. **Form-level validation first** — required `End date` / `Value ($)` / `Is this Renewable?`; renew-by
    as a **date** field shown only when Renewable = Yes; no free-text dates.
26. **The gate** — when `Status → Legal Review` and `QC Status = "Needs Fix"` and not grandfathered:
    bounce to `New Request`, request an update from the Originator listing `Data Quality Flag`, alert
    Contracts. *A row cannot reach Legal until it is clean* — this is what replaces the manual
    keyed-data check.
27. **Daily Claude row review** (weekdays 7:30 AM, read-only against Smartsheet): rows created/modified
    in 24h with ≥1 attachment and status in the intake/review range, capped ~10 per run; plus a
    `Request AI Pre-Review` checkbox for urgency between sweeps. Runs `fbcgi-contract-analysis`, and
    delivers a **digest to Gina** — verification table, derived renew-by date, risk snapshot, memo PDF
    held locally, proposed `Supersedes` links. **Nothing is written or attached without her approval.**
28. **Skill upgrades** for that loop (see RESTRUCTURE.md Phase G): a required *Row data verification*
    section; the renew-by date **derived as a date**; auto-renew as a discrete verdict; a
    signature-presence check; a machine-readable JSON companion; `Row ID` in the masthead; a separate
    **Renewal delta review** mode; and a Windows-friendly render path with a graceful fallback (the
    skill currently targets `/mnt/user-data/outputs` and `present_files`, which are claude.ai-side).

---

## 5. Risk register

| Risk | Control |
|---|---|
| Wrong survivor loses a signed PDF or approval trail | Signed audit sheet + snapshots; nothing deleted before sign-off |
| Attachments can't be merged into an existing row | Move the surviving row so files travel; script download/re-upload only for the minority where the master row also holds files |
| 379-row Move triggers an approval storm (#4) | All workflows off during the window; unconditional triggers given real conditions permanently |
| One `Status` column, two chains (#5) | Explicit `Division` condition on **every** workflow; the collision table is the checklist |
| Moved rows lose row formulas | Column formulas first (Stage 2, step 12) |
| Column-name mismatch silently creates junk columns | Pre-align names before Move (Stage 3, step 14) |
| Deleting a column is irreversible | Export + snapshot before the first delete; stray values to `Legacy Notes` |
| Renaming a column breaks the analysis skill | Do-not-delete list; update `data-sources.md` in the same session |
| QC automations spam originators over legacy gaps | Formulas now, automations after cutover, `QC Grandfathered` on pre-cutover rows |
| Dynamic View misconfigured → CMO work stalls Monday | Build and test with a real CMO account, not an admin; keep the email path as documented fallback |
| Cell-limit growth | Prune to ~105 columns + the archive sweep |
| Cell history does not migrate | The archived CMO sheet *is* the pre-cutover record |
| Turning off public links breaks an unknown consumer | Reversible in one click; rebuild as a report or Dynamic View, which is what it should have been |

## 6. Verification

1. `get_sheet_aggregates` by `Division` → CMO ≈ 990, total ≈ 1,490; by `Status` filtered `Division=CMO`
   → **no `(blank)`** among migrated rows.
2. `list_attachments` / `list_discussions` → totals up by the migrated volume; spot-check 10 audited
   rows for their expected PDFs and comment threads.
3. **Do not** use "dashboard tiles still match" as the correctness test (#11) — validate against
   aggregates, then rebuild the tiles to agree.
4. One live form submission routes approvals to a user with **no** share on the master.
5. **Dynamic View with a real CMO user**: only `Division = CMO` rows; attachments and comments open;
   exactly the intended fields editable; no other division reachable by search, filter, or row link.
6. **ID freeze × skill**: look up a 2025 contract by the ID printed on its existing summary PDF and
   confirm the skill finds the row (today it cannot).
7. **Row review end-to-end**: submit a test contract whose PDF dates disagree with the keyed row — the
   digest must name the mismatch, derive the renew-by date, state auto-renew and signature status, and
   touch nothing; then approve one item and confirm only that item changed.
8. **Gate**: a renewable row with no renew-by date and an end-before-start date must read `Needs Fix`
   and be bounced back from `Legal Review`.
9. **Archive**: check `Archive Ready` on a terminal test row, run the sweep, confirm it lands in
   `Contracts Archive` **with attachments and comments** and appears in the union report.
10. **Prune safety**: after each delete batch, submit a test entry through the form, re-open the
    Automation panel for missing-column errors, and open both reports.

## 7. Open items

- [ ] 🔴 Turn off both public publish links
- [ ] Conditional formatting + saved filters → `STEP0-INVENTORY.md` §E
- [ ] Decide who the 3–5 CMO sheet leads are (everyone else on the Dynamic View)
- [ ] Confirm where the credentials from `Account Password` should go
- [ ] Pick the cutover weekend and tell Contracts + CMO
- [ ] Renewal backlog: expect missed renew-by dates to surface when CMO data lands in the real date
      column — agree with Contracts how to handle them before the ladder is switched on
- [ ] Run `audit_pairs.py` and get the `Survivor` column signed
- [ ] Fix the stale local `master` branch in the primary working directory (last commit 2026-07-10,
      while canonical is `main`)
