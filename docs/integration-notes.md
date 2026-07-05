# Integration Notes — Connecting the Dashboard to Live Microsoft 365 Data

This dashboard (`output/dashboard.html`) currently renders entirely from hardcoded mock content that mirrors `data/sample-dashboard.json`. This document explains how to replace that mock content with live Microsoft Graph and SharePoint List data.

## Assumptions
- The dashboard will eventually run either as a Power Apps canvas app (see `PhaseU/power_app_mvp_plan_and_prompt.md`) or as a lightweight web app registered in Entra ID that calls Microsoft Graph directly. This HTML file is a **visual/structural prototype**, not the final runtime — expect the data-fetching layer to be rebuilt in whichever of those two the team chooses, not just "connected" as-is.
- No live Microsoft 365 credentials, tenant IDs, or app registrations exist yet in this environment. Nothing in this prototype calls a real endpoint.
- The underlying SharePoint lists (Inbox Action Register / Subscription Register / User Profile Register) already exist per `PhaseU/scout_manual_setup_checklist.md` — this doc assumes those schemas as the source of truth for List-backed sections.

## Required data fields, by section

| Dashboard section | Source | Key fields needed |
|---|---|---|
| KPI strip | Graph + SharePoint (aggregate counts) | Counts derived from the sources below — no new fields, just server-side/query-time aggregation |
| Urgent banner | SharePoint (Inbox Action Register) + Graph (mail) | `Priority`, `Recipient Scope`, `Due Date Stated`, `Draft Status`, message subject/id |
| Tomorrow's Schedule | Graph (Calendar) | `subject`, `start`, `end`, `location.displayName`, `webLink` |
| Prep Notes | Manual/AI-generated (not a Graph source) | Free text — likely sourced from a future "prep" list or an AI summarization step, not scoped here |
| Top Projects | Power Automate flow run history / a projects list (not yet built) | Flow name, status, % complete — needs a dedicated "Projects" list or the Power Automate Admin API |
| Week Calendar Load | Graph (Calendar) | `start`/`end` per event, aggregated to hours/day, bucketed into heavy/normal/light thresholds |
| Time Allocation | Derived from Calendar categories + manual categorization | Requires either Outlook calendar categories or a mapping table (event → time-allocation bucket) |
| Emails Needing a Reply | Graph (Mail) + SharePoint (Inbox Action Register) | `from`, `subject`, `receivedDateTime`, `webLink`, cross-referenced `Priority`/`Status` from the register |
| Long-Term Action Items | SharePoint (Inbox Action Register) | Items where `Digest Lane` = Leadership/Reporting or similar, filtered by open `Status` |
| Training & Learning | Manual list or a future "Learning" SharePoint list (not yet built) | Title, type, progress, URL |
| OOF Radar | Graph (`/me/people` + calendar OOF events, or manual entry) | Name, OOF date range, contact email |
| People to Follow Up With | SharePoint (Inbox Action Register), grouped by Sender | `Sender`, `Sender Domain`, `Priority`, `Last Status Change` |
| Unread Teams Chats | Graph (Chat) | `topic`/participant name, last message preview, `unreadMessageCount`, chat `webUrl` |
| SharePoint Lists in Flight | Graph (`/sites/{id}/lists/{id}/items`) | All Inbox Action Register / User Profile Register columns per `scout_manual_setup_checklist.md` |

## Suggested Graph endpoints / connector approach

- **Calendar:** `GET /me/calendarView?startDateTime={iso}&endDateTime={iso}` — delegated permission `Calendars.Read`.
- **Mail:** `GET /me/messages?$filter=isRead eq false&$top=25&$orderby=receivedDateTime desc` — delegated permission `Mail.Read`.
- **Teams chats:** `GET /me/chats/getAllMessages` (or per-chat `GET /chats/{id}/messages`) — delegated permission `Chat.Read` (application permission `Chat.Read.All` if a background job needs to run without a signed-in user).
- **SharePoint list items:** `GET /sites/{site-id}/lists/{list-id}/items?expand=fields` — delegated or application permission `Sites.Read.All` (or `Sites.Selected` scoped to just this site, which is the safer/preferred option for least-privilege).
- **Connector approach if built as a Power App instead of a custom web app:** use the native **SharePoint connector** for all three lists (no Graph calls needed at all — this is the simpler, lower-maintenance path and is what `PhaseU/power_app_mvp_plan_and_prompt.md` recommends for the MVP), and the native **Office 365 Outlook** / **Microsoft Teams** connectors for mail/calendar/chat data. Power Automate flows (Sorter, Tempo, Watchdog, Sweep) already write into the SharePoint lists, so the app mostly just reads what the flows have already produced — it does not need to re-derive KPI logic itself.

## What to replace, mechanically
Every hardcoded content block in `output/dashboard.html` is preceded by an HTML comment naming the relevant future Graph/SharePoint source. Replace each block with server-rendered or client-fetched output shaped like the corresponding array/object in `data/sample-dashboard.json` — that JSON file is the intended data contract, so keep field names consistent with it (or update both together) rather than inventing a new shape per section.

## Security notes
- Never call Graph directly from a static HTML file with an embedded client secret — that exposes credentials to anyone who views source. A production build needs either (a) a Power Apps/Power Automate backend (recommended — see the MVP plan doc), or (b) a proper backend-for-frontend that holds the token and proxies requests, using MSAL.js with a public client / PKCE flow if a pure SPA is required.
- Prefer `Sites.Selected` over `Sites.Read.All` for the SharePoint permission grant — it scopes access to only the Intelligence Hub site instead of every site in the tenant.
- Mail/Chat/Calendar scopes above are delegated (act-as-the-signed-in-user) by default, which is appropriate for a personal dashboard; do not request application-level Mail/Chat permissions unless a background (non-interactive) sync job is a deliberate, reviewed requirement — those are tenant-wide and higher-risk.
- All mock URLs in this prototype (`outlook.office.com/.../mock-msg-...`, `teams.microsoft.com/.../mock-...`, `*.example.com` mailto addresses) are placeholders and will 404/bounce if clicked — replace with real `webLink`/`webUrl` values from the Graph responses once wired up.
