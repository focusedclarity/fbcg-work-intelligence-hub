// ============================================================================
// dashboard-metrics  —  SINGLE-FILE build for the Supabase DASHBOARD editor.
// Paste this ENTIRE file into the web editor for the 'dashboard-metrics'
// function, then Deploy with **Verify JWT = ON** (this is the gated variant).
// It is functions/dashboard-metrics/index.ts with _shared/aggregate.ts inlined.
// ============================================================================

// -- remote import kept at top (the aggregate.ts import is inlined below) --
import { createClient } from "jsr:@supabase/supabase-js@2";

// Shared Smartsheet fetch + aggregation for FBCG inspection dashboards.
// Verified against the Facilities sheet: inspections 170 (111 building / 59 env),
// work orders 82, building/env by month, and by-campus splits all match the
// published dashboard. FINDINGS / CHECKPOINT-FAILURE rules are the best-supported
// interpretation — reconcile to STATS-2026H1.md before treating findings as final
// (each payload carries a `_totals` block for eyeballing).

// --- Rolling reporting window (auto-advances each month) --------------------
// The window is Jan 1 of the reporting year through the END of the last COMPLETE
// month, and the as-of date is that month-end. Runs server-side (Deno), so the
// dashboard rolls forward on its own with no code change — e.g. any run during
// August 2026 reports Jan 1 – Jul 31 (as of Jul 31). Dates are keyed off the
// WALK date recorded in each Report ID (MM/DD/YY), not the row's entry date.
const NOW = new Date();
const WINDOW_END = Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), 1); // 1st of current month (exclusive)
const ASOF = WINDOW_END - 86400000;                                     // last day of last complete month
const ASOF_DATE = new Date(ASOF);
const WINDOW_START = Date.UTC(ASOF_DATE.getUTCFullYear(), 0, 1);         // Jan 1 of the reporting year
const NMONTHS = ASOF_DATE.getUTCMonth() + 1;                            // # of months Jan..last complete
const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS = ALL_MONTHS.slice(0, NMONTHS);
const DEFICIENCY_MARKER = /deficien/i;

// Walk date from the Report ID (e.g. "07/30/26-WC-Daily/Weekly"); falls back to
// the Created entry timestamp if the Report ID has no leading date.
function walkDateOf(rid: string, created: string): number | null {
  const m = rid.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
  if (m) return Date.UTC(2000 + (+m[3]), (+m[1]) - 1, +m[2]);
  const t = Date.parse(created);
  return isNaN(t) ? null : t;
}

const META_COLUMNS = new Set([
  "Helper Column", "Report ID", "FMX Ticket Numbers", "Deficiencies", "Created",
  "Status", "Additional Comments", "Inspector",
  "Environmental / Climate Inspection Only", "Environmental / Climate Inspection Location",
  "Location", "Inspection Location", "Frequency", "Frequency - CLC / EC / SB",
]);
const CAMPUS_NAMES: Record<string, string> = {
  WC: "Worship Center", CL: "Community Life Center", EC: "Empowerment Center",
  MC: "Ministry Center", SB: "Service Building",
};
// Gross floor area per campus — enables "findings per 1,000 sq ft" so campuses are
// comparable regardless of inspection depth. TODO: add CL (Community Life Center) and
// SB (Service Building) once provided; unknown campuses return null (no false compare).
const SQFT_BY_CODE: Record<string, number> = { WC: 205000, MC: 105000, EC: 56000 };

// --- FMX closed-loop (STATIC, inspection-originated) ------------------------
// The FMX work orders our INSPECTIONS logged — matched by the FMX ticket numbers
// recorded in the Smartsheet "FMX Ticket Numbers" column against the FMX export
// (rev 071426) — tracked to closure. This is the true inspection→work-order loop,
// NOT all-facilities FMX volume. Computed offline (the FMX export is an Excel file,
// not a live API) and scoped to H1: tickets created Jan 1 – Jun 30 2026, as of Jun 30.
//   ticketsClosed = logged tickets with a Resolved-on date on/before Jun 30.
//   openBacklog   = logged tickets created ≤ Jun 30 still unresolved at Jun 30.
// 110 of 121 ticket references matched; 11 inspection rows carry mistyped numbers
// and are excluded pending correction (see the exceptions list in the dashboard).
// To refresh: re-match a fresh FMX export to the Smartsheet ticket numbers and
// update these constants (see the monthly refresh runbook).
const FMX_LOOP = {
  source: "FMX export (rev 071426) × Smartsheet FMX Ticket Numbers",
  scope: "inspection-originated work orders, created Jan 1 – Jun 30 2026, as of Jun 30",
  basis: "H1 (Jan 1 – Jun 30, 2026)",
  h1Inspections: 170,
  h1Findings: 253,
  ticketsLogged: 110,
  ticketsClosed: 72,
  closureRate: 65,          // % of the 110 logged tickets resolved by Jun 30
  openBacklog: 38,
  medianDaysToClose: 10.8,
  avgDaysToClose: 25.6,
  closedWithin7: 28,
  closedWithin30: 54,
  ticketRefsMatched: 110,
  ticketRefsTotal: 121,
  exceptions: 11,
  byCampus: [
    { campus: "Ministry Center", code: "MC", created: 75, closed: 57, closureRate: 76 },
    { campus: "Worship Center", code: "WC", created: 24, closed: 12, closureRate: 50 },
    { campus: "Community Life Center", code: "CL", created: 8, closed: 0, closureRate: 0 },
    { campus: "Empowerment Center", code: "EC", created: 2, closed: 2, closureRate: 100 },
    { campus: "Service Building", code: "SB", created: 1, closed: 1, closureRate: 100 },
  ],
};

