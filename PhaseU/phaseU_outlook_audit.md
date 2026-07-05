# Phase U — Deliverable 4: Outlook Rules & Folders Audit

**Purpose (§3e #4):** map existing inbox rules, folder structure, and categories — what they already handle, what conflicts with Sweep's `BSSI Hub/Done` / `BSSI Hub/Reference` design, and what should be retired at cutover.
**Window/source:** Gina's Primary mailbox via M365 connector.

## Connector-scope limitation (stated honestly)
The M365 connector in this session exposes **search** (mail/calendar/Teams/SharePoint) and **read-resource** by URI. It does **not** expose Outlook **inbox-rule definitions** (`MailboxSettings/messageRules`) or a **folder-tree enumeration** endpoint, and search results do not return a message's Outlook **category** assignment. So this audit reports (a) what is *inferable* from message/behavior patterns, and (b) a short **self-report checklist** for Gina to complete the three items that require the Outlook UI. This does not block the exit gate — the audit's job is to de-risk Sweep, and the checklist closes the gap in ~10 minutes.

## A. Inferred from behavior (findings)
- **No `BSSI Hub/Done` or `BSSI Hub/Reference` folders exist yet.** Nothing in the mailbox references them; Scout (Flow 0) will create them fresh, so there is **no naming collision risk** from prior BSSI structure.
- **Heavy read-through, low filing.** Across the sample, high-volume automated streams (Smartsheet inspection reports, NetSuite scheduled searches, NextProcess reports, marketing) arrive in the **Inbox** and are largely left in place (`isRead` mixed). This strongly implies **most automated mail is NOT currently rule-filed out of the Inbox** — consistent with the ~60/day Inbox load. Sweep + Reference-at-classification (Flow 8 / Flow 1) will do the filing that rules currently don't.
- **A Teams-recording / SharePoint expiry stream** exists ("Your Teams meeting recording has expired", "Finance Procurement … Meeting Recording"). Pure Reference/auto-file candidates.
- **Distribution-list membership drives volume:** Gina is on broad internal lists (`_ALLCBOSTAFF`, `#CMOStaff`, Jethro House ~30 recipients, CBO Directors meeting invites). Much of the internal 3,331 is list traffic, not direct-to-Gina action. Sorter should treat **To: a distribution list** as a mild de-prioritizer vs. **To: gthomas directly**.

## B. Conflict check against Sweep's design
| Sweep design element | Conflict found? | Note |
|---|---|---|
| Create `BSSI Hub/Done` under Primary | None | No existing folder of that name |
| Create `BSSI Hub/Reference` under Primary | None | No existing folder of that name |
| Move-on-`Done` via Message ID | **Watch** | Manual pre-cleaning happens (e.g., "cleaned agreements", deletions) → the §4 edge case (Message-ID lookup fails → write Note, don't error) is warranted; evidence of manual inbox tidying is present |
| Reference-at-classification | None | Large clear FYI/Promo tail makes this high-value |
| Shared-mailbox folders (Additional Mailboxes) | **Confirm** | See §C — shared/functional mailboxes exist; delegation must be verified before Sweep targets them |

## C. Shared / functional mailboxes observed
> **DECISION (Gina, 2026-07-03): do NOT use shared mailboxes at this time.** `Additional Mailboxes` = empty for the pilot; Sweep and Scout target Gina's Primary mailbox only. The functional addresses below are recorded for future reference (post-pilot) but are **out of scope now** — no delegation pre-check, no folder creation against them. This also removes the §6 procurement-mailbox ambiguity: procurement mailbox stays tabled.

Functional addresses observed (reference only, out of scope for pilot):
- `procurement@fbcglenarden.org` (she sends as this — Zoom statement thread) — **note:** spec §6 lists the *procurement shared mailbox as tabled by Gina*; reconcile.
- `contracts@fbcglenarden.org` (DocuSign completion thread, "marked as executed")
- `wcwc@fbcglenarden.org` / `wcwcteam@fbcglenarden.org` (Women Connecting With Christ ministry)
- `Funerals@fbcglenarden.org`, `cmo@fbcglenarden.org` (received, likely list not delegate)

## D. Self-report checklist (Gina — Outlook desktop/web, ~10 min)
Complete before Scout runs; findings freeze into the cutover plan:
1. **Rules:** Outlook → Settings → *Rules*. List each rule's name + what it moves/flags/deletes. Flag any that move contract/vendor/NetSuite/NextProcess mail into subfolders — those will **compete with Sweep** and should be disabled at cutover.
2. **Folders:** expand the Primary mailbox folder tree. List top-level folders and any that already hold "done"/"reference"/"filed" mail — decide keep vs. migrate vs. retire.
3. **Categories:** Outlook → *Categorize → Manage Categories*. List existing color categories. Sweep *clears* categories on Done/Reference; confirm none carry meaning you need to preserve (if so, exclude them from the clear step).

## E. Recommendation
Sweep is **safe to build** — no structural collisions. The only real risks are (1) pre-existing rules silently moving business mail (item D1), and (2) manual inbox cleaning breaking Message-ID lookups (already handled by the §4 edge case). Both are contained by the checklist and the graceful-failure design.
