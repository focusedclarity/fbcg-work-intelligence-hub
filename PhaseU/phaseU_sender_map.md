# Phase U — Deliverable 1: Sender Map

**Pilot user:** Gina Thomas — *Contract & Procurement Manager* (per live M365 profile), Business Services Department (BSD) / Church Business Office (CBO), First Baptist Church of Glenarden.
**Source:** Gina's Primary mailbox, Inbox folder, read live via M365 (Graph) connector.
**Window:** 2026-01-01 → 2026-07-03 (~6 months).
**Persistence note:** Findings only. Sender/domain clusters and counts are aggregates. No message bodies or bulk subject listings are stored (per §3c). Subject fragments appear only as anonymized pattern examples.

> ⚠️ **Profile discrepancy to reconcile at freeze:** the spec header calls the pilot user "Business Systems & Solutions Manager"; the live M365 profile job title is "Contract & Procurement Manager." This does not change the analysis but should be settled before onboarding card #1 (Department/Role) is frozen.

---

## A. Volume backbone (reliable counts)

**Monthly Inbox volume** (Graph `totalResultCount`, Inbox folder):

| Month | Received |
|---|---:|
| Jan 2026 | 1,925 |
| Feb 2026 | 1,422 |
| Mar 2026 | 1,885 |
| Apr 2026 | 1,732 |
| May 2026 | 1,507 |
| Jun 2026 | 1,966 |
| Jul 1–3 2026 | 302 |
| **Total (window)** | **~10,739** |

Roughly **60–65 inbound messages/day**. This is the number that matters most for the Step 0.5 credit gate and Echo's backfill sizing: **a naïve 6-month classification pass is ~10,700 AI Builder credits**, not a few hundred. The Step 0.5 one-week test must be multiplied against this, not against a 90-day assumption.

---

## B. Sender / domain clusters, ranked by volume (full window)

Counts below are reliable Graph `totalResultCount` results by sender filter. "Est. share" is against the ~10,739 total.

| Rank | Cluster | Sender pattern | Count | Est. share | Internal/External | Proposed Business Category | Proposed Digest Lane | Pillar (default) |
|---|---|---|---:|---:|---|---|---|---|
| 1 | **Internal FBCG staff** | `@fbcglenarden.org` | 3,331 | 31% | Internal | *mixed* — Reply Needed / Approval / Reporting | Action lanes + Leadership/Reporting | mixed |
| 2 | **Smartsheet automation** | `app.smartsheet.com` (`automation@`, `user@`) | 2,117 | 20% | External (system) | *mixed by content* — Contracts, Vendor, Reporting, Inspections, System Exception | mixed | mixed |
| 3 | **NextProcess** | `nextprocess.net` | 625 | 6% | External (system) | PROCUREMENT – PO/Requisition; SYSTEM | Action / System Exceptions | P5 / P3 |
| 4 | **NetSuite** | `netsuite.com` (`system@sent-via.`, `netsuite@na.`) | 298 | 3% | External (system) | SYSTEM – NetSuite; FINANCE/AP | Leadership/Reporting; System Exceptions | P3 / P2 |
| 5 | **Oracle (NetSuite impl. team)** | `oracle.com` | 222 | 2% | External (people) | SYSTEM – NetSuite (project); AI/AUTOMATION DESIGN | Action – Reply/Decision | P3 |
| 6 | **OmegaCor IT (MSP)** | `omegacorit.com` | 41 | <1% | External (people) | ACTION – System Exception; SYSTEM | System Exceptions / Workflow Breaks | P3 |
| — | **Other external** (promotions, newsletters, community, other vendors) | everything else | ~4,105 | 38% | External | PROMOTIONS/MISC; FYI/Learning; MINISTRY (see D5) | FYI + Promotions | N/A |

**Headline finding:** the two largest clusters are **internal staff mail (31%)** and **Smartsheet-generated workflow notifications (20%)**. But the single largest *band* is **"other external" (~38%)**, which is overwhelmingly promotional/subscription/community noise — see the taxonomy deliverable (§D5). Business-critical mail is a minority of raw volume; the classifier's hardest job is separating signal from a very large FYI/Promo tail.

---

## C. What each cluster carries (evidence, anonymized patterns)

