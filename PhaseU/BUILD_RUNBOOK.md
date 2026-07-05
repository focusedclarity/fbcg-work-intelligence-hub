# Work Action Hub — Build Runbook (pilot, step-by-step)

Sequenced, click-level. **Automated where possible** (Sorter is a real flow); **manual only where the environment blocks it** (list/column/view creation — no HTTP/OneDrive connector here). Do the parts in order; each part has a "done when" check.

Site: `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155`
Files referenced: `scout_manual_setup_checklist.md`, `sorter_flow1_rulesbased_build.md`.

---

## PART 0 — Prep (5 min)
1. Confirm you're a **Member or Owner** of the site (you need "create list" rights): site → **Settings ⚙ → Site permissions**. If you're not, request it before continuing.
2. Open two browser tabs: the **site**, and **Power Automate** (the flow maker in your environment).
3. Have `scout_manual_setup_checklist.md` and `sorter_flow1_rulesbased_build.md` open for copy-paste.

---

## PART 1 — Create List A "Inbox Action Register"  (manual; ~25 min)
> Why manual: this environment can't run the provisioning HTTP calls. One-time only.

**1.1 Create the list**
1. Site → **+ New → List → Blank list**.
2. Name: `Inbox Action Register` → **Create**.

**1.2 Rename the Title column**
1. In the new list: **Settings ⚙ → List settings**.
2. Under Columns, click **Title** → change "Column name" to `Email Subject` → **OK**. (Leave everything else.)

**1.3 Add each column** — for every row in the List A table of `scout_manual_setup_checklist.md`, use **+ Add column** in the list view. The mechanic per type:
- **Single line of text / Multiple lines of text / Number / Yes/No / Hyperlink / Date and time:** pick the type → type the exact name → set the setting noted (decimals, required, date-only vs with-time) → **Save**.
- **Choice:** pick **Choice** → name it → paste the choices (one per line) into "Choices" → set **"Allow multiple selections" = No** → set default if the checklist lists one → set **"Can add values manually"** = Yes only where the checklist says allow fill-in → **Save**.
- **Calculated (`Days Since Received`, `Confidence Band`):** **+ Add column → More…** (opens the classic dialog) → name it → select **"Calculated (calculation based on other columns)"** → paste the formula from the checklist → set the result type (Number 0-dec, or Text) → **OK**.

> **Order matters:** create **Received Date** and **Confidence** *before* their calculated columns, or the formula can't find them.

**1.4 Create the 8 views** — List → the view dropdown (top-right, says "All Items") → **Create new view**. For each view in the checklist: name it, then after it's created use **Filter** / **Group by** / **Sort** from the toolbar to match the checklist, then **Save view**.

**✅ Done when:** you can add a test item and see `Days Since Received` and `Confidence Band` compute, all dropdowns show the right choices, and the 8 views exist (especially **Needs Review** and **Stale — Review to Close**). Delete the test item.

---

## PART 2 — Create List B "Subscription Register" & List C "User Profile Register" (manual; ~15 min)
Repeat Part 1's mechanics using the **List B** and **List C** tables in the checklist. Renames: B Title → `Sender Domain`, C Title → `Display Name`. No calculated columns in B or C, so it's faster.

**Seed your List C row:** open List C → **+ New** → fill Display Name = your name, UPN/Email = gthomas@fbcglenarden.org, Schema Version = v4, Onboarding Date = today, the five card fields (pilot values are in the checklist), Additional Mailboxes = blank, Digest Channel = Teams, Business-Hours 9:00 AM / 5:00 PM → **Save**. Then edit the row and set **Onboarding Complete = Yes** (the activation gate).

**✅ Done when:** all three lists exist with their columns/views, and your List C row shows Onboarding Complete = Yes.

---

## PART 3 — Build Sorter (Flow 1) — automated (~30 min)
This is the automated piece. Build it in the Power Automate designer.

**3.1 Create the flow**
1. Power Automate → **Create → Automated cloud flow**.
2. Name: `Sorter — Classify Inbox`. Trigger: search **"When a new email arrives (V3)"** (Office 365 Outlook) → **Create**.
3. In the trigger: **Folder** = Inbox. Click **Show advanced options** → Include Attachments = No, Only with Attachments = No.

