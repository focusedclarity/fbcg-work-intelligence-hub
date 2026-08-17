# HANDOFF — FBCG Facilities Inspections Dashboard: July 2026 update

**Session date:** 2026-08-17 · **Branch:** `claude/fbcg-inspections-2026-update-72e2bd` · **Worktree:** `reverent-borg-cb0c15`
**Owner:** Gina Thomas (BSS Manager, FBCG). Human-in-the-loop; nothing goes live/outbound without her review.

## Goal
Move the facilities inspections dashboard from H1 (Jan–Jun) to **Jan–Jul 2026, as of Jul 31**, with all figures verified against the **live** Smartsheet. Fix the "when last walked" panel, retie the FMX panel to **inspection-logged tickets**, and update BOTH the static HTML (review) and the live **Lovable + Supabase** pipeline. Design tweaks along the way (grouped-by-route inspector panel, readable number columns).

---

## Data sources (LIVE)
- **Smartsheet** — "Building Services Quality Inspection Checklist", **sheet ID `8519533426855812`**
  URL: `https://app.smartsheet.com/sheets/2mmRHxfPcQ6rcVRPQX2JwpmVvcgg5JMRmp9XgX31`
  Path: CBO:Facilities > Comprehensive Maintenance Plan. 399 columns, **266 rows** (pulls of the 7 meta columns are NOT sampled). Accessed via the Smartsheet MCP connector (`mcp__7876…__get_sheet_summary` etc.).
