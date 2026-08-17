# Lovable prompt — Facilities dashboard on the Facilities page (INTERIM passcode gate)

Paste into the **fbcgistaffhub** Lovable app. This is the "right now" version:
static data + a temporary passcode. The real access control (SSO + per-page roles)
replaces the passcode later — see the note at the end.

---

On the **Facilities page**, add a **"Dashboards & Reporting"** section. In it, place a
card titled **"Facilities Inspection Dashboard — Mid-Year (Jan–Jun 2026)"**. Clicking
it opens the dashboard at route `/facilities/inspections`.

**Access gate (temporary):** protect `/facilities/inspections` with a simple passcode
screen — a centered card, one password input, "Enter" button. Correct code is **`5700`**.
On success, store a flag in `sessionStorage` (`fac_dash_ok`) so it isn't re-prompted
during the session, and show the dashboard; wrong code shows "Incorrect code." Add a
small "Lock" link to clear the flag.
> Add a clear `// TODO: replace passcode with SSO + role-based access` comment. This is
> a placeholder gate, not real security — leave the structure ready to swap in Supabase
> Auth + a per-page allow-list later.

**Design — make it feel premium, not muted.** Use the site theme (Cormorant Garamond
headings, Inter body; cream `--background`; royal-violet `--primary`; gold `--accent`;
green for positive). Crisp **white** cards floating on the cream with **layered soft
shadows**, 16px radius, 1px hairline borders, and generous padding. Use **full-strength**
violet/gold for numbers, chart marks, and accents — avoid washed-out, low-contrast fills.
Add depth: a faint top-down gradient on cards, **gradient-filled bars** (violet→lighter
violet; gold→lighter gold), an **area fill** under the trend line, and smooth **hover
states** (cards lift ~3px with a deeper shadow; charts show tooltips). Strong type
hierarchy; tabular numerals. Respect `prefers-reduced-motion`.
(Visual reference: attach the dashboard PDF/screenshot to this message.)

**Header:** eyebrow "First Baptist Church of Glenarden International · Facilities";
title "Building Services Quality Inspection Program"; subtitle "Mid-Year Report ·
January 1 – June 30, 2026"; small line "Data as of June 30, 2026".

**KPI TILES (5) — elevated.** Each: white card, 16px radius, layered shadow, a **3px
brand top keyline** (violet→gold gradient), a small **lucide icon in a tinted circular
chip** (top-right), an uppercase label, a **large tight-tracked tabular number**
(full-strength ink/violet), a muted sub-line, and — where noted — a small colored
**context chip**. Hover: lift 3px, deeper shadow, keyline brightens. Optional subtle
count-up on the numbers.
1. **Inspections completed** — `170` — sub "111 building · 59 env/climate" — icon `clipboard-check`.
2. **Findings documented** — `253` — sub "225 building · 28 env/climate" — icon `file-warning`; add a gold/red chip "▼ 51% per inspection since Feb".
3. **Work orders initiated** — `82` — sub "48% of inspections" — icon `wrench`; violet chip "48%".
4. **Clean inspections** — `50%` — sub "39% building · 71% env/climate" — icon `check-circle-2`; green chip.
5. **Coverage** — `8` — sub "inspectors · 5 campuses" — icon `users`.

**WHAT THE DATA SAYS** — a panel titled "What the data says", subtitle "Five takeaways from 170 inspections and 253 documented findings", in a two-column row beside the "Findings by month" chart. Numbered list:
1. **Winter showed up in the pavement.** Parking lots and sidewalks were the single largest issue source (34 checkpoint failures). Exterior issues peaked in February (19) and were worked down to 3 by June.
2. **The program is proving itself.** Findings per inspection are down 51% since February (2.2 → 1.8 → 1.2 → 1.0), holding near 1.1 in June at full cadence — catch, fix, and find less on the next pass.
3. **Two programs, two profiles.** Building checks carry the workload (225 findings, 39% clean). Environmental checks — temperature and climate conditions in equipment spaces — came back healthy (28 findings, 71% clean).
4. **Interior wear tracks foot traffic.** After exterior, failures cluster in restrooms, the sanctuary, and stairwells (23 each) — the highest-traffic, most member-facing spaces.
5. **Ministry Center got the deepest look — and clears slowest.** 124 of 253 findings came from its 23 inspections, and its FMX work orders close at 78% versus 96% at the Worship Center. The pipeline overall is fast — a 1.2-day median to close and 93% closure — but Ministry Center is where fixes lag.

