# Review & Challenge — HANDOFF "Still to do" Items 1–6, + Dashboard Placement/Live-Feed Options
_As of 2026-07-05_

## Scope note (read this first)
This is a **review/analysis memo, not a build spec**. This session has no browser access to make.powerautomate.com or SharePoint — the prior builds all went through an interactive Claude-in-Chrome session, which this session isn't. So "complete 1–6" here means: confirm what's actually already done vs. spec'd vs. missing, cross-check the design against Dan Martell / Nate Herk / Ari Meisel and general SLA-industry practice, and surface the gaps and disagreements Gina should decide on before anyone opens Power Automate again.

Bottom line up front: of items 1–6, **only item 6 (Sweep) has zero spec written**. Items 3–5 (Tempo, List B upsert, Watchdog) are already fully spec'd in `PhaseU/tempo_watchdog_listB_build.md`. Item 2 (views) is done per `HANDOFF.md`. Item 1 (AI middle tier) is blocked on Gina, not on spec work. The playbook review below found one real numeric inconsistency (Tempo's High-priority window) and several design questions worth Gina's input before Sweep gets written.

---

## 1. AI middle tier (OpenRouter)
**Status:** Parked. Blocked on Gina obtaining an OpenRouter (or OpenAI platform) API key — not a spec-writing gap.
**Traces to:** `references/playbooks/nate-herk-inbox-agent.md` (OpenRouter: one key, many models, ~$5 lasts a long time) and `dan-martell-ai-operating-system.md` ("tokens first, hire later" — AI Replacement Ladder rung 1 = the Gatekeeper/Hub itself).

**Challenge:** Herk's OpenRouter recommendation comes from an n8n/Gmail stack with no existing AI-Builder relationship. The Hub already has AI Builder wired into Sorter's `Run a prompt` step — the only reason it's failing is exhausted credits, not architecture. Is OpenRouter (a new vendor, a new key, an HTTP action that needs full Power Automate since the restricted agent has no HTTP action) actually the lower-friction fix, or would simply **topping up AI Builder credits** in the current environment restore Sorter to full AI-classification with zero new build work? OpenRouter only becomes clearly worth it if Gina wants the *middle tier as a permanent second path* (buy resilience against future credit exhaustion) rather than a one-time fix. Recommend framing this as two separate decisions: (a) short-term — top up AI Builder credits now; (b) long-term — build OpenRouter as a genuine fallback tier alongside the existing rule-based fallback, only if Gina wants that redundancy.

## 2. Create views
**Status:** Done. `HANDOFF.md` states all 8 (List A) + 4 (List B) + 4 (List C) views are built and verified live.
**Traces to:** `dan-martell-ai-operating-system.md`'s **Gatekeeper triage buckets** — Reply-me, Delegate, Monitor/FYI, Schedule, No-reply.

**Challenge:** mapping List A's 8 views against those 5 buckets — Open Actions/By Lane/By Mailbox Source/Overdue ≈ Reply-me + Delegate, Needs Review ≈ a review queue Martell's model doesn't have (it's specific to the AI-confidence design here, fine), Dead-Letter ≈ No-reply, Stale — Review to Close ≈ a Monitor variant. **No view maps to "Schedule"** — Martell's bucket for items that need a calendar block proposed. The Hub has no calendar integration yet (confirmed nowhere in the Sorter/Tempo/Watchdog specs), so this bucket is currently unhandled by design, not by oversight. Worth flagging explicitly rather than letting it stay implicit — either accept the gap for the pilot or scope a future "Schedule" lane once calendar automation is in play.

## 3. Tempo (Flow 5a)
**Status:** Fully spec'd — `PhaseU/tempo_watchdog_listB_build.md`, "FLOW 5a — TEMPO" section. Not yet built live (can't be, from here).
**Traces to:** `dan-martell-exec-admin-playbook.md`'s response-SLA placeholders, which HANDOFF.md's own "Finalization decisions" section says became Tempo's windows.

**Challenge — found a real inconsistency:** `HANDOFF.md`'s "Finalization decisions" section states:
> Tempo SLA windows: **High / Direct-to-Me = respond same business day, resolve 2 business days**

But `tempo_watchdog_listB_build.md` §1a (the actual spec that would get built) says:
> Critical → 1 business day · **High → 2** · Normal → 5 · Low → 10

