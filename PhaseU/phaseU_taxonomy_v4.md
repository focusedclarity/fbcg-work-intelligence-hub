# Phase U — Deliverable 5: Revised Taxonomy v4

**Status: ✅ FROZEN — 2026-07-03.** Validated by the §3f stress test: a first 50 surfaced the rule gaps (R1/R6/R7/R8), and a **fresh, non-overlapping 50 cleared the gate at 45/50 = 90%** with R9/R10 folded in. This is now the **authoritative input** to Scout's column-definition JSON (`businessCategory`, `Digest Lane`, `Source System`) and Sorter's classifier prompt (§3h). Exit-gate criteria #1 and #3 met.
**Basis:** ~10,739 messages (Jan 1 – Jul 3 2026), reliable sender-cluster counts + ~175-message cross-section. **Persistence:** findings only.

---

## 1. Revised Business Category list (recommended)

Legend for change: **KEEP** / **KEEP+CLARIFY** / **MERGE** / **NEW** / **RENAME**.

| # | Business Category | Change | One-line justification (with evidence) |
|---|---|---|---|
| 1 | CONTRACTS – Intake / Review | KEEP | High volume via Smartsheet contract workflow + internal; core of role. |
| 2 | PROCUREMENT – PO / Requisition | KEEP | NextProcess (625) + requisition escalations; distinct from contracts. |
| 3 | VENDOR – Setup / Master Data | KEEP | "New Vendor Request / Complete … Vendor ID VEN#####" is a steady discrete workflow (~300 est.). |
| 4 | FINANCE / AP – Check Request | KEEP+CLARIFY | Real but smaller (~200); clarify boundary vs SYSTEM (see rule R2). |
| 5 | SYSTEM – NetSuite / NextProcess | KEEP+CLARIFY | NetSuite(298)+NextProcess(625) system output; must not swallow PROC/FINANCE (rule R2). |
| 6 | ~~SMARTSHEET – Automation / Support~~ | **MERGE / RETIRE as a business category** | **Smartsheet is a transport, not a topic.** It carries 2,117 msgs spanning Contracts/Vendor/Inspections/Reporting/Exceptions. Keeping it as a category guarantees mis-classification. Move genuine platform-admin/support items to AI/AUTOMATION DESIGN or ACTION–System Exception; classify everything else by content. |
| 7 | AI / AUTOMATION DESIGN | KEEP (thin) | Genuine design work is small (~60); most "AI" mail is vendor marketing → FYI/Promo. Keep for the real Smartsheet/NetSuite/Copilot build threads. |
| 8 | REPORTING – CBO / Leadership | KEEP | Initiative Tracker, CBO Digest, Director's Monthly Report, "Weekly updates" (~650). |
| 9 | TRAINING / SOP / ENABLEMENT | KEEP | CMO cross-training, NextProcess/NetSuite training, benefits sessions (~90). |
| 10 | ACTION – System Exception | KEEP (high value) | Data Shuttle failures, workflow breaks, IP-validation, IT tickets (~180). The lane the whole spec exists to catch. |
| 11 | ACTION – Reply Needed | KEEP | Large internal share (~550). |
| 12 | ACTION – Approval / Decision | KEEP | Contract/transfer/requisition/Adobe approvals (~450). |
| 13 | WAITING – Someone Else | KEEP | Present but low (~50); clock from Last Status Change (§1a). |
| 14 | BLOCKED – Needs Escalation | KEEP | Rare (~20) but highest severity (e.g., "VENDOR NOT IN NETSUITE", past-due disputes). |
| 15 | LEGAL / POLICY / COMPLIANCE | KEEP+CLARIFY | Overlaps CONTRACTS heavily (contracts route through Lettie, Esq./in-house counsel); keep but add tie-break rule R3. |
| 16 | FYI – Reference / Learning | KEEP | Largest single tail (~3,000). |
| 17 | **PROMOTIONS / SUBSCRIPTIONS / MISC** | **NEW as first-class category** | ~1,500 pure marketing/subscription msgs. Currently only a *lane*; promoting to a category lets Sorter/Sweep auto-Reference it at classification time and keeps it out of FYI's "might-read" bucket. |
| 18 | **MINISTRY / CHURCH-COMMUNITY (non-BSD)** | **NEW** | ~1,200 msgs: WCWC, Jethro House, Pastor's Staff Meeting, CMO newsletters, Funerals, Prayer Wall/circle.so, benevolence. Large, real, and **currently unhoused** — forced into FYI or Reply Needed today, which pollutes both. A distinct category (with its own low-touch lane) is the single biggest structural fix. |
| 19 | **FACILITIES – Inspection Reports** | **NEW (low-priority/FYI sub-stream)** | ~700 auto-generated WC/MC/CL daily+weekly inspection submissions with near-zero Gina action. Splitting them out of the Smartsheet blob stops them inflating action lanes; route straight to Reference. |

