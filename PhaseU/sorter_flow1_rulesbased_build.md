# Sorter (Flow 1) — Rules-based build (no AI; environment-compatible)

Runs on the supported connectors only: **Office 365 Outlook** (trigger) + **SharePoint** (Create item) + Compose/expressions. Zero AI Builder credits. Implements the frozen taxonomy + rules R1–R10 deterministically; ambiguous mail → `Reviewed = No` (Needs Review view). Layer AI on the uncertain tail later if it becomes available.

**Target site:** `https://fbcglenarden.sharepoint.com/sites/m365appbuilder-app-3155` · **List:** Inbox Action Register.
**Prereq:** the three lists exist (per `scout_manual_setup_checklist.md`).

## Trigger
Office 365 Outlook → **When a new email arrives (V3)** · Folder = Inbox · Include Attachments = No · (optional) Only with attachments = No. (V3 exposes `from`, `subject`, `bodyPreview`, `toRecipients`, `ccRecipients`, `hasAttachments`, `receivedDateTime`, `webLink`, `messageId` / `internetMessageId`.)

## Helper Compose actions (create in this order)
Name them exactly; later expressions reference `outputs('...')`.

- **subjL** = `toLower(triggerBody()?['subject'])`
- **bodyL** = `toLower(triggerBody()?['bodyPreview'])`
- **domain** = `toLower(last(split(triggerBody()?['from'],'@')))`
- **toL** = `toLower(coalesce(triggerBody()?['toRecipients'],''))`
- **ccL** = `toLower(coalesce(triggerBody()?['ccRecipients'],''))`
- **recipientScope** = `if(contains(outputs('toL'),'gthomas@fbcglenarden.org'),'Direct to Me',if(contains(outputs('ccL'),'gthomas@fbcglenarden.org'),'CC','Distribution List'))`
- **SourceSystem** =
```
if(contains(outputs('domain'),'smartsheet'),'Smartsheet',if(contains(outputs('domain'),'nextprocess'),'NextProcess',if(contains(outputs('domain'),'netsuite'),'NetSuite',if(contains(outputs('domain'),'oracle'),'Oracle',if(contains(outputs('domain'),'adp.com'),'ADP',if(contains(outputs('domain'),'omegacorit'),'OmegaCor IT',if(contains(outputs('domain'),'docusign'),'DocuSign',if(contains(outputs('domain'),'zoom'),'Zoom',if(contains(outputs('domain'),'fbcglenarden'),'Internal Email','External Email')))))))))
```