// --- checkpoint → area mapping (for the per-area panels) --------------------
const ENV_AREA_LABELS: Array<[RegExp, string]> = [
  [/Meeting Rooms/i, "Meeting rooms"],
  [/Sanctuary\/Warehouse/i, "Sanctuary / warehouse"],
  [/Offices/i, "Offices"],
  [/CLC\/Courts/i, "CLC / courts"],
  [/Kitchen\/Health Clinic/i, "Kitchen / health clinic"],
  [/First Aid/i, "First aid stations"],
  [/IT Closets/i, "IT closets"],
  [/Server Rooms/i, "Server rooms"],
  [/Storage Rooms/i, "Storage rooms"],
  [/Telecom Closets/i, "Telecom closets"],
];
const ALL_ENV_AREAS = ["Meeting rooms", "Sanctuary / warehouse", "Offices", "CLC / courts",
  "Kitchen / health clinic", "First aid stations", "IT closets", "Server rooms",
  "Storage rooms", "Telecom closets"];

function bldgArea(title: string): string {
  if (title.startsWith("Exterior") || /Parking Lot/i.test(title)) return "Exterior & grounds";
  if (title.startsWith("Entrance Area")) return "Entrance areas";
  if (title.startsWith("Lobby Area/Halls")) return "Lobby & halls";
  if (title.startsWith("Sanctuary")) return "Sanctuary";
  if (title.startsWith("Elevator")) return "Elevators";
  if (title.startsWith("Stairwell")) return "Stairwells";
  if (title.startsWith("Restroom")) return "Restrooms";
  if (title.startsWith("Class and Conference Room")) return "Class & conference rooms";
  return "All other areas";
}
function envArea(title: string): string {
  for (const [re, label] of ENV_AREA_LABELS) if (re.test(title)) return label;
  return "Other";
}
// {program, area} for a checkpoint column (env columns start "Environmental/Climate",
// distinct from the meta "Environmental / Climate Inspection Only" which has spaces).
function areaOf(title: string): { program: "env" | "building"; area: string } {
  if (title.startsWith("Environmental/Climate")) return { program: "env", area: envArea(title) };
  return { program: "building", area: bldgArea(title) };
}

interface Cell { columnId: number; value?: unknown; displayValue?: string; }
interface Row { cells: Cell[]; }
interface Column { id: number; title: string; }