**Net:** 16 → **18** categories: retire 1 (SMARTSHEET), add 3 (PROMOTIONS/MISC promoted from lane to category, MINISTRY, FACILITIES-Inspections). AI/AUTOMATION DESIGN was already present (kept, thin). All others kept, several with clarifying rules.

## 2. Revised Digest Lane list (recommended)

| Digest Lane | Change | Justification |
|---|---|---|
| System Exceptions / Workflow Breaks | KEEP | High-value; strong signature set (Deliverable 3B). |
| Waiting On Others | KEEP | Low volume, needs Last-Status-Change clock. |
| Leadership / Reporting | KEEP | ~650. |
| FYI / Learning Reference | KEEP | Split promo out of it (below). |
| Promotions / Subscriptions / Misc | KEEP → align with new category #17 | Make lane and category 1:1 so auto-Reference is unambiguous. |
| Action lanes (Reply / Approval / Contracts / Vendor / Procurement) | KEEP | The buyback numerator. |
| **Ministry / Community** | **NEW lane** | Pairs with category #18; low-touch, weekly-digest-only, never action-clocked. Keeps ministry mail from tripping follow-up rules. |

## 3. Classifier disambiguation rules (the hesitation-point fixes)
These are the points where a human reader (and therefore the classifier) will hesitate; bake them into Sorter's prompt:

