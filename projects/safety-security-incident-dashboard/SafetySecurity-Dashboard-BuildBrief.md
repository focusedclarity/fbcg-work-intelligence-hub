# Build Brief — Safety & Security Incident Dashboard (FBCGI Staff Hub)

**Paste this whole file into a Lovable session for `fbcgistaffhub` (project `55f65b31-3b4a-4c70-b01d-3d8d0b95f287`) that has the Lovable MCP connector authorized, or into the Lovable editor.** It adds a passcode-gated Safety & Security incident dashboard under CBO, matching the existing Reporting & Dashboards patterns. Ship it with the accompanying data file `safetyIncidents.ts`.

---

## 0. Prompt for the Lovable agent (copy/paste)

> Add a new **Safety & Security** Reporting & Dashboards landing under CBO, plus a live **Incident Report Dashboard**, following the exact same patterns already used for Facilities → Fleet Report and HR → HR Monthly Metrics. Keep it **passcode-gated** via the existing `DashboardGate`. Use the incident data in `src/data/safetyIncidents.ts` (489 records, structured fields only — no narratives). Build the page with shadcn/ui `Card`s, Recharts, and Tailwind, styled to match the app. Details below. When done, confirm the KPI self-check numbers match.

---

## 1. Wiring (match existing conventions exactly)

**a. Data file** — add `src/data/safetyIncidents.ts` (provided). It exports `INCIDENTS: IncidentRecord[]`, `INCIDENT_DATA_AS_OF`, `INCIDENT_REPORTING_WINDOW`.

**b. `DEPARTMENTS` in `src/pages/ReportsDashboard.tsx`** — add a new `DeptGroup` `cbo-safety-security` with one live tile, mirroring the `cbo-human-resources` group you added for HR:
- Department: **Safety & Security**
- Tile: **Incident Report Dashboard** — status `live`, links to `/divisions/cbo/safety-security/dashboards/incidents`.
- Remove **Safety & Security** from the CBO "departments without a dashboard yet" list.

**c. Routes** (React Router, same as Fleet/HR):
- `/divisions/cbo/safety-security/dashboards` → department landing (`ReportsDashboard` scoped by `scopeKey`).
- `/divisions/cbo/safety-security/dashboards/incidents` → `src/pages/safety/SafetySecurityIncidentsDashboard.tsx` (new page component below).

**d. Passcode gate (KEEP PASSWORD PROTECTION ON)** — wrap the new entry points in `DashboardGate` exactly like the other dashboards. In `src/components/PasscodeGate.tsx`:
- Simplest: let it inherit the default `DASHBOARD_PASSCODE` (`5700`) — protection stays on with no new secret.
- **Recommended:** add a dedicated scope passcode `SCOPE_PASSCODES["cbo-safety-security"]` so S&S has its own code. **Ask G. Thomas / Carl Bartee for the value** (do not reuse the standalone HTML's `barteec` unless they say so). Do **not** add this scope to `NON_PERSISTENT_SCOPES` (that re-lock-every-navigation behavior is intentionally CBO-landing-only).

---

## 2. Page spec — `SafetySecurityIncidentsDashboard.tsx`

A department incident-intelligence dashboard. Everything recomputes from `INCIDENTS` via the filters below. **No raw narratives anywhere** — only the structured fields in the data file.

### Global filters (top bar)
- **Year:** All · 2023 · 2024 · 2025 · 2026
- **Period:** Full · YTD (YTD = date on/before Aug 17 within scope; use `INCIDENT_DATA_AS_OF`)
- **Month:** All months · Jan…Dec
- **Compare years** toggle → shows same-period incident count per year (2023–2026).
- **Reporting window** text (right-aligned) that updates from the filtered set's min/max date (ignore dates `< 2023-01-01`).

### KPI tiles (recompute from filtered set)
Total Reports · Medical/Injury % (nature = "Injury / Illness / Medical") · Severe Injuries (severity = "Severe") · 911 Calls (called911 = "Yes"; foot = % of Yes+No answered) · Hospital Transports (transported = "Yes") · Minors Involved (minor = "Yes", % of total).

### Charts
- **Reporting Trend** — Recharts `LineChart`/`AreaChart` of monthly counts. Offer Timeline / Year-over-Year (one line per year over Jan–Dec) / Month-over-Month (Δ bars). Mark Jul 2023 and Aug 2026 as partial.
- **Nature of Report** — horizontal bars, sorted desc; **clicking a bar opens a drill-down table** of the matching records showing **Report #, Date, Time, Location, Affiliation only** (no narrative). Include a small "structured fields only" note.
- **Location of Incident** — horizontal bars.
- **FBCG Affiliation** — Recharts `PieChart` donut (Member / Guest / Employee / Other).
- **Injury / Illness Severity** — bars over the coded medical subset (Complaint / Minor / Severe / Other), with a note on % minors and % PM.
- **Response & Escalation** — 5 meters: S&S Notified (of all), Police (of answered), 911 (of answered), Hospital Transport (of answered), First Aid (of answered incl. Refused).

### Factual Insights (computed, not prose)
A grid of statements computed directly from the filtered set (top nature/location, member-vs-visitor split, 911/transport, severe count, minors, S&S %, busiest month). Label it "computed from data — updates with the filters."

### Actions (top right)
- **Save PDF** → `window.print()` with a print stylesheet that forces a light, legible layout (hide filter chrome and the drill-down table; add a print header with scope + as-of date). This is what Carl sends to Pastor.
- **Email summary** → `mailto:` prefilled with a plain-text factual summary (key figures + top types/locations) so it reads inline in email.

### Data-quality notes (display at bottom)
- `Department` field blank on every source row.
- Nature/Location free-text duplicates were merged.
- One 1963 date is a known mis-entry (excluded from the reporting window).
- 2023 (from July) and Aug 2026 are partial months.
- "911 called" / "transported" blank on >half of rows → response rates use the answered subset.

### Style
FBCG palette: gold `#c6902a`, brand purple `#7a3ea0`, steel-blue accent for data. Use the S&S wordmark if a shared logo/asset exists in the app; otherwise a simple heading is fine.

---

## 3. KPI self-check (unfiltered = All years / Full)

The build is correct when the "All · Full" view shows:

| Metric | Value |
|---|---|
| Total reports | **489** |
| Medical / injury | **247** (50.5%) |
| Severe injuries | **20** |
| 911 called (Yes) | **88** |
| Hospital transports | **50** |
| Minors involved | **67** (13.7%) |
| S&S notified | **368** (75%) |
| Police notified | **198** |
| First aid offered | **165** |

Per-year totals: 2023 = 52, 2024 = 166, 2025 = 134, 2026 = 136 (plus one 1963 mis-entry). Month totals within a year must sum to that year's total.

---

## 4. Reference implementation

A fully-working standalone HTML version of this exact dashboard (same data, filters, drill-down, insights, PDF/email, gate) already exists — ask G. Thomas for `incident-dashboard.html` (also published as a Claude artifact). Use it as the visual/behavioral reference when building the React port.
