# Phase U — Deliverable 3: Trigger-Word Candidate List

Feeds **onboarding card #5 (Priority Trigger Words)** and **Sorter's (Flow 1) priority-scoring prompt**.
Drawn from recurring subject-line patterns across the window; confirmed against message content during analysis but reported here as findings only (anonymized patterns, no bulk listings).
**Window:** 2026-01-01 → 2026-07-03.

## A. Priority-escalation words (push toward Critical/High)
These reliably co-occur with genuinely time-sensitive items in Gina's mail:

| Trigger phrase | Where it appears | Suggested effect |
|---|---|---|
| `ACTION REQUIRED` | CBO Master Initiative Tracker; contract-for-signature | High; often Approval/Decision or Reporting |
| `Action Needed` / `Action Requested` | Vendor setup; intake-form access | High |
| `Immediate Attention Required` | Requisition approval escalations | Critical |
| `Urgent` / `Past Due` | Vendor/AP balance disputes (e.g. OmegaCor) | Critical; often BLOCKED |
| `Escalation` / `Bottle Neck` | NextProcess requisition daily report | High; PROCUREMENT / System Exception |
| `Requires your review` / `for Legal Review` / `for CMO Approval` | Smartsheet contract workflow | High; CONTRACTS / Approval |
| `Renew By` / `Expiration` / `Less Than - 90/60/30 Days` | Contract renewal notifications | High; CONTRACTS – time-boxed |
| `Fraudulent` / `phishing` / `disregard or delete` | IT security alerts | **Refined (stress test):** a *broadcast* awareness alert ("disregard/delete") → **FYI**, not auto-Critical. Treat as Critical/security only when it targets an account/system Gina owns. |

## B. System-exception signatures (route to System Exceptions / Workflow Breaks lane — §1a forces ≥1 business-day)
These are the **highest-value, lowest-volume** patterns. They are the exact class that "sat three days with nothing resurfacing them" (spec §1). Sorter should hard-route these to the exception lane regardless of the polite tone of the sender:

- `Something went wrong with your … Data Shuttle workflow` (Smartsheet automation failing silently)
- `Not all recipients will receive … notifications` (Smartsheet automation permission/sharing break)
- `IP Validation Failure` (ADP time-application access denied)
- `has been in a status of "Waiting on Client"` (OmegaCor ticket aging)
- `C: Drive has … % Used` / disk-full ticket (OmegaCor infra alert)
- `VENDOR NOT IN NETSUITE` (master-data gap embedded in a contract/renewal notice — the same failure class as the spec's "Vendor ID lookup failure")

## C. Waiting / dependency signals (route to Waiting On Others; clock from Last Status Change per §1a)
- `Waiting on Client`, `pending your response`, `following up on`, `as needed`, out-of-office / `Automatic reply:` auto-responses (signal a dependency stall, not an action).

## D. Anti-triggers / de-prioritizers (suppress — do NOT let these inflate action lanes)
High-frequency phrases that look actionable but are almost always FYI/auto-file:
- `An Inspection Report ID # …-WC/MC/CL-Daily/Weekly was submitted` (facilities inspection stream — very high volume, near-zero Gina action)
- `Accepted:` / `Declined:` / `Canceled:` (meeting responses)
- `has been visited` / `Meeting assets … are ready` / `recording has expired` (collaboration-tool noise)
- `A new customer signed up` (VHX/streaming platform noise)
- `Get started with your … trial`, `EAP Insights`, `Newsletter`, `Replay`, `ICYMI`, `Happy [Holiday]` (marketing/promo)

## E. Notes for the classifier prompt
1. **Sender ≠ priority.** Smartsheet/NetSuite/NextProcess send *both* Critical exceptions and pure noise from the same address — priority must come from subject/content, not domain.
2. **`ACTION REQUIRED` is overloaded.** The Master Initiative Tracker fires it weekly on low-urgency status-update nudges; don't let it auto-Critical. Combine with lane + due-date context.
3. **Facilities inspection reports** are the biggest anti-trigger by volume — an explicit suppression rule here is the single highest-leverage precision fix.
