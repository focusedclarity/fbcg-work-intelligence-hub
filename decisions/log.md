# Decision Log

Append-only. When a meaningful decision is made, log it here.

Format: [YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...

---

[2026-08-17] DECISION: Ship Fleet, HR Monthly Metrics, and Marketing Metrics dashboards as manually-refreshed monthly static snapshots (Phase 1). | REASONING: Same proven pattern as the original Facilities Inspections build; no live feed needed to deliver value now. | CONTEXT: FBCGI Staff Hub reporting — see projects/fbcgi-staff-hub-reporting.md.

[2026-08-17] DECISION: Do NOT auto-pull marketing stats yet; treat ActiveCampaign live feed as a scoped Phase 2 build. | REASONING: ActiveCampaign is not in Lovable's connector catalog — auto-pull needs a custom API token + scheduled Supabase edge function; social/app-store numbers don't live in ActiveCampaign anyway. Asana is available but doesn't hold email/social/web analytics. | CONTEXT: Marketing team request; see projects/fbcgi-staff-hub-reporting.md §3.

[2026-08-17] DECISION: CBO division landing passcode set to `jonesje` and made non-persistent (re-locks on every navigation). | REASONING: Division-landing scope should re-prompt each visit; all other scopes stay unlocked for the browser session. | CONTEXT: NON_PERSISTENT_SCOPES in src/components/PasscodeGate.tsx.

## 2026-08-18 — Consolidate CMO Contracts Database into the master Contracts Database

**Decision:** retire the CMO Contracts Database as a working sheet and make `/CBO/Contracts Database`
the single system of record for all divisions, including CMO.

**Why:** the copy-row automation has drifted badly — 430 of the master's 611 `Division=CMO` rows have
a blank `Status` while their CMO twins (same `Created` timestamp) carry the real lifecycle value. The
CMO copy became the de facto system of record, so contract data, files and comments are split across
two sheets and staff maintain both.

**Supporting decisions:**
- Access: approval-by-email + 3-5 named CMO leads on the master, not all 20 CMO collaborators
  (master holds 500 CBO/Pastor/CFO/PGCA rows). Credentials columns leave the sheet first.
- Twin conflicts: resolved case-by-case from a reconciliation audit sheet signed off by Contracts.
- Cutover: one weekend freeze with every workflow on both sheets deactivated (a 379-row Move counts
  as rows added and would otherwise fire the master's alert/approval automations).
- The old CMO sheet is archived, never deleted — cell history does not travel with moved rows, so
  that sheet is the pre-cutover audit record.

**Record:** `projects/contracts-db-consolidation/` (PLAN.md, STEP0-INVENTORY.md, audit_pairs.py).
