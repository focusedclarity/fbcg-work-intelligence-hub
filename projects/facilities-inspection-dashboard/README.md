# Facilities Inspection Dashboard — Project Handoff

**Status: v2.1 COMPLETE and published (2026-07-10).** Safe to clear session memory — this folder +
`STATS-2026H1.md` + the memory file `project_facilities_dashboard.md` hold everything needed to resume.

## The deliverable

**Live artifact (print-to-PDF for the business meeting handout):**
https://claude.ai/code/artifact/15e6cd0f-5d4a-4860-a710-5d532c4b7af0

One-page combined-view dashboard, FBCG purple/gold, light + dark themes, for the business meeting.
Sections top to bottom: KPI row → 5 insights + findings trend (▼51% since Feb) → Building program
(cadence + where checkpoints fail) → Environmental/Climate program (temperature checks: cadence +
where checks flag) → campus strip → inspector coverage (named, route-framed) → FMX closed-loop
panel (placeholder) → method footer.

## Files in this folder

| File | What it is |
|---|---|
| `dashboard-2026H1.html` | Dashboard source. Edit + republish via Artifact tool (same path = same URL). |
| `STATS-2026H1.md` | Full verified stat pack, cleaning method, framing/language decisions. Every number on the dashboard traces here. |
| `inspections-clean-2026H1.csv` | 183 cleaned inspection rows (170 in period, flagged by `InPeriod`). |
| `checkpoint-failures-2026H1.csv` | 234 area-level "Deficiency" flags (223 in period) with month/campus/type/area. |

## Source & reproduction

- Smartsheet: "Building Services Quality Inspection Checklist", sheet ID **8519533426855812**
  (https://app.smartsheet.com/sheets/2mmRHxfPcQ6rcVRPQX2JwpmVvcgg5JMRmp9XgX31), via Smartsheet MCP connector.
- Real inspection rows = rows where "Environmental / Climate Inspection Only" is Yes/No (Yes → Env, No → Building).
  Divider/scaffold rows have neither. Campus parsed from Report ID (Env rows: from Env Location field). CLC→CL.
- Area stats: search the 98 "Satisfactory | Deficiency" picklist columns for "Deficiency" via
  `find_in_sheet`; join cells to rows; validate (all cells must land on real rows; building-area flags
  only on Building reports, env-area flags only on Env reports; findings split must sum to 253).
- July refresh = re-run this method with the window moved; it is a re-run, not a rebuild.

## Headline numbers (Jan 1 – Jun 30, 2026)

170 inspections (111 Building / 59 Env-Climate) · 253 findings (225 B / 28 E) · 82 work orders
initiated (48%) · 50% clean (39% B / 71% E) · findings per inspection ▼51% since Feb (2.2 → 1.1) ·
8 inspectors, 5 campuses · top issue area: exterior & grounds (59 flags, Feb-peaked, worked down).

## Open items

1. **FMX work-order export from Sean** — raw Excel/CSV, all work orders created OR closed Jan 1–Jun 30,
   with: ticket ID, created date, closed date, status, building/location, category/trade, priority,
   description. Fills the dashboard's dashed closed-loop panel (created / closed / closure rate /
   median days-to-close / backlog). Align to inspections by campus + month only (ticket field in the
   inspection sheet is free text — 56 of 170 rows have real ticket numbers).
2. **Live Smartsheet Sight + cleaned summary sheet** — deferred by Gina to conserve credits; build
   after the meeting for the ongoing auto-refreshing internal view.
3. Also tracked in `claude code\docs\OPEN-ITEMS.md` (items 16 / 16b).

## Decisions log (all Gina, 2026-07-10)

- Period Jan 1 – Jun 30, 2026; Building vs Env/Climate kept separate; combined view (not 5 dashboards).
- Env/Climate inspections = **temperature/climate checks** — describe them that way.
- Inspectors **named** on the dashboard, framed as campus-anchored routes (reversed team-level-only).
- Findings trend shown from February (January = ramp-up, 8 inspections).
- No internal data-cleaning mechanics in the audience-facing footer.
- Every chart states its scope: "All campuses" on church-wide charts; campus/inspector views labeled as such.
- Deliverable = artifact/PDF for the meeting; Sight is the later "dynamic" secondary.
