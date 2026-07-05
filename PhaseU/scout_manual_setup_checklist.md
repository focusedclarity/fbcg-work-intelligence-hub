# Manual provisioning checklist — Lists A, B, C (SharePoint UI)

Use this when Scout-as-a-flow can't run (no HTTP/OneDrive connector). Create everything once by hand on the target site; then build the operational flows (they only need SharePoint list-item actions, which are supported).

**General steps for each list:** Site → **New → List → Blank list** → name it → **Settings (gear) → List settings** for column work, or **+ Add column** in the list view. Rename the Title column: List settings → click **Title** → change name.

**Column type mapping (modern UI):** Single line of text = Text · Multiple lines of text (plain) = Note · Date and time = DateTime · Choice = Choice · Number = Number · Yes/No = Boolean · Hyperlink = URL · **Calculated** = *Add column → More… → "Calculated (calculation based on other columns)"* (classic dialog).

**Calculated-column caveat:** `Days Since Received` uses `TODAY()`, which SharePoint only recomputes when an item is edited — it will look stale between edits. That's expected; **Watchdog computes real aging in its daily flow.** Keep the column for display only.

---

## LIST A — "Inbox Action Register"  (rename Title → **Email Subject**)

| Column | Type | Settings |
|---|---|---|
| Received Date | Date and time | include time; required |
| Sender | Single line of text | |
| Sender Domain | Single line of text | |
| Recipient Scope | Choice | Direct to Me; CC; Distribution List · no fill-in |
| Mailbox Source | Choice | Primary · allow fill-in · default Primary |
| Source System | Choice | Smartsheet; NetSuite; NextProcess; Oracle; ADP; DocuSign; Microsoft 365 / Teams; Zoom; Amazon Business; Canva; OmegaCor IT; Internal Email; External Email; Other · allow fill-in |
| Business Category | Choice (no fill-in) | CONTRACTS – Intake / Review; PROCUREMENT – PO / Requisition; VENDOR – Setup / Master Data; FINANCE / AP – Check Request; SYSTEM – NetSuite / NextProcess; AI / AUTOMATION DESIGN; REPORTING – CBO / Leadership; TRAINING / SOP / ENABLEMENT; ACTION – System Exception; ACTION – Reply Needed; ACTION – Approval / Decision; WAITING – Someone Else; BLOCKED – Needs Escalation; LEGAL / POLICY / COMPLIANCE; FYI – Reference / Learning; PROMOTIONS / SUBSCRIPTIONS / MISC; MINISTRY / CHURCH-COMMUNITY (non-BSD); FACILITIES – Inspection Reports  ⚠️ use the en-dash "–", not a hyphen |
| Digest Lane | Choice (no fill-in) | System Exceptions / Workflow Breaks; Action Required; Waiting On Others; Leadership / Reporting; Ministry / Community; FYI / Learning Reference; Promotions / Subscriptions / Misc |
| Pillar | Choice (no fill-in) | P1; P2; P3; P4; P5; P6; Ops/Admin; N/A |
| Action Owner | Choice (no fill-in) | Me; Someone Else; None |
| Owner | Single line of text | |
| Waiting On | Single line of text | |
| Priority | Choice (no fill-in) | Critical; High; Normal; Low · default Normal |
| Status | Choice (no fill-in) | New; In Progress; Waiting; Blocked; Snoozed; Done; Reference · default New |
| Due Date Stated | Date and time | date only |
| Follow-Up Date | Date and time | date only |
| Last Status Change | Date and time | include time |
| Days Since Received | **Calculated** | Formula: `=TODAY()-[Received Date]` · result type **Number**, 0 decimals |
| Reviewed | Choice (no fill-in) | Yes; No · default No |
| Suggested Flag | Choice (no fill-in) | Today; This Week; Next Week; None · default None |
| Draft Status | Choice (no fill-in) | None; Draft Ready; Approved to Send; Sent · default None |
| Confidence | Number | 0 decimals; min 0; max 100 |
| Confidence Band | **Calculated** | Formula: `=IF([Confidence]>=85,"High",IF([Confidence]>=60,"Medium","Low"))` · result type **Text** |
| Trigger Words Hit | Multiple lines of text | plain text |
| Source Link / Message ID | Single line of text | |
| Web Link | Hyperlink | |
| Has Attachments | Yes/No | default No |
| Pillar Rationale | Multiple lines of text | plain text |
| Classified Date | Date and time | include time |
| Notes | Multiple lines of text | plain text |

