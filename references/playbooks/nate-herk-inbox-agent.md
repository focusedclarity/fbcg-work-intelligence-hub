# Reference — Nate Herk: "Inbox Agent" tutorial

**Source:** Nate Herk (AI Automation) YouTube tutorial, provided by Gina 2026-07-04.
**Stack in the demo:** n8n + Gmail + OpenRouter. (Ours is Power Automate + Outlook + SharePoint — mechanics differ, ideas transfer.)
**What it is:** A beginner no-code build of an inbox agent that classifies incoming email and takes a per-category action. Simpler than the FBCG Hub; useful for tactical ideas and outside validation, not architecture.

## Core pattern
Trigger (new email) → **AI text classifier** (reads subject + body) → routes into one of N category branches → each branch does its own action. Demo used 4 categories: Customer Support, Finance/Billing, High Priority, Promotion.

## Per-branch actions demonstrated (the useful part)
- **Customer Support:** label → AI agent drafts a reply → **auto-send** reply in-thread.
- **Finance/Billing:** label → **notification** to the team, built with *variables, not AI* (time, from-name, from-email, subject) to save cost.
- **High Priority:** label → AI agent drafts → **create draft** (human reviews before send), not auto-send.
- **Promotion:** label → mark as read (get it out of headspace).

## Reusable takeaways for the Hub
1. **"Use variables, not AI, where you can."** Herk builds the finance notification with plain variables to save AI cost. → Validates keeping Tempo/List B/Watchdog/Sweep/Courier fully deterministic.
2. **Draft vs. auto-send split** — auto-reply for routine, draft-only for high-stakes. → Matches Courier (send-only, human approves).
3. **OpenRouter as the AI connection** — one account, one API key, many models, ~$5 credit lasts a long time, pay-per-use. → Concrete cheap/resilient option for the Hub's parked "middle tier" (see [[hub-design-playbooks]]); slots in as an HTTP action in full Power Automate.
4. **The "logger" scale-up** — write every action (time in, path taken, result) to a sheet for "a clean front-end interface to spot patterns." → This IS the Inbox Action Register + Power Apps dashboard, already built and richer.
5. **Iterate the classifier prompt** when it mis-classifies (too many / too few in a category). → Applies to `sorter_classifier_prompt.md`.
6. Turn OFF Gmail's "simplify" to get full body text; **pin data** while testing to avoid re-spending on AI; toggle off the tool's auto-attribution footer; **activate** the workflow (test mode doesn't poll).

## What does NOT transfer
n8n node mechanics, Gmail-specific nodes, the OpenRouter *node* — all stack-specific. Keep the ideas, ignore the clicks.
