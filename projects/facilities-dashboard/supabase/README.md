# Facilities dashboard — live data backend (Supabase)

Edge function `facilities-metrics` pulls the Smartsheet inspection sheet via the
Smartsheet REST API, aggregates it server-side, and returns dashboard-ready JSON.
The Lovable frontend fetches this function and renders the charts.

```
Smartsheet REST API ──(Bearer token, server-side)──▶ facilities-metrics (Deno) ──JSON──▶ Lovable page
```

## Verified vs. to-validate
- ✅ **Verified against the live sheet:** inspections 170 (111 building / 59 env),
  work orders 82, building/env by month, and by-campus splits all match the
  published dashboard exactly.
- ⚠️ **Validate before going live:** findings (expect 253), checkpoint failures
  (expect 223), and clean % (~50%). The function returns a `_validation` block
  comparing `got` vs `expected`; if findings/checkpoints differ, adjust
  `FINDING_SOURCE` / `DEFICIENCY_MARKER` in `index.ts` (nothing else changes).

## Prerequisites (Gina — one time)
1. **Smartsheet API token:** Smartsheet → Account → Personal Settings → **API Access
   → Generate new access token.** Copy it once. *(If greyed out, your plan blocks
   API — the live path can't proceed; fall back to a CSV/manual refresh.)*
2. Free **Supabase** project created (see the main chat steps).

## Deploy (two ways)

**A — Supabase CLI (recommended)**
```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>          # ref is in the project URL
supabase secrets set SMARTSHEET_TOKEN=<paste-your-token>  # you run this; token never leaves your machine
supabase functions deploy facilities-metrics --no-verify-jwt
```

**B — Supabase dashboard (no CLI)**
1. **Edge Functions → Create a function** → name `facilities-metrics` → paste `functions/facilities-metrics/index.ts`.
2. **Project Settings → Edge Functions → Secrets** → add `SMARTSHEET_TOKEN`.
3. Deploy.

## Test
```bash
curl -s "https://eitfgjuppfacpuywrror.supabase.co/functions/v1/facilities-metrics" \
  -H "apikey: <anon-key>" | jq ._validation
```
✅ **Done when:** `_validation.got` matches `_validation.expected` (or the deltas
are understood). Then remove the `_validation` block if you like.

## Wire it into the Lovable page
Give Lovable this fetch (uses the public anon key — safe in the frontend):
```ts
const SUPABASE_URL = "https://eitfgjuppfacpuywrror.supabase.co";
const SUPABASE_ANON = "<anon-key>";
async function loadMetrics() {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/facilities-metrics`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!r.ok) throw new Error(`metrics ${r.status}`);
  return r.json(); // { kpis, findingsByMonth, byCampus, byInspector, loop, ... }
}
```
Prompt Lovable: *"Fetch dashboard data from this Supabase function on load and bind
the KPIs, charts, campus cards, and inspector table to the returned JSON; render the
FMX 'Closing the loop' panel from the populated `loop` fields (`ticketsCreated`,
`ticketsClosed`, `closureRate`, `medianDaysToClose`, `openBacklog`, and the
`loop.fmx.byMonth` / `loop.fmx.byBuilding` breakdowns)."*

## Refresh cadence
The function recomputes on each call (response cached 5 min via `Cache-Control`).
For a fixed daily snapshot instead, add a Supabase **scheduled function** (cron) that
writes the JSON to a table and have the page read the table.

## FMX closed-loop (static)
FMX ticket lifecycle (tickets created/closed / closure rate / median days-to-close /
backlog) is **not** in the Smartsheet. As of 2026-07-14 it is baked into
`_shared/aggregate.ts` as the `FMX_LOOP` constant (from the FMX Excel export, pulled
2026-07-14; work orders created Jan 1–Jun 30 2026, as of Jun 30) and returned under
`loop` (+ `loop.fmx`). **To refresh:** re-run the FMX export through the same
as-of-Jun-30 method (see `decisions/log.md` 2026-07-14 and the ANALYSIS workbook), update
`FMX_LOOP`, and redeploy. It is static because FMX is an export, not a live API feed.

---

# Model A — department-gated dashboards with M365 SSO

One Supabase project, one auth system, **many dashboards**; each user sees only
their department's. `facilities-metrics` above is the **anonymous** variant (good
for a quick public test); **`dashboard-metrics`** is the **gated** one used in
production — it verifies the signed-in user and returns data only if their
department is allowed.

```
M365 / Entra ID ──SSO──▶ Supabase Auth ──JWT──▶ Lovable app ──?dashboard=facilities──▶ dashboard-metrics
                                                                     │ verifies JWT + can_access_dashboard()
                                                                     ▼ 200 data  |  401 no auth  |  403 wrong dept