export async function aggregateSheet(sheetId: string, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.smartsheet.com/2.0/sheets/${sheetId}?level=0`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Smartsheet API ${res.status}: ${await res.text()}`);
  const sheet = await res.json() as { columns: Column[]; rows: Row[] };

  const idToTitle = new Map<number, string>();
  const titleToId = new Map<string, number>();
  for (const c of sheet.columns) { idToTitle.set(c.id, c.title); titleToId.set(c.title, c.id); }
  const val = (row: Row, title: string): string => {
    const id = titleToId.get(title);
    if (id === undefined) return "";
    const cell = row.cells.find((x) => x.columnId === id);
    return cell ? (cell.displayValue ?? (cell.value == null ? "" : String(cell.value))) : "";
  };

  const zeroN = () => new Array(NMONTHS).fill(0);
  const inspByMonth = { building: zeroN(), env: zeroN() };
  const findingsByMonth = zeroN();
  const inspCountByMonth = zeroN();
  let inspections = 0, buildingInsp = 0, envInsp = 0;
  let findingsTotal = 0, findingsBuilding = 0, findingsEnv = 0;
  let checkpointBuilding = 0, checkpointEnv = 0;
  let cleanTotal = 0, cleanBuilding = 0, cleanEnv = 0, workOrders = 0;
  const inspectors = new Set<string>();
  const byCampus: Record<string, { code: string; name: string; building: number; env: number; findings: number; clean: number; total: number }> = {};
  const byInspector: Record<string, { name: string; building: number; env: number; findings: number; total: number }> = {};
  // campus code -> inspector -> tallies (drives the grouped "Coverage by route" panel)
  const byRoute: Record<string, Record<string, { name: string; building: number; env: number; findings: number; total: number }>> = {};
  const buildingAreas: Record<string, number[]> = {};
  const envAreas: Record<string, number[]> = {};
  const perColumn: Record<string, number[]> = {};
  let checkpointsAssessed = 0;
  let oshaFail = 0, oshaAssessed = 0, fireFail = 0, fireAssessed = 0;
  const oshaByMonth = zeroN(), fireByMonth = zeroN();
  const campusLast: Record<string, number> = {};      // campus code -> latest inspection timestamp
  const recur: Record<string, number> = {};           // "campus␟checkpoint" -> # inspections it was flagged

  const findingsFor = (row: Row): number => {
    const d = parseFloat(val(row, "Deficiencies"));
    if (!isNaN(d)) return d;
    let n = 0;
    for (const c of row.cells) {
      const t = idToTitle.get(c.columnId) ?? "";
      if (/ Deficiency \d+$/.test(t) && String(c.displayValue ?? c.value ?? "").trim() !== "") n++;
    }
    return n;
  };
  const checkpointFailsFor = (row: Row): number => {
    let n = 0;
    for (const c of row.cells) {
      const t = idToTitle.get(c.columnId) ?? "";
      if (META_COLUMNS.has(t) || / Deficiency \d+$/.test(t)) continue;
      if (DEFICIENCY_MARKER.test(String(c.displayValue ?? c.value ?? ""))) n++;
    }
    return n;
  };

  for (const row of sheet.rows) {
    const status = val(row, "Status").trim();
    if (!status) continue; // universe = rows with a non-blank Status
    // WALK date (from Report ID) drives the window & month bucketing, not entry date.
    const t = walkDateOf(val(row, "Report ID"), val(row, "Created"));
    if (t === null || t < WINDOW_START || t >= WINDOW_END) continue;

    const isEnv = val(row, "Environmental / Climate Inspection Only").trim().toLowerCase() === "yes";
    const mi = new Date(t).getUTCMonth();
    const findings = findingsFor(row);
    const checks = checkpointFailsFor(row);
    const clean = findings === 0;

    inspections++; inspCountByMonth[mi]++; findingsByMonth[mi] += findings; findingsTotal += findings;
    if (clean) cleanTotal++;
    if (status.toLowerCase() === "work order initiated") workOrders++;
    if (isEnv) { envInsp++; inspByMonth.env[mi]++; findingsEnv += findings; checkpointEnv += checks; if (clean) cleanEnv++; }
    else { buildingInsp++; inspByMonth.building[mi]++; findingsBuilding += findings; checkpointBuilding += checks; if (clean) cleanBuilding++; }

    const m = val(row, "Report ID").match(/-([A-Za-z]{2})-/);
    const code = (m ? m[1] : (val(row, "Location") || "??")).toUpperCase();
    const camp = byCampus[code] ??= { code, name: CAMPUS_NAMES[code] ?? code, building: 0, env: 0, findings: 0, clean: 0, total: 0 };
    camp.total++; camp.findings += findings; if (clean) camp.clean++; isEnv ? camp.env++ : camp.building++;
    if (t > (campusLast[code] || 0)) campusLast[code] = t;

    // one pass over checkpoint cells: assessed count, safety, per-area failures, recurrence
    for (const c of row.cells) {
      const ct = idToTitle.get(c.columnId) ?? "";
      if (META_COLUMNS.has(ct) || / Deficiency \d+$/.test(ct)) continue;
      const raw = String(c.displayValue ?? c.value ?? "").trim();
      if (!raw) continue;                          // blank = checkpoint not assessed on this inspection
      checkpointsAssessed++;
      if (ct === "OSHA Compliance") oshaAssessed++;
      else if (ct === "Fire & Safety Compliance") fireAssessed++;
      if (!DEFICIENCY_MARKER.test(raw)) continue;  // assessed & passed
      // --- deficiency ---
      const a = areaOf(ct);
      if (a.program === "env") (envAreas[a.area] ??= zeroN())[mi]++;
      else { (buildingAreas[a.area] ??= zeroN())[mi]++; (perColumn[ct] ??= zeroN())[mi]++; }
      if (ct === "OSHA Compliance") { oshaFail++; oshaByMonth[mi]++; }
      else if (ct === "Fire & Safety Compliance") { fireFail++; fireByMonth[mi]++; }
      recur[code + "␟" + ct] = (recur[code + "␟" + ct] || 0) + 1;
    }

    const who = val(row, "Inspector").trim() || "Unassigned";
    inspectors.add(who);
    const ins = byInspector[who] ??= { name: who, building: 0, env: 0, findings: 0, total: 0 };
    ins.total++; ins.findings += findings; isEnv ? ins.env++ : ins.building++;
  }

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  // ASOF is module-level and dynamic (end of the last complete month).
  const checkpointTotalFails = checkpointBuilding + checkpointEnv;
  const recurInstances = Object.values(recur).reduce((x, y) => x + y, 0);
  const recurRepeats = recurInstances - Object.keys(recur).length;
  const chronic = Object.entries(recur).filter(([, n]) => n >= 3)
    .map(([k, n]) => { const i = k.indexOf("␟"); const cc = k.slice(0, i); return { campus: CAMPUS_NAMES[cc] || cc, checkpoint: k.slice(i + 1), count: n }; })
    .sort((a, b) => b.count - a.count).slice(0, 10);
  const coverage = Object.entries(campusLast)
    .map(([cc, ts]) => ({ code: cc, name: CAMPUS_NAMES[cc] || cc, lastInspection: new Date(ts).toISOString().slice(0, 10), daysSince: Math.floor((ASOF - ts) / 86400000) }))
    .sort((a, b) => b.daysSince - a.daysSince);

  return {
    asOf: ASOF_DATE.toISOString().slice(0, 10),
    period: `January 1 – ${MONTHS_FULL[ASOF_DATE.getUTCMonth()]} ${ASOF_DATE.getUTCDate()}, ${ASOF_DATE.getUTCFullYear()}`,
    kpis: {
      inspections, buildingInsp, envInsp,
      findings: findingsTotal, findingsBuilding, findingsEnv,
      workOrders, workOrderPct: pct(workOrders, inspections),
      cleanPct: pct(cleanTotal, inspections),
      cleanBuildingPct: pct(cleanBuilding, buildingInsp),
      cleanEnvPct: pct(cleanEnv, envInsp),
      inspectorCount: inspectors.size, campusCount: Object.keys(byCampus).length,
    },
    findingsByMonth,
    // Quality trajectory starts at Feb — January (index 0) is ramp-up (8 inspections) and
    // is excluded, matching the approved report. Round half-up (Math.round), not toFixed.
    ratePerInspection: Array.from({ length: NMONTHS - 1 }, (_, k) => k + 1).map((i) => inspCountByMonth[i] ? Math.round((findingsByMonth[i] / inspCountByMonth[i]) * 10) / 10 : 0),
    rateMonths: MONTHS.slice(1),
    buildingByMonth: inspByMonth.building,
    envByMonth: inspByMonth.env,
    checkpointFailures: { building: checkpointBuilding, env: checkpointEnv, total: checkpointTotalFails },
    // Facility Quality Score — % of assessed checkpoints that passed
    qualityScore: {
      passPct: pct(checkpointsAssessed - checkpointTotalFails, checkpointsAssessed),
      checkpointsAssessed, checkpointFailures: checkpointTotalFails,
    },
    // Safety & compliance pass rates (OSHA + Fire & Safety checkpoints)
    safety: {
      osha: { assessed: oshaAssessed, fails: oshaFail, passPct: pct(oshaAssessed - oshaFail, oshaAssessed), byMonth: oshaByMonth },
      fire: { assessed: fireAssessed, fails: fireFail, passPct: pct(fireAssessed - fireFail, fireAssessed), byMonth: fireByMonth },
    },
    // Coverage freshness — days since each campus was last walked (as of the month-end ASOF)
    coverage,
    // Repeat/chronic deficiencies — a flag that recurred at the same campus+checkpoint
    recurrence: { repeats: recurRepeats, totalDeficiencies: recurInstances, repeatRatePct: pct(recurRepeats, recurInstances), chronic },
    // months index: 0=Jan … 5=Jun. Each area carries byMonth[6] so a month filter
    // in the UI (YTD · J F M A M J) can re-slice the bars without another call.
    months: MONTHS,
    checkpointsByArea: Object.entries(buildingAreas)
      .map(([area, m]) => ({ area, count: sum(m), byMonth: m }))
      .sort((a, b) => b.count - a.count),
    topCheckpoints: Object.entries(perColumn)
      .map(([column, m]) => ({ column, count: sum(m), byMonth: m }))
      .sort((a, b) => b.count - a.count).slice(0, 6),
    envFlagsByArea: ALL_ENV_AREAS
      .map((area) => ({ area, count: sum(envAreas[area] || []), byMonth: envAreas[area] || zeroN() }))
      .filter((x) => x.count > 0).sort((a, b) => b.count - a.count),
    envZeroAreas: ALL_ENV_AREAS.filter((area) => sum(envAreas[area] || []) === 0),
    byCampus: Object.values(byCampus).sort((a, b) => b.total - a.total).map((c) => {
      const sqft = SQFT_BY_CODE[c.code] ?? null;
      return { ...c, cleanPct: pct(c.clean, c.total), sqft, findingsPer10kSqft: sqft ? +(c.findings / (sqft / 10000)).toFixed(1) : null };
    }),
    byInspector: Object.values(byInspector).sort((a, b) => b.total - a.total),
    // Closing-the-loop: the inspection funnel (live from Smartsheet) + the FMX
    // work-order pipeline (static; see FMX_LOOP above). FMX fields are now populated,
    // so the frontend renders the panel instead of showing "pending".
    loop: {
      // live inspection funnel for the current window
      inspections, findings: findingsTotal, workOrders,
      // inspection-originated FMX closed loop (H1, as of Jun 30 — static, see FMX_LOOP)
      h1Inspections: FMX_LOOP.h1Inspections,
      h1Findings: FMX_LOOP.h1Findings,
      ticketsLogged: FMX_LOOP.ticketsLogged,
      ticketsClosed: FMX_LOOP.ticketsClosed,
      closureRate: FMX_LOOP.closureRate,
      medianDaysToClose: FMX_LOOP.medianDaysToClose,
      openBacklog: FMX_LOOP.openBacklog,
      fmx: FMX_LOOP,
    },
    _totals: { inspections, buildingInsp, envInsp, findings: findingsTotal, checkpointFailures: checkpointBuilding + checkpointEnv, cleanPct: pct(cleanTotal, inspections), workOrders },
  };
}