## Compose: BusinessCategory  (ordered — first match wins; paste as one expression)
```
if(and(contains(outputs('subjL'),'inspection report'),contains(outputs('subjL'),'submitted')),'FACILITIES – Inspection Reports',
if(or(contains(outputs('subjL'),'something went wrong'),contains(outputs('subjL'),'not all recipients'),contains(outputs('subjL'),'has become invalid'),contains(outputs('subjL'),'data shuttle')),'ACTION – System Exception',
if(or(contains(outputs('subjL'),'ip validation failure'),and(contains(outputs('domain'),'omegacorit'),or(contains(outputs('subjL'),'ticket'),contains(outputs('subjL'),'drive'),contains(outputs('subjL'),'waiting on client')))),'ACTION – System Exception',
if(or(contains(outputs('subjL'),'new vendor request'),contains(outputs('subjL'),'vendor setup'),contains(outputs('subjL'),'vendor id'),and(contains(outputs('subjL'),'vendor'),contains(outputs('subjL'),'complete'))),'VENDOR – Setup / Master Data',
if(contains(outputs('subjL'),'master initiative tracker'),'REPORTING – CBO / Leadership',
if(or(contains(outputs('subjL'),'contract'),contains(outputs('subjL'),'renew by'),contains(outputs('subjL'),'legal review'),contains(outputs('subjL'),'legal approved'),contains(outputs('subjL'),'for signature')),'CONTRACTS – Intake / Review',
if(or(contains(outputs('subjL'),'requisition'),contains(outputs('domain'),'nextprocess'),contains(outputs('subjL'),'approved po')),'PROCUREMENT – PO / Requisition',
if(and(contains(outputs('domain'),'netsuite'),or(contains(outputs('subjL'),'upgrade'),contains(outputs('subjL'),'suiteapp'),contains(outputs('subjL'),'bank feeds'),contains(outputs('subjL'),'release notice'))),'SYSTEM – NetSuite / NextProcess',
if(and(contains(outputs('domain'),'netsuite'),or(contains(outputs('subjL'),'approve'),contains(outputs('subjL'),'transfer request'))),'ACTION – Approval / Decision',
if(and(contains(outputs('domain'),'netsuite'),or(contains(outputs('subjL'),'bill'),contains(outputs('subjL'),'check payments'),contains(outputs('subjL'),'payments by'))),'FINANCE / AP – Check Request',
if(or(contains(outputs('subjL'),'wcwc'),contains(outputs('subjL'),'women connecting')),'MINISTRY / CHURCH-COMMUNITY (non-BSD)',
if(or(contains(outputs('domain'),'circle.so'),contains(outputs('subjL'),'prayer'),contains(outputs('subjL'),'funeral'),contains(outputs('subjL'),'devotional'),contains(outputs('subjL'),'staff meeting')),'FYI – Reference / Learning',
if(or(startsWith(outputs('subjL'),'accepted:'),startsWith(outputs('subjL'),'declined:'),startsWith(outputs('subjL'),'canceled:'),startsWith(outputs('subjL'),'tentative:'),contains(outputs('subjL'),'meeting forward'),contains(outputs('subjL'),'recording'),contains(outputs('subjL'),'has been visited'),contains(outputs('subjL'),'new customer signed up'),contains(outputs('subjL'),'undeliverable'),contains(outputs('domain'),'otter.ai')),'FYI – Reference / Learning',
if(or(contains(outputs('subjL'),'replay'),contains(outputs('subjL'),'icymi'),contains(outputs('subjL'),'webinar'),contains(outputs('subjL'),'newsletter'),contains(outputs('domain'),'lyttlesisters'),contains(outputs('domain'),'claude'),contains(outputs('domain'),'usaii'),contains(outputs('domain'),'ncmahq'),contains(outputs('domain'),'christianitytoday'),and(contains(outputs('domain'),'smartsheet'),or(contains(outputs('domain'),'eap'),contains(outputs('domain'),'productinfo')))),'FYI – Reference / Learning',
if(or(contains(outputs('domain'),'grubhub'),contains(outputs('domain'),'frg.co'),contains(outputs('domain'),'evite'),contains(outputs('domain'),'phorest'),contains(outputs('domain'),'rasmus'),contains(outputs('domain'),'blazepizza'),contains(outputs('domain'),'notion'),contains(outputs('domain'),'loom'),contains(outputs('domain'),'gamma'),contains(outputs('domain'),'mastermind'),contains(outputs('domain'),'sectionai'),contains(outputs('domain'),'vhx.tv'),contains(outputs('domain'),'uhc'),contains(outputs('domain'),'dtfprint')),'PROMOTIONS / SUBSCRIPTIONS / MISC',
if(contains(outputs('domain'),'fbcglenarden'),'ACTION – Reply Needed',
'FYI – Reference / Learning'))))))))))))))))
```
> The en-dash `–` in each literal must be a real en-dash so it matches the choice column exactly. Copy from the choice list you created, don't retype as a hyphen.

