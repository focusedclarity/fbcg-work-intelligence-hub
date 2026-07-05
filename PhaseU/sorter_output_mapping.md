# Sorter (Flow 1) — AI Output → List A Column Mapping

**Purpose:** The authoritative "Create item" mapping for the Sorter flow in the restricted workflow agent
(Approvals / Outlook / Planner / SharePoint list-item / Teams / AI-prompt only — NO Compose/variables/HTTP).
**List A:** `Inbox Action Register` on site `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155` (Site Address must be the FULL URL — the short name errors with "Site Address … is not valid").
**Source of truth:** `phaseU_taxonomy_v4.md` (FROZEN) + `scout_listA_columns.json` + `sorter_classifier_prompt.md`.

---

## Recommended AI prompt-step outputs (13 for pilot)

Define these as the AI step's **named outputs** (structured), because the restricted agent has no JSON-parse.

| # | AI output name | Type | → List A column | Notes |
|---|---|---|---|---|
| 1 | `businessCategory` | Text (enum) | Business Category | 18 enums, **en-dash "–"** exact |
| 2 | `digestLane` | Text (enum) | Digest Lane | 7 enums |
| 3 | `sourceSystem` | Text (enum) | Source System | fillInChoice=true, tolerant |
| 4 | `pillar` | Text (enum) | Pillar | P1–P6 / Ops-Admin / N/A |
| 5 | `actionOwner` | Text (enum) | Action Owner | Me / Someone Else / None |
| 6 | `owner` | Text | Owner | ADDED — Watchdog target |
| 7 | `priority` | Text (enum) | Priority | Critical/High/Normal/Low |
| 8 | `status` | Text (enum) | Status | Sorter emits New/Waiting/Blocked/Reference only |
| 9 | `dueDateStated` | Date | Due Date Stated | ADDED — Tempo override; may be blank |
| 10 | `reviewed` | Text (enum) | Reviewed | Yes / No |
| 11 | `confidence` | Number | Confidence | 0–100 |
| 12 | `recipientScope` | Text (enum) | Recipient Scope | ADDED to prompt (see patch) |
| 13 | `triggerWordsHit` | Text | Trigger Words Hit | ADDED — keep for pilot debugging |

**Skipped for pilot** (use column default or a later flow): `waitingOn` (add post-pilot), `suggestedFlag`
(default None; Watchdog sets Today), `pillarRationale` (audit only).

---

## Fields sourced from the TRIGGER (not AI)

Map directly from "When a new email arrives (V3)" dynamic content:

| List A column | Trigger dynamic content |
|---|---|
| Email Subject (Title) | Subject |
| Received Date | Received Time |
| Sender | From |
| Has Attachments | Has Attachment |
| Source Link / Message ID | Message Id |

---

## Fields set to a DEFAULT / expression at Create

| List A column | Value | How (no-Compose) |
|---|---|---|
| Mailbox Source | `Primary` | Type the literal, or rely on column default |
| Classified Date | now | Inline expression `utcNow()` in the field. If the agent blocks expressions, fall back to mapping Received Time. |
| Last Status Change | now | Same as above — `utcNow()` (fallback: Received Time) |
| Follow-Up Date | *(blank)* | Tempo/Flow 5a writes it |
| Draft Status | `None` | Column default |
| Suggested Flag | `None` | Column default |

## Fields left BLANK for pilot

`Sender Domain` (needs string-split; no Compose — add to AI outputs later if reporting needs it),
`Web Link` (V3 trigger doesn't reliably expose it), `Notes`, `Waiting On`, `Pillar Rationale`.
Calculated columns `Days Since Received` and `Confidence Band` populate themselves.

---

## Prompt patch required (recipientScope as an output)

`sorter_classifier_prompt.md` currently treats `recipientScope` as an INPUT. In the no-Compose agent we
can't compute To-vs-CC in-flow, so let the model infer it. Add to RULE 0's JSON contract:

```
  "recipientScope": "Direct to Me | CC | Distribution List",
```

And add a short instruction near RULE 4:
> **recipientScope:** Set `"Direct to Me"` if gthomas@fbcglenarden.org is in To; `"CC"` if only in Cc;
> `"Distribution List"` if reached via a group/DL address. Feed To and Cc to the model.

(Enum matches the Recipient Scope column choices exactly.)

---

## Critical gotchas to watch during testing

1. **EN-DASH "–" not hyphen "-".** Business Category and several enums use an en-dash. `Business Category`
   and `Digest Lane` are `fillInChoice=false`, so a hyphen version will **fail the Create item** with
   "The specified value is not valid." If GPT keeps emitting hyphens, either (a) reinforce in the prompt
   with the exact strings, or (b) temporarily set those two columns `fillInChoice=true` during pilot.
2. **Confidence < 60 or enum-miss → Reviewed=No.** The prompt already does this; verify the row lands
   with Reviewed=No rather than erroring.
3. **utcNow() availability.** Inline expressions usually work even without the Compose action; if your
   agent's field editor won't accept `utcNow()`, fall back to Received Time for both date-stamp columns.
4. **DueDateStated empty string breaks Create item.** SharePoint's date column rejects `""` (`OpenApiOperationParameterTypeConversionFailed`, requires `String/date`). Fixed live 2026-07-04 by wrapping the field mapping in `if(empty(body('Parse_JSON')?['dueDateStated']),null,body('Parse_JSON')?['dueDateStated'])`. This bug was latent from the start (both the AI Builder path and the rule-based fallback can leave dueDateStated blank) but only surfaced once a run actually reached Create item — see `sorter-fallback-classifier` memory.

## AI Builder credit exhaustion (added 2026-07-04)

The AI step ended up being AI Builder **"Run a prompt"** (GPT-4.1 mini, custom prompt "Sorter – Email Classifier (13-key JSON)"), not the originally-planned named-outputs design above — same 13-key contract, but the model returns raw JSON text parsed by a `Parse JSON` action rather than 13 separate structured outputs. When the environment's AI Builder/Copilot credits are exhausted, `Run a prompt` fails with `Forbidden`. A rule-based fallback (keyword/trigger-word matching, no AI) now catches this and still writes a row with `confidence=30, reviewed=No` so it's flagged for manual review. Full design in memory `sorter-fallback-classifier`. Planned next: an OpenAI API middle tier (blocked on Gina getting a platform.openai.com key) between AI Builder and the rule-based fallback.
