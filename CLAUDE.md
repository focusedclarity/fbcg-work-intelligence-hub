# CLAUDE.md

Project-level standards for Claude Code sessions working in this repo.

## Dashboard prototype — standards to preserve

The FBCG Intelligence Hub dashboard prototype (`output/dashboard.html`, `data/sample-dashboard.json`, `docs/integration-notes.md`) must keep these rules on every future change:

### Portability (non-negotiable)
- `output/dashboard.html` must remain a **single, self-contained file**: no CDN links, no external fonts, no external scripts, no build step.
- Must open directly from the filesystem (`file://`) with zero external network requests on load.
- Must render meaningful content with **JavaScript disabled or blocked**. Any JavaScript on the page is progressive enhancement only (e.g., the dark-mode toggle) — never a requirement for content to appear.
- All KPI values and list content are **static-first**: hardcoded directly into the HTML markup, not initialized to 0/empty and populated by a script.
- No canvas-based charts, no Chart.js, no D3. All charts are pure CSS (flex-box bars, `conic-gradient` doughnuts, etc.).
- `localStorage` access must always be wrapped in `try/catch` — some contexts (privacy mode, sandboxed previews) throw instead of returning null.
- System font stack only (`"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`) — no `@font-face`, no Google Fonts.

### Brand tokens
Use these placeholder brand tokens as CSS variables at the top of the stylesheet, unless official FBCG hex values are provided by Gina — do not substitute blues or any other color as the primary brand color:

```css
:root {
  --brand-purple: #2e1a47;
  --brand-purple-dark: #1f1233;
  --brand-gold: #c9a227;
  --brand-gold-soft: #f5e6b3;
  --brand-white: #ffffff;
  --brand-off-white: #faf8f2;
  --brand-ink: #1f2937;
  --brand-muted: #6b7280;
  --card-bg: #ffffff;
  --page-bg: linear-gradient(135deg, #1f1233 0%, #2e1a47 45%, #faf8f2 100%);
  --header-bg: linear-gradient(135deg, #1f1233 0%, #2e1a47 55%, #c9a227 100%);
  --accent: #c9a227;
  --border-soft: rgba(46, 26, 71, 0.16);
  --shadow-soft: 0 18px 45px rgba(31, 18, 51, 0.16);
}
```

Dark mode is a full token override set under `:root[data-theme="dark"]`, not a separate stylesheet. The urgent banner has its own theme-aware token set (`--urgent-bg`, `--urgent-heading`, `--urgent-item-bg`, `--urgent-item-hover`, `--urgent-watermark`) that must be re-defined for both themes whenever it's touched.

### SharePoint Lists, not OneDrive
The "files/documents in flight" section of this dashboard represents **SharePoint List items** (Inbox Action Register / Subscription Register / User Profile Register — the actual lists built for this project, see `PhaseU/scout_manual_setup_checklist.md`), not OneDrive files. Do not reintroduce a OneDrive-based section — the Hub's data model is list-item-centric by design (see `PhaseU/HANDOFF.md`).

### Data contract
`data/sample-dashboard.json` mirrors the content hardcoded into `output/dashboard.html` and is the intended shape for future live data (see `docs/integration-notes.md`). If a dashboard section's content changes, update both the HTML and the JSON together so they stay in sync — the JSON is documentation of the data contract, not something the page fetches at runtime.

### Live-data connection
Do not wire up real Microsoft Graph/SharePoint calls directly from static HTML with embedded credentials. The recommended path is rebuilding this as a Power Apps canvas app over the existing SharePoint lists (see `PhaseU/power_app_mvp_plan_and_prompt.md`), not a client-side Graph SDK call from this file. See `docs/integration-notes.md` for the full endpoint/permission/security plan before any live-data work begins.

## General
- This repo is primarily markdown documentation and specs for a Power Automate + SharePoint automation project (the "Work Action Intelligence Hub") — most of it is not executable application code. See `PhaseU/HANDOFF.md` for full project context before making changes.
- Do not add external npm/pip packages or CDN dependencies to the dashboard prototype without Gina's explicit approval.
