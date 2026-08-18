# FBCGI Work Intelligence Hub

G. Thomas's personal work "second brain" — the single git-backed home for context,
decisions, project records, references, and active builds. Worked from **two computers**
(gmail account + fbcglenarden.org account), so **`main` is the one canonical copy** and
the daily discipline below is what keeps both machines honest.

> New here (or a fresh Claude session)? Read `context/` first, then `context/current-priorities.md`,
> then open the relevant folder below.

## Structure

| Folder | What goes here |
|---|---|
| `context/` | Who I am, my role, my team, goals, and current priorities. The orientation layer — read first. |
| `decisions/` | `log.md` — append-only record of meaningful decisions (what + why). |
| `projects/` | One record per active/completed project (status, what shipped, how to resume). |
| `references/` | Reusable knowledge: `playbooks/` (methods I follow), `sops/` (how-to procedures), `examples/`. |
| `templates/` | Reusable doc skeletons (e.g. `session-summary.md`). |
| `archives/` | Finished/retired material kept for the record. |
| `PhaseU/` | The office-automation build (M365 Power Automate / Planner / SharePoint). Large, self-contained project. |

## The two-computer rule (read `SYNC.md` for the full process)

1. **`main` is canonical.** Both computers only pull/push `main`.
2. **Pull before you start, push when you stop** — every session, every machine.
3. **Finished task branches get merged into `main` right away** — never leave completed work parked on a feature branch, or the other computer won't see it.

See **`SYNC.md`** for the step-by-step daily workflow and credit/computer failover.
