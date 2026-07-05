# Work Action Intelligence Hub — Session Handoff (as of 2026-07-04)

Paste the opener at the bottom into a new session to continue. Everything below is the current state.

## Where we are
- **Phase U: COMPLETE.** Mailbox analyzed (Jan 1–Jul 3 2026, ~10,700 msgs). Taxonomy **frozen** (18 business categories, 7 digest lanes, rules R1–R10 + Needs-Review). Exit gate cleared via a stress test that passed at 90% on a fresh 50-email sample.
- **Lists A/B/C: CREATED** on SharePoint site `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155` via the SharePoint list agent. List A's two calculated columns (`Days Since Received`, `Confidence Band`) are added.
- **Sorter (Flow 1): LIVE, PUBLISHED, TESTED, credit-resilient.** See "Sorter status" section below.

## North Star / ultimate vision (Gina, 2026-07-04)
One **Intelligence Hub dashboard** to view and manage *all* work in one place — AI agents, emails, transactions, meeting summaries, action items. The dashboard (Power Apps over the SharePoint lists) is the single pane of glass, connected to the automation flows + tools already built. It surfaces **reports & data summaries** and lets Gina **use Copilot AI to ask questions and take actions** against what's on the hub. Three layers: **Hub flows = the hands** (classify/route/act) · **Claude Code exec-assistant repo = the brain** (principles/SOPs/templates, [[exec-assistant-setup]]) · **dashboard = the single-pane-of-glass** on top. Context: this is Gina's real-world application of Nate Herk's 7-Day AIS Challenge (see memory [[hub-build-progress]]); the exec-assistant build is the challenge's Day 7 capstone.

## Environment constraint (critical)
The flow-building "workflow automation" agent supports ONLY: **Approvals, Office 365 Outlook, Planner, SharePoint (list-item actions only), Teams, and AI/prompt steps.** NO Compose / Data Operations / variables / HTTP / OneDrive. Consequences:
- Schema (lists/columns/views) had to be created manually / via the SharePoint list agent — done.
- The deterministic rules-in-Compose Sorter (`sorter_flow1_rulesbased_build.md`) **cannot** be built in this agent — it works only in full Power Automate (make.powerautomate.com).
- **We pivoted Sorter to an AI-prompt design:** Outlook trigger → AI prompt step "Classify Email" (10 named outputs) → SharePoint Create item. Classifier instructions came from `sorter_classifier_prompt.md`.

## Sorter — build history (superseded by "Sorter status" below)
- Trigger "When a new email arrives (V3)" (Inbox) built.
- AI prompt step "Classify Email": **output set finalized at 13** (added owner, dueDateStated, triggerWordsHit to the original 10; recipientScope now emitted by the prompt). Instruction prompt updated in `sorter_classifier_prompt.md` (RULE 0 trimmed to the 13, recipientScope rule added under RULE 4).
- Create item mapping fully specified in **`sorter_output_mapping.md`** (13 AI outputs + 5 trigger fields + defaults; en-dash + utcNow() caveats).
- Classifier logic was hand-verified against 5 sample emails (all correct incl. the two hard calls) before the live test below was run. Test harness + sample emails + answer key in **`sorter_test_harness.md`**.
- NOTE: the restricted flow agent throws only a generic "something went wrong" (no detail); the throwaway manual-trigger test flow could not be built — pivoted to testing the real Sorter live via Run history. See memory `workflow-agent-prompt-wording.md`.

## Sorter status (updated 2026-07-04 evening — current, authoritative — LIVE, TESTED, credit-resilient)
Sorter is **BUILT, PUBLISHED, ON, and live-tested** in the **Gina Thomas production Power Platform environment** (flow "Flow 1 — Sorter (Classification) FBCG", GUID `b281d545-c563-4401-aebc-ca2d0ffd5323`, env `Default-7980b399-a235-46a9-85e4-294f51bdba15`). The classifier fix (Option A) is done: `Run a prompt` (AI Builder, GPT-4.1 mini, custom prompt "Sorter – Email Classifier (13-key JSON)") replaced the broken async Execute Agent step, feeding `Parse JSON` (13-key schema) → `Create item` (all 22 columns mapped).

