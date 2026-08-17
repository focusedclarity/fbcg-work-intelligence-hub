# Finish SSO — where IT's three values go (Supabase side)

IT sends back: **Application (client) ID**, **Directory (tenant) ID**, **Client secret value**.

## 1. Turn on the Microsoft provider
Supabase → **Authentication → Providers → Azure** → toggle **Enabled**, then:

| IT gave you | Paste into (Supabase Azure provider) |
|---|---|
| Application (client) ID | **Application (client) ID** |
| Client secret **value** | **Secret Value** |
| Directory (tenant) ID | **Azure Tenant URL** → enter `https://login.microsoftonline.com/<tenant-id>` |

- Confirm the **Callback URL** shown here exactly matches the redirect URI IT
  registered (`https://eitfgjuppfacpuywrror.supabase.co/auth/v1/callback`). If not, they must fix it.
- **Save.**

## 2. Point auth back at the app
Supabase → **Authentication → URL Configuration:**
- **Site URL:** your Lovable app URL (e.g. `https://<yourapp>.lovable.app`)
- **Redirect URLs:** add that same URL (and any custom domain) so login returns to the app.

## 3. Make sure the backend is live (if not already)
- SQL editor → run `migrations/0001_access_control.sql` (once).
- `supabase secrets set SMARTSHEET_TOKEN=<token>`
- `supabase functions deploy dashboard-metrics`

## 4. Sign in once, then set roles
Sign in to the app with Microsoft yourself first (creates your profile row), then in the SQL editor:
```sql
update public.profiles set role='admin'            where email='gthomas@fbcglenarden.org';
update public.profiles set department='Facilities' where email in ('person1@fbcglenarden.org','person2@fbcglenarden.org');
```

## 5. Smoke test
- Sign in as a **Facilities** user → `/facilities` loads. ✅
- Sign in as a non-Facilities user → `/facilities` returns **403 / "no access."** ✅
- `_totals` in the response matches the published numbers (or deltas understood). ✅

## Never paste to anyone / anywhere public
Client **secret value**, the Smartsheet **token**, and the Supabase **service_role key**
stay in Supabase settings only. The **anon key** + project URL are the only things
that belong in the Lovable frontend.