// ---------------------------------------------------------------------------
// HTTP handler (from functions/dashboard-metrics/index.ts; import lines removed)
// ---------------------------------------------------------------------------
// Auth-aware, department-gated metrics function (Model A).
// One function serves EVERY dashboard: caller must be signed in (M365 SSO via
// Supabase Auth), and only gets data for a dashboard their department is allowed
// to see. Data-driven from the `dashboards` table (key → sheet_id + department).
//
// Call from the signed-in Lovable app:
//   GET /functions/v1/dashboard-metrics?dashboard=facilities
//   headers: apikey: <anon>, Authorization: Bearer <user session JWT>
//
// Deploy WITHOUT --no-verify-jwt (we verify the user ourselves):
//   supabase functions deploy dashboard-metrics
// Secret needed: SMARTSHEET_TOKEN (SUPABASE_URL / _ANON_KEY / _SERVICE_ROLE_KEY
// are injected automatically).


const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "private, max-age=120" } });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const dashboard = new URL(req.url).searchParams.get("dashboard");
  if (!dashboard) return json({ error: "missing ?dashboard" }, 400);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const smartsheetToken = Deno.env.get("SMARTSHEET_TOKEN");

  // 1) Identify the caller from their session JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authErr } = await asUser.auth.getUser();
  if (authErr || !user) return json({ error: "not authenticated" }, 401);

  // 2) Authorize + resolve the sheet (service role bypasses RLS for the lookup).
  const admin = createClient(SUPABASE_URL, SERVICE);
  const { data: allowed, error: rpcErr } = await admin.rpc("can_access_dashboard", { uid: user.id, dkey: dashboard });
  if (rpcErr) return json({ error: "authorization check failed", detail: rpcErr.message }, 500);
  if (!allowed) return json({ error: "forbidden" }, 403);

  const { data: dash, error: dErr } = await admin.from("dashboards").select("sheet_id,name").eq("key", dashboard).single();
  if (dErr || !dash) return json({ error: "unknown dashboard" }, 404);

  // 3) Fetch + aggregate the sheet.
  if (!smartsheetToken) return json({ error: "SMARTSHEET_TOKEN secret is not set" }, 500);
  try {
    const payload = await aggregateSheet(dash.sheet_id, smartsheetToken);
    return json({ dashboard, name: dash.name, ...payload }, 200);
  } catch (e) {
    return json({ error: "aggregation failed", detail: String(e) }, 502);
  }
});