- **Internal `@fbcglenarden.org` (3,331):** the true action surface. Contract sign/approve requests, vendor setup questions, requisition/funds-transfer questions, NetSuite migration threads, reporting requests from the Director, meeting accept/cancel notices, and a large ministry-community stream (see §D5). Maps to *most* action lanes — cannot be assigned a single category by sender; must be classified by content.
- **Smartsheet `app.smartsheet.com` (2,117):** the workflow transport for BSD. Carries at least five *distinct* business categories: contract intake/legal-review/approval/executed steps ("CBO/CMO Contract … Submission for Legal Review / for CMO Approval / Fully Executed"), vendor setup ("New Vendor Request … / Complete: New Vendor Request … Vendor ID VEN#####"), the **facilities inspection-report stream** ("An Inspection Report ID # …-WC-Daily was submitted"), the **CBO Master Initiative Tracker** ("ACTION REQUIRED: … provide update on this initiative"), BSD service requests, and **workflow-break exceptions** ("Something went wrong with your Data Shuttle workflow", "Not all recipients will receive … notifications"). **Do not create a "Smartsheet" category** — it is a channel, not a topic.
- **NextProcess `nextprocess.net` (625):** daily procurement operations — "Requisition Bottle Neck" daily report, "Approved PO's" report, requisition approval escalations. Mostly PROCUREMENT + some SYSTEM.
- **NetSuite `netsuite.com` (298):** scheduled search results ("ACS | Gina | Bill & Check Payments by Department – Summary"), transfer/approval requests, SuiteApp upgrade notices. FINANCE/AP + SYSTEM.
- **Oracle `oracle.com` (222):** the live NetSuite migration project — working sessions, onsite visits, journal-entry/vendor-address data issues (Maggie Alves, Pranav Kaushik, Mahesh Muzumdar, Mary Habashy). High-value P3 work, easily buried by system noise.
- **OmegaCor IT `omegacorit.com` (41):** managed IT tickets, "Waiting on Client" nudges, disk-full / password-reset tickets. Low count but high **System Exception** signal density.
- **Other external (~4,105):** promotions (restaurants, salon/spa, auctions, pizza, Evite), SaaS lifecycle/marketing (Smartsheet EAP & product, NetSuite ebooks, Notion, Loom/Atlassian, Canva, Adobe, gamma, Section AI, Mastermind/AI Advantage), church-community platforms (circle.so, Christianity Today), and food-delivery receipts. Almost all FYI/Promo.

---

## D. Onboarding-card evidence

### Card #2 — Reports To
**Rev. Lettie Carr, Esq.** — Director, Business Services Department & In-House Counsel. Strong evidence: recurring 1:1 ("one on one with Gina"), direct tasking ("Weekly updates … how many workbench items each person cleared"), coverage/hand-off during her absence, "CBO initial review process proposal." Senior leadership also in-frame: **Vincent Miller** (Sr. Director, Business Operations), **Loleta Holmes** (approver on contracts).

### Card #4 — Key Contacts (evidence-ranked)
**Internal:** Lettie Carr (director), Tomiko Hankerson (Administrative Manager), Vincent Miller (Sr. Dir. Business Operations), Yolanda Dudley, CPA (Controller), Stefanie May (contracts), Stefn/Stef Capito (building/vending ops), Rachelle Patterson (Office Manager, requisitions), Torè Girty (IT/insurance), Nina Ellis / "Nina" (AP/vendor setup), Patrick Capito (NextProcess/AP), Vincent Griggs, Stella Afolabi, Chaun Coleman (Building Manager), Jarrett Jenkins.
**External:** Oracle NetSuite team — Maggie Alves, Pranav Kaushik, Mahesh Muzumdar; NextProcess — T. McMorrow, K. Carper; OmegaCor IT — Reenah Sheikh + support desk; Isaac H. Marks, Esq. (imarkslaw — outside counsel coverage); Alex Acevedo (Smartsheet AE); Mark Evans (Connection / Microsoft licensing); Zoom receivables (Caren Dimayuga).

### Cards #1, #3, #5
Card #1 Department/Role and Card #3 Key Systems and Card #5 Trigger Words are supported here and detailed in the histogram, taxonomy, and trigger-word deliverables. All five cards are fillable with real data (exit-gate criterion #2 → **met**).
