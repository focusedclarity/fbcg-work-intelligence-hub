# Deploy sequence — Facilities dashboard edge functions

Redeploys the Supabase edge functions so the Lovable page receives the **FMX
closed-loop** numbers wired in 2026-07-14. Run from the `supabase/` folder:
`projects/facilities-dashboard/supabase/`.

- **Project ref:** `eitfgjuppfacpuywrror` ("Dashboards & Reporting - Facilities")
- **Two functions:** `facilities-metrics` (anonymous / interim) and `dashboard-metrics`
  (M365-gated / production). Both share `_shared/aggregate.ts`, so both pick up FMX.
- **Secret:** `SMARTSHEET_TOKEN` (already set if you deployed before — step 3 is a no-op then).

---

## Copy-paste (PowerShell or bash — same commands)

```bash
# 0. one-time only: install the Supabase CLI (skip if `supabase --version` works)
#    Windows (winget):  winget install Supabase.CLI
#    macOS (brew):      brew install supabase/tap/supabase

# 1. from the supabase folder
cd "projects/facilities-dashboard/supabase"

# 2. authenticate + link (opens a browser the first time)
supabase login
supabase link --project-ref eitfgjuppfacpuywrror

# 3. set the Smartsheet secret (skip if already set from a prior deploy)
supabase secrets set SMARTSHEET_TOKEN=<paste-token>

# 4. deploy BOTH functions
#    dashboard-metrics = gated: it MUST verify the JWT, so do NOT pass --no-verify-jwt
supabase functions deploy dashboard-metrics --project-ref eitfgjuppfacpuywrror
#    facilities-metrics = anonymous interim variant: skip JWT verification
supabase functions deploy facilities-metrics --no-verify-jwt --project-ref eitfgjuppfacpuywrror
```

## Smoke-test (confirm FMX is live in the payload)

```bash
# anonymous variant — should return JSON with a populated "loop" block.
# <ANON_KEY> = Supabase → Project Settings → API → anon public key.
curl -s "https://eitfgjuppfacpuywrror.supabase.co/functions/v1/facilities-metrics" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
  | grep -o '"ticketsLogged":[0-9]*'
# expected:  "ticketsLogged":110
```

If that prints `"ticketsLogged":110`, the inspection-originated FMX numbers are live.
(The `loop` block now uses `ticketsLogged` / `ticketsClosed` / `closureRate` — the older
`ticketsCreated` field is gone.) You can also confirm the reporting window rolled forward
by checking `"asOf"` in the response (e.g. `"asOf":"2026-07-31"` during August). And
`dashboard-metrics` needs a signed-in user's token, so test it from the Lovable page
after login, not curl.

## Then, in Lovable
Paste the updated build prompt (`lovable-build-prompt.md`) into the **fbcgistaffhub**
Lovable app so it renders the FMX panel from the populated `loop` / `loop.fmx` fields.

---

## Notes
- **FMX numbers are static** (FMX is an export, not a live feed): baked into
  `_shared/aggregate.ts` as `FMX_LOOP`. To refresh, re-run the FMX export through the
  same as-of-Jun-30 method (see `decisions/log.md` 2026-07-14 + the ANALYSIS workbook),
  update the constant, and re-run step 4.
- **Everything else in the payload is live** from Smartsheet on each call (5-min cache).
- Deploy needs Docker running only if the CLI asks to bundle locally; the hosted build
  path does not. If a deploy errors on a Deno type issue, send me the message — I couldn't
  compile locally (no Deno on the build machine).
- Still separately gated on the SSO setup (Supabase project + Entra app registration) —
  see `README.md` and `sso-finish-checklist.md`. That is unrelated to this FMX deploy.
