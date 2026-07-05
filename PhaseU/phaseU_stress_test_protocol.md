# Phase U — §3f Taxonomy Stress Test: Protocol (human step)

**Why this file holds no email list:** §3f requires that message references (sender/subject/date) be presented **one at a time and "not persisted anywhere."** So the 50-message sample is drawn **live in chat** at run time, not saved here. This file is the reusable procedure + scoresheet template only.

## Procedure
1. Claude draws **~50 real messages** spanning the window, **stratified** to stress the hard cases (not a random skim): weight toward the R1–R5 hesitation points in Deliverable 5 — Smartsheet items that are really Contracts/Vendor/Inspections, NetSuite/NextProcess business-vs-system calls, Contracts-vs-Legal, internal Ministry vs BSD, and the Promo/FYI/Ministry three-way tail.
2. For each, Claude shows **sender · subject · date** only (no body persisted) and Gina picks **one Business Category + one Digest Lane** from the v4 draft.
3. Claude records **only**: chosen category, chosen lane, and a **hesitation flag** (Y/N). No content is written down.
4. **Anywhere Gina hesitates, the classifier will too** — those items become taxonomy fixes before freeze.

## Scoresheet template (fill during the run)
| # | Category chosen | Lane chosen | Hesitated? | If hesitated: why / which rule (R1–R5) |
|---|---|---|---|---|
| 1 | | | | |
| … | | | | |
| 50 | | | | |

**Scoring:** clean = classified with no hesitation and no "forced fit." Pass threshold = **≥90% clean (≥45/50)**.

## Predicted failure points (from analysis — where to expect hesitation)
- Smartsheet contract-workflow steps that also mention approval → CONTRACTS vs ACTION–Approval (guidance: lifecycle step = CONTRACTS; the *ask to approve* = Approval — decide the tie-break and record it).
- NextProcess "Requisition Bottle Neck" → PROCUREMENT vs SYSTEM vs System-Exception lane.
- Internal ministry mail from a colleague → MINISTRY vs ACTION–Reply Needed (R5 should resolve).
- Marketing that name-drops "AI" → PROMOTIONS vs AI/AUTOMATION DESIGN.

If clean < 90%, iterate Deliverables 5 (categories/rules) → re-run. Do **not** proceed to Scout with an unfrozen taxonomy (§3g).
