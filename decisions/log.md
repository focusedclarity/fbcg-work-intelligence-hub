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

### Amendment 2026-08-18 — access model switched to Dynamic View
Dynamic View is provisioned in the tenant (confirmed in the Smartsheet toolbar). CMO staff will work
a `Division = CMO` Dynamic View over the consolidated master rather than being shared to the sheet,
which gives true row-level separation instead of the compromise (a handful of shared leads + email
approvals for everyone else). The email approval/update path stays as the documented fallback. New
dependency to watch: the CMO experience now rests on a premium add-on, so the view must be tested
with a real CMO account during the cutover weekend and the add-on noted in the solutions register.

### 2026-08-18 — Contracts programme consolidated into one plan (five stages)

**Decision:** treat the CMO consolidation, the master-sheet restructure, and the contract-review
automation as **one sequenced programme**, recorded in
`projects/contracts-db-consolidation/MASTER-PLAN.md`. Stages: (1) security & truth, (2) restructure the
master, (3) merge the CMO sheet over one weekend, (4) govern, (5) automate.

**Why the order:** Smartsheet's Move matches columns by name, so the master's schema has to be final
before 379 rows arrive. Restructuring first also means ~50 dead columns are gone before the merge
rather than after, and the archive sheet can be cloned from the finished schema.

**Findings that drove it (live audit, 2026-08-18):**
- Two live PUBLIC publish links: master `Read Only - Full` ON (all 1,111 contracts + attachments,
  no login); CMO sheet `Edit by Anyone` ON (anyone with the URL can edit). Decision: turn both off.
- Four master workflows fire on every row added — one of them (`CFO`) triggers on `Row ID is Any Value`
  and requests an approval; two trigger on an attachment being added, which every migrated row
  satisfies. A 379-row Move would fire hundreds of approval requests.
- Both divisions' approval chains key off one `Status` column, so `Legal Approved` would route CMO
  catering contracts to Pastor Jenkins via `Construction Approval`. Every workflow now needs an
  explicit `Division` condition.
- The primary key rebuilds from `YEAR(TODAY())`, so every contract's ID drifts each January — which
  also breaks the `fbcgi-contract-analysis` skill's own lookup-by-ID and every summary PDF already
  filed under an older ID. Chaining will use the immutable `Row ID` instead.
- CMO contracts have had no renewal reminders: the 5/14/30/60/90 ladder lives only on the master and
  keys on a date column the CMO side kept as text.

**Supporting decisions:** dead columns exported then deleted (135 → ~105); `Value ($)` converted to a
real currency column with a `Value Notes` companion; entry QC = formula flag + a gate that blocks a row
from reaching Legal Review until it is clean; the daily Claude row review is **read-only** and reports
to a digest — nothing is written or attached to a row without per-item approval; renewal comparison
gets its own "Renewal delta review" mode so the analysis skill's independence rule stays intact.
