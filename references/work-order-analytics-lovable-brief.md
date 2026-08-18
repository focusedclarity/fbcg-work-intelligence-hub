# Build brief — Facilities "Work Order Analytics" (FBCGI Staff Hub)

**Purpose:** Turn the existing *pending* "Work Order Analytics" tile on `/divisions/cbo/facilities/dashboards`
into a live dashboard, built from the Jan–Jun 2026 maintenance-request export.
**Preview of the intended result:** Claude artifact (Work Order Analytics) — matches the layout described below.
**Delivery:** paste the "Prompt for Lovable" section below into the Lovable chat for project
`55f65b31-3b4a-4c70-b01d-3d8d0b95f287`, OR have Claude send it once the Lovable connector is reconnected.

---

## Data provenance (state this; do not overstate)
- Source: Facilities maintenance-request PDF export, pulled **Jul 13, 2026**.
- The export actually holds **2,243 unique work orders (Jun 15 2023 → Jul 13 2026)**. This dashboard is scoped
  to the **Jan–Jun 2026** focus period = **1,311 unique work orders** (deduped by work-order ID). July 2026 was partial → excluded.
- **Static snapshot, Phase 1** — refresh by re-running the export and updating the constants. Same model as Fleet / Facilities Inspections.
- **Resolution timing** is only measurable for work orders carrying a recorded resolution timestamp:
  **94 across the whole export, 20 within Jan–Jun 2026** — small samples; label them as such.
- **Status caveat:** ~90% of rows show workflow step "Active" with an assignee but **no explicit open/closed marker**.
  Do NOT compute a churchwide closure/backlog rate from this file. Show status verbatim with the caveat.

---

## Layout (mirror the Fleet/Inspections page conventions)
- Route `/divisions/cbo/facilities/dashboards/work-orders` → new `src/pages/facilities/FacilitiesWorkOrderDashboard.tsx`.
- Flip the existing "Work Order Analytics" tile in the `DEPARTMENTS` array (ReportsDashboard.tsx) from `status:"pending"` to live, linking to the route. Keep `DashboardGate` wrapping.
- **Period filter pills** (single-select, drives every panel): `YTD` + `Jan Feb Mar Apr May Jun`.
- **KPI tiles** (reactive): Work orders (period), Top category (+share), Worship Center share %, Median resolution (from resolved sample, show n), Recorded resolutions (n).
- **Volume by month** bar chart (6 months, highlight selected).
- **By category** and **By location** horizontal bar breakdowns (reactive).
- **Time to resolution**: buckets `Same day / 1–7d / 8–30d / 1–3mo / 3mo+` with median & average; caption sample size.
- **Status snapshot** (reactive) with the caveat box.
- **Insights** section (see below).
- **Auto-collapsed** detail sections (chevron on the right, collapsed by default): "Data notes & methodology" and "Full category table".

---

## Insights (factual — no assumptions)
1. 1,311 work orders in H1 2026 (~219/month). Peak **March (255)**, low **May (184)**.
2. **Worship Center = 1,161 / 1,311 (89%)** of requests. Ministry Center a distant 2nd (123).
3. **General Maintenance = 867 (66%)** — dominant catch-all; next: Electrical 112, Painting 99, Grounds 63, Flooring 62. Suggests finer intake sub-categorization.
4. **Grounds is seasonal** — ~0 in Jan → 22 in Jun.
5. Resolved sample: median **6.5 days** (all-export, n=94); ~half close within a week; long tail to **372 days**.

---

## Data constants (verified — paste into the component)