**3.2 Add the helper Compose actions** (7 of them). For each:
1. **+ New step → Compose** (search "Compose", under Data Operation).
2. Rename it (click the action's title, type the exact name from §"Helper Compose actions" in `sorter_flow1_rulesbased_build.md`, e.g. `subjL`).
3. Click the **Inputs** box → the **fx / Expression** tab → paste that Compose's expression → **OK**.
4. Repeat in this order: **subjL, bodyL, domain, toL, ccL, recipientScope, SourceSystem**. (Order matters — `recipientScope` uses `toL`/`ccL`; `SourceSystem` uses `domain`.)

**3.3 Add the classification Composes** (same add-Compose-then-paste-expression mechanic), in this order so each can reference the ones above:
1. `BusinessCategory` — paste the big 17-rule expression.
2. `ActionOwner`
3. `BaseLane`
4. `DigestLane`
5. `Pillar`
6. `Priority`
7. `Reviewed`
8. `Confidence`
9. `Status`
(All expressions are in `sorter_flow1_rulesbased_build.md`, copy each verbatim. Tip: paste into the expression editor, not the plain box, and make sure the en-dash `–` survives — copy the category names from your List A choice column if unsure.)

**3.4 Add Create item**
1. **+ New step → SharePoint → Create item.**
2. **Site Address:** the site URL above (pick from the list or "Enter custom value").
3. **List Name:** Inbox Action Register.
4. Map each column per the **Create item table** in `sorter_flow1_rulesbased_build.md`:
   - For Compose outputs, use the dynamic-content picker (the `Outputs` of the matching Compose) or the expression `outputs('BusinessCategory')` etc.
   - For trigger fields (Subject, From, Received Date, Web Link, Message Id, Has Attachments), pick them from the trigger's dynamic content.
   - Confidence → wrap as `int(outputs('Confidence'))`.
5. Leave Follow-Up Date / Owner / Waiting On / Draft Status empty.

**3.5 Save & test**
1. **Save.**
2. **Test → Manually → Run** (or send yourself an email). Forward yourself ~5 representative messages: a Smartsheet contract notice, an "Inspection Report … submitted", a "Something went wrong … Data Shuttle", a promo (e.g., a restaurant newsletter), and a direct internal request.
3. Open **Inbox Action Register** and confirm each row's Category/Lane/Priority looks right, and that the content-dependent ones show **Reviewed = No** in the Needs Review view.
4. If a run errors: open **Flow → Run history → the failed run**, click the red action to see the message (usual causes: a Compose referenced before it's created — fix order; or a choice value mismatch — check the en-dash).

**✅ Done when:** new inbox mail auto-creates classified rows, and uncertain items land in Needs Review.

---

## PART 4 — Tune (ongoing, no code)
The only tuning surface is the keyword lists inside the `BusinessCategory` Compose. When you spot a miss (e.g., a new vendor sends promos), add its domain/phrase to the right branch and Save. No other action changes.

---

## PART 5 — Next flows (say the word and I'll build each like Part 3)
- **Tempo (Flow 5a)** — on item create/modify, if Follow-Up Date is blank, set it from the §1a windows using Priority + Digest Lane + Received/Last Status Change (+ List C business hours). All doable with SharePoint Update item + expressions.
- **List B upsert branch** — inside Sorter, when Category = PROMOTIONS/MISC or FYI: SharePoint **Get items** (filter Sender Domain = this domain) → if found **Update item** (MessageCount +1, Last Seen now) else **Create item**.
- **Watchdog (Flow 6)** — Recurrence daily → Get items (open) → compute real aging (`utcNow()` − Received/Last Status Change, fixing the TODAY() caveat) → escalate/flag per §1b → Teams or email per List C Digest Channel.
- **Sweep (Flow 8)** — on Status → Done/Reference → Outlook move message to `BSSI Hub/Done` or `/Reference` (create those Outlook folders first); on lookup failure write to Notes (spec §4).
- **Courier (Flow 9)** — on Draft Status = Approved to Send → Outlook send → stamp Sent → flip Status = Done.

---

## Environment reality check (so nothing surprises you)
- **List/column/view creation stays manual** here — no connector supports it. That's a one-time cost; everything operational is automated.
- **Sweep/Courier need Outlook actions** (move/send) — those ARE supported (Office 365 Outlook is on your list), so they'll build fine.
- **No AI** used anywhere — Sorter is pure rules, so zero AI Builder credits and no Step 0.5 gate needed for rules-covered mail.
