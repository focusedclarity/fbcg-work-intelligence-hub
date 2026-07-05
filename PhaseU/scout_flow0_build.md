# Scout (Flow 0) — Power Automate build guide

Builds Lists A, B, C from `scout_provisioning_payloads.json`. Written so the flow is a simple **loop + one HTTP action** — no in-designer XML building (the payloads are pre-rendered). This one-off provisioning flow **is** Scout; keep it, and it's your replication template for the next tester.

## Prereqs
- Standard user Power Automate (no admin). Connections: **Office 365 Users**, **SharePoint** (your own account), optionally **Teams**.
- Upload `scout_provisioning_payloads.json` to a known OneDrive folder (or paste its contents into a Compose action — see step 3).
- **Do the TEST run first** (spec §2): set `TestSuffix = " TEST"` (step 2) so lists are created as "Inbox Action Register TEST" etc. Verify, delete, then run clean with `TestSuffix = ""`.

## Internal-name map (deliberate — tell downstream flows)
Two fields use an internal name ≠ display name to avoid reserved/collision issues. Sorter/Tempo/Watchdog/Sweep must reference the **internal** name:
- List A **Status** → internal **`HubStatus`**
- List B **Status** → internal **`SubStatus`**
All other internal names equal the `Name=` in the SchemaXml (no spaces), e.g. `BusinessCategory`, `DigestLane`, `SourceSystem`, `ActionOwner`, `FollowUpDate`, `DaysSinceReceived`, `ConfidenceBand`.

## Flow steps

**1. Trigger** — *Manually trigger a flow* (or a Teams "button"). Run by the tester.

**2. Initialize variables**
- `TestSuffix` (String) = `""`  (set to `" TEST"` for the dry run).
- `SiteUrl` (String) — leave blank; set in step 4.

**3. Get the payloads**
- Either **OneDrive → Get file content** on `scout_provisioning_payloads.json`, then **Parse JSON** (use the file as sample to generate schema);
- or **Compose** the JSON inline and **Parse JSON** that. Call the parsed output `Payloads`.

**4. Resolve the site live** (fixes the hardcoded-URL problem, spec §2)
- **Office 365 Users → Get my profile (V2)**.
- The target is the tester's OneDrive/personal site. Set `SiteUrl` = your personal SharePoint root (e.g. `https://{tenant}-my.sharepoint.com/personal/{upn_with_underscores}`). Derive from the profile's mail/UPN rather than typing it. All SharePoint HTTP actions below use `Site Address = SiteUrl`.

**5. Apply to each LIST** — `@Payloads('lists')`  (leave concurrency default here)
  For each list object `L`:

  **5a. Create the list** — *Send an HTTP request to SharePoint*
  - Site Address: `SiteUrl`
  - Method: `POST`
  - Uri: `_api/web/lists`
  - Headers: `{ "Accept":"application/json;odata=verbose", "Content-Type":"application/json;odata=verbose" }`
  - Body: `L.createListBody` but set `Title` = `concat(L.createListBody.Title, variables('TestSuffix'))`.
  - *(Idempotency: precede with a GET `_api/web/lists/getbytitle('...')` inside a Scope with "Configure run after → has failed" to skip-if-exists, or just run against a clean location.)*

  **5b. Rename Title** — *Send an HTTP request to SharePoint*
  - Method: `POST`; Uri: `L.titleMerge.endpoint` (add `TestSuffix` into the list title in the getbytitle path if testing).
  - Headers: add `"X-HTTP-Method":"MERGE"` and `"IF-MATCH":"*"` to the JSON headers above.
  - Body: `L.titleMerge.body`.

  **5c. Apply to each FIELD** — `L.fields` — **set this loop's Concurrency Control = ON, Degree = 1** (sequential, so calculated fields land after their inputs)
  - *Send an HTTP request to SharePoint*
  - Method: `POST`
  - Uri: `_api/web/lists/getbytitle('{concat(L.title, TestSuffix)}')/fields/createfieldasxml`
  - Headers: the odata=verbose Accept/Content-Type pair.
  - Body:
    ```json
    { "parameters": { "__metadata": { "type": "SP.XmlSchemaFieldCreationInformation" },
        "SchemaXml": "@{item()}", "Options": 12 } }
    ```
    (`item()` is the current SchemaXml string.)

  **5d. Apply to each VIEW** — `L.views`
  - *Send an HTTP request to SharePoint*, Method `POST`, Uri `_api/web/lists/getbytitle('{concat(L.title, TestSuffix)}')/views`
  - Body:
    ```json
    { "__metadata": { "type": "SP.View" }, "Title": "@{item()?['title']}", "PersonalView": false,
      "ViewQuery": "@{item()?['viewQuery']}" }
    ```
  - Then set the view's fields: for each `item()?['viewFields']`, POST to `.../views/getbytitle('{title}')/viewfields/addviewfield('{fieldInternalName}')`. (Simplest: a nested Apply-to-each over `viewFields`.)

**6. Onboarding intake → write List C row** (spec §2 steps 8–9)
- Present the five cards (Microsoft Form or Teams adaptive card): Department, Reports To, Key Systems, Key Contacts, Priority Trigger Words. *For the pilot these are already known from Phase U — you can pre-fill.*
- **SharePoint → Create item** in `User Profile Register`: Title = your name, `UPNEmail` = profile mail, `SchemaVersion` = `v4`, `OnboardingDate` = `utcNow()`, plus the five card fields, `AdditionalMailboxes` = empty, `DigestChannel` = `Teams`, `BusinessHoursStart`/`End` = `9:00 AM`/`5:00 PM`.
- **Gate check:** only set `OnboardingComplete = Yes` once all five card fields are non-empty (a Condition). This is what activates Flows 1–10 for the user.

**7. Confirmation + roster**
- **Teams adaptive card** (or email) to the tester with links to the three new lists.
- **Log to Pilot Roster** (a small list on the shared BSSI site — metadata only: name, onboarding date, schema version). Solves silent-drift; no email content, so it respects the per-user privacy design.

## Verify (the point of the test run)
1. Open List A → confirm `Days Since Received` and `Confidence Band` show computed values on a test item (add one row with a Received Date + Confidence).
2. Confirm every choice column's dropdown lists the right values (spot-check Business Category = 18, Digest Lane = 7, Source System = 14).
3. Confirm the 8 List A views exist, especially **Stale — Review to Close** and **Needs Review**.
4. Repeat for B (4 views) and C (4 views).
5. If all good: delete the TEST lists, set `TestSuffix = ""`, run once more for the real lists.

## Gotchas (already handled, don't re-introduce)
- **Field loop must be sequential** (Concurrency = 1) — calculated fields reference `ReceivedDate` / `Confidence`.
- **odata=verbose headers** on every SharePoint HTTP call, and `X-HTTP-Method: MERGE` + `IF-MATCH: *` on the Title rename.
- **UTF-8** body — the en-dash (–) in category names must survive; don't let a copy step mangle it to a hyphen (Sorter's enum match is exact).
- **TODAY() caveat** — `Days Since Received` won't refresh daily on its own; Watchdog computes real aging in-flow. Don't wire follow-up rules to that column.
- **Internal names** `HubStatus` / `SubStatus` (see map above) — use them in every downstream flow and in Sorter's write step.
