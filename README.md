# FBCG Work Intelligence Hub

Project files for the Work Action Intelligence Hub build (Power Automate + SharePoint email/action-item triage system) and its Power Apps/dashboard layer. See `PhaseU/HANDOFF.md` for the full project history and current state.

## Dashboard prototype

`output/dashboard.html` is a self-contained, static HTML/CSS prototype of the "Intelligence Hub" personal work dashboard — FBCG-branded (dark purple / gold / white), built with **mock data only**.

### How to open and test it
1. Open `output/dashboard.html` directly in a browser — double-click the file, or drag it into a browser window. No server, build step, or install is required.
2. It works fully offline: no CDN, no external fonts, no external scripts, and no network requests are made on load.
3. It also renders fully with JavaScript disabled — the only script on the page is the dark-mode toggle (a "🌙 Dark mode" button in the header), which is progressive enhancement and hides itself automatically if scripting isn't available. Every KPI number, list, and chart is real markup, not something JavaScript fills in.
4. Every item (calendar events, emails, Teams chats, SharePoint list rows, projects, training links, follow-up contacts) is a clickable link that opens in a new tab. Since this is a mock build, those links point at realistic-looking placeholder URLs and will not resolve to real content.

### Current status: mock data
All content in `output/dashboard.html` is hardcoded sample data mirroring `data/sample-dashboard.json` — no live Outlook, Calendar, Teams, SharePoint, or Microsoft Graph connection exists. This is intentional: the prototype is for reviewing layout, branding, and information architecture before wiring up real data.

### Replacing mock data with live Microsoft 365 data later
See `docs/integration-notes.md` for the full plan — which Microsoft Graph endpoints or SharePoint connectors map to each dashboard section, required permissions/scopes, and security notes (in particular: never embed a Graph client secret directly in static HTML — the live version needs either a Power Apps/Power Automate backend or a proper backend-for-frontend). `PhaseU/power_app_mvp_plan_and_prompt.md` has the recommended path: rebuild this as a Power Apps canvas app over the existing SharePoint lists, reusing the flows (Sorter/Tempo/Watchdog/Sweep) that already populate them.

## Repository layout
- `PhaseU/` — the Work Action Intelligence Hub build: taxonomy, Sorter/Tempo/Watchdog/List B specs, handoff notes, and review memos.
- `output/`, `data/`, `docs/` — the dashboard prototype and its supporting data/docs.
- `references/playbooks/` — distilled operator playbooks (Dan Martell, Nate Herk) used to sanity-check design decisions.
- `context/`, `decisions/`, `templates/` — general project/EA working files.

See `CLAUDE.md` for the standards (brand tokens, portability rules) future sessions should preserve when touching the dashboard.
