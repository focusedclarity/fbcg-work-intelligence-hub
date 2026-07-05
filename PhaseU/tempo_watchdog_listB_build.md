# Tempo (5a) · List B Upsert (Flow 2) · Watchdog (6) — Build Spec for the Restricted Agent

**Agent limits:** Approvals, Outlook, Planner, SharePoint list-item, Teams, AI-prompt only. NO Compose/variables/HTTP/OneDrive.
**Strategy:** offload all date math to **AI prompt steps** (fed the row's dates + the trigger timestamp) so we don't need
expressions. Only List B's counter increment uses one inline expression (flagged).
**Rules source:** Automation Spec v4 §1a (follow-up windows) and §1b (escalation). List A/B columns per `scout_manual_setup_checklist.md`.

---

## §1a follow-up windows (Tempo) and §1b thresholds (Watchdog) — reference

**§1a windows** (base date = Received Date, EXCEPT Waiting On Others = Last Status Change):
- Critical → 1 business day · High → 2 · Normal → 5 · Low → 10
- Digest Lane = System Exceptions / Workflow Breaks → **1 business day minimum, overrides priority**
- Digest Lane = Waiting On Others → 5 business days **from Last Status Change**
- Digest Lane = Leadership / Reporting → none unless Due Date Stated
- Digest Lane = FYI / Learning Reference or Promotions / Subscriptions / Misc → none
- **Due Date Stated present → it wins; Follow-Up Date = Due Date Stated.**

**§1b escalation:**
1. Status = Blocked AND past its follow-up window → Priority=Critical, Suggested Flag=Today, Teams alert to Owner.
2. Digest Lane = System Exceptions AND unresolved > 2 business days → same escalation.
3. Digest Lane = Waiting On Others AND no Last Status Change 5+ business days → queue a nudge draft (Draft Status=Draft Ready; nothing sends without Approved to Send).
4. Any open item (not Done/Reference) with Last Status Change > 30 calendar days → Reviewed=No; surfaces in "Stale — Review to Close".
5. Draft Status = Sent → Status=Done, stamp Last Status Change. (Courier normally does this; Watchdog is the backstop.)

---

## ⚠ TRIGGER CONSTRAINT (confirmed 2026-07-04)
The agent has **NO SharePoint item-created/modified trigger.** Supported: Recurrence, Manual, Office 365 email/calendar.
So Tempo, List B upsert, Sweep, and Courier are all built as **Recurrence flows that poll List A with Get items + Filter Query.**
Only Sorter has a real event trigger (new email). Latency = the recurrence interval (fine for follow-up dates / daily sweeps).

## FLOW 5a — TEMPO  (Recurrence, hourly)

**Trigger:** Recurrence — every 1 hour.
**Get items:** `Inbox Action Register`, Filter Query:
`FollowUpDate eq null and Status ne 'Done' and Status ne 'Reference' and DigestLane ne 'FYI / Learning Reference' and DigestLane ne 'Promotions / Subscriptions / Misc' and DigestLane ne 'Leadership / Reporting'`
(Fallback if the agent rejects the long filter: use `FollowUpDate eq null` only — the AI step returns empty for the excluded lanes anyway, at the cost of a few wasted calls.)
**Apply to each** returned item — branch on Due Date Stated:
- Due Date Stated **is not empty** → Update item: Follow-Up Date = Due Date Stated. End.
- Else → run the AI step below, then Update item.

**AI step "Tempo – Compute Follow-Up":**
- Inputs: Priority, Digest Lane, Received Date, Last Status Change.
- Instruction: *"Given §1a, return followUpDate as an ISO date (YYYY-MM-DD) = base date + N business days (skip Sat/Sun). Base = Last Status Change if Digest Lane is 'Waiting On Others' else Received Date. N: Critical=1, High=2, Normal=5, Low=10. If Digest Lane is 'System Exceptions / Workflow Breaks', N=1 regardless of priority. If Digest Lane is 'Leadership / Reporting', 'FYI / Learning Reference', or 'Promotions / Subscriptions / Misc', return empty. Return only the date or empty."*
- Output: `followUpDate` (text).
- Condition: if `followUpDate` is not empty → Update item: Follow-Up Date = followUpDate.

---

## FLOW 2 — LIST B UPSERT (separate flow; does NOT touch the working Sorter)

Keyed on **Sender Email** for the pilot (Sender Domain is left blank on List A rows — no string-split without Compose).
One row per sender in `Subscription Register`.

**Trigger:** Recurrence — every few hours (no item trigger available).
**Get items (List A):** `Inbox Action Register`, Filter Query:
`(BusinessCategory eq 'PROMOTIONS / SUBSCRIPTIONS / MISC' or BusinessCategory eq 'FYI – Reference / Learning')`.
To avoid re-processing the same rows every run, also require a marker (e.g. a Boolean "Logged To Sub Register" column, or filter Created ge the last run) — **open decision, see caveat.**
**Apply to each** List A row → **Get items (List B)**, Filter Query: `SenderEmail eq '<Sender>'`, Top 1.
**Condition — does a row already exist?**
- **Yes (found):** Update item (the found row): Message Count = *(existing count)* + 1 [inline expression `add(..., 1)`], Last Seen = Received Date, Sender Name/Email refreshed.
- **No (none):** Create item: Sender Domain=(Sender for now), Sender Email=Sender, Sender Name=Sender, Subscription Type=Unknown, First Seen=Received Date, Last Seen=Received Date, Message Count=1, Status=Active, Pillar=N/A.

**⚠ Dependency:** the "found vs not" check and the `+1` increment need a length/empty test and an add expression.
If the agent rejects inline expressions, **defer List B to full Power Automate** (bundle with Echo) — it is a
nice-to-have subscription tracker, not core action intelligence. Test this flow first before relying on it.

---

## FLOW 6 — WATCHDOG (daily)

**Trigger:** Recurrence — daily (e.g., 7:00 AM). Its timestamp is fed to the AI step as "today" (no expression needed).
**Get items** — `Inbox Action Register`, Filter Query: `Status ne 'Done' and Status ne 'Reference'` (open items only).
**Apply to each** open item:

**AI step "Watchdog – Assess Aging":**
- Inputs: Status, Digest Lane, Priority, Received Date, Last Status Change, Follow-Up Date, Draft Status, and the Recurrence timestamp as `today`.
- Instruction: apply §1b and return:
  - `action`: one of `escalate` | `nudge` | `stale` | `close` | `none`
  - `escalate` if (Status=Blocked and Follow-Up Date < today) OR (Digest Lane='System Exceptions / Workflow Breaks' and business-days(Last Status Change→today) > 2)
  - `nudge` if Digest Lane='Waiting On Others' and business-days(Last Status Change→today) ≥ 5
  - `stale` if calendar-days(Last Status Change→today) > 30
  - `close` if Draft Status='Sent'
  - else `none`
- Output: `action`.

**Switch on `action`:**
- `escalate` → Update item: Priority=Critical, Suggested Flag=Today. Then **Post message in a chat or channel** (Teams) to the item's Owner: "Watchdog: '<Email Subject>' is past its follow-up window — needs attention." (Respect List C Digest Channel: Teams/Email/Both — read the pilot profile row; pilot default Teams.)
- `nudge` → Update item: Draft Status=Draft Ready (Quill/you complete the nudge; nothing auto-sends).
- `stale` → Update item: Reviewed=No.
- `close` → Update item: Status=Done, Last Status Change=(Recurrence timestamp).
- `none` → no action.

**Credit note:** one AI call per open item per day. Open (non-Done/Reference) items are the small action set, not the
FYI/promo tail, so daily cost is modest. If it grows, pre-filter Get items harder before the loop.