## Compose the derived fields (reference `outputs('BusinessCategory')`)
**ActionOwner** (R6 core):
```
if(or(equals(outputs('BusinessCategory'),'FYI – Reference / Learning'),equals(outputs('BusinessCategory'),'PROMOTIONS / SUBSCRIPTIONS / MISC'),equals(outputs('BusinessCategory'),'FACILITIES – Inspection Reports'),equals(outputs('BusinessCategory'),'SYSTEM – NetSuite / NextProcess')),'None',if(equals(outputs('recipientScope'),'Direct to Me'),'Me','Someone Else'))
```
**BaseLane**:
```
if(equals(outputs('BusinessCategory'),'ACTION – System Exception'),'System Exceptions / Workflow Breaks',if(or(equals(outputs('BusinessCategory'),'FACILITIES – Inspection Reports'),equals(outputs('BusinessCategory'),'FYI – Reference / Learning'),equals(outputs('BusinessCategory'),'SYSTEM – NetSuite / NextProcess')),'FYI / Learning Reference',if(equals(outputs('BusinessCategory'),'PROMOTIONS / SUBSCRIPTIONS / MISC'),'Promotions / Subscriptions / Misc',if(equals(outputs('BusinessCategory'),'MINISTRY / CHURCH-COMMUNITY (non-BSD)'),'Ministry / Community',if(or(equals(outputs('BusinessCategory'),'REPORTING – CBO / Leadership'),equals(outputs('BusinessCategory'),'FINANCE / AP – Check Request')),'Leadership / Reporting','Action Required')))))
```
**DigestLane** (applies R6/R10 — informed copies fall to FYI, except Promo/Ministry keep their lane):
```
if(equals(outputs('ActionOwner'),'Me'),outputs('BaseLane'),if(or(equals(outputs('BusinessCategory'),'PROMOTIONS / SUBSCRIPTIONS / MISC'),equals(outputs('BusinessCategory'),'MINISTRY / CHURCH-COMMUNITY (non-BSD)')),outputs('BaseLane'),'FYI / Learning Reference'))
```
**Pillar**:
```
if(or(equals(outputs('BusinessCategory'),'CONTRACTS – Intake / Review'),equals(outputs('BusinessCategory'),'PROCUREMENT – PO / Requisition'),equals(outputs('BusinessCategory'),'VENDOR – Setup / Master Data')),'P5',if(equals(outputs('BusinessCategory'),'FINANCE / AP – Check Request'),'P2',if(or(equals(outputs('BusinessCategory'),'SYSTEM – NetSuite / NextProcess'),equals(outputs('BusinessCategory'),'ACTION – System Exception')),'P3',if(equals(outputs('BusinessCategory'),'REPORTING – CBO / Leadership'),'P4',if(equals(outputs('BusinessCategory'),'FACILITIES – Inspection Reports'),'Ops/Admin','N/A')))))
```
**Priority** (base by category + owner, then urgent override):
```
if(or(contains(outputs('subjL'),'urgent'),contains(outputs('subjL'),'past due'),contains(outputs('subjL'),'immediate attention')),'Critical',if(contains(outputs('subjL'),'escalation'),'High',if(not(equals(outputs('ActionOwner'),'Me')),'Low',if(equals(outputs('BusinessCategory'),'ACTION – System Exception'),'Critical',if(or(equals(outputs('BusinessCategory'),'CONTRACTS – Intake / Review'),equals(outputs('BusinessCategory'),'ACTION – Approval / Decision')),'High','Normal')))))
```
**Reviewed** (flag the categories where content genuinely decides → human confirms):
```
if(or(equals(outputs('BusinessCategory'),'ACTION – Reply Needed'),equals(outputs('BusinessCategory'),'FINANCE / AP – Check Request'),equals(outputs('BusinessCategory'),'ACTION – Approval / Decision'),and(equals(outputs('BusinessCategory'),'PROCUREMENT – PO / Requisition'),not(contains(outputs('subjL'),'escalation')))),'No','Yes')
```
**Confidence**: `if(equals(outputs('Reviewed'),'No'),45,85)`
**Status** (initial): `if(equals(outputs('ActionOwner'),'Me'),'New','Reference')`

## Create item — SharePoint → Create item (site above, list "Inbox Action Register")
| List column | Value |
|---|---|
| Email Subject (Title) | `triggerBody()?['subject']` |
| Received Date | `triggerBody()?['receivedDateTime']` |
| Sender | `triggerBody()?['from']` |
| Sender Domain | `outputs('domain')` |
| Recipient Scope | `outputs('recipientScope')` |
| Mailbox Source | `Primary` |
| Source System | `outputs('SourceSystem')` |
| Business Category | `outputs('BusinessCategory')` |
| Digest Lane | `outputs('DigestLane')` |
| Pillar | `outputs('Pillar')` |
| Action Owner | `outputs('ActionOwner')` |
| Priority | `outputs('Priority')` |
| Status | `outputs('Status')` |
| Reviewed | `outputs('Reviewed')` |
| Confidence | `int(outputs('Confidence'))` |
| Source Link / Message ID | `triggerBody()?['internetMessageId']` (or `messageId`) |
| Web Link | `triggerBody()?['webLink']` |
| Has Attachments | `triggerBody()?['hasAttachments']` |
| Classified Date | `utcNow()` |
| Last Status Change | `utcNow()` |
| Trigger Words Hit | (optional) `trim(concat(if(contains(outputs('subjL'),'urgent'),'urgent; ',''),if(contains(outputs('subjL'),'past due'),'past due; ',''),if(contains(outputs('subjL'),'escalation'),'escalation; ',''),if(contains(outputs('subjL'),'action required'),'action required; ','')))` |

Leave Follow-Up Date, Owner, Waiting On, Draft Status blank — Tempo/Quill set those.

## Test plan
1. Turn the flow ON; send/forward yourself a few representative emails (a Smartsheet contract notice, an inspection report, a "Something went wrong" alert, a promo, an internal direct request).
2. Confirm each lands in Inbox Action Register with sensible Category/Lane/Priority and that ambiguous ones show **Reviewed = No** in the Needs Review view.
3. Adjust the keyword lists in the BusinessCategory Compose as you spot misses — that's the whole tuning surface, no code.

## What this deliberately does NOT do (by design)
- No content-deep reasoning — it reads subject/sender/recipients + body preview only. The Reviewed=No routing is the safety net for everything it can't decide from patterns.
- Doesn't set follow-up dates (Tempo/Flow 5a) or write drafts (Quill/Flow 5) — next flows.
- Doesn't upsert List B — add that as a parallel branch when cat = PROMOTIONS/MISC or FYI (Sorter-inline, decision #1), using SharePoint Get items (match Sender Domain) → Update or Create.
