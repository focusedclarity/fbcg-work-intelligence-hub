# Restructure the master Contracts Database (pre-migration hardening + renewal engine)

## Context

The CMO → master consolidation is planned and approved (`projects/contracts-db-consolidation/PLAN.md`).
Before rows move, the master sheet itself needs work: it has 135 columns of which ~50 are provably
dead, a primary-key formula that silently rewrites itself every January, a money column that holds
text, and two **live public links**. Gina will drive the edits through Claude in browser mode as we
go, so this plan is the edit script for that session.

She also asked for three capabilities the current sheet can't deliver:
1. An **archive sheet** for finished/expired/superseded contracts.
2. **Automatic checking of incoming entries** — so she stops hand-verifying that someone keyed the
   expiration / renew-by dates correctly before legal review.
3. **30/60/90 renewal triggers with follow-ups**, and **renewal chaining**: when a new entry replaces
   an old contract, link them and archive the predecessor.

Structural work must land **before** the migration weekend, because Smartsheet's Move matches
columns by name — the master's schema has to be final before 379 rows arrive.

### Evidence gathered live (2026-08-18)

| Finding | Evidence |
|---|---|
| **Public link on master: "Read Only – Full" is ON** | Anyone with the URL views all 1,111 contracts and downloads attachments, no login, ignoring sheet sharing |
| **Public link on CMO sheet: "Edit by Anyone" is ON** | Anyone with the URL can edit cells, manage attachments, comment |
| `Approval Status2/4/6/7/8` — 100% blank | 611 CMO rows + 500 non-CMO rows, all blank |
| `Approval Status3/5/9/10` — 44 stray values total | e.g. Status3: 29 "Legal Approved", 15 "Submitted to Legal" |
| `PGCA`, `Contract`, `Business Services Contract Received`, `CMO Approver <5K`, `CMO Approver 5K-10K`, `Approver >10K` — blank | ~4 stray "Submitted" values across the CBO threshold columns |
| `Is this Renewable?` blank on **266 of 500** non-CMO rows | the renewal engine's input is half-empty |
| `Renew or Terminate` blank 498/500; `Setup for Auto Renew` blank 494/500 | renewal decisions were never captured |
| `Fully Executed Contract On File` true on only 63/500 | compliance gap vs 441 Executed/Fully Executed |
| `Value ($)` is TEXT and holds multi-values | e.g. `96.50,132.00,165.00` — breaks sums, thresholds, dashboards |
| **Primary key rewrites annually** | `Contract or Application ID` = `RIGHT(YEAR(TODAY()),2) + "-" + LEFT([Originating Department]@row,4) + …` → every contract's ID changes when the year rolls over |
| `Status` picklist contains **"Legal Approved" twice** | 34 options, one duplicated |
| `Division` has no `CFO` option | yet two master workflows trigger on `Division → CFO`, so they can never fire |

### Decisions taken
Public links **off now**; dead columns **exported then deleted**; `Value ($)` **converted to numeric**
with a `Value Notes` companion; entry QC = **formulas + a legal-review gate + a scheduled Claude
review** of new rows and their attachments.

On the review itself:
- **The scheduled job writes nothing to Smartsheet.** It delivers a **daily digest to Gina**. Anything
  that lands on a row — the memo PDF, a comment, a flag — happens only after she approves that
  specific item. (Consequence: `AI Pre-Review Done` cannot be machine-set, so the Phase F gate keys on
  the formula-driven `QC Status` only, and `AI Pre-Review Done` becomes a checkbox Contracts ticks when
  they action the digest.)
- **Every new contract gets both** the row-data verification **and** the full legal memo; Gina is
  pinged for approval before either is attached to the row.
- **Renewal comparison gets its own mode.** The skill's independence rule stays intact for standard
  analysis; a separate **"Renewal delta review"** is invoked explicitly when `Supersedes (Row ID)` is
  populated, comparing new vs predecessor on price, term, notice period, and added/removed clauses.

---

## Double review: is restructuring-before-migration the right sequence?