```

## Build order
1. **Run the schema:** SQL editor → paste `migrations/0001_access_control.sql` → Run.
   (Creates `profiles`, `dashboards`, `user_dashboard_grants`, RLS, the signup
   trigger, and seeds the `facilities` dashboard.)
2. **Deploy the gated function** (note: NO `--no-verify-jwt`):
   ```bash
   supabase functions deploy dashboard-metrics
   supabase secrets set SMARTSHEET_TOKEN=<token>   # if not already set
   ```
3. **Enable M365 SSO** — Supabase → Authentication → Providers → **Azure** → on.
   Paste Client ID / Secret / Tenant from the Entra app (IT registers it — see
   checklist below).
4. **After people sign in once**, assign departments (SQL editor):
   ```sql
   update public.profiles set role='admin'      where email='gthomas@fbcglenarden.org';
   update public.profiles set department='Facilities' where email in ('...','...');
   ```
5. **Add more dashboards** anytime — no new project, no new function:
   ```sql
   insert into public.dashboards(key,name,department,sheet_id)
   values ('finance','Finance Dashboard','Finance','<sheet id>');
   ```

## Entra (Azure AD) app registration — checklist for IT
- **Entra admin center → App registrations → New registration.**
- Name: `FBCG Dashboards (Supabase Auth)`.
- **Redirect URI (Web):** `https://eitfgjuppfacpuywrror.supabase.co/auth/v1/callback`
- **Certificates & secrets → New client secret** → copy the *value* once.
- **API permissions:** Microsoft Graph → delegated `openid`, `profile`, `email`
  (add `User.Read`; `GroupMember.Read.All` only if we later auto-map departments
  from Entra groups) → **Grant admin consent**.
- Hand back: **Application (client) ID**, **Directory (tenant) ID**, **client secret value**.
  (Gina pastes these into Supabase's Azure provider — they never go to Claude.)

## Lovable — login + role-gated routes (prompt)
> "Add Supabase Auth with a single 'Sign in with Microsoft' button; unauthenticated
> users see only the login screen. After login, call the Supabase function
> `dashboard-metrics?dashboard=<key>` with the user's session token in the
> Authorization header. Render one route per dashboard (e.g. `/facilities`); if the
> function returns 403, show 'You don't have access to this dashboard.' Only show
> nav links for dashboards that return 200. Bind KPIs/charts/tables to the JSON and
> render the FMX 'Closing the loop' panel from the populated `loop` fields (incl.
> `loop.fmx.byMonth` and `loop.fmx.byBuilding`)."

Frontend auth call:
```ts
const { data: { session } } = await supabase.auth.getSession();
const r = await fetch(`${SUPABASE_URL}/functions/v1/dashboard-metrics?dashboard=facilities`, {
  headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${session?.access_token}` },
});
// 200 → render; 401 → send to login; 403 → "no access"
```

## Cost note (Model A)
All of this — Auth (up to 100K users), RLS, both functions, every department's
dashboard — lives in **one** project. Free = $0; Pro = **$25/mo flat**. Adding
dashboards or departments does **not** add projects, so the per-project compute
cost never stacks.

## Enforcement reminder
The `dashboard-metrics` function is the wall (JWT + `can_access_dashboard`).
Hiding nav links in the frontend is UX only — never the security boundary.