These don't match — the Finalization-decisions text implies High gets a same-day *response* clock with a separate 2-day *resolution* clock, while the build spec only has one number (2) for High and never encodes a same-day tier at all. Either the spec is missing the tighter same-day sub-window for Direct-to-Me items, or the Finalization-decisions text was aspirational and never got folded into the spec. **This needs reconciling before Sweep/Tempo actually gets built**, or Tempo will silently under-serve the highest-priority mail relative to what Gina already signed off on.

Secondary data point: general SLA-tier benchmarks (help-desk P1–P4 conventions) run in **hours**, not business days, for top-tier urgency — e.g. P1 acknowledgment in 15–30 minutes, P2 in ~1 hour. That's a different context (customer support, not an internal exec inbox), so business-day granularity for Tempo isn't wrong on its face — but it's worth Gina explicitly confirming that's intentional rather than an artifact of copying Martell's placeholder template, especially since the same document already implies a same-day tier should exist for the top bucket.

## 4. List B upsert / Buyback gate (Flow 2, feeding Subscription Register)
**Status:** Fully spec'd — `tempo_watchdog_listB_build.md`, "FLOW 2 — LIST B UPSERT" section. The spec itself already flags an open dependency risk: the found/not-found check and the `+1` count increment need an inline expression, and the doc says to defer List B to full Power Automate if the restricted agent rejects it.
**Traces to:** `dan-martell-ai-operating-system.md`'s **DRIP Matrix** — the Buyback gate (`Priority=Low AND Recipient Scope≠Direct to Me AND Category∈{Promotions/Misc, FYI, Newsletters}`) is a textbook **Delegate** quadrant signal (low value, not draining enough to matter, hand it to automation).

**Challenge:** Herk's inbox agent handles this same category ("Promotion") far more simply — mark as read, done, no persistent register. List B instead builds a whole second SharePoint list with upsert logic and a flagged expression-dependency risk, purely to track subscription metadata (sender, message count, first/last seen). Is that complexity buying something Gina actually wants (a real subscription inventory she can act on — e.g., "these 12 senders account for 80% of noise, unsubscribe from the top 3"), or would folding the same signal straight into Sweep/Steward's archival logic (no separate list, just move-and-forget) get 90% of the value with none of the build risk? This is worth deciding **before** Sweep gets spec'd, since Sweep is exactly where this simpler alternative would live.

## 5. Watchdog (Flow 6)
**Status:** Fully spec'd — `tempo_watchdog_listB_build.md`, "FLOW 6 — WATCHDOG" section.
**Traces to:** `dan-martell-exec-admin-playbook.md`'s inbox cadence — "twice a day, target inbox-zero by ~10 AM and again by ~5 PM" — which HANDOFF.md already correctly mapped to Watchdog's two-digest-passes/day design. Good alignment, no gap here.

**Challenge:** Watchdog's `stale` threshold is **30 calendar days** (`calendar-days(Last Status Change→today) > 30`). Ari Meisel's "Less Doing" inbox-zero framework — a much more aggressive minimalism model — recommends archiving anything untouched after **2 weeks**. 30 days is more than double that. That's not automatically wrong (Meisel is optimizing a personal inbox for volume/speed; this Hub is optimizing for not losing track of real business action items, where premature archiving is a bigger cost than staleness), but it's worth Gina confirming 30 days is a deliberate choice and not just an unexamined round number — especially since the "Stale — Review to Close" view already exists and a tighter threshold would surface items for review sooner without actually closing/deleting anything.

## 6. Sweep (Flow 8) — the actual gap
**Status:** **No build spec exists.** Only a one-paragraph stub in `BUILD_RUNBOOK.md` Part 5 and a one-line mention in `HANDOFF.md`'s to-do list ("on Status→Done/Reference, Outlook move to BSSI Hub/Done or /Reference; on lookup fail write to Notes"). This is genuinely the only unfinished item among 1–6.
**Should trace to:** Ari Meisel's minimalist archive model (inbox + one folder, filter anything with "unsubscribe," archive on a threshold) and Herk's "mark as read to get out of headspace" idea for the Promotions branch — both point at Sweep, not List B, as the natural home for low-stakes cleanup.

