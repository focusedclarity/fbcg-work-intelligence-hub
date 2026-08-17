// Supabase Edge Function (Deno) — facilities-metrics  [anonymous test variant]
// Thin wrapper over the shared aggregation. Reads the FBCG Facilities inspection
// sheet from the Smartsheet REST API and returns dashboard-ready JSON (KPIs,
// by-month, by-campus, by-inspector, per-area checkpoint/env breakdowns, loop).
//
// SECRET (set in Supabase, never in the frontend):  SMARTSHEET_TOKEN
// Deploy:  supabase functions deploy facilities-metrics --project-ref <ref>
// Call:    GET /functions/v1/facilities-metrics   (apikey: <anon key>)
//
// This is the anonymous variant used by the interim/passcode dashboard. The
// department-gated variant is `dashboard-metrics` (JWT + can_access_dashboard).

import { aggregateSheet } from "../_shared/aggregate.ts";

const SHEET_ID = "8519533426855812";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const token = Deno.env.get("SMARTSHEET_TOKEN");
  if (!token) return json({ error: "SMARTSHEET_TOKEN secret is not set" }, 500);

  try {
    const payload = await aggregateSheet(SHEET_ID, token);
    return json(payload, 200);
  } catch (e) {
    return json({ error: "aggregation failed", detail: String(e) }, 502);
  }
});