| Option | Verdict |
|---|---|
| **Restructure master first, then migrate (chosen)** | Correct. Move maps columns by name, so schema must be frozen first; pruning 50 columns before 379 rows arrive means half the cleanup work disappears. The archive sheet must also be cloned from the *final* schema. |
| Migrate first, clean up later | Rejected. You would prune columns that CMO rows just populated, re-map names twice, and build the archive sheet against a schema you're about to change. |
| Do both in the same weekend | Rejected. Structural edits need daylight and a few days of watching the form and automations behave; the cutover weekend should have zero avoidable variables. |
| Rebuild as a fresh sheet with the ideal schema | Rejected for the same reasons as the earlier plan: it orphans 1,279 attachments, 96 comment threads, the 364-submission form, 27 workflows, and every report. |

### Risks this restructure introduces, and the controls

| Risk | Control |
|---|---|
| Deleting a column destroys data irreversibly | Excel export of the whole sheet + `Save as New` snapshot **before the first delete**; the 44 stray legacy values copied into `Legacy Notes` first |
| Changing `Value ($)` to numeric drops multi-value text | Copy the offending values into `Value Notes` **before** the type change; verify the count of non-numeric values first and reconcile after |
| Fixing the ID formula changes every contract's displayed ID | Freeze IDs as static text at their correct year (from `Created`), and make `Row ID` (auto-number, immutable) the key for renewal chaining — never the display ID |
| Renaming/removing a column silently breaks a workflow, report, or the form | Work from the Step 0 inventory; after each batch, re-open the Automation panel and the two reports; the form is the highest-traffic consumer (364 submissions) — submit a test entry after every schema batch |
| QC automations fire on legacy rows and spam originators with 20-year-old data gaps | QC **formulas** go in now (harmless, read-only), but the **gate and update-request automations activate only after cutover**, and are conditioned so they never fire on pre-cutover rows (`QC Grandfathered` checkbox set during migration) |
| Turning off the public links breaks an unknown consumer | It is reversible in one click; if a dashboard or vendor link breaks we rebuild it as a report or Dynamic View, which is what it should have been |
| More automations = more collision surface | Every new workflow carries an explicit `Division` condition from birth, per the collision table in `STEP0-INVENTORY.md` |

---

## Plan

### Phase A — Security and truth (do first, same session)
1. **Publish off**: master `Read Only – Full` → OFF; CMO sheet `Edit by Anyone` → OFF. (Right rail → Publish.)
2. Export both sheets to Excel and `Save as New` snapshots labelled `PRE-RESTRUCTURE 2026-08-18`.
3. Move `Account User Name` / `Account Password` / `Legacy Subscription Account …` values into the
   proper secrets store, then delete those columns from the master.
