# Sync the Build Across Both Computers — Step by Step

> How to work this build from either computer / either Claude account, and fail over cleanly when one
> account runs low on credits — without losing any progress.

## The mental model (read this first — it makes everything simpler)
- **The build itself lives in the Microsoft 365 cloud** — the SharePoint lists, the Power Automate flows, the
  Planner plan, the Power App. Those are identical no matter which computer or account you use. **You do not
  "sync" the build; the M365 tenant is the single source of truth for what's live.**
- **Only two things live in git and need syncing:** (1) the **spec docs** (`PhaseU/COMMAND_CENTER_PLAN.md`,
  `BUILD_SPEC_phase0-3/4-6/7-10.md`, `EXECUTION_CHECKLIST.md`, this file), and (2) **your progress** (the
  checkboxes + Part 3 log in `EXECUTION_CHECKLIST.md`).
- **Claude credits are per-account.** Git is what lets you stop on Computer A / Account A and continue on
  Computer B / Account B with the full plan and up-to-date progress in hand.

**Repo:** `fbcg-work-intelligence-hub` · **Branch these docs live on:** `claude/office-automation-no-ai-builder-763f82`
(main branch = `main`). All build docs are in the `PhaseU/` folder.

---

## One-time setup on EACH computer
1. [ ] **Git installed** and signed in to GitHub (`git --version` to confirm).
2. [ ] **Repo cloned** to a known folder:
   ```bash
   git clone <your-repo-url> && cd fbcg-work-intelligence-hub
   ```
3. [ ] **On the right branch:**
   ```bash
   git checkout claude/office-automation-no-ai-builder-763f82
   ```
4. [ ] **Claude Code installed and working.** *Known issue on the second computer:* the `claude` command may
   not be on PATH (documented in `HANDOFF.md` second-computer notes). If `claude` isn't found, finish that PATH
   fix first — everything else here assumes `claude` runs.
5. [ ] **Signed into M365** in the browser you'll use (for the Chrome-plugin execution). Same tenant, so both
   computers see the same live flows/lists/Planner.

---

## Daily workflow (every work session, on whichever computer you're using)
1. **Pull first — always:**
   ```bash
   git pull
   ```
2. **Open Claude Code** in the repo folder and tell it where to resume, e.g.:
   > "Read `PhaseU/EXECUTION_CHECKLIST.md` and the BUILD_SPEC docs, then help me execute the first unchecked phase."
3. **Do the work** — build the phase in M365 (Chrome plugin or by hand), one phase at a time; you click
   *Save & turn on*. Run that phase's test.
4. **Record progress** — check the box in `EXECUTION_CHECKLIST.md` and add a Part 3 log line
   (date — what you built/tested — next step).
5. **Commit + push:**
   ```bash
   git add PhaseU/ && git commit -m "Progress: <phase built> on <date>" && git push
   ```

---

## Switching computers / credit failover (the whole point)
When Account A is low on credits, or you're moving to the other machine:

**On the computer you're leaving:**
1. [ ] Update the checklist + Part 3 log with exactly where you stopped.
2. [ ] `git add PhaseU/ && git commit -m "Handoff: stopped at <phase/step>" && git push`

**On the other computer (Account B):**
3. [ ] `git pull`
4. [ ] Open Claude Code (Account B) and say:
   > "Read `PhaseU/EXECUTION_CHECKLIST.md` (esp. Part 3 log) and resume at the first unchecked phase."
5. [ ] Continue. Because the live build is in the M365 cloud, everything you already turned on is still
   running — you're only picking up the *next* unbuilt phase.

> **You never lose work to a credit limit:** worst case, push what's done, switch accounts, pull, keep going.

---

## Avoiding and fixing conflicts
- **Edit on only one computer at a time**, and **always `git pull` before you start.** That alone prevents
  virtually every conflict.
- These are Markdown docs, so conflicts are rare and harmless. If `git pull` reports a conflict:
  1. Open the file — git marks the clash with `<<<<<<<`, `=======`, `>>>>>>>`.
  2. Keep **both** sets of progress (delete the marker lines), save.
  3. `git add PhaseU/ && git commit -m "Merge progress" && git push`
- If you get stuck, ask Claude: "resolve this git conflict in `PhaseU/EXECUTION_CHECKLIST.md`, keeping both progress edits."

---

## Optional: make `main` the canonical home
These docs currently live on branch `claude/office-automation-no-ai-builder-763f82`. Once you're happy, merge
them into `main` so every clone gets them by default:
```bash
git checkout main && git merge claude/office-automation-no-ai-builder-763f82 && git push
```
After that, the daily workflow can just use `main` on both computers.

---

## Commands cheat-sheet
```bash
git pull                                             # before every session
git add PhaseU/ && git commit -m "..." && git push   # after every session
git checkout claude/office-automation-no-ai-builder-763f82   # ensure right branch
git status                                           # see what's changed / current branch
```
