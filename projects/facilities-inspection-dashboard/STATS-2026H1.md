# Facilities Inspection Dashboard — Cleaned Stat Pack (Jan 1 – Jun 30, 2026)

**Source:** Smartsheet "Building Services Quality Inspection Checklist" (sheet ID 8519533426855812), pulled 2026-07-10 via Smartsheet MCP connector.
**Cleaned dataset:** `inspections-clean-2026H1.csv` (183 real inspection rows; `InPeriod` column marks the 170 inside the Jan–Jun window).

## Cleaning method (reproducible)

- Raw sheet: 237 rows × 399 columns. Pulled 10 key columns only.
- **4 rows** are fully empty scaffold rows (verified: no text in any cell) — excluded.
- **50 rows** are divider/label rows (Report ID like `12/22/25--Jan 2026`, no Inspector, no Status, no type flag) — excluded.
- **Real inspections = 183 rows**, identified by `Environmental / Climate Inspection Only` = Yes/No.
- Type: Yes → Env/Climate; No → Building.
- Campus: Building rows parsed from Report ID segment 2; Env/Climate rows from the Env/Climate Location field (fallback: Report ID segment 3). `CLC` normalized to `CL`.
- Date: system Created date. Verified 0 month mismatches between Report ID date prefix and Created date across all 183 rows.
- Window: Jan 1 – Jun 30, 2026 → **170 in period** (excluded: 7 Dec-2025, 6 Jul-2026 real reports).

## Headline numbers (Jan–Jun 2026)

| Metric | Value |
|---|---|
| Inspections completed | **170** (111 Building, 59 Env/Climate) |
| Deficiencies caught & routed | **253** |
| Inspections that initiated work orders | **82** (48%) |
| Zero-deficiency inspections | **85 of 170 (50%)** |
| Inspectors | **8** (team-level on the public view) |
| Campuses covered | **5** |

## By month (total / Building / EnvClimate / deficiencies)

| Month | Total | Building | Env/Climate | Deficiencies |
|---|---|---|---|---|
| Jan | 8 | 4 | 4 | 27 |
| Feb | 27 | 20 | 7 | 59 |
| Mar | 32 | 18 | 14 | 56 |
| Apr | 40 | 25 | 15 | 46 |
| May | 37 | 23 | 14 | 37 |
| Jun | 26 | 21 | 5 | 28 |

Narrative: program ramped to full cadence in February; deficiencies-per-inspection trended **down** (Feb 2.2 → Jun 1.1) while cadence held — the "finding less because we're fixing more" story.

## By campus

| Campus | Inspections | Building | Env/Climate | Deficiencies | Zero-def % |
|---|---|---|---|---|---|
| Worship Center (WC) | 53 | 39 | 14 | 90 | 30% |
| Community Life Center (CL) | 52 | 9 | 43 | 10 | 87% |
| Empowerment Center (EC) | 40 | 40 | 0 | 28 | 58% |
| Ministry Center (MC) | 23 | 22 | 1 | 124 | 0% |
| Service Building (SB) | 2 | 1 | 1 | 1 | 50% |

**Framing cautions (baked into dashboard copy):**
- Campus mixes differ — CL is mostly pass/fail Env/Climate checks, so raw deficiency counts are not comparable across campuses.
- MC framed as "deepest-dive campus — surfaced 124 of 253 issues," not as underperforming.
- SB entered the rotation late (2 inspections) — noted honestly in a footnote.

## Status field (report workflow, NOT ticket closure)

Submitted 85 · Work Order Initiated 82 · Complete 3. Ticket closure comes from the FMX export (pending from Sean) — dashboard has a designed placeholder panel for it.

## FMX ticket field quality

All 170 in-period rows have non-empty "FMX Ticket Numbers" text, but only **56** contain ticket-like numbers — confirms the free-text field cannot support row-level joins to FMX. Join plan remains campus + month alignment.

## Inspector-level (backup only — NOT on the public dashboard)

Armando Lopez 43 · Harold Rogers 40 · Kenneth Carr 29 · Von Brown 23 · Chaun Coleman 19 · Misael Gonzalez 10 · Brandon McRae 4 · Luther Jones 2
