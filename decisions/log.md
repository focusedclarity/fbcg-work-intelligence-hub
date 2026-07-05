# Decision Log

Append-only. When a meaningful decision is made, log it here.

Format: [YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...

---

[2026-07-05] DECISION: Add same-business-day response sub-window to Tempo for High/Direct-to-Me items, keeping the existing 2-business-day resolution target. | REASONING: HANDOFF.md's Finalization-decisions text promised same-day response for this tier but the actual build spec (`tempo_watchdog_listB_build.md` §1a) only had a single 2-day number — a real inconsistency found during playbook review. | CONTEXT: `PhaseU/items_1-6_review_and_challenge.md`, item 3.

[2026-07-05] DECISION: Fold the Buyback-gate signal (List B / Subscription Register) directly into Sweep instead of building a standalone list. | REASONING: List B's upsert logic carried a flagged expression-dependency risk and only tracked subscription metadata; Herk's simpler "mark as read, no persistent register" pattern gets ~90% of the value with none of the build risk. | CONTEXT: `PhaseU/items_1-6_review_and_challenge.md`, item 4. Sweep's build spec is now unblocked and is the next concrete deliverable.

[2026-07-05] DECISION: Keep Watchdog's "stale" threshold at 30 calendar days (not tightening to Meisel's 2-week convention). | REASONING: internal business action items legitimately sit longer than a personal inbox would tolerate, and the threshold only flags for review, not deletion. | CONTEXT: `PhaseU/items_1-6_review_and_challenge.md`, item 5.

[2026-07-05] DECISION: Dashboard placement = Power Apps app as a Teams tab, extending the existing Watchdog/Sorter Teams feed as the "live" layer; explicitly ruled out Power BI (embedded report or streaming dataset). | REASONING: matches where Gina already works (Teams), avoids building new real-time infrastructure the pilot's data volume doesn't justify. | CONTEXT: `PhaseU/items_1-6_review_and_challenge.md`, dashboard section.

[2026-07-05] DECISION: Rollout model = one shared Power App now, with per-user views (via List C profile lookup on signed-in user's email) — not a separate app copy per client. Multi-client templating (Power Platform Solution + environment variables) is scaffolded in docs but deferred ("template client later"). | REASONING: internal org rollout doesn't need data isolation yet; List C's schema/onboarding-gate design already anticipated multi-instance use. | CONTEXT: `PhaseU/power_app_mvp_plan_and_prompt.md`.

[2026-07-05] DECISION: For connecting live data, chose the Power Apps native-connector route over building custom Microsoft Graph/MSAL.js auth into the static HTML dashboard. | REASONING: no Azure AD app registration exists, Power Apps connectors reuse the existing M365 sign-in with no custom auth code or client secrets, and it's the buildable/testable path since this Claude Code session has no browser/Power Platform access. | CONTEXT: `PhaseU/power_app_mvp_plan_and_prompt.md` §5 has the paste-ready Power Fx formulas (KPI counts, Register filter switch, Approvals patch, Settings lookup/save).
