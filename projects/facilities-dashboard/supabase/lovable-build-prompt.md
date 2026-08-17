# Lovable build prompt — gated Facilities dashboard route (Model A)

Paste into the **fbcgistaffhub** Lovable app's chat. First **connect this Supabase
project** to the app via Lovable's Supabase integration (URL
`https://eitfgjuppfacpuywrror.supabase.co`) so the client + anon key are available.

---

Add a protected **Facilities Inspection Dashboard** at route `/facilities`, using
our existing theme (Cormorant Garamond headings, Inter body, the cream/royal-violet/
gold tokens) so it blends with the rest of the site.

**Auth & access**
- Use Supabase Auth with a single **"Sign in with Microsoft"** button. Unauthenticated
  users hitting `/facilities` are redirected to login.
- On load, fetch from our Supabase Edge Function with the signed-in user's token:
  `GET https://eitfgjuppfacpuywrror.supabase.co/functions/v1/dashboard-metrics?dashboard=facilities`
  headers: `apikey: <anon key>`, `Authorization: Bearer <session access_token>`.
- Handle responses: **200** → render; **401** → send to login; **403** → show
  "You don't have access to this dashboard."
- Only show the `/facilities` nav link when the call returns 200.

**Render from the returned JSON** (shape below), matched to the site theme:
- **Header:** `name`, `period`, and "Data as of {asOf}".
- **KPI tiles** from `kpis`: inspections (`inspections`; sub "`buildingInsp` building · `envInsp` env/climate"), findings (`findings`; "`findingsBuilding` · `findingsEnv`"), work orders (`workOrders`; "`workOrderPct`% of inspections"), clean inspections (`cleanPct`%; "`cleanBuildingPct`% building · `cleanEnvPct`% env"), coverage (`inspectorCount` inspectors across `campusCount` campuses).
- **Findings by month** bar chart from `findingsByMonth` (Jan–Jun).
- **Findings per inspection** line chart from `ratePerInspection` (Feb–Jun) with area fill; caption "▼ 51% since February".
- **Building inspections by month** bar from `buildingByMonth`.
- **Environmental checks by month** bar from `envByMonth` (gold).
- **Checkpoint failures** summary from `checkpointFailures` {building, env, total}.
- **By campus** cards from `byCampus[]` {code, name, building, env, findings, clean, cleanPct, total} — building/env mix bar + findings + clean%.
- **Coverage by inspector** table from `byInspector[]` {name, building, env, findings, total}.
- **Where checkpoints fail** (building) horizontal bars from `checkpointsByArea[]` {area, count, byMonth[6]}, plus a "top single checkpoints" line from `topCheckpoints[]` {column, count}. Each area carries `byMonth[6]` (Jan–Jun) so a month filter can re-slice without another call.
- **Where environmental checks flag** (gold) bars from `envFlagsByArea[]` {area, count, byMonth[6]}; list the `envZeroAreas[]` (areas with zero failures) as a note.
- **Closing the loop:** left = the inspection funnel inspections → findings → workOrders
  (`loop.inspections`, `loop.findings`, `loop.workOrders`). Right = the **FMX work-order
  pipeline** — now **live in the payload** (render it; only fall back to "pending" if the
  fields come back `null`). Five stat tiles from `loop`: Tickets created (`ticketsCreated`,
  sub "all work orders, H1"), Tickets closed (`ticketsClosed`, sub "resolved by Jun 30"),
  Closure rate (`closureRate`%, sub "`loop.fmx.within7DaysPct`% within 7 days"), Median days
  to close (`medianDaysToClose`, sub "avg `loop.fmx.avgDaysToClose` days"), Open backlog
  (`openBacklog`, sub "as of Jun 30"). Below the tiles, a **closure-rate-by-building** bar
  list from `loop.fmx.byBuilding[]` {building, created, closed, closureRate} (violet fill,
  width = closureRate%, right label "`closureRate`% · `created`"), and a small
  **created-vs-closed by month** view from `loop.fmx.byMonth` {months, created[], closed[]}.
  Caption verbatim: *"FMX carries no origin tag, so these are all facilities work orders,
  aligned by period and campus — not matched ticket-by-ticket to the 82 inspection-initiated
  ones. 'Closed' counts a resolved ticket; work resolved but awaiting administrative
  finalization is treated as closed."*

