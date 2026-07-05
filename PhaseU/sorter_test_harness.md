# Sorter (Flow 1) — Classifier Test Harness

**Purpose:** Verify the classifier "brain" (the AI prompt step + instructions) produces correct outputs
BEFORE trusting the real Sorter's SharePoint Create-item wiring. Runs in the restricted workflow agent
(no Compose/variables/HTTP — Approvals / Outlook / Planner / SharePoint list-item / Teams / AI-prompt only).
**Related:** `sorter_classifier_prompt.md` (instructions), `sorter_output_mapping.md` (real mapping), `phaseU_taxonomy_v4.md` (FROZEN).

---

## Build request (paste into the workflow agent)

The agent only accepts build/modify-a-workflow requests, so the test is framed as a throwaway test flow:

```
Create a new manual test workflow called "Sorter – Classifier Test".

Trigger: Manually trigger a flow (button), with 6 text inputs — Subject, From, To, Cc, ReceivedTime, Body.

Step 1 — AI prompt step "Classify Email (Test)": reuse the same classifier instructions as my Sorter flow, and feed it the six trigger inputs (Subject, From, To, Cc, ReceivedTime, Body). Return the 13 named outputs: businessCategory, digestLane, sourceSystem, pillar, actionOwner, owner, priority, status, dueDateStated, reviewed, recipientScope, confidence, triggerWordsHit.

Step 2 — Since Compose isn't available, add a step that posts the 13 outputs to me as a Teams chat message (or an Outlook email to gthomas@fbcglenarden.org) formatted as one line per field.

Do NOT create a SharePoint item in this test flow — this is only to verify the classifier outputs before wiring the real Sorter.
```

**If the agent balks at the output step:** tell it to use "Post message in a chat or channel" (Teams) or
"Send an email (V2)" (Outlook) — both are inside the allowed connector set.

---

## Test inputs — type these into the button flow, one run per email

### EMAIL 1
- **Subject:** CBO Contract for Xerox Managed Print MSA – Submission for Legal Review
- **From:** automation@smartsheet.com (CBO Contract Workflow)
- **To:** gthomas@fbcglenarden.org
- **Cc:** *(blank)*
- **ReceivedTime:** 2026-07-04 09:12
- **Body:** A new contract has been submitted through the CBO workflow and requires your initial review before it routes to Legal. Vendor: Xerox. Type: Managed Print MSA. Please complete your review by 07/10/2026.

### EMAIL 2
- **Subject:** An Inspection Report ID # 07/04/26-WC-Daily was submitted
- **From:** automation@smartsheet.com (Facilities Inspections)
- **To:** gthomas@fbcglenarden.org
- **Cc:** *(blank)*
- **ReceivedTime:** 2026-07-04 06:00
- **Body:** This is an automated notification. Inspection Report ID # 07/04/26-WC-Daily has been submitted. View the submission in Smartsheet.

### EMAIL 3
- **Subject:** Gina, your weekend treat: 2 entrees for $25!
- **From:** offers@olivegarden.com
- **To:** gthomas@fbcglenarden.org
- **Cc:** *(blank)*
- **ReceivedTime:** 2026-07-03 17:45
- **Body:** This weekend only — bring a friend and enjoy 2 classic entrees for $25. Plus unlimited breadsticks. Find a location near you. Unsubscribe anytime.

### EMAIL 4
- **Subject:** Quick question on vendor setup turnaround
- **From:** dhaley@fbcglenarden.org (Dr. Haley)
- **To:** gthomas@fbcglenarden.org
- **Cc:** *(blank)*
- **ReceivedTime:** 2026-07-03 14:20
- **Body:** Gina — what's the typical turnaround for setting up a new vendor in NetSuite once the form is submitted? I need to give the ministry a timeframe. Thanks.

### EMAIL 5
- **Subject:** Staples orders not syncing from NextProcess since 07/02
- **From:** notifications@nextprocess.com
- **To:** apteam@fbcglenarden.org
- **Cc:** gthomas@fbcglenarden.org
- **ReceivedTime:** 2026-07-03 11:05
- **Body:** We've detected that purchase orders submitted to Staples have not appeared in their system since 07/02. This may require an integration review on the NextProcess side.

---

## Answer key — grade the returned outputs against this

| # | Email | Category | Lane | Source | Action Owner | Priority | Reviewed | recipientScope | Key rule(s) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Xerox contract | CONTRACTS – Intake / Review | Action Required | Smartsheet | Me | High | Yes | Direct to Me | R1, R3; dueDateStated = 2026-07-10 |
| 2 | Inspection report | FACILITIES – Inspection Reports | FYI / Learning Reference | Smartsheet | None | Low | Yes | Direct to Me | Anti-trigger; status = Reference |
| 3 | Olive Garden promo | PROMOTIONS / SUBSCRIPTIONS / MISC | Promotions / Subscriptions / Misc | External Email | None | Low | Yes | Direct to Me | R9 (consumer marketing, not Learning) |
| 4 | Dr. Haley question | ACTION – Reply Needed | Action Required | Internal Email | Me | Normal | Yes | Direct to Me | R8 (short answer, not Design) |
| 5 | Staples not syncing | ACTION – System Exception | Action Required | NextProcess | Me | High | **No** | **CC** | R2/R7 integration break + Needs-Review; Gina cc'd, To = DL |

**What each email probes:**
- #1 — R1 (platform ≠ category) + due-date extraction
- #2 — anti-trigger suppression to FYI/Reference
- #3 — R9 promo-vs-learning split
- #4 — R8 (reply vs design) + recipientScope = Direct to Me
- #5 — the hard one: Needs-Review (Reviewed = No) AND recipientScope = CC (cc'd on a DL-addressed system alert). If it returns Reviewed = Yes or recipientScope = Direct to Me, tighten the prompt.

**#1 en-dash check:** if the returned businessCategory shows a hyphen ("CONTRACTS - Intake") instead of the
en-dash ("CONTRACTS – Intake"), that's the failure that will break the real Sorter's Create item — fix at the prompt.
