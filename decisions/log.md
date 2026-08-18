# Decision Log

Append-only. When a meaningful decision is made, log it here.

Format: [YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...

---

[2026-08-17] DECISION: Ship Fleet, HR Monthly Metrics, and Marketing Metrics dashboards as manually-refreshed monthly static snapshots (Phase 1). | REASONING: Same proven pattern as the original Facilities Inspections build; no live feed needed to deliver value now. | CONTEXT: FBCGI Staff Hub reporting — see projects/fbcgi-staff-hub-reporting.md.

[2026-08-17] DECISION: Do NOT auto-pull marketing stats yet; treat ActiveCampaign live feed as a scoped Phase 2 build. | REASONING: ActiveCampaign is not in Lovable's connector catalog — auto-pull needs a custom API token + scheduled Supabase edge function; social/app-store numbers don't live in ActiveCampaign anyway. Asana is available but doesn't hold email/social/web analytics. | CONTEXT: Marketing team request; see projects/fbcgi-staff-hub-reporting.md §3.

[2026-08-17] DECISION: CBO division landing passcode set to `jonesje` and made non-persistent (re-locks on every navigation). | REASONING: Division-landing scope should re-prompt each visit; all other scopes stay unlocked for the browser session. | CONTEXT: NON_PERSISTENT_SCOPES in src/components/PasscodeGate.tsx.
