# Tempo (Flow 5a) — SLA Follow-Up Date builder

**Purpose:** Stamp `Follow-Up Date` on every List A ("Inbox Action Register") row so the
Watchdog and the dashboard know *when* an item is due for a nudge. Tempo encodes response
**SLAs** (an initial-response target and a resolution target), tighter for High than for FYI.

**Build target:** restricted workflow-automation agent (Approvals / Outlook / Planner /
SharePoint list-item / Teams / AI-prompt only — **NO Compose / variables / HTTP**). Fully
deterministic — **no AI Builder call**, so it is not blocked by credit exhaustion.

**List:** `Inbox Action Register` on site
`https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155` (use the FULL URL).

---

## SLA windows (LOCKED — from HANDOFF "Finalization decisions")

Business days after `Received Date` (or `Last Status Change` on re-open — see §Trigger).
`Due Date Stated`, when present, **overrides** the computed initial-response date.

| Tier (Priority + Recipient Scope) | Initial response | Resolution target |
|---|---|---|
| **High** OR **Recipient Scope = Direct to Me** | same business day (+0) | +2 business days |
| Normal | +2 business days | +5 business days |
| Low | +5 business days | best-effort (no resolution date) |
| FYI / Promotions–Misc / Newsletters | *(none — leave Follow-Up Date blank)* | none |

`Follow-Up Date` is set to the **initial-response** date (the first nudge point). The
resolution target is informational (Watchdog can compute breach separately); we do not need a
second column for pilot.

**Critical** priority is treated as High (+0 / +2). If Gina wants Critical = immediate escalate,
that's a Watchdog ping, not a Tempo date.

---

## Trigger

**"When an item is created or modified (V2)"** on List A.

Guard against loops: Tempo writes `Follow-Up Date` (and `Last Status Change` is NOT touched by
Tempo). A modify trigger re-fires on its own update, so add a **Condition** early to exit when
the row already has the correct Follow-Up Date for its current tier — see §Idempotency.

> No-Compose note: the V2 modified trigger has no built-in "only when these columns change"
> filter in the restricted agent. We rely on the idempotency condition instead.

---

## Logic (branch tree, no variables)

Because there are no variables/Compose, implement as nested **Condition** actions, each branch
ending in a SharePoint **Update item** that sets `Follow-Up Date` with an inline
`addDays`/date expression on `Received Date`.

### Step 1 — Skip non-actionable lanes
Condition: `Digest Lane` is one of `FYI`, `Promotions – Misc`, `Newsletters`
**→ If yes:** terminate (leave Follow-Up Date blank). **→ If no:** continue.

> Use `Digest Lane` (not Business Category) — it is the frozen 7-lane routing field. Match the
> en-dash "–" exactly.

### Step 2 — Due Date Stated override
Condition: `Due Date Stated` is not blank
**→ If yes:** Update item `Follow-Up Date` = `Due Date Stated`. Terminate.
**→ If no:** continue to Step 3.

### Step 3 — Tier → offset
Nested conditions on `Priority` and `Recipient Scope`:

1. `Priority` is `High` **OR** `Priority` is `Critical` **OR** `Recipient Scope` is `Direct to Me`
   → Follow-Up Date = **+0** business days.
2. else `Priority` is `Normal` → **+2** business days.
3. else `Priority` is `Low` → **+5** business days.
4. else (unclassified / blank Priority) → **+2** business days (safe default) and set
   `Reviewed = No` so it surfaces in Needs-Review.

---

## Business-day date expression (no-Compose friendly)

The restricted agent allows inline expressions in a field even without a Compose action. Set
`Follow-Up Date` in **Update item** to one of these (base = `Received Date`):

- **+0 business days** (same day; if received Sat/Sun, roll to Monday):
  ```
  if(greater(dayOfWeek(triggerOutputs()?['body/ReceivedDate']),5),
     addDays(triggerOutputs()?['body/ReceivedDate'], add(1, mod(sub(8,dayOfWeek(triggerOutputs()?['body/ReceivedDate'])),7))),
     triggerOutputs()?['body/ReceivedDate'])
  ```
- **+2 business days:** add 2, then push off weekends:
  ```
  addDays(triggerOutputs()?['body/ReceivedDate'], if(greaterOrEquals(dayOfWeek(triggerOutputs()?['body/ReceivedDate']),4),4,2))
  ```
- **+5 business days** (one full work week):
  ```
  addDays(triggerOutputs()?['body/ReceivedDate'], 7)
  ```

> These are pragmatic weekend-aware approximations, NOT holiday-aware (no business-calendar in
> the restricted agent). List C business-hours refinement is deferred — noted in HANDOFF §3.
> If exact business-day math is required, that's a full Power Automate rebuild with a working-days
> connector, out of scope for the restricted agent. Confirm the approximation is acceptable with Gina.

Field references above use `triggerOutputs()?['body/ReceivedDate']` — confirm the internal name
of `Received Date` in List A (likely `ReceivedDate` or `Received_x0020_Date`; check via the
dynamic-content picker, don't hand-type).

---

## Idempotency (prevent modify-trigger loops)

Before any Update item, add a top Condition:
`Follow-Up Date` **is not equal to** the value Step 3 would compute for the current tier.
Simplest safe form for the restricted agent: only proceed when `Follow-Up Date` **is blank**
OR `Last Status Change` is **more recent** than `Follow-Up Date`'s last write. Since we can't
store a last-write marker without a column, the pragmatic pilot rule is:

> **Only run the Update when `Follow-Up Date` is currently blank.** Re-computation on status
> changes is handled later by Watchdog / a manual "recompute" view action. This guarantees no
> infinite modify loop and covers the create case (which is 95% of rows).

If Gina needs Follow-Up Date to recompute when Priority/Status changes, add a dedicated
`Tempo Stamp` yes/no column that Tempo sets, and gate on it — flagged as a small follow-up.

---

## Update item — field map

| List A column | Value |
|---|---|
| `Follow-Up Date` | tier expression above (or `Due Date Stated` in Step 2) |
| `Reviewed` | `No` **only** in the Step 3 fallback branch (blank/unknown Priority); otherwise leave unchanged |

Do **not** write `Last Status Change` (Tempo isn't a status change) and do not touch any other
column, to keep the modify-trigger blast radius minimal.

---

## Test plan

1. Create a test List A row: Priority=High, Recipient Scope=Direct to Me, Digest Lane=Action,
   Received Date=a Wednesday, Due Date Stated=blank → expect Follow-Up Date = same Wednesday.
2. Priority=Normal, Received=Thursday → expect +2 business = Monday (weekend roll).
3. Priority=Low → expect +5 (following week).
4. Digest Lane=Newsletters → expect Follow-Up Date stays blank, flow terminates at Step 1.
5. Due Date Stated=next Friday, Priority=Low → expect Follow-Up Date = that Friday (override wins).
6. Re-save an already-stamped row → expect NO change / no loop (idempotency holds).

Log results + any internal-column-name corrections back into this file and
`memory/command-center-progress.md` after the live build.

---

## Status
- **2026-07-30:** Spec authored. Not yet built live (requires the restricted agent / browser
  session Gina drives). Next live action: build trigger + Step 1–3 conditions in the
  production Power Platform environment, run the 6 tests above, mark Phase 4 done.
