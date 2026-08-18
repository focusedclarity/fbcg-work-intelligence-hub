# Working This Hub Across Both Computers

> How to work the FBCGI Work Intelligence Hub from **either computer / either Claude account**
> without losing progress or leaving work stranded. This governs the **whole repo**.
> (The older `PhaseU/SYNC_BOTH_COMPUTERS.md` covers the office-automation build specifically —
> the same principles, scoped to that project. This file is the top-level version.)

## Mental model (read once)
- **`main` is the single source of truth.** There is one canonical copy of this hub, and it lives on
  the `main` branch on GitHub. Both computers are just working copies of it.
- **Claude credits are per-account.** Git is what lets you stop on Computer A / Account A and pick up on
  Computer B / Account B with everything intact.
- **Claude-on-the-web sessions create their own task branches** (e.g. `claude/<something>`). That's fine —
  but a task branch is *delivery*, not *storage*. The moment the work is done, it gets merged into `main`.

**Repo:** `fbcg-work-intelligence-hub` · **Canonical branch:** `main`
**Computer A:** gmail Claude account · **Computer B:** fbcglenarden.org Claude account (same repo, same `main`).

---

## One-time setup on EACH computer
1. [ ] Git installed and signed in to GitHub (`git --version` to confirm).
2. [ ] Repo cloned to a known folder:
   ```bash
   git clone <repo-url> && cd fbcg-work-intelligence-hub
   ```
3. [ ] On `main`:
   ```bash
   git checkout main
   ```
4. [ ] Claude Code installed and working. *(Known second-computer issue: `claude` may not be on PATH —
   see `PhaseU/HANDOFF.md` second-computer notes if the command isn't found.)*

---

## Daily workflow (every session, whichever computer)
1. **Pull first — always:**
   ```bash
   git checkout main && git pull
   ```
2. **Orient Claude:** point it at `context/` and `context/current-priorities.md`, then the folder you're working in.
3. **Do the work** — edit docs / build the project.
4. **Record it** — update the relevant `projects/` record and append to `decisions/log.md` if a real decision was made.
5. **Commit + push to `main`:**
   ```bash
   git add -A && git commit -m "<what changed> (<date>)" && git push
   ```

---

## When a Claude-web session made a task branch
Claude-on-the-web sessions push to a `claude/...` branch, not `main`. To land that work so **both computers see it**:

```bash
git checkout main && git pull
git merge origin/claude/<the-branch-name>     # fast-forward or clean merge for docs
git push
```

Then the task branch has served its purpose. Don't keep stacking new work on it — start the next task from a
fresh pull of `main`.

---

## Switching computers / credit failover
**Leaving Computer A:**
1. [ ] Update the relevant `projects/` record + `decisions/log.md` with exactly where you stopped.
2. [ ] `git add -A && git commit -m "Handoff: stopped at <point>" && git push`

**Arriving at Computer B:**
3. [ ] `git checkout main && git pull`
4. [ ] Tell Claude: "Read `context/current-priorities.md` and the relevant `projects/` record, and resume where I stopped."

> Worst case with a credit limit: push what's done, switch accounts, pull, keep going. No work is lost.

---

## Avoiding conflicts
- **Edit on only one computer at a time**, and **always pull before you start.** That alone prevents nearly every conflict.
- These are Markdown docs, so conflicts are rare and easy: git marks a clash with `<<<<<<<` / `=======` / `>>>>>>>`;
  keep **both** sets of edits, delete the marker lines, then `git add -A && git commit && git push`.
- Stuck? Ask Claude: "resolve this git conflict, keeping both sets of edits."

---

## Cheat-sheet
```bash
git checkout main && git pull                 # before every session
git add -A && git commit -m "..." && git push # after every session
git merge origin/claude/<branch> && git push  # land a Claude-web task branch onto main
git status                                     # what's changed / which branch
```