- **FMX export** (attached by user): `C:\Users\gthomas\OneDrive - First Baptist Church of Glenarden\Facilities - Reporting & Dashboards\FMX Maintenance Requests - ANALYSIS 2026H1 (rev 071426).xlsx`
  Sheet **"FMX Raw (all)" = 2,779 tickets**. Key cols: `ID` (ticket #), `Requested on`, `Resolved on`, `Status`, `Building`. Covers through ~Jul 14; scoped to as-of Jun 30. Does NOT contain full July/Aug closure.

## Methodology (VERIFIED — reproduces the published H1 dashboard exactly)
- **Date basis = WALK date** from the Report ID prefix `MM/DD/YY` (e.g. `07/30/26-WC-Daily`), NOT the `Created` entry timestamp. Walk-basis reproduces the published monthly curve exactly; Created-basis shifts one **Feb 28 walk entered Mar 1 (WC, 9 findings)** into March. Totals identical either way.
- **Universe** = rows with non-blank `Status` AND a walk date inside the window.
- **Building vs Env** = `Environmental / Climate Inspection Only` == "yes".
- **Findings** = `Deficiencies` numeric column. **Clean** = 0 findings.
- **Campus code** = Report ID `-([A-Za-z]{2})-` → WC/CL/EC/MC/SB.
- **Work order initiated** = `Status` == "Work Order Initiated".

---

## VERIFIED FIGURES — Jan–Jul 2026, walk basis, as of Jul 31 (all reconcile)
**KPIs:** Inspections **196** (123 bldg / 73 env) · Findings **268** (240 / 28) · Work orders **91** (46%) · Clean **52%** (bldg 37% / env 77%) · **9** inspectors / **5** campuses.

**By month** (bldg / env / findings / per-insp): Jan 4/4/27/3.4(ramp) · Feb 20/7/59/2.2 · Mar 18/14/56/1.8 · Apr 25/15/46/1.2 · May 23/14/37/1.0 · Jun 21/5/28/1.1 · **Jul 12/14/15/0.6**.
**Chart arrays:** findings `[27,59,56,46,37,28,15]` · building `[4,20,18,25,23,21,12]` · env `[4,7,14,15,14,5,14]` · rate Feb–Jul `[2.2,1.8,1.2,1.0,1.1,0.6]`.

**By campus:** WC 63 (46/17) f96 clean33% · CL 63 (10/53) f10 clean89% · EC 40 (40/0) f28 clean58% · MC 28 (26/2) f133 clean4% · SB 2 (1/1) f1 clean50%.

**By route → inspector (Jan–Jul):**
- CL (63, last Jul 30): Armando Lopez 53 (4/49) f10 · Kenneth Carr 10 (6/4) f0
- WC (63, last Jul 30): Von Brown 25 (24/1) f22 · Kenneth Carr 23 (11/12) f58 · Misael Gonzalez 13 (9/4) f1 · Luther Jones 2 (2/0) f15
- **EC (40, last Jun 18, OVERDUE, single inspector):** Harold Rogers 40 (40/0) f28
- MC (28, last Jul 31): Chaun Coleman 20 (19/1) f98 · Brandon McRae 4 (4/0) f31 · **Cordell Donte Jackson (NEW) 4 (3/1) f4**
- **SB (2, last Jun 4, OVERDUE, single inspector):** Von Brown 2 (1/1) f1

**Coverage freshness — when last walked (as of Jul 31):** MC Jul 31 (0d) · WC Jul 30 (1d) · CL Jul 30 (1d) · **EC Jun 18 (43d ⚠ OVERDUE)** · **SB Jun 4 (57d ⚠ OVERDUE)**.
> EC verified: Harold Rogers is the ONLY EC inspector; his last activity of any kind was **Jun 18**; there are **zero EC inspections in July** (July activity is only WC/MC/CL). Either he stopped walking EC or the July EC walks were never entered in Smartsheet — worth checking with him.

## FMX inspection-originated closed loop (H1, as of Jun 30)
Tied to the FMX ticket numbers on inspection rows × the FMX export. **110 tickets logged, 72 closed (65%), backlog 38, median 10.8d (avg 25.6), ≤7d 28, ≤30d 54.** By campus: **MC 75/57 (76%) · WC 24/12 (50%) · CL 8/0 (0%) · EC 2/2 (100%) · SB 1/1 (100%)**. Funnel: 170 inspections → 253 findings → 110 tickets. **110 of 121** ticket refs matched.

## Ticket-number EXCEPTIONS to fix in Smartsheet (11 rows; Von Brown = 7)
CSV: `…/scratchpad/fmx_ticket_exceptions.csv`.
| Inspector | Campus | Walk | Report ID | Value entered | Issue |
|---|---|---|---|---|---|
| Von Brown | WC | Feb 5 | 02/05/26-WC-Daily | `#1201626297` | 10 digits — garbled |
| Von Brown | WC | Feb 9 | 02/09/26-WC-Daily/Weekly | `#12027981` | 8-digit, not in FMX |
| Von Brown | WC | Feb 11 | 02/11/26-WC-Daily/Weekly | `#120941` | 6 digits |
| Von Brown | WC | May 10 | 05/10/26-WC-Daily/Weekly | `#1203348` | 7 digits |
| Von Brown | WC | Jun 3 | 06/03/26-WC-Daily/Weekly | `#1227677` | 7 digits |
| Von Brown | WC | Jun 8 | 06/08/26-WC-Daily/Weekly | `# 1285970` | 7 digits |
| Von Brown | WC | Jun 23 | 06/23/26-EnvClim-WC-Daily | `# FMX 1210428` | 7 digits |
| Chaun Coleman | MC | Mar 13 | 03/13/26-MC-Daily | `121085168` | 9 digits |
| Brandon McRae | MC | Jun 5 | 06/05/26-MC-Daily | `122841195` | 9 digits |
| Luther Jones | WC | Mar 1 | 03/01/26-WC-Daily | `12071010` | 8-digit, not in FMX |
| Armando Lopez | CL | Jan 12 | 01/12/26-EnvClim-CL-Daily | `11940593` | 8-digit, not in FMX |
Real FMX IDs are **8 digits**; Von Brown consistently drops a digit (7-digit).

---

## DECISIONS (confirmed by user)
1. **Period:** through July 31 (as of Jul 31). 2. **Date basis:** walk date (Report ID). 3. **FMX:** use the attached export, inspection-tied, through Jun 30. 4. **Deliverable:** BOTH — HTML now for review, then live pipeline. 5. **Build now**, don't wait for typo fixes. 6. **Add collapsible typo-exceptions section** in the dashboard. 7. **Full Lovable update** (data + frontend). 8. **Dynamic as-of** (auto-rolls each month = through last complete month).

## FILES (this branch)
- `projects/facilities-dashboard/source-artifact.html` — **DONE.** Updated dashboard (Jan–Jul, International header, no "Business Services" up top, as-of Jul 31, freshness panel, grouped "Coverage by route", inspection-tied FMX + collapsible exceptions). Reviewed & rendered in browser.
- `projects/facilities-dashboard/supabase/functions/_shared/aggregate.ts` — **DONE (code edits; not yet deployed / lint-run in Deno).** See changes below.
- Scratchpad (temp, session dir `…\3fc7e3b1-…\scratchpad\`): `janjul.ps1` (main Jan–Jul recompute), `route_group.ps1`, `ec_check.ps1`, `fmx_final.ps1` (ticket match + exceptions), `xlsx.ps1` (xlsx→CSV), `verify.ps1`/`verify2.ps1` (H1 verification), `july_area.ps1`, `analyze_fmx.ps1`, `fmx_ticket_exceptions.csv`.

## aggregate.ts changes (already applied)
- Replaced hard-coded `WINDOW_START/END` + `MONTHS[6]` with a **rolling window** computed from `new Date()`: `WINDOW_END` = 1st of current month, `ASOF` = last day of last complete month, `WINDOW_START` = Jan 1 of that year, `NMONTHS` = # months, `MONTHS`/`MONTHS_FULL` sliced dynamically.
- Added `walkDateOf(rid, created)` — parses walk date from Report ID (`MM/DD/YY`), falls back to `Created`.
- Row filter now uses walk date (`t = walkDateOf(...)`) instead of `Date.parse(created)`.
- `zero6()` → `zeroN()` = `new Array(NMONTHS).fill(0)` (all month arrays now N-length).
- `ratePerInspection` months made dynamic (`Array.from({length: NMONTHS-1}, …)`).
- `asOf`/`period` output now dynamic strings from `ASOF_DATE`.
- Removed the local `const ASOF = Date.UTC(2026,5,30)` (now module-level dynamic) — this is what fixes "when last walked".
- Replaced the `FMX_LOOP` static block (was "all facilities work orders" 1,442/93%/1.2d) with the **inspection-originated** numbers (110/72/65%/10.8d, `byCampus[]`, `h1Inspections:170`, `h1Findings:253`, `exceptions:11`). Updated the `loop` output field names (`ticketsLogged` etc.).

---

## PENDING / NEXT STEPS
1. **Deploy Supabase** — redeploy edge functions `dashboard-metrics` + `facilities-metrics` (**project ref `eitfgjuppfacpuywrror`**). See `supabase/DEPLOY.md`. Needs Supabase CLI + token in the environment (NOT yet verified available). After deploy, the DEPLOY.md smoke-test curl should now show `"ticketsLogged":110` and a dynamic `asOf` — update DEPLOY.md's expected values (it still says `ticketsCreated:1442`).
2. **Update Lovable frontend** to match `source-artifact.html`: grouped "Coverage by route" panel, "Coverage freshness" panel, inspection-tied FMX section + collapsible exceptions, 7-month charts, header. Find the Lovable project via the Lovable MCP (`list_projects`). **The prompt/doc files are now stale** and must be rewritten to the new payload shape: `supabase/lovable-build-prompt.md`, `supabase/lovable-facilities-interim-prompt.md`, `supabase/README.md` still describe the OLD all-work-orders FMX (`ticketsCreated`, `loop.fmx.byBuilding`, `byMonth`, `within7DaysPct`) and H1-only period. New payload: `loop.ticketsLogged/ticketsClosed/closureRate/openBacklog/medianDaysToClose`, `loop.h1Inspections/h1Findings`, `loop.fmx.byCampus[]{campus,code,created,closed,closureRate}`, `loop.fmx.exceptions`, dynamic `asOf`/`period`, `coverage[]{code,name,lastInspection,daysSince}`.
3. **Typos** — inspectors fix the 11 ticket numbers in Smartsheet → re-pull → refresh FMX (matched rises toward 121).
4. **Area-detail panels** ("Where checkpoints fail" / env) are labeled **Jan–Jun** in the HTML because the 399-col Smartsheet pull samples for July rows; the live pipeline recomputes them for the full period automatically once deployed.
5. **Optional:** write a monthly-refresh runbook/skill (cheap recurring updates; the inspection side auto-refreshes via the dynamic window, only FMX needs a manual export drop).

## HOW TO RESUME
- **Re-verify live:** Smartsheet MCP `get_sheet_summary` on sheet `8519533426855812`, columns `["Created","Report ID","Status","Deficiencies","Environmental / Climate Inspection Only","Location","Inspector"]`, sort Created DESC (266 rows, not sampled). Recompute with the logic in `scratchpad/janjul.ps1`.
- **Edit dashboard:** `projects/facilities-dashboard/source-artifact.html`; render via browser `preview_start` `file:///…/source-artifact.html`.
- **Deploy:** follow `projects/facilities-dashboard/supabase/DEPLOY.md`.
- Memory to consult: `project_facilities_dashboard`, `reference_facilities_dashboard_deploy` in the user's auto-memory.
