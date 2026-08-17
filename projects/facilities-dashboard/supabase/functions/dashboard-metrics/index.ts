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

import { createClient } from "jsr:@supabase/supabase-js@2";
import { aggregateSheet } from "../_shared/aggregate.ts";

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
