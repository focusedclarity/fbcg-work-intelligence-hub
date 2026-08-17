# Lovable prompt — passcode → "jackson" + FMX panel numbers (NO design changes)

Paste this whole block into the **fbcgistaffhub** Lovable app's chat, send it, then
review Lovable's preview before publishing. It should only touch two things: the
passcode and the FMX "Closing the loop" panel. Nothing else.

---

Make exactly the two changes below to the Facilities Inspection Dashboard. **Do NOT
change the visual design, theme, layout, fonts, colors, spacing, charts, or any other
panel.** Data/label/text changes only.

**1) Passcode.** On the `/facilities/inspections` passcode gate, change the accepted
code from `5700` to **`jackson`** (accept it case-insensitively, so "Jackson" also
works). Keep the gate otherwise identical — same `sessionStorage` flag (`fac_dash_ok`),
same "Incorrect code." message, same Lock link.

**2) FMX "Closing the loop" panel.** It currently shows the old *all-facilities*
work-order numbers (e.g. 1,442 created, 93% closure). Replace them with the new
**inspection-originated** numbers below, keeping the panel's existing look:

- Title: **"Closing the loop: inspection-originated FMX work orders"** with a small
  badge reading **"H1 · as of Jun 30"**.
- Subtitle: *"The FMX work orders our inspections actually logged — matched by the
  ticket numbers recorded on each inspection row — tracked to closure. Scope: tickets
  created Jan 1 – Jun 30, 2026, measured as of June 30."*
- Funnel: **170** inspections → **253** findings → **110** FMX work orders logged.
- Stat tiles:
  - Tickets logged **110** (created ≤ Jun 30)
  - Closed by Jun 30 **72** (65% closure)
  - Open backlog **38** (unresolved at Jun 30)
  - Median days to close **10.8** (avg 25.6 days)
  - Closed ≤ 7 days **28** (of 72 closed)
- Closure rate by campus (bars): **Ministry Center 76%** (57/75), **Worship Center 50%**
  (12/24), **Community Life Center 0%** (0/8), **Empowerment Center 100%** (2/2),
  **Service Building 100%** (1/1).
- Caption: *"Tickets are matched to the FMX export (rev 071426) by the FMX numbers
  logged on inspection rows — a true inspection→work-order closed loop, distinct from
  all-facilities FMX volume. 11 inspection rows carry mistyped ticket numbers and are
  excluded pending correction; fixing them will raise the matched count toward 121."*
- **Remove** the old caption that says *"FMX carries no origin tag, so these are all
  facilities work orders…"* — it is no longer accurate.

If this panel is bound to the Supabase function payload rather than hard-coded, read
these fields instead of the old ones:
`loop.ticketsLogged`, `loop.ticketsClosed`, `loop.closureRate`, `loop.openBacklog`,
`loop.medianDaysToClose`, `loop.fmx.avgDaysToClose`, `loop.fmx.closedWithin7`,
`loop.fmx.closedWithin30`, `loop.fmx.byCampus[]` ({campus, code, created, closed,
closureRate}), `loop.fmx.exceptions`, `loop.h1Inspections`, `loop.h1Findings`.
Stop referencing `loop.ticketsCreated`, `loop.fmx.byBuilding`, `loop.fmx.byMonth`,
and `loop.fmx.within7DaysPct` — those fields no longer exist in the payload.

Do not change any other panel, number, chart, or styling.

---

> After Lovable applies this, the new passcode is **jackson** — let anyone who uses the
> dashboard know. (The `5700` code will no longer work.)