**New issue found + fixed same day:** the production environment's **AI Builder/Copilot credits are exhausted**, so `Run a prompt` returns `Forbidden` on every run right now. Rather than losing emails, added a **rule-based fallback path** (keyword/trigger-word matching, no AI) that fires whenever `Run a prompt` fails/times out/is skipped — see memory `sorter-fallback-classifier` for the full expression-level design. Also fixed a **separate, pre-existing bug** this exposed: SharePoint's `DueDateStated` date column rejected empty string (only surfaced once a run actually reached `Create item` for the first time). **Verified live** 2026-07-04 ~3:39 PM with a real test email from Procurement — row created correctly (Item ID 16), overall flow run shows Succeeded.

Browser note: automation can drive make.powerautomate.com but NOT copilotstudio.com.

## Web Link (Outlook Web deep link) — added 2026-07-04 evening
List A's **Web Link** column (Hyperlink or Picture type — already existed in the schema, previously unmapped) is now populated by Sorter's `Create item` step:
```
concat('https://outlook.office.com/owa/?ItemID=', uriComponent(triggerOutputs()?['body/id']), '&exvsurl=1&viewmodel=ReadMessageItem', ', Open Email')
```
- **Verified live**: navigated to this exact URL pattern with a real message ID in a signed-in Outlook Web session (2026-07-04) — Microsoft 302-redirects it to their newer `outlook.cloud.microsoft/mail/deeplink/read/<id>` format and opens the correct message. Confirmed working.
- **Desktop Outlook**: does NOT work — no supported conversion from the Graph REST message ID (what the trigger gives us) to the desktop client's MAPI EntryID format. The link is a plain `https://` URL, so clicking it always opens a browser tab (Outlook Web), never hands off to the desktop app. This is by design/unavoidable, not a bug to fix.
- Only applies to emails processed **from now on** — the field is populated at `Create item` time, so the 14 rows already in the register before this change don't have a Web Link value.
- Relevant for the Power Apps dashboard Gina is starting to build on top of List A — the Web Link column can be surfaced as a clickable "open the email" action there.

