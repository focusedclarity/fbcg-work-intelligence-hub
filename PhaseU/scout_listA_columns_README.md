# Scout (Flow 0) — List A column provisioning: how to use `scout_listA_columns.json`

Generated from the **frozen Phase U taxonomy v4** (2026-07-03). This drives §2 steps 4–5 of the spec. **List B and List C** get their own arrays built the same way once their v3 schemas are confirmed; this file is List A (`Inbox Action Register`), 30 created fields + the Title rename.

## Order of operations in Scout
1. Create List A (§2 step 3).
2. **Rename Title → "Email Subject"** using the `titleRename` block (PATCH/MERGE the built-in Title — do **not** create a new field).
3. **Apply to each** over `.columns` → create each field. Use **`CreateFieldAsXml`** (recommended, below) or a typed JSON POST (alt, below).
4. Create the 7 views (§2 step 6), including the new **"Stale — Review to Close" / Needs Review** view filtered `Reviewed = No` AND `Status` not in (Done, Reference).

## Recommended: CreateFieldAsXml (uniform, controls internal name, survives special chars)
`POST {site}/_api/web/lists/getbytitle('Inbox Action Register')/fields/createfieldasxml`
Body:
```json
{ "parameters": { "__metadata": { "type": "SP.XmlSchemaFieldCreationInformation" }, "SchemaXml": "<Field .../>", "Options": 12 } }
```
`Options=12` = AddFieldInternalNameHint (8) + AddToDefaultContentType (4). Build `SchemaXml` from each column object:

- **Text** (`fieldTypeKind 2`): `<Field Type="Text" Name="{internalName}" DisplayName="{displayName}" MaxLength="{maxLength}" Required="{TRUE|FALSE}"/>`
- **Note** (3): `<Field Type="Note" Name="..." DisplayName="..." NumLines="{numLines}" RichText="FALSE" Required="..."/>`
- **DateTime** (4): `<Field Type="DateTime" Name="..." DisplayName="..." Format="{DateOnly|DateTime}" Required="..."/>`
- **Choice** (6): `<Field Type="Choice" Name="..." DisplayName="..." Format="Dropdown" FillInChoice="{TRUE|FALSE}"><Default>{default}</Default><CHOICES>` + one `<CHOICE>value</CHOICE>` per entry + `</CHOICES></Field>` (omit `<Default>` if none)
- **Number** (9): `<Field Type="Number" Name="..." DisplayName="..." Decimals="{numDecimals}" Min="{min}" Max="{max}" Required="..."/>`
- **Boolean** (8): `<Field Type="Boolean" Name="..." DisplayName="..."><Default>{0|1}</Default></Field>`
- **URL** (11): `<Field Type="URL" Name="..." DisplayName="..." Format="Hyperlink"/>`
- **Calculated** (17): see rendered XML below.

### XML-escaping (do this in the flow when building SchemaXml)
Escape in every value you inject: `&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`, `"`→`&quot;`. The **en-dash `–`** in the Business Category / lane names is a normal Unicode char and needs no escaping, but send the body UTF-8. None of the 18 frozen category names contain `&` (the old ampersand-heavy list is retired), so the classic REST ampersand gotcha the spec warned about is largely moot here — but keep the escaper in for the `>=`/`"` inside the two calculated formulas.

## The two calculated fields — rendered, ready to paste
```xml
<Field Type="Calculated" Name="DaysSinceReceived" DisplayName="Days Since Received" ResultType="Number" Decimals="0">
  <Formula>=TODAY()-[Received Date]</Formula>
  <FieldRefs><FieldRef Name="ReceivedDate"/></FieldRefs>
</Field>
```
```xml
<Field Type="Calculated" Name="ConfidenceBand" DisplayName="Confidence Band" ResultType="Text">
  <Formula>=IF([Confidence]&gt;=85,"High",IF([Confidence]&gt;=60,"Medium","Low"))</Formula>
  <FieldRefs><FieldRef Name="Confidence"/></FieldRefs>
</Field>
```
**Create order matters:** create `ReceivedDate` and `Confidence` **before** their dependent calculated fields, or the `FieldRef`/formula resolution fails. The JSON array is already ordered so each calculated field appears after its inputs — have Scout preserve array order (don't parallelize the Apply-to-each, or set concurrency = 1).

> ⚠️ **TODAY() caveat (important, not a bug in this file):** SharePoint calculated columns that use `TODAY()` only recompute when the item is edited — they do **not** roll over at midnight. So `Days Since Received` will look stale between edits. Do **not** build the follow-up/aging logic on this column. **Watchdog (Flow 6, daily recurrence)** should compute aging as `utcNow()`-`ReceivedDate` in-flow (or restamp a real number column each morning). The calculated column stays only as a convenience display.

## Alternative: typed JSON POST (if you prefer per-type bodies over XML)
`POST .../fields` with `__metadata.type` per kind, e.g. Choice:
```json
{ "__metadata": { "type": "SP.FieldChoice" }, "FieldTypeKind": 6, "Title": "Business Category",
  "Choices": { "__metadata": { "type": "Collection(Edm.String)" }, "results": ["…the 18…"] }, "EditFormat": 0 }
```
Works for Text/Note/DateTime/Number/Boolean/Choice. **Calculated via JSON POST is unreliable** — use CreateFieldAsXml for those two regardless of which path you pick for the rest. Internal names auto-generate from Title (spaces → `_x0020_`) unless you use the XML path, which is the other reason to prefer CreateFieldAsXml.

## What feeds Sorter (Flow 1) from here
- `BusinessCategory` + `DigestLane` choices = Sorter's classifier label set (verbatim from this file).
- Put **R1** at the very top of the classifier prompt (platform → `SourceSystem`, never the category) and include **R2, R5–R10** + the Needs-Review disposition (see `phaseU_taxonomy_v4.md`).
- `ActionOwner` (R6) is the primary driver of `DigestLane`/`Priority`: `Someone Else`/`None` → FYI/Reference lane and no follow-up clock.

## Dry-run reminder (spec §2 "Before building this")
Run this whole create sequence against a **disposable test list / second OneDrive** first. Calculated columns and choice creation are the fragile steps; verify `Days Since Received` and `Confidence Band` compute and every choice list renders before pointing Scout at the real pilot list.