> Create **Received Date** and **Confidence** *before* their calculated columns (Days Since Received / Confidence Band), or the formula won't find them.

**List A views** (List → **All Items ▸ → Create new view**, or Save-as after filtering):
- **Open Actions** — filter Status ≠ Done AND ≠ Reference; sort Priority.
- **Overdue** — filter Follow-Up Date ≤ [Today] AND Status ≠ Done/Reference.
- **Needs Review** — filter Reviewed = No.
- **Drafts Awaiting Approval** — filter Draft Status = Draft Ready.
- **By Mailbox Source** — group by Mailbox Source.
- **By Lane** — group by Digest Lane.
- **Dead-Letter** — filter Status = Blocked.
- **Stale — Review to Close** — filter Reviewed = No AND Status ≠ Done/Reference; sort Last Status Change (oldest first).

---

## LIST B — "Subscription Register"  (rename Title → **Sender Domain**)

| Column | Type | Settings |
|---|---|---|
| Sender Name | Single line of text | |
| Sender Email | Single line of text | |
| Subscription Type | Choice (no fill-in) | Promotion; Newsletter; FYI / Reference; Vendor Marketing; System Notification; Unknown · default Unknown |
| First Seen | Date and time | include time |
| Last Seen | Date and time | include time |
| Message Count | Number | 0 decimals; min 0 |
| Status | Choice (no fill-in) | Active; Unsubscribe Candidate; Unsubscribed; Keep · default Active |
| Pillar | Choice (no fill-in) | P1; P2; P3; P4; P5; P6; Ops/Admin; N/A · default N/A |
| Notes | Multiple lines of text | plain text |
| Last Status Change | Date and time | include time |

**Views:** All Subscriptions (sort Message Count desc) · Unsubscribe Candidates (Status = Unsubscribe Candidate) · By Type (group Subscription Type) · Noisiest Senders (sort Message Count desc).

---

## LIST C — "User Profile Register"  (rename Title → **Display Name**)

| Column | Type | Settings |
|---|---|---|
| UPN / Email | Single line of text | required |
| OneDrive URL | Hyperlink | (cache/display only) |
| Schema Version | Single line of text | default v4 |
| Onboarding Date | Date and time | date only |
| Onboarding Complete | Yes/No | default No — **this is the activation gate** |
| Department | Single line of text | pilot: Business Services Department |
| Reports To | Single line of text | pilot: Rev. Lettie Carr, Esq. |
| Key Systems | Multiple lines of text | pilot: Smartsheet, NetSuite (Oracle), NextProcess, ADP, DocuSign, M365/Teams, Zoom, Amazon Business, Canva |
| Key Contacts | Multiple lines of text | pilot: from Deliverable 1 sender map |
| Priority Trigger Words | Multiple lines of text | pilot: from Deliverable 3 |
| Additional Mailboxes | Multiple lines of text | pilot: leave empty |
| Digest Channel | Choice (no fill-in) | Teams; Email; Both · default Teams |
| Digest Time | Choice (allow fill-in) | 7:00 AM; 8:00 AM; 9:00 AM; 12:00 PM; 5:00 PM |
| Business-Hours Start | Single line of text | default 9:00 AM |
| Business-Hours End | Single line of text | default 5:00 PM |
| Notes | Multiple lines of text | plain text |

**Views:** All Profiles · Active Instances (Onboarding Complete = Yes) · Incomplete Onboarding (= No) · Schema Drift Check (group Schema Version).

**Last:** add your own row to List C with the pilot values above, then flip **Onboarding Complete = Yes** — that's the switch the operational flows check.