## AI-credit failure emails — investigated, NOT resolved (2026-07-04)
Gina asked to stop getting Power Automate failure-notification emails while `Run a prompt` fails on every run (AI Builder credits exhausted). Investigated and found:
- **Power Automate has no native "disable this step" toggle** — checked both the new (v3) and classic designer's action context menu and Settings panel on `Run a prompt`; the option doesn't exist for this action type.
- Real options are: (a) delete the `Run a prompt` step entirely (the underlying AI Builder prompt itself survives elsewhere in AI Builder; re-adding the step later is some rework), or (b) leave it in place still failing every run and mute Power Automate's failure-notification emails on Gina's account instead (couldn't locate the exact setting before Gina redirected to the Web Link task — Settings gear → "Update contact preferences" leads to a generic M365 privacy page, NOT flow-failure-specific; the real control is likely elsewhere, e.g. Power Automate mobile app notification settings or per-connector run history filtering — not yet found).
- **Gina deferred this** ("don't worry about the notification") to focus on the Web Link fix above. Still open if revisited.

## Recently completed
- Confirmed List C seed row exists with Onboarding Complete = Yes (Gina confirmed 2026-07-04) — pilot profile row created, activation gate is live.
- Web Link column wired up in Sorter's Create item and verified (see above).

## Triage-layer plan (refined 2026-07-04 against best-in-class playbooks)
Benchmarked against Dan Martell (AI Operating System + Exec Admin Playbook) and Nate Herk (Inbox Agent). Full rationale in the design-memo artifact + `references\playbooks\` + memory [[hub-design-playbooks]]. **Two-layer framing:** this Hub is the *hands* (classify/route/act); the Claude Code exec-assistant repo at `Desktop\Claude\` is the *brain* (principles/SOPs/templates). **All six triage stages below are fully deterministic — no AI Builder call — so none is blocked by credit exhaustion.**

## Still to do (in order)
1. **[PARKED — recommended path found]** AI "middle tier" between AI Builder and the rule-based fallback so degraded emails still get real AI classification. **Recommended: OpenRouter** (one key, many models, ~$5 lasts long — what Herk uses) instead of / alongside a raw platform.openai.com key. Add an HTTP action calling the model with the same 13-key prompt, gated to fire only when `Run a prompt` fails, Compose fallback last. Blocked only on Gina getting an OpenRouter (or OpenAI platform) API key + billing.
2. **[IN PROGRESS] Create views** — building live via Claude-in-Chrome directly on the SharePoint site (classic "Edit current view" pages), not the list agent chat. Definitions came from `scout_list_view_prompts.md`; underlying spec in `scout_manual_setup_checklist.md`.
   - **List A ("Inbox Action Register") — ALL 8 DONE & verified live:** Open Actions, Needs Review, Drafts Awaiting Approval, Dead-Letter, By Lane, By Mailbox Source, Overdue (manual `[Today]` filter), Stale — Review to Close (manual). One known data-mismatch: **"Confidence Band" column does not exist** in List A at all (full A–Z scan confirmed) — Needs Review view uses only "Confidence" instead; flag to Gina if the dashboard needs a literal band field.
   - **List B ("Subscription Register") — ALL 4 DONE & verified live:** All Subscriptions, Unsubscribe Candidates, By Type, Noisiest Senders.
   - **List C ("User Profile Register") — ALL 4 DONE & verified live:** All Profiles ✅, Active Instances ✅ (filter Onboarding Complete=Yes), Incomplete Onboarding ✅ (filter Onboarding Complete=No, sort Onboarding Date ascending, columns Display Name/UPN-Email/Department/Onboarding Date/Onboarding Complete — verified empty since Gina's seed row is Yes), Schema Drift Check ✅ (group by Schema Version, sort Display Name ascending, columns Display Name/UPN-Email/Schema Version/Onboarding Complete — verified showing "Schema Version: v4 (1)" group). **Views step is now fully complete across all three lists (A/B/C).**
   - **Gotcha confirmed again:** after saving a view via classic "Edit current view", the modern list UI can show stale content (old columns/rows, no filter pill) for several seconds even on a hard navigate to the view's direct URL — this is server-side view-definition propagation delay, not just browser cache. Fix: wait ~8-10 seconds and reload; don't conclude the save failed just because the first reload looks stale. Confirmed correct by re-opening "Edit current view" immediately after save (shows the true saved state) and by waiting before reload.
   - **Build method that works:** navigate to the list's current view URL → click "+ Add view" (may need a second click if the modal doesn't appear the first time) → name it → Cancel the stray duplicate-name modal that sometimes pops after → open the view dropdown (▾) → "Edit current view" → this opens a NEW TAB with the classic ASPX editor → set Display columns first (checkboxes, alphabetical-ish list, watch for reused checked state inherited from the previous view), then scroll to Sort (native `<select>`, type-ahead works, then click the ascending/descending radio — click carefully, the layout shifts after typing) and Filter (native selects; 2 clauses show by default, click "Show More Columns…" link to reveal a 3rd clause row for And-chains) → scroll to top → OK to save. Always reload the list page after saving; the modern UI sometimes shows stale columns from cache until refreshed.
   - **Gotcha repeated across builds:** the browser_batch tool defaults to the *active* tab when `tabId` is omitted — always pass explicit `tabId` for every action or clicks can land on the wrong tab (happened once, accidentally selected a row in the underlying list).
3. Tempo (Flow 5a) — set Follow-Up Date from §1a windows using Priority + Digest Lane + Received/Last Status Change (+ List C business hours). **Refinement:** windows encode response **SLAs** (initial-response vs. resolution target), tighter for High than FYI. SharePoint Update item + Planner as needed (no Compose).
4. List B upsert branch inside Sorter — gated by the **Buyback rule** (conservative 3-signal: `Priority=Low AND Recipient Scope≠Direct to Me AND Category∈{Promotions/Misc,FYI,Newsletters}`). Diverted mail still gets a register row (metrics stay complete); then Get items by Sender Domain → Update or Create.
5. Watchdog (Flow 6) — **two digest passes/day** (~10 AM & 5 PM ET, Martell's twice-daily inbox-zero cadence) to List C Digest Channel + **immediate pings for High / Direct-to-Me breaches**; compute REAL aging in-flow (the calculated Days Since Received doesn't refresh daily).
6. Sweep (Flow 8) — on Status→Done/Reference, Outlook move to BSSI Hub/Done or /Reference (create those Outlook folders first); on lookup fail write to Notes.
7. Courier (Flow 9) — **send-only (Gina writes drafts, no AI drafting)**; on Draft Status=Approved to Send → Outlook send, stamp Sent, **set Waiting On**, flip Status=Done. Backed by a **response-template library** (Martell pass/decline templates rewritten in FBCG/Gina voice — never a generic assistant).
8. **Steward (NEW disposition stage)** — M365-native reversible mailbox cleanup. Register keeps all metrics; then a scheduled flow groups handled+aged items by category and sends a batch **Approvals** card ("Archive N [Category] older than X days?") → on approve, move those emails to category Archive folders / Online Archive, or a "Proposed for Deletion" holding folder Gina empties herself. **No PST, no hard delete** (PST rejected — pulls records out of M365, unsearchable, non-compliant, not automatable; see memory). Prereqs: new List A `Disposition` column (via LIST agent), Outlook folder tree, admin-enable Online Archive + retention policy.
9. (Deferred) Echo backfill, Step 0.5 credit gate — largely moot if classification stays rules/AI-prompt; revisit if AI Builder credits apply.

**Dashboard metrics (Power Apps, from Martell):** Time Saved · Cost (labor vs. automation) · Output Consistency (% approved w/o edits) · ROI = (Savings + Revenue Lift − AI Cost) ÷ AI Cost.

## Finalization decisions (weekend build) — recommended defaults + open items
Defaults are LOCKED unless Gina overrides. Open items need her input (flagged ⧗).
- **Build order:** Views (List A/B/C) → Tempo → List B (Buyback gate) → Watchdog → Sweep → Courier → Steward. Then dashboard polish + Copilot layer.
- **Intent layer:** DEFAULT = keep encoding intent via existing fields (Priority + Status + Action Owner + Recipient Scope); do NOT expand the frozen 13-key classifier contract. (Revisit only if routing proves too coarse.)
- **Tempo SLA windows:** High / Direct-to-Me = respond same business day, resolve 2 business days · Normal = 2 / 5 · Low = 5 / best-effort · FYI/Promotions = none.
- **Watchdog:** two digest passes/day ≈ 10 AM & 5 PM ET (⧗ confirm timezone) + immediate pings for High / Direct-to-Me breaches.
- **Steward archive ages:** Promotions/FYI/Newsletters 30 days · Reference 90 · Done 60 · obvious junk → "Proposed for Deletion" holding folder Gina empties. No PST, no hard delete.
- **Dashboard:** Power Apps over List A/B/C; metrics = Time Saved · Cost · Output Consistency (% approved w/o edits) · ROI. ⧗ **Copilot Q&A layer** — decide M365 Copilot vs Copilot Studio agent over the SharePoint data.
- ⧗ **AI middle tier:** OpenRouter recommended (Gina to get a key) — else stay on rule-based fallback.
- ⧗ **Future-phase sources (meeting notes → action items → projects → Planner → Loop):** confirm what feeds *transactions* (NetSuite?) and *meeting summaries* (Teams/Zoom/Copilot?).
- **Build approach:** sub-agents (Sonnet) for parallel prep/content/spec (Courier template library, Steward flow spec, view definitions); Claude Chrome (interactive, this session) for the live Power Automate / SharePoint building.

## Key facts to carry
- Role: Business Systems & Solutions Manager (M365 profile still shows old title). No shared mailboxes in pilot. Teams = new BSSI channel.
- Rule R1 (platform≠category, use Source System) and R6 (owner-vs-informed) are the backbone of classification.
- Choice values must match the lists exactly (en-dash "–", not hyphen).
- Calculated TODAY() columns don't auto-refresh — Watchdog does real aging.

## Local environment setup (this computer, 2026-07-04 evening) — for continuity across computers
Gina is moving to work on another computer and asked to set up the ability to run multiple terminal-based Claude Code sessions on **this** machine for later. Findings + what was done:
- **Before today:** this machine had no standalone `claude` CLI, no Node.js, no npm — Claude Code was only running via the **Claude Desktop app** (bundles its own Node runtime, not exposed to a normal terminal). Windows Terminal (`wt.exe`) was already installed.
- **Installed today:** Node.js LTS v24.18.0 via `winget install --id OpenJS.NodeJS.LTS` (required a UAC admin-approval click — cannot be scripted/approved remotely), then `npm install -g @anthropic-ai/claude-code` (CLI v2.1.201). Both `C:\Program Files\nodejs\` and `%APPDATA%\npm` are confirmed in the **permanent** Machine/User PATH (registry-level), so `claude`, `node`, `npm` will work in **any new** terminal window/tab from now on — no per-session setup needed.
- **Result:** Opening Windows Terminal (or Git Bash, or plain PowerShell) and typing `claude` now starts an independent CLI session. This means multiple Windows Terminal tabs can each run their own fully independent Claude Code session in parallel — separate from the in-conversation `Agent` subagent tool (which spawns scoped helper agents *within* one session, not standalone parallel sessions).
- **Deferred:** git worktrees for parallel sessions on this same repo — held off for now (repo also lives inside OneDrive sync scope, which can conflict with git's `.git` locking across multiple worktrees). Revisit only if parallel work on this exact repo is needed later; recommended approach when revisited: create worktrees in a **non-OneDrive** local path.

## GitHub sync — set up 2026-07-04 evening, for working across two computers
Goal: keep two computers (this one + Gina's other machine) in sync on this project, using a private GitHub repo as the source of truth (OneDrive already syncs plain files, but git's internal `.git` folder doesn't sync reliably over OneDrive — GitHub is the real fix for that).
- **GitHub account:** `focusedclarity` (email `focusedclarity@icloud.com`).
- **Repo:** `https://github.com/focusedclarity/fbcg-work-intelligence-hub` (private). This computer's project is pushed there; local `main` is tracking `origin/main` and is fully in sync as of this commit.
- **Installed to make this work:** GitHub CLI (`gh`) via winget, then authenticated via `gh auth login --web` (device-code flow — needs a one-time manual code entry at github.com/login/device, can't be automated) and `gh auth setup-git` to wire git itself to use that login for push/pull.
- **Local git identity set:** `user.name = focusedclarity`, `user.email = focusedclarity@icloud.com`.
- **History:** local project was committed fresh (`git add -A` + commit — `.gitignore` already excludes `.env`, `CLAUDE.local.md`, `.claude/settings.local.json`, `node_modules/`), then merged with the repo's pre-existing default README via `git merge origin/main --allow-unrelated-histories`, then pushed.
- **To set up the OTHER computer so it's in sync:** the simplest path is to `git clone https://github.com/focusedclarity/fbcg-work-intelligence-hub.git` into a local (ideally non-OneDrive) folder there, install `gh` + Node/Claude CLI the same way as documented above if not already present, and `gh auth login` again there (each machine needs its own login). From then on: `git pull` before starting work, `git add -A && git commit -m "..." && git push` when done, on whichever computer you're using.
- **Not yet done:** worktrees for parallel Claude sessions (deferred, see above) — can be layered on top of this GitHub setup on either machine whenever wanted, independent of the cross-computer sync.

### Second computer — setup IN PROGRESS, paused mid-way (2026-07-04 night)
Status on Gina's other computer, to resume from exactly here:
- ✅ Node.js installed, ✅ Claude Code CLI installed (`npm.cmd install -g @anthropic-ai/claude-code` — had to use `.cmd` explicitly because plain `npm` is blocked by that machine's PowerShell script-execution policy), ✅ GitHub CLI installed, ✅ `gh auth login` completed and authorized as `focusedclarity`, ✅ Git for Windows was already installed but **not on PATH** (fixed by appending `C:\Program Files\Git\cmd` to that user's permanent PATH via `[Environment]::SetEnvironmentVariable`), ✅ repo cloned successfully into `C:\dev\fbcg-work-intelligence-hub` (confirmed all folders/files present, non-OneDrive location as intended).
- ❌ **BLOCKED:** running `claude` from that cloned folder still gives "term not recognized." Same PATH pattern as the git issue — the fix given (append `$env:APPDATA\npm` to that user's permanent PATH, then fully close **all** terminal windows and reopen fresh) was applied but the error persisted on the same attempt; **not yet root-caused**. Gina paused here to resume later.
- **Next steps when resuming:** (1) confirm the npm global folder actually contains the `claude`/`claude.cmd`/`claude.ps1` shims on that machine (`dir $env:APPDATA\npm` — if missing, the earlier `npm.cmd install -g` may not have completed cleanly and needs re-running); (2) confirm the PATH edit actually persisted (`[Environment]::GetEnvironmentVariable("Path","User")` should show `...\AppData\Roaming\npm` in it); (3) if both check out but `claude` still isn't found, try invoking the full path directly as a workaround (`& "$env:APPDATA\npm\claude.cmd"`) to isolate whether it's still a PATH-refresh issue vs. something else (e.g. a corrupted/incomplete npm install).
- **General lesson learned across this whole setup (both computers):** on Windows, freshly-installed CLI tools (Node, Git, GitHub CLI, npm global packages) only become visible to **brand-new** terminal processes opened *after* the permanent PATH was updated — existing terminal windows/tabs, even "new tabs" within an already-running Windows Terminal instance, keep the stale PATH they inherited at launch. Always fully close the whole terminal application (not just a tab) and relaunch before assuming an install "didn't work."

## File inventory — `Desktop\Claude\PhaseU\`
- Phase U deliverables: `phaseU_SUMMARY.md`, `phaseU_sender_map.md`, `phaseU_volume_histogram.csv`/`.md`, `phaseU_trigger_words.md`, `phaseU_outlook_audit.md`, `phaseU_taxonomy_v4.md` (FROZEN), `phaseU_stress_test_protocol.md`.
- Provisioning: `scout_manual_setup_checklist.md` (used), `scout_listA/B/C_columns.json`, `scout_provisioning_payloads.json`, `scout_flow0_build.md`, `scout_list_view_prompts.md` (paste-ready view prompts, all 3 lists).
- Sorter: `sorter_classifier_prompt.md` (AI-step instructions), `sorter_flow1_rulesbased_build.md` (full-Power-Automate version).
- Orchestration: `BUILD_RUNBOOK.md`, this `HANDOFF.md`.
- Source spec: `Downloads\Work_Action_Intelligence_Hub_Automation_Spec_v4.md`; List B/C defs: `Downloads\List_B_and_C_Definitions_v1.md`.

---

## PASTE THIS TO OPEN THE NEW SESSION
```
Continuing the Work Action Intelligence Hub — weekend build to finalize. Read this HANDOFF.md fully, the frozen taxonomy phaseU_taxonomy_v4.md, and memory: hub-build-progress, hub-design-playbooks, exec-assistant-setup, sorter-fallback-classifier, outlook-owa-deeplink-pattern. Also skim references\playbooks\ (Martell x2 + Herk distillations) and the design-memo artifact.

STATE: Sorter (Flow 1) is LIVE/tested/credit-resilient (AI Builder + rule-based fallback) and writes an Outlook-Web deep link to List A's Web Link column. Lists A/B/C exist on site m365appbuilder-app-3155. Vision = one Power Apps "Intelligence Hub" dashboard over the SharePoint lists (agents/emails/transactions/meeting-summaries/action-items) with reports + a Copilot Q&A layer. Three layers: Hub flows = hands, Claude Code repo at Desktop\Claude = brain (exec-assistant build, Phase 1 done / Phase 2 interview paused at Section 1), dashboard = single pane of glass.

PICK UP AT: Step 2 "Create views" is now COMPLETE — all views across Lists A/B/C (8+4+4) are built and verified live. Next: Tempo (Flow 5a, SLA-driven follow-up windows) → List B upsert branch inside Sorter (Buyback gate) → Watchdog (Flow 6, two digest passes/day) → Sweep → Courier → Steward. Also still need to resolve the ⧗ open items in "Finalization decisions" (Copilot layer choice, OpenRouter key, transactions/meeting sources). Model: Opus 4.8, high effort for planning / medium for execution.

SEPARATE SIDE TASK, ALSO PAUSED: setting up GitHub sync + CLI on Gina's SECOND computer so both machines can run Claude Code and stay in sync via https://github.com/focusedclarity/fbcg-work-intelligence-hub. See "Second computer — setup IN PROGRESS" section above for exact status — everything worked except the final `claude` command isn't found yet after cloning (npm PATH issue, not yet root-caused). Resume there if Gina brings this up.
```
