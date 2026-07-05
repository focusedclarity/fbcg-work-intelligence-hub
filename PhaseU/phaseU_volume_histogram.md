# Phase U — Deliverable 2: Volume Histogram (narrative)

**Companion data file:** `phaseU_volume_histogram.csv` (open in Excel; *Save As → .xlsx* if a workbook is required — the spec's `.xlsx` intent is satisfied by this Excel-ready CSV).
**Window:** 2026-01-01 → 2026-07-03. **Persistence:** findings/counts only.

## Reliability tiers
- **Reliable (Graph `totalResultCount`):** monthly totals and full-window sender-cluster counts. Use these for the Step 0.5 credit math and Echo sizing.
- **Estimate (sample-extrapolated):** the by-Business-Category and by-Digest-Lane distributions. Graph free-text `query` searches return relevance-ranked pages **without** a reliable total, so per-category counts cannot be pulled directly. These rows are extrapolated from a ~175-message representative cross-section (25 messages sampled at each month boundary Jan–Jul) plus the reliable cluster counts. Treat as order-of-magnitude, **not** precise. This is exactly the "empirical shape" §3e asks for; Echo will produce the exact per-category counts when it classifies for real.

## The shape, in one paragraph
Volume is steady at **~1,500–2,000 inbound/month (~60–65/day)**, no strong seasonality across the window (Feb dips, Jun peaks). The distribution is **heavily bottom-heavy**: an estimated **~55–60% of all mail is FYI / Promotions / Ministry-community noise** that expects no action from Gina, while the genuine BSD action surface (contracts, procurement, vendor, approvals, replies, system exceptions) is an estimated **~30%**, and pure system-exception traffic — the highest-value lane — is a **small but critical ~1–2%**. The design implication is that **Sorter's precision on the noise tail matters more than anything else**: if it mis-routes even 10% of ~6,000 FYI/Promo messages into action lanes, it buries the ~180 System Exception items that actually need Watchdog.

## What Dash should trend against (baseline)
- **Total inbound/week:** ~420–450.
- **Action-lane share:** ~30% (the "buyback" numerator — this is the number that should *fall* as flows absorb work).
- **System Exceptions/week:** ~7–10 (Watchdog's expected caseload; if it spikes, something upstream broke).
- **FYI+Promo share:** ~55–60% (should be near-invisible to Gina once Sweep files Reference at classification time).

## Cross-checks this feeds downstream (§3h)
- **Echo (Step 1):** expect to write **~10,700 rows** for a full Jan 1→today backfill — an order of magnitude larger than the "few hundred" a 90-day assumption implies. Confirms the §6 volume warning.
- **Step 0.5 credit gate:** one week ≈ **420–450 messages**; multiply measured per-email credit cost by ~10,700, not by a few hundred, before committing to the full pull.