```ts
export const WORK_ORDER_DATA = {
  months: ["Jan","Feb","Mar","Apr","May","Jun"],
  countByMonth: { Jan:203, Feb:248, Mar:255, Apr:217, May:184, Jun:204 },
  ytdTotal: 1311,
  exportTotal: 2243,
  exportRange: ["2023-06-15","2026-07-13"],
  typeByMonth: {
    Jan:{ "General Maintenance":146,"Painting":11,"Plumbing":7,"Electrical":12,"Flooring":13,"Carpentry":8,"HVAC":3,"Other":1,"Space/Move":1,"Custodial":1 },
    Feb:{ "Painting":23,"Flooring":13,"General Maintenance":164,"Grounds":2,"Other":5,"Carpentry":4,"Housekeeping":2,"Plumbing":9,"Electrical":24,"Custodial":1,"HVAC":1 },
    Mar:{ "General Maintenance":158,"Carpentry":6,"Painting":23,"Plumbing":8,"Grounds":14,"Electrical":27,"Flooring":6,"Custodial":7,"Roofing":1,"Housekeeping":2,"Other":2,"Space/Move":1 },
    Apr:{ "Flooring":10,"General Maintenance":152,"Grounds":15,"Electrical":16,"Plumbing":4,"Painting":13,"HVAC":2,"Carpentry":2,"Custodial":1,"Other":2 },
    May:{ "General Maintenance":107,"Flooring":15,"Painting":14,"Grounds":10,"Electrical":20,"HVAC":1,"Carpentry":10,"Custodial":3,"Roofing":1,"Plumbing":1,"Other":2 },
    Jun:{ "General Maintenance":140,"Grounds":22,"Painting":15,"Electrical":13,"Flooring":5,"Plumbing":2,"Carpentry":4,"Other":1,"Custodial":2 },
    YTD:{ "General Maintenance":867,"Electrical":112,"Painting":99,"Grounds":63,"Flooring":62,"Carpentry":34,"Plumbing":31,"Custodial":15,"Other":13,"HVAC":7,"Housekeeping":4,"Roofing":2,"Space/Move":2 }
  },
  buildingByMonth: {
    Jan:{ "Worship Center":190,"Ministry Center":11,"Other/Unlabeled":1,"Family Life Center":1 },
    Feb:{ "Worship Center":216,"Ministry Center":26,"Family Life Center":5,"Service Building":1 },
    Mar:{ "Worship Center":220,"Ministry Center":28,"Family Life Center":4,"Other/Unlabeled":2,"Service Building":1 },
    Apr:{ "Worship Center":197,"Ministry Center":15,"Family Life Center":3,"Service Building":2 },
    May:{ "Worship Center":168,"Ministry Center":13,"Family Life Center":2,"Service Building":1 },
    Jun:{ "Worship Center":170,"Ministry Center":30,"Service Building":4 },
    YTD:{ "Worship Center":1161,"Ministry Center":123,"Family Life Center":15,"Service Building":9,"Other/Unlabeled":3 }
  },
  statusByMonth: {
    Jan:{ "In workflow":193,"Completed":7,"Pending resolution":2,"Declined":1 },
    Feb:{ "In workflow":219,"Completed":14,"Pending resolution":12,"Declined":3 },
    Mar:{ "In workflow":224,"Completed":16,"Pending resolution":14,"Pending assignment":1 },
    Apr:{ "In workflow":207,"Pending resolution":7,"Completed":2,"Pending assignment":1 },
    May:{ "In workflow":162,"Pending resolution":15,"Completed":6,"Pending assignment":1 },
    Jun:{ "In workflow":181,"Pending resolution":15,"Completed":6,"Declined":1,"Pending assignment":1 },
    YTD:{ "In workflow":1186,"Pending resolution":65,"Completed":51,"Declined":5,"Pending assignment":4 }
  },
  // days from request -> recorded resolution; buckets = same-day / 1-7 / 8-30 / 31-90 / 90+
  closureByMonth: {
    Jan:{ n:3, median:4, avg:9.0, buckets:{same:0,w1:2,m1:1,q:0,plus:0} },
    Feb:{ n:2, median:34.5, avg:34.5, buckets:{same:1,w1:0,m1:0,q:1,plus:0} },
    Mar:{ n:4, median:61, avg:57.0, buckets:{same:1,w1:0,m1:1,q:0,plus:2} },
    Apr:{ n:4, median:48.5, avg:40.8, buckets:{same:1,w1:0,m1:0,q:3,plus:0} },
    May:{ n:3, median:0, avg:13.7, buckets:{same:2,w1:0,m1:0,q:1,plus:0} },
    Jun:{ n:4, median:1.5, avg:4.8, buckets:{same:1,w1:2,m1:1,q:0,plus:0} },
    YTD:{ n:20, median:10, avg:27.4, buckets:{same:6,w1:4,m1:3,q:5,plus:2} }
  },
  closureAllExport: { n:94, median:6.5, avg:26.3, max:372, buckets:{same:28,w1:21,m1:26,q:11,plus:8} }
};
```

---

## Prompt for Lovable (paste verbatim into the Lovable chat)

> On the Facilities dashboards page, turn the existing "Work Order Analytics" tile (currently status "pending")
> into a live dashboard at `/divisions/cbo/facilities/dashboards/work-orders`, new component
> `src/pages/facilities/FacilitiesWorkOrderDashboard.tsx`, wrapped in `DashboardGate` like the other Facilities
> reports. Follow the exact visual conventions of `FacilitiesFleetDashboard.tsx` (cards, stat tiles, Recharts, shadcn).
>
> Title "Work Order Analytics — Jan–Jun 2026". Add a single-select period filter row of pills: YTD + Jan..Jun that
> drives every panel. Panels: (1) KPI stat tiles — work orders for the period, top category with %, Worship Center
> share %, median resolution in days with sample n, recorded-resolutions n; (2) a bar chart of monthly volume
> (highlight the selected month); (3) horizontal-bar breakdowns "By category" and "By location"; (4) "Time to
> resolution" with five buckets Same-day / 1–7d / 8–30d / 1–3mo / 3mo+ plus median & average; (5) a status snapshot;
> (6) an insights list; (7) two auto-collapsed <details>-style sections with the chevron on the right — "Data notes
> & methodology" and a "Full category table". Use the WORK_ORDER_DATA constant I provide as the single data source.
>
> Important honesty rules to bake into the copy: this is a manual Phase-1 snapshot from an export pulled 7/13/2026;
> the export actually spans 2,243 work orders since 2023 and this view is scoped to the 1,311 in Jan–Jun 2026;
> resolution timing is only known for the 94 (all-time) / 20 (period) work orders with a recorded resolution date —
> label sample sizes; and ~90% of rows have no explicit open/closed status, so do NOT show a closure/backlog rate.
```
```