**Recommendation:** don't write Sweep's full build spec yet — its design directly depends on how items 4 and 5's open questions above get answered:
- If Gina decides List B's complexity isn't worth it (item 4's challenge), Sweep should absorb that Buyback-gate cleanup logic directly (archive-on-sight for Promotions/FYI/Newsletters, no register).
- Sweep's own trigger constraint is already known from the same build-spec file (`⚠ TRIGGER CONSTRAINT` — no item-created/modified trigger on the restricted agent, so Sweep will be a Recurrence + Get-items + Filter-Query poller like Tempo/List B/Watchdog).
- Once Gina answers the item-4 question, Sweep's spec is a small, mechanical follow-on to write in the same style as the existing Tempo/Watchdog sections (trigger → filter query → per-item branch → Outlook folder move / Notes-on-lookup-fail) — flagging this explicitly as the next concrete deliverable rather than doing it now on an unresolved design question.

---

## Dashboard placement + live feed — options (not yet decided)

HANDOFF.md already has this as an open (⧗) item tangled up with the Copilot-layer choice. Laying out the actual options separately:

### Placement options
| Option | What it is | Trade-off |
|---|---|---|
| **Power Apps app as a Teams tab** | Canvas app over Lists A/B/C, pinned as a personal or channel tab in Teams | Meets Gina where she already works (Teams = new BSSI channel per HANDOFF); no context-switch to a browser tab |
| **Standalone Power Apps app, linked from SharePoint** | Same app, accessed via a link/tile on the SharePoint site instead of a Teams tab | Simpler to set up (no Teams app registration), but one more click/tab than the Teams option |
| **Power BI report embedded in a SharePoint page** | Power BI over the same lists, embedded via a web part | Best for trend/aggregate reporting (the ROI/Time-Saved metrics table) but weaker for row-level action (approve a draft, open an email) — Power Apps is better for that |
| **Teams-only adaptive-card feed, no separate app** | Just the existing Watchdog/Sorter Teams posts, no dashboard UI at all | Zero build cost, but loses the "single pane of glass" vision entirely — not a real substitute, more of a fallback if the Power Apps build stalls |

### Live-feed options
| Option | What it is | Trade-off |
|---|---|---|
| **Power Apps native refresh** (on-load / timer control) | The app just re-queries SharePoint on open or on a timer | Simplest, no extra plumbing, but not truly "live" — depends on refresh interval/reopen |
| **Push-style Teams channel feed** | Extend what Watchdog/Sorter already post (escalation alerts, new-item notices) into a general activity feed, not just alerts | Reuses existing flow logic (nothing new to build) but is Teams-only, not inside the dashboard itself |
| **Power BI streaming dataset** | True real-time push into a Power BI tile | Needs Power BI Premium / streaming API — meaningfully more infrastructure for a pilot with ~14 rows in List A so far; overkill right now |
| **Plain "Recent Activity" SharePoint view** (sort by Modified desc) | Zero-build fallback — just a view, not a feed | Already achievable today with existing view-building method; good stopgap while the Power Apps build is pending |

### Recommendation
Power Apps app (Teams-tab placement) as the single pane of glass, refreshed natively rather than built as a real-time stream — the data volume and update cadence (a handful of emails/day, two Watchdog passes/day) don't justify streaming infrastructure. Keep and extend the Teams feed Watchdog/Sorter already post to as the "live" layer, since it's already partially built and free. This ties directly into the still-open ⧗ Copilot-layer decision (M365 Copilot vs. Copilot Studio) in HANDOFF.md — worth deciding both together, since the Copilot Q&A surface and the dashboard placement are the same screen.

---

## Consolidated challenge questions for Gina
1. **AI middle tier:** top up AI Builder credits now (quick fix) vs. build OpenRouter as a permanent second path (real resilience, more build work)? These are two different decisions, not one.
2. **Views:** accept that there's no "Schedule" bucket/view yet (no calendar integration exists), or scope that as a future addition?
3. **Tempo — reconcile the numbers:** HANDOFF's Finalization-decisions text promises High/Direct-to-Me = same-business-day response + 2-day resolution; the actual build spec only has a single 2-business-day number for High with no same-day sub-window. Which is correct?
4. **List B / Buyback gate:** is the standalone Subscription Register (with its own upsert logic and flagged expression risk) worth building, or should that signal fold directly into Sweep's archival logic with no separate list?
5. **Watchdog:** is the 30-calendar-day "stale" threshold deliberate, or should it be tightened (e.g., toward Meisel's 2-week convention) given "Stale — Review to Close" only surfaces items for review, not deletion?
6. **Sweep:** ready to answer #4 now so Sweep's spec (the one real gap in 1–6) can be written next, in the same style as Tempo/Watchdog?
7. **Dashboard:** Power Apps-as-Teams-tab + extend the existing Teams feed (recommended above) — confirm, or prefer one of the other placement/feed combinations?