4. Capture the last Step 0 gap while in the sheet: **conditional formatting rules and saved filters**
   on both sheets (I couldn't locate the CF panel in read-only mode; it's reachable from the toolbar
   overflow once we're editing). Record them in `STEP0-INVENTORY.md` section E.

### Phase B — Fix the data model (the part that makes everything else work)
5. **Freeze the primary key.** Replace the `YEAR(TODAY())` ID formula with static text computed from
   `Created` (`YY-DEPT-nnnnn`), so a 2025 contract keeps its 2025 ID forever. Adopt **`Row ID`
   (auto-number) as the immutable key** for all chaining and cross-sheet references.
6. **`Value ($)` → currency number**, with new `Value Notes` (text) holding rate cards and
   multi-value strings. Then thresholds (`<5K`, `5K–10K`, `>10K`) can be conditions instead of columns.
7. **Picklist hygiene:** remove the duplicate `Legal Approved` from `Status`; settle one canonical
   `Division` list (`CBO`, `CMO`, `Office of the Pastor: Construction`, `Office of the Pastor: CFO`,
   `PGCA`) and retire the two dead `Division → CFO` workflows.
8. **Prune ~50 dead columns.** Copy the 44 stray values into `Legacy Notes`, then delete
   `Approval Status2–15`, the six threshold approver columns, `PGCA`, `Contract`,
   `Business Services Contract Received`, the legacy subscription columns, and the unused
   `Approver Review / Approval & Signoff` checkbox pairs.
   **Do NOT delete — the `fbcgi-contract-analysis` skill reads these** (`references/data-sources.md`):
   `Date Carr Initialed` (blank ⇒ legal review pending), `CFO Legal Review`, `Approval Status`,
   `Latest comment`, `Confirmed Tax Exemption (Yes)`, `Type of Document`, `Value ($) Period`,
   `Is this Renewable?`, `Required Notification to Renew by Date`. Any rename of these breaks the
   skill's lookup sequence — if one must change, update the skill's reference file in the same session.
9. **Collapse approvals to one pattern per stage**, replacing the numbered sprawl:
   `Decision – Initial Review`, `Decision – Legal`, `Decision – Final Approval` (each the picklist a
   Smartsheet approval writes to), plus `Approver` and `Decision Date` per stage.
10. **Add the CMO-only columns** the migration needs (artist/speaker, deposits/balances, event fields,
    `Legal Review`, `CMO Initial CMO Approved`) — per Step 2 of the migration plan.
11. Convert all calculated fields to **column formulas** so they re-apply to arriving rows.

Target: ~135 → **~105 columns**. At 1,490 rows that's ~161k cells (32% of the 500k cap) versus ~231k
if we migrated without pruning.

### Phase C — New columns for QC, renewal, and chaining
12. `Data Quality Flag` (column formula) — builds a human-readable problem string:
    ```
    =IF(ISBLANK([End date]@row), "Missing end date; ", "")
    + IF(AND(NOT(ISBLANK([Start Date]@row)), NOT(ISBLANK([End date]@row)), [End date]@row < [Start Date]@row), "End before start; ", "")
    + IF(AND([Is this Renewable?]@row = "Yes", ISBLANK([Required Notification to Renew by Date]@row)), "Renewable but no renew-by date; ", "")
    + IF(AND(NOT(ISBLANK([Required Notification to Renew by Date]@row)), NOT(ISBLANK([End date]@row)), [Required Notification to Renew by Date]@row > [End date]@row), "Renew-by after end date; ", "")
    + IF(ISBLANK([Value ($)]@row), "Missing value; ", "")
    + IF(ISBLANK([Originating Department]@row), "Missing department; ", "")
    + IF(AND([Status]@row = "Executed", ISBLANK([Executed Date]@row)), "Executed with no executed date; ", "")
    ```
13. `QC Status` = `=IF([Data Quality Flag]@row = "", "Clean", "Needs Fix")`; `QC Grandfathered` (checkbox).
14. Renewal: `Renewal Decision` (Renew / Terminate / Not Renewing / No Response), `Renewal Decision Date`.
15. Chaining: `Supersedes (Row ID)`, `Superseded By (Row ID)`, and lookups
    `=IFERROR(INDEX([Status]:[Status], MATCH([Superseded By]@row, [Row ID]:[Row ID], 0)), "")` →
    `Successor Status`; same pattern for `Predecessor Status`.
16. `Archive Ready` (column formula): true when status is terminal and `End date < TODAY(-365)`, **or**
    when `Superseded By` is populated and `Successor Status = "Executed"`.

### Phase D — The archive sheet
17. After the schema is final, `Save as New` the master **structure only** → **`Contracts Archive`**
    in the same workspace. Identical column names and order, so Move maps cleanly.
18. Monthly automation on the master: *when `Archive Ready` is checked → **Move row** to
    `Contracts Archive`*. Move carries attachments and comments and removes the row from the master,
    which is what protects the cell-limit headroom long term.
19. Build a report **`All Contracts (incl. archive)`** over both sheets so search and audit never
    require knowing which sheet a contract sits in. Archive sheet: no editors, Contracts + Gina only.

### Phase E — Renewal ladder with real follow-up (replaces the current five identical alerts)
The existing 5/14/30/60/90-day workflows all send the same alert to the same five people, which is
why nothing gets decided. Restructure by audience:

| Trigger | Action | To |
|---|---|---|
| 90 / 60 / 30 days before `Required Notification to Renew by Date` | **Request an update** on `Renewal Decision` (+ value, dates) | Originator, Originating Department Director |
| 14 days before, **and `Renewal Decision` still blank** | Alert — escalation | Contracts, Gina, division director |
| 5 days before, **and still blank** | Alert — final escalation | Rev. Carr + Gina |
| `Renewal Decision = Renew` | Alert + task to submit the renewal entry, which fills `Supersedes (Row ID)` | Originator, Contracts |
| `Supersedes` populated **and** `Status = Executed` | Alert Contracts to confirm the link; `Archive Ready` then trips on the predecessor | Contracts |

Every one of these carries a `Division` condition from birth.

### Phase F — Entry QC: the gate plus the Claude review
20. **Form first** (cheapest control): make `End date`, `Value ($)`, `Is this Renewable?` required;
    make `Required Notification to Renew by Date` a **date** field shown only when Renewable = Yes;
    no free-text dates anywhere. Add the CMO-only questions with `Division = CMO` logic.
21. **The gate** (this is what removes Gina's manual pre-legal check): *when `Status` changes to
    `Legal Review` AND `QC Status = "Needs Fix"` AND `QC Grandfathered` is unchecked → change `Status`
    back to `New Request`, request an update from the Originator listing `Data Quality Flag`, alert
    Contracts.* A row cannot reach Legal until it is clean.
22. **Scheduled Claude review** (`/schedule`, weekdays 7:30 AM) — **read-only against Smartsheet.**
    Read rows created/modified in the last 24h with at least one attachment, open the attachments,
    run the `fbcgi-contract-analysis` skill, and compare keyed data against the document — dates,
    dollar value, vendor name, document type, auto-renew language, notice period, signature presence.
    Output goes to a **daily digest for Gina**: per contract, the row-data verification table, the
    derived renew-by date, the risk snapshot, and the rendered memo PDF held locally. **Nothing is
    written to the sheet and nothing is attached until she approves that item**; on approval Claude
    attaches the PDF and posts the verification note. Detected renewals are reported in the digest as
    proposed `Supersedes` / `Superseded By` links for her to confirm — the reciprocal link native
    Smartsheet cannot maintain, now human-approved rather than machine-written.

### Phase G — Row review driven by the `fbcgi-contract-analysis` skill

The skill already produces the legal memo (masthead → paper notation → clause flags → financial
breakdown → critical dates → action items → Maryland index → sign-off). Phase F's daily job should
*call it*, not reinvent it. What the skill does **not** yet do is verify the Smartsheet row — it only
raises staleness as a `●` note. Changes needed so one run serves both legal review and row QC:

1. **New required output section: "Row data verification."** A table of every field Contracts depends
   on — `Vendor Name`, `Value ($)` + `Value ($) Period`, `Start Date`, `End date`,
   `Is this Renewable?`, `Required Notification to Renew by Date`, `Type of Document`,
   `Confirmed Tax Exemption (Yes)` — each marked ✔ matches / ✗ contradicts the agreement / ⃝ missing,
   followed by an explicit **"Fields to correct in the row"** list. This is the artifact that replaces
   Gina's manual keying check.
2. **Derive the renew-by date, don't just narrate it.** The memo must state
   `Required Notification to Renew by Date = End date − <notice period>` as a single date, because
   that one field drives the entire 30/60/90 ladder (Phase E) and is blank on most rows today.
3. **Auto-renew as a discrete verdict** (Yes/No + the clause), feeding `Setup for Auto Renew` —
   blank on 494 of 500 non-CMO rows today.
4. **Signature check** → feeds `Fully Executed Contract On File` (true on only 63 of 500 rows):
   does the attachment actually contain executed signature blocks and dates, or is it an unsigned draft?
5. **Machine-readable companion.** Emit a small JSON alongside the PDF (row id, verification verdicts,
   derived dates, risk counts, recommendation) so the scheduled job can post a comment and set flags
   without re-parsing its own PDF.
6. **Record `Row ID` (immutable) in the masthead** next to the display Contract ID.

**Defect the skill exposes in the sheet:** the skill's lookup sequence keys on
`Contract or Application ID`, but that formula rebuilds from `YEAR(TODAY())` — so every existing
summary PDF filed under, say, `25-Musi-01339` no longer matches its row, which now reads `26-…`.
Every one of the recent summary attachments is stamped `26-`. Phase B's ID freeze is what makes the
skill's own lookup reliable; do it before wiring the automation.

**Portability:** the skill renders to `/mnt/user-data/outputs` and uses `present_files` / `view` —
claude.ai-side paths. The scheduled run happens in Claude Code on Windows, so it needs a local output
directory, Chromium/Playwright (or wkhtmltopdf) present, and a graceful fallback to the HTML fragment
if neither is installed, so a scheduled run degrades instead of dying silently.

7. **New "Renewal delta review" mode** (separate from the standard memo, invoked when
   `Supersedes (Row ID)` is populated): compares the new agreement against its predecessor —
   % change in value, term length change, notice-period change, clauses added or removed, and whether
   any previously-flagged `▲` item was fixed or persists. Short memo, its own filename prefix. The
   existing independence rule stays untouched for standard analysis; this mode declares the comparison
   explicitly so the two never blur.

**Trigger design (recommended):**
- **Scheduled sweep**, weekdays 7:30 AM: rows where `Created` or `Modified` is within 24h **and**
  `Status ∈ {New Request, CMO Initial Review, CBO Initial Review, Legal Review}` **and** attachment
  count ≥ 1 **and** `AI Pre-Review Done` is unchecked.
- **On-demand:** a `Request AI Pre-Review` checkbox on the row, picked up by the next sweep — gives
  Contracts a manual lever without asking Claude in chat.
- **Gate tie-in:** `AI Pre-Review Done` joins the Phase F gate, so nothing reaches Legal Review
  un-reviewed. Cap each run (e.g. 10 rows) so a migration-day surge can't blow up the job.
- Smartsheet has no standard-connector webhook path in this tenant, so polling is the realistic
  trigger; the checkbox covers urgency between sweeps.

### Sequencing against the migration
Phases A–D land **before** the cutover weekend. Phase E and the Phase F automations are **built but
left inactive** until after migration, because 379 arriving rows would otherwise generate hundreds of
update requests for legacy gaps. During migration, set `QC Grandfathered` on every pre-cutover row.

---

## Files / assets
- Master: [Contracts Database](https://app.smartsheet.com/sheets/VVgV8vQpgRmJ3hfQCx5WqVFmc3WVV9F2pW9F6931) (`1551069754642308`)
- New: `Contracts Archive` sheet; `All Contracts (incl. archive)` report; CMO Dynamic View
- Repo: `projects/contracts-db-consolidation/` — `PLAN.md` (migration), `STEP0-INVENTORY.md`
  (automations/forms; section E still to fill), `audit_pairs.py`; this plan becomes `RESTRUCTURE.md`
- The scheduled Claude review gets its own doc + `/schedule` routine once Phase F activates

## Verification
1. **Publish off:** open both published URLs in a logged-out browser — both must fail.
2. **Prune safe:** after each delete batch, submit a live test entry through `Contracts Submission
   Form` and confirm it lands with all fields; re-open the Automation panel and confirm no workflow
   shows a missing-column error; open the CBO/CMO reports.
3. **ID freeze:** confirm a 2025-created row still displays a `25-…` ID, and that `Row ID` is unchanged.
4. **Value conversion:** `get_sheet_aggregates` summary stats on `Value ($)` returns a real median/max,
   and the count of rows with `Value Notes` equals the pre-conversion count of multi-value strings.
5. **QC formulas:** deliberately submit a test entry that is renewable with no renew-by date and an
   end date before its start date — `Data Quality Flag` must name both problems and `QC Status` must
   read `Needs Fix`; then set `Status = Legal Review` and confirm the gate bounces it back.
6. **Archive:** check `Archive Ready` on one terminal test row, run the monthly workflow manually, and
   confirm the row lands in `Contracts Archive` **with its attachments and comments**, and appears in
   the union report.
7. **Renewal ladder:** set a test row's renew-by date to 30 days out and confirm the update request
   reaches the originator, that leaving `Renewal Decision` blank escalates at 14 days, and that a
   renewal entry filling `Supersedes` trips `Archive Ready` on the predecessor.
8. **Cell headroom:** column count ≈105 and `rowsInSheet × columns` well under 500,000.
9. **Row review, end to end:** submit a test contract with a PDF whose dates deliberately disagree with
   the keyed row. The digest must (a) name the mismatch in the Row data verification table, (b) derive
   the renew-by date from the notice clause, (c) state the auto-renew verdict and whether the file is
   actually signed, and (d) render the memo without touching the sheet. Then approve one item and
   confirm the PDF attaches and nothing else changed.
10. **ID freeze × skill:** after Phase B, look up a 2025 contract by the ID printed on its existing
    summary PDF and confirm the skill's lookup sequence finds the row (today it cannot).
