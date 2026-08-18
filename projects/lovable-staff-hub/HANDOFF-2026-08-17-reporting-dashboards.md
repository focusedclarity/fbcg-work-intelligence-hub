# FBCGI Staff Hub — Reporting & Dashboards Handoff
**Date:** 2026-08-17 · **Author:** Claude (session), for G. Thomas
**Purpose:** Everything needed to continue this work in another AI session or hand off to another builder.

---

## 1. Where this lives

- **App:** Lovable project **FBCGI Staff Hub** (`fbcgistaffhub`)
- **Project ID:** `55f65b31-3b4a-4c70-b01d-3d8d0b95f287`
- **Workspace:** `FBCGI Staff Hub` (workspace ID `workspace_01krh7ye84e42az2tmh7hnca6v`)
- **Editor:** https://lovable.dev/projects/55f65b31-3b4a-4c70-b01d-3d8d0b95f287
- **Live/published URL:** https://fbcgistaffhub.lovable.app
- **Latest commit as of this handoff:** `7574a3f1ce25bb5f34f3f45a89e8bc9528776f19`
- **Stack:** Vite + React + shadcn/ui + Tailwind + TypeScript, React Router, Recharts.
- **How to make changes:** This is a Lovable-managed repo. Don't hand-edit files outside Lovable's own tooling — use the Lovable MCP `send_message` tool (or the Lovable editor UI directly) so the agent's own build pipeline stays in sync. `read_file` / `list_files` are fine for inspection.

### URL & gating pattern (pre-existing, unchanged)
- Canonical scheme: `/divisions/<division>/<department>/dashboards[/<report>]`.
- Every Reporting & Dashboards page renders `src/pages/ReportsDashboard.tsx` (scoped by `scopeKey`) or a dedicated page component for an individual live report.
- Every entry point is wrapped in `DashboardGate` (`src/components/PasscodeGate.tsx`) — passcode-gated until SSO/role-based auth ships.
- Single source of truth for which departments have dashboards and what tiles they show: the `DEPARTMENTS` array in `src/pages/ReportsDashboard.tsx`.

---

## 2. What was built this session

