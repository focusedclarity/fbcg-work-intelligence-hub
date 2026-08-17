# Lovable prompt — "Who's walking the floor" / Coverage by route (clarity fix)

Paste this into the **fbcgistaffhub** Lovable chat. It restructures ONLY the coverage
section (who inspects each campus) into a grouped-by-route layout and adds a plain-
language explainer at the top so the numbers are self-explanatory. It does not change
the site theme, other panels, or the passcode.

---

In the Facilities Inspection Dashboard, improve **only** the coverage section that shows
who is inspecting each campus — the "who's walking the floor" / "Coverage by route" area.
**Keep the site's existing theme, colors, fonts, card style, and overall layout** — only
restructure this one section and add the explainer below. Do not change any other panel,
number, chart, or the passcode.

**A) Add a short plain-language explainer at the TOP of the section** (above the route
list), in a subtle bordered box that matches the existing theme:

> **How to read this.** Each campus is an inspection **route**. Under each route we list
> everyone who walked it, with:
> • **Inspections** — how many walks they did on that route, split into **building**
>   inspections (violet) and **environmental / climate** checks (gold).
> • **Findings** — the total issues they documented on that route.
> A higher finding count does **not** mean a worse inspector — it reflects the size and
> condition of the building they cover. Anyone who covers two campuses is listed under both.

**B) Group inspectors by route (campus).** Each route is its own card with a header
showing the campus code + name, total inspections, and when it was last walked. Flag a
route not walked recently as **Overdue**, and a route with only one inspector as
**Single inspector**. Under each route header, one row per inspector showing their
inspections (with the building/env split) and their findings. Keep a small legend
(violet = building, gold = env/climate). Use this data (January–July 2026, as of Jul 31):

- **CL — Community Life Center** · 63 inspections · last walked Jul 30
  - Armando Lopez — 53 (4 building / 49 env) — 10 findings
  - Kenneth Carr — 10 (6 / 4) — 0 findings
- **WC — Worship Center** · 63 · last walked Jul 30
  - Von Brown — 25 (24 / 1) — 22
  - Kenneth Carr — 23 (11 / 12) — 58
  - Misael Gonzalez — 13 (9 / 4) — 1
  - Luther Jones — 2 (2 / 0) — 15
- **EC — Empowerment Center** · 40 · last walked Jun 18 · **Single inspector · Overdue**
  - Harold Rogers — 40 (40 / 0) — 28
- **MC — Ministry Center** · 28 · last walked Jul 31
  - Chaun Coleman — 20 (19 / 1) — 98
  - Brandon McRae — 4 (4 / 0) — 31
  - Cordell Donte Jackson (New) — 4 (3 / 1) — 4
- **SB — Service Building** · 2 · last walked Jun 4 · **Single inspector · Overdue**
  - Von Brown — 2 (1 / 1) — 1

Keep everything outside this section exactly as it is.

---

> If the coverage section is bound to the Supabase function instead of hard-coded, the
> per-route data is in `byInspector[]` (name, building, env, findings, total) and the
> last-walked info is in `coverage[]` (code, name, lastInspection, daysSince). The
> route grouping is by campus code from each inspector's rows.