**Charts:**
- Findings by month (bar): Jan 27, Feb 59, Mar 56, Apr 46, May 37, Jun 28. Caption "▼ 51% findings per inspection since February".
- Findings per inspection (line, area fill): Feb 2.2, Mar 1.8, Apr 1.2, May 1.0, Jun 1.1.
- Building inspections by month (bar): 4, 20, 18, 25, 23, 21.
- Environmental checks by month (gold bar): 4, 7, 14, 15, 14, 5.

**Building program section** (111 inspections · 225 findings · 39% clean) —
"Where checkpoints fail" horizontal bars: Exterior & grounds 59 (by month 2,19,14,14,7,3),
Restrooms 23, Sanctuary 23, Stairwells 23, Lobby & halls 19, Class & conference rooms 17,
Elevators 8, Entrance areas 8, All other areas 21. Note: "Top single checkpoints: parking
lots & paved surfaces 22, sidewalks 12, sanctuary carpet 10, stairwell walls 10."

**Environmental/climate section** (59 checks · 28 findings · 71% clean) —
"Where env checks flag" gold bars: Meeting rooms 10, Sanctuary/warehouse 6, Offices 3,
CLC/courts 2, Kitchen/health clinic 1. Note: "Server rooms, IT closets, telecom closets,
storage rooms, first-aid stations: zero failures all period. CLC anchors the cadence
(43 of 59 checks, 36 clean)."

**By campus** (cards with a building/env mix bar): WC Worship Center 53 (39B/14E),
findings 90, clean 30%; CL Community Life Center 52 (9B/43E), 10, 87%; EC Empowerment
Center 40 (40B/0E), 28, 58%; MC Ministry Center 23 (22B/1E), 124, 0%; SB Service Building
2 (1B/1E), 1, "1 of 2".

**Coverage by inspector** (table: name · route · inspections · bldg/env · findings):
Armando Lopez CL 43 (4/39) 10; Harold Rogers EC 40 (40/0) 28; Kenneth Carr CL·WC 29
(15/14) 56; Von Brown WC·SB 23 (21/2) 19; Chaun Coleman MC 19 (18/1) 93; Misael Gonzalez
WC 10 (7/3) 1; Brandon McRae MC 4 (4/0) 31; Luther Jones WC 2 (2/0) 15.

**Closing the loop** (funnel): 170 inspections → 253 findings → 82 initiated FMX work
orders. Then the **FMX work-order pipeline** panel — all facilities work orders, Jan–Jun
2026, as of Jun 30 — five stat tiles: Tickets created **1,442** (sub "all work orders,
H1"), Tickets closed **1,343** (sub "resolved by Jun 30"), Closure rate **93%** (sub "85%
within 7 days"), Median days to close **1.2** (sub "avg 4.9 days"), Open backlog **102**
(sub "as of Jun 30"). Below: closure-rate-by-building bars — Worship Center 96% (1,258),
Ministry Center 78% (156), Service Building 100% (10), Family Life Center 12% (16). By
month created/closed: Jan 235/209, Feb 271/266, Mar 281/258, Apr 237/222, May 197/189,
Jun 221/226. Caption: "FMX carries no origin tag, so these are all facilities work orders,
aligned by period and campus — not matched ticket-by-ticket to the 82 inspection-initiated
ones. 'Closed' counts a resolved ticket; work resolved but awaiting administrative
finalization is treated as closed."

**Footer:** "Source: Building Services Quality Inspection Checklist (Smartsheet), pulled
July 10, 2026; FMX closed-loop from the FMX maintenance-request export (pulled July 14,
2026), covering work orders created Jan 1 – Jun 30, 2026 as of Jun 30. Environmental/
climate checks verify temperature and climate conditions in equipment and climate-sensitive
spaces."

---

## Later: swap the passcode for real access control
When SSO is live, replace the passcode gate on `/facilities/inspections` with:
1. Require Supabase Auth (Microsoft SSO) — redirect to login if not signed in.
2. Call `https://eitfgjuppfacpuywrror.supabase.co/functions/v1/dashboard-metrics?dashboard=facilities`
   with the session token (200 → data, 403 → "no access") — this also flips the data
   from static to **live from Smartsheet**.
3. Show the "Dashboards & Reporting" card only to users whose department is allowed
   (this is the per-page "who has access" placeholder you mentioned).