### A. Facilities — Fleet Report (live)
- New tile "Fleet Report" on `/divisions/cbo/facilities/dashboards`.
- Route: `/divisions/cbo/facilities/dashboards/fleet` → `src/pages/facilities/FacilitiesFleetDashboard.tsx`.
- Content: July 2026 Monthly Fleet Report — leased vehicle table (10 vehicles, $20,949.72/mo total), Ministry Impacts/Citations/Downtime stat tiles, Future Lease/Purchase Priority (2026/2027), Mileage Top-5 (12mo + July), month-to-month mileage & fuel variance, Fuel Purchases Top-5, YOY Fuel Cost line chart (approximate, read off the source report), Repairs >10 Days (none this month).
- **Static data, Phase 1** — no live feed. Refresh = re-run this by hand each month from the new Monthly Fleet Report export (same as how the Facilities Inspections dashboard's FMX numbers work).

### B. Facilities — SolarWinds Energy Report (placeholder)
- New "Coming Soon" tile on the same Facilities dashboards page, no route yet. Just a placeholder tile (`status: "pending"`) — same pattern as "Work Order Analytics".
- **Open:** no build behind it yet. When ready, will need to decide: static export refresh (like Fleet/FMX) vs. a live SolarWinds API pull (bigger build, needs an API token + likely a Supabase edge function, same architecture pattern as the Smartsheet-backed Facilities Inspections dashboard).

### C. Human Resources — HR Monthly Metrics (live) — NEW DEPARTMENT LANDING
- HR had no Reporting & Dashboards landing before this session (it was in the "coming soon" list). Added:
  - New `DeptGroup` `cbo-human-resources` in `ReportsDashboard.tsx`.
  - Route `/divisions/cbo/human-resources/dashboards` (department landing) and `/divisions/cbo/human-resources/dashboards/metrics` → `src/pages/hr/HumanResourcesMetricsDashboard.tsx`.
  - Removed "Human Resources" from the CBO "departments without a dashboard yet" list.
- Content: July 2026 HR metrics — Hires 5, Open Job Ads 7, New Job Ads (month) 4, Video Screens 1, Prescreens 1, Interviews 1, Status Changes 10, Disciplinary Actions 2, Development Plans 0, PIPs 0, Disability Cases 1, Workers Comp 2, FMLA 1, Staff Recognitions 4, Service Awards 1, I SEE HIM Awards 10, Unemployment Claims 1, Separations 7, Monthly Employee Engagement Event 38, Volunteers/Staff Fingerprinting 30, Learning Bites attendance 0, HR University attendance 0.
- **Static data, Phase 1**, same monthly-refresh model as Fleet.

### D. Marketing — Marketing Metrics (live) — second tile alongside the existing digest dashboard
- New tile "Marketing Metrics" on `/divisions/cbo/marketing/dashboards`, alongside the pre-existing "CBO Weekly Digest — Email Performance" (untouched).
- Route `/divisions/cbo/marketing/dashboards/metrics` → `src/pages/cbo/MarketingMetricsDashboard.tsx`.
- **Data source — locked in:** Google Sheet
  `https://docs.google.com/spreadsheets/d/1RKtBoui5jaPqG5n9Sjc_Bb33sWyL9uXjEpLOBxOBWfg/edit?gid=111556458#gid=111556458`
  Columns: Month, No. MarComm Requests, Email Subscribers, Click Rate, Avg Open Rate, Instagram Followers, Facebook Followers, Website Visits, Podcast Downloads, 1st-time Apple App Downloads, 1st-time Android App Downloads.
  Data present Jan–Jul 2026; Aug–Dec blank (shown as "pending" in the dashboard). YTD totals through July: 378 MarComm requests, 2.98% avg click rate, 49.15% avg open rate, 1,090,323 website visits, 23,638 podcast downloads, 2,271 Apple / 440 Android first-time downloads (Android tracked from April on).
- **Static snapshot, Phase 1.** To refresh: re-pull the same sheet (same gid) and update the data constants in `MarketingMetricsDashboard.tsx`.
- Also fixed the pre-existing digest dashboard: the "Send-by-send detail" panel on `src/pages/cbo/MarketingDigestDashboard.tsx` now loads **collapsed by default** (`defaultOpen={false}`) instead of expanded.

### E. CBO division passcode
- In `src/components/PasscodeGate.tsx`: `SCOPE_PASSCODES.cbo` changed from `"Jones DR"` to **`jonesje`**.
- New behavior added: the `cbo` scope (`/divisions/cbo/dashboards`) is now in a `NON_PERSISTENT_SCOPES` set — its unlock is **never written to sessionStorage**. Every other scope (facilities, marketing, congregational-care, finance) keeps the old behavior (stays unlocked for the rest of the browser session once entered). For `cbo` specifically, navigating away and back — or reloading — requires the passcode again, every time.
- **Passcode reference (as of this handoff):**
  | Scope | Passcode |
  |---|---|
  | Default (`DASHBOARD_PASSCODE`) — most scopes | `5700` |
  | `cmo-congregational-care` | `1305` |
  | `cbo-marketing` | `7773` |
  | `cbo` (division landing) | `jonesje` — **re-locks on every navigation** |

---

## 3. Open question answered this session — ActiveCampaign / Asana auto-pull for Marketing

Gina/marketing team asked whether stats could be pulled automatically instead of typed in by hand. Checked Lovable's connector catalog (`list_connectors`) for the FBCGI Staff Hub workspace:

- **Asana:** available as a standard Lovable connector (not yet connected/authorized). It could feed task/project data automatically, but Asana doesn't hold email/subscriber/social/web analytics — it would only help if some of these metrics (e.g. MarComm request volume) are tracked as Asana tasks. Needs a decision on whether MarComm requests actually live in Asana before this is useful.
- **ActiveCampaign:** **not** in Lovable's connector catalog at all. There's no one-click integration. Pulling it automatically would require a custom build: an ActiveCampaign API token + a scheduled Supabase edge function to pull and cache the metrics (the same architecture already used for the Facilities Inspections dashboard's Smartsheet feed, and the FMX closed-loop data). That's a real, scoped Phase 2 project, not a quick add — needs an API token from whoever admins ActiveCampaign, and someone to decide which of the fields in this dashboard actually come from ActiveCampaign vs. elsewhere (social/app-store numbers don't live in ActiveCampaign at all).

**Bottom line:** nothing here is auto-pulling yet. Everything shipped this session (Fleet, HR, Marketing Metrics) is a manually-refreshed monthly snapshot, same pattern as the original Facilities Inspections build. Wiring any of them to a live source is a separate, explicitly-scoped follow-up.

---

## 4. Reference — full current `DEPARTMENTS` picture (post-session)

| Division | Department | Tile(s) | Status |
|---|---|---|---|
| CBO | Business Services | Front Desk Dashboard | live |
| CBO | Facilities | Facilities Inspections | live |
| CBO | Facilities | **Fleet Report** | **live (new)** |
| CBO | Facilities | Work Order Analytics | pending |
| CBO | Facilities | **SolarWinds Energy Report** | **pending (new)** |
| CBO | Marketing | CBO Weekly Digest — Email Performance | live |
| CBO | Marketing | **Marketing Metrics** | **live (new)** |
| CBO | Human Resources | **HR Monthly Metrics** | **live (new department)** |
| CMO | Congregational Care | Monthly Staff Minister's Report | live |
| Pastor | Finance | Stewardship Dashboard | live |

CBO "no dashboard yet" list is now: Events, Information Technology, Safety & Security (Human Resources removed since it now has one).

---

## 5. If you're picking this up in a new session

Give the new AI:
1. This document.
2. The Lovable project ID: `55f65b31-3b4a-4c70-b01d-3d8d0b95f287` and workspace ID `workspace_01krh7ye84e42az2tmh7hnca6v` (needs the Lovable MCP connector authorized to act on it).
3. Confirm whether any of Fleet / HR / Marketing Metrics needs a data refresh before making further changes — they're all frozen at July 2026.
4. Any decision on the SolarWinds Energy Report build approach (static export vs. live API) before starting it.