Building program color = the site `--primary` (royal violet); Environmental = the
site `--accent` (gold); improvement/positive = green. Charts: gradient bars, area-fill
line, tabular numerals.

**JSON shape returned by the function**
```json
{
  "name": "Facilities Inspection Dashboard", "period": "January 1 – June 30, 2026", "asOf": "2026-06-30",
  "kpis": { "inspections":170,"buildingInsp":111,"envInsp":59,"findings":253,"findingsBuilding":225,"findingsEnv":28,
            "workOrders":82,"workOrderPct":48,"cleanPct":50,"cleanBuildingPct":39,"cleanEnvPct":71,
            "inspectorCount":8,"campusCount":5 },
  "findingsByMonth":[27,59,56,46,37,28], "ratePerInspection":[2.2,1.8,1.2,1.0,1.1],
  "buildingByMonth":[4,20,18,25,23,21], "envByMonth":[4,7,14,15,14,5],
  "checkpointFailures":{"building":201,"env":22,"total":223},
  "byCampus":[{"code":"WC","name":"Worship Center","building":39,"env":14,"findings":90,"clean":16,"cleanPct":30,"total":53}],
  "byInspector":[{"name":"Armando Lopez","building":4,"env":39,"findings":10,"total":43}],
  "loop":{"inspections":170,"findings":253,"workOrders":82,
          "ticketsCreated":1442,"ticketsClosed":1343,"closureRate":93,"medianDaysToClose":1.2,"openBacklog":102,
          "fmx":{"source":"FMX maintenance-request export, pulled 2026-07-14",
                 "scope":"all facilities work orders created Jan 1 – Jun 30, 2026, measured as of Jun 30",
                 "ticketsCreated":1442,"ticketsClosed":1343,"closureRate":93,"medianDaysToClose":1.2,"avgDaysToClose":4.9,
                 "within7DaysPct":85,"within30DaysPct":90,"openBacklog":102,
                 "byMonth":{"months":["Jan","Feb","Mar","Apr","May","Jun"],"created":[235,271,281,237,197,221],"closed":[209,266,258,222,189,226]},
                 "byBuilding":[{"building":"Worship Center","created":1258,"closed":1208,"closureRate":96},
                               {"building":"Ministry Center","created":156,"closed":121,"closureRate":78},
                               {"building":"Family Life Center","created":16,"closed":2,"closureRate":12},
                               {"building":"Service Building","created":10,"closed":10,"closureRate":100},
                               {"building":"Empowerment Center","created":2,"closed":2,"closureRate":100}]}}
}
```

> **FMX data is now wired into the payload** (static constants in `_shared/aggregate.ts`;
> both `facilities-metrics` and `dashboard-metrics` inherit it). **Redeploy the edge
> function** (`supabase functions deploy dashboard-metrics --project-ref eitfgjuppfacpuywrror`,
> and `facilities-metrics` for the interim route) so Lovable receives the populated `loop`.

---

## Also in the payload (optional richer panels)
Beyond the fields above, the function also returns: `qualityScore` {passPct,
checkpointsAssessed, checkpointFailures}, `safety` {osha, fire — each assessed/fails/
passPct/byMonth}, `coverage[]` {code, name, lastInspection, daysSince}, `recurrence`
{repeats, totalDeficiencies, repeatRatePct, chronic[]}, and `byCampus[].findingsPer10kSqft`
(size-normalized). Render these if you want the fuller board; skip for the lean version.

The per-area panels ("Where checkpoints fail" / "Where environmental checks flag") are
**now live** in the feed (`checkpointsByArea`, `topCheckpoints`, `envFlagsByArea`,
`envZeroAreas`) — see the render bullets above; no static fallback needed.