- **R1 — Platform ≠ category. [CONFIRMED by Gina 2026-07-03, decided via stress test]** Never classify by sender domain. The originating platform (Smartsheet / NetSuite / NextProcess) goes in the **`Source System` field**, NOT the Business Category. Category = business intent in subject/body. *Evidence this rule is essential: in the §3f stress test Gina's unguided default was platform-first ("anything from Smartsheet = C6", NextProcess/NetSuite = C5) — the exact collapse that would blind Watchdog/Tempo/Dash. This rule must appear verbatim near the top of Sorter's classifier prompt and in the onboarding brief, because the human default fights it.*
- **R2 — System-output tie-break.** A NetSuite/NextProcess message is `SYSTEM – NetSuite/NextProcess` only when it's about the *system itself* (upgrade notice, job failure, config). If it's a *business transaction* the system happens to carry, use the transaction category: requisition/PO → PROCUREMENT; bill/check → FINANCE/AP; vendor record → VENDOR.
- **R3 — Contracts vs Legal.** Default contract lifecycle steps (submit / initial review / approve / execute / renew-by) → CONTRACTS. Use LEGAL/POLICY/COMPLIANCE only for genuine legal-counsel questions, policy, compliance, or outside-counsel (imarkslaw) threads.
- **R4 — Direct vs list.** `To:` Gina directly outranks `To:` a distribution list for priority.
- **R5 — Ministry routing [REFINED, confirmed 2026-07-03].** Reserve **MINISTRY / Church-Community** for ministries Gina *actively works* (e.g., WCWC — member reports, class materials). **Broadcast** church-community info (Upcoming Funerals, CBO Digest devotionals, Jethro House updates she doesn't own) → **FYI** (or Reply Needed if she owes a response). Evidence: stress test — WCWC report → Ministry, but Funerals/Digest → FYI.
- **R6 — Owner vs informed [NEW, confirmed 2026-07-03]. (Single richest stress-test finding.)** For every item, determine whether Gina **owns the next action** or is merely **cc'd/informed**. Set the `Owner` field accordingly. If she does **not** own the next step, route to the **FYI / Reference lane regardless of business content** (keep the content category + Source System for reporting, but do not put it in an action lane or start a follow-up clock). Evidence: items where identical content flipped to "FYI-for-me" because she was copied (past-due threads, vendor-status completions, forwarded process explainers, coverage arrangements).
- **R7 — Finance / System / Contract tie-break [NEW, confirmed 2026-07-03].** For NetSuite / NextProcess / Oracle **money items**: a *transaction* (journal entry, bill/check, transfer, past-due, invoice) → **FINANCE / AP** (or the specific transaction category), with Source System capturing the platform. Use **SYSTEM – NetSuite/NextProcess** only for notices about the platform itself (upgrade/config/integration/break). Use **AI / AUTOMATION DESIGN** only when the item is about *designing or acquiring* capability (e.g., "which module do we need to automate invoice capture", process-redesign proposals). Evidence: Truist journal-entry thread and Bill-Capture-module thread both blurred Finance/System/Design.
- **R8 — Process-request rule [NEW, confirmed 2026-07-03].** A request to **build or revisit a process/form/automation** → **AI / AUTOMATION DESIGN** (e.g., "can we build a benevolence form like the vendor form", "revisit the funds-transfer process in NetSuite"). A request that only needs a **scheduling/short answer** → **ACTION – Reply Needed**.
- **R9 — Learning vs Promotions [NEW, confirmed 2026-07-03 fresh-50].** **Educational / how-to / AI-learning** content Gina wants to skim or get a summary of → **FYI – Reference/Learning** (e.g., Learning Tube replays, Claude/NotebookLM sessions, professional newsletters). Reserve **PROMOTIONS / SUBSCRIPTIONS / MISC** for **transactional/consumer/vendor marketing** (restaurants, salon, streaming sign-ups, food-delivery receipts, product trials). When in doubt between the two, prefer FYI/Learning.
- **R10 — IT-support / equipment ownership [NEW, confirmed 2026-07-03 fresh-50].** Routine **IT-support tickets and equipment-request *automations/notifications*** → **FYI** (Gina does not act on IT support tickets). BUT a **named person's equipment/access request awaiting Gina's fulfillment or decision** → **ACTION** (Procurement or Approval). The discriminator is R6: does Gina own the next step for a *specific* person, or is she just on the system/ticket copy list.
- **Needs-Review disposition [confirmed 2026-07-03 fresh-50].** When action-vs-FYI is genuinely ambiguous (e.g., a system/integration notice that *might* require Gina), do **not** force-sort — set **`Reviewed = No`** and surface in the **"Stale — Review to Close" / Needs Review** view until a human confirms. Ambiguity is a valid, explicit state, not a misclassification.

## 4. Zero / near-zero traffic (merge candidates)
- **SMARTSHEET – Automation / Support** — zero *legitimate standalone* traffic once content-classified (its apparent volume is other categories in disguise). → retired (see #6).
- **AI / AUTOMATION DESIGN** — near-zero genuine (~60); mostly vendor marketing that belongs in PROMOTIONS. Kept small, but watch at 90-day review; candidate to fold into REPORTING or a "Projects" category if it stays thin.
- **WAITING – Someone Else** (~50) and **BLOCKED – Needs Escalation** (~20) are low-count but **must be kept** — they are low-volume/high-consequence, exactly the items the follow-up rules (§1) exist for. Low count ≠ merge here.

## 5. Clusters that fit no existing category (split / new candidates)
1. **Ministry / church-community** (~1,200) → **NEW category #18** (biggest gap).
2. **Pure promotions/subscriptions** (~1,500) → **promote to first-class category #17**.
3. **Facilities inspection reports** (~700) → **NEW low-priority sub-stream #19**.
4. **Collaboration-tool notifications** (meeting accepted/canceled, recording expired/ready, "has been visited") → route to Reference under FYI; no new category needed, but add to Deliverable 3D anti-triggers.

## 6. Freeze checklist (do NOT mark final until all true)
- [x] §3f stress test (exit-gate #1): first 50 = **40/48 = 83%** (surfaced rule gaps) → R1/R5–R8 added → **fresh non-overlapping 50 = 45/50 = 90%** (gate met). Residual 5 → R9/R10 + Needs-Review disposition.
- [x] Gina confirmed the 4 category changes (retire SMARTSHEET; add PROMOTIONS/MISC, MINISTRY, FACILITIES-Inspections) and the new Ministry/Community lane (2026-07-03).
- [x] R1–R10 disambiguation rules accepted into Sorter's prompt (2026-07-03); **R1 (platform≠category, use Source System)** must appear at the top of the prompt — the human default fights it.
- [x] Role/title resolved for card #1 → **Business Systems & Solutions Manager** (Gina confirmed 2026-07-03; M365 profile to be updated later).
- [ ] On freeze: this list becomes the source for Scout's `businessCategory` + `Digest Lane` JSON and Sorter's classifier categories (§3h).
