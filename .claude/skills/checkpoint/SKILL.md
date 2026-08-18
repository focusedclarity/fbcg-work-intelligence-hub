---
name: checkpoint
description: >-
  Save-and-handoff routine for the two-computer / two-account FBCGI hub workflow. Records progress
  (projects/ record + decisions/log.md if a real decision was made), then git add -A, commit, and push
  to main so the other computer/account can pick up exactly here. Trigger with "checkpoint", "save my
  progress", "commit and push", "I'm switching computers", "/checkpoint", when context is about to be
  compacted, or when a session is running long and usage/time limits may be close.
---

# Checkpoint — Save Progress & Hand Off

Run this whenever the user is about to lose the session (context compaction, low credits, switching
computers, or just ending for the day) and wants zero risk of stranded work. See [SYNC.md](../../../SYNC.md)
for the full mental model — this skill is the "commit + push" step of that process, automated.

## Steps

1. **Check for real work to save.** Run `git status`. If there's nothing changed and nothing new to log,
   say so and stop — don't create empty commits.
2. **Update the record.** If this session touched a specific initiative, update its `projects/<name>.md`
   with current status + next step. If a real decision was made (not just routine edits), append one line
   to `decisions/log.md` with today's date.
3. **Stage, commit, push:**
   ```bash
   git add -A
   git commit -m "Checkpoint: <what changed> (<date>)"
   git push
   ```
4. **Report back plainly** — what got committed, that it's now on `main`, and the one-line resume
   instruction for the other computer: *"On the other machine: `git pull`, then tell Claude to read
   `context/current-priorities.md` and the `<project>` record and resume."*
5. **If on a `claude/<task>` branch** (not `main`), say so explicitly — pushing there is not enough for
   the other computer to see it. Note that it still needs `git merge origin/claude/<branch>` into `main`
   before the handoff is complete, and ask whether to do that now.

## Definition of Done
- [ ] `git status` checked before acting — no empty commits.
- [ ] Relevant `projects/` record and/or `decisions/log.md` reflect where things actually stand.
- [ ] Changes committed and pushed to `main` (or flagged if stuck on a task branch).
- [ ] User told exactly what to do on the other computer to resume.
