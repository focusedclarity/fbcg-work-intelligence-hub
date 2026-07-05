# List views — ready-to-paste build prompts

Purpose: paste-ready prompts for the **SharePoint LIST agent** (not the flow agent) to create the standard views on Lists A, B, C on site `m365appbuilder-app-3155`. View definitions come from `scout_manual_setup_checklist.md`.

**Two categories:**
- **Agent-buildable** — static filters/sorts/grouping. Paste the prompt as-is.
- **Manual only** — filters use `[Today]` (relative dates). The list agent cannot emit `[Today]`, so build these by hand: List → **All Items ▸ → Create new view** (or **Edit current view** in classic), set the filter, Save. Instructions given inline.

Choice values must match the lists **exactly**, including the en-dash "–" (not a hyphen). Status "Done"/"Reference" etc. are the exact choice labels.

---

## LIST A — "Inbox Action Register"

### 1. Open Actions  *(agent-buildable)*
```
On the "Inbox Action Register" list, create a new list view named "Open Actions".
Filter: show items where Status is not equal to "Done" AND Status is not equal to "Reference".
Sort by Priority (ascending). Show columns: Email Subject, Received Date, Sender, Business Category, Priority, Status, Action Owner, Follow-Up Date. Set it as a public view.
```

### 2. Needs Review  *(agent-buildable)*
```
On the "Inbox Action Register" list, create a new list view named "Needs Review".
Filter: show items where Reviewed is equal to "No".
Sort by Received Date (descending). Show columns: Email Subject, Received Date, Sender, Business Category, Confidence, Confidence Band, Reviewed, Priority. Public view.
```

### 3. Drafts Awaiting Approval  *(agent-buildable)*
```
On the "Inbox Action Register" list, create a new list view named "Drafts Awaiting Approval".
Filter: show items where Draft Status is equal to "Draft Ready".
Sort by Received Date (ascending). Show columns: Email Subject, Sender, Business Category, Draft Status, Priority, Follow-Up Date. Public view.
```

### 4. Dead-Letter  *(agent-buildable)*
```
On the "Inbox Action Register" list, create a new list view named "Dead-Letter".
Filter: show items where Status is equal to "Blocked".
Sort by Received Date (ascending). Show columns: Email Subject, Received Date, Sender, Business Category, Status, Notes. Public view.
```

### 5. By Lane  *(agent-buildable)*
```
On the "Inbox Action Register" list, create a new list view named "By Lane".
Group by Digest Lane. Sort by Priority (ascending) within each group. Show columns: Email Subject, Received Date, Sender, Business Category, Priority, Status. Public view.
```

### 6. By Mailbox Source  *(agent-buildable)*
```
On the "Inbox Action Register" list, create a new list view named "By Mailbox Source".
Group by Mailbox Source. Sort by Received Date (descending) within each group. Show columns: Email Subject, Received Date, Sender, Business Category, Priority, Status. Public view.
```

### 7. Overdue  ⚠️ *(manual — uses [Today])*
Build by hand:
1. List A → **All Items ▸ → Create new view** → name **Overdue** → start from Standard/blank.
2. Save, then open the view → **All Items ▸ → Edit current view** (classic settings page).
3. Filter (AND both rows):
   - `Follow-Up Date` **is less than or equal to** `[Today]`
   - `Status` **is not equal to** `Done`
   - `Status` **is not equal to** `Reference`
   (Classic filter supports up to the needed rows; join with **And**.)
4. Sort: `Follow-Up Date` ascending (oldest overdue first).
5. Columns: Email Subject, Received Date, Follow-Up Date, Sender, Business Category, Priority, Status.
6. OK to save.

### 8. Stale — Review to Close  ⚠️ *(manual — needs oldest-first aging)*
Build by hand (same classic Edit-current-view route):
1. Name **Stale — Review to Close**.
2. Filter (join with **And**):
   - `Reviewed` **is equal to** `No`
   - `Status` **is not equal to** `Done`
   - `Status` **is not equal to** `Reference`
3. Sort: `Last Status Change` ascending (oldest first — surfaces items sitting unreviewed longest).
4. Columns: Email Subject, Received Date, Last Status Change, Sender, Business Category, Reviewed, Status.
5. Save.

> Note: this one has no `[Today]` and *could* go through the agent, but it's grouped here with Overdue because both are the "aging/close" pair reviewed together. If the agent handles it fine, great; the manual steps are the fallback.

---

## LIST B — "Subscription Register"  *(all agent-buildable)*

### 1. All Subscriptions
```
On the "Subscription Register" list, create a new list view named "All Subscriptions".
No filter (show all). Sort by Message Count (descending). Show columns: Sender Domain, Sender Name, Sender Email, Subscription Type, Message Count, Status, Last Seen. Public view.
```

### 2. Unsubscribe Candidates
```
On the "Subscription Register" list, create a new list view named "Unsubscribe Candidates".
Filter: show items where Status is equal to "Unsubscribe Candidate".
Sort by Message Count (descending). Show columns: Sender Domain, Sender Name, Subscription Type, Message Count, Status, Notes. Public view.
```

### 3. By Type
```
On the "Subscription Register" list, create a new list view named "By Type".
Group by Subscription Type. Sort by Message Count (descending) within each group. Show columns: Sender Domain, Sender Name, Message Count, Status, Last Seen. Public view.
```

### 4. Noisiest Senders
```
On the "Subscription Register" list, create a new list view named "Noisiest Senders".
No filter. Sort by Message Count (descending). Show columns: Sender Domain, Sender Name, Subscription Type, Message Count, First Seen, Last Seen. Public view.
```

---

## LIST C — "User Profile Register"  *(all agent-buildable)*

### 1. All Profiles
```
On the "User Profile Register" list, create a new list view named "All Profiles".
No filter. Sort by Display Name (ascending). Show columns: Display Name, UPN / Email, Department, Onboarding Complete, Digest Channel, Schema Version. Public view.
```

### 2. Active Instances
```
On the "User Profile Register" list, create a new list view named "Active Instances".
Filter: show items where Onboarding Complete is equal to "Yes".
Sort by Display Name (ascending). Show columns: Display Name, UPN / Email, Department, Digest Channel, Digest Time, Schema Version. Public view.
```

### 3. Incomplete Onboarding
```
On the "User Profile Register" list, create a new list view named "Incomplete Onboarding".
Filter: show items where Onboarding Complete is equal to "No".
Sort by Onboarding Date (ascending). Show columns: Display Name, UPN / Email, Department, Onboarding Date, Onboarding Complete. Public view.
```

### 4. Schema Drift Check
```
On the "User Profile Register" list, create a new list view named "Schema Drift Check".
Group by Schema Version. Sort by Display Name (ascending) within each group. Show columns: Display Name, UPN / Email, Schema Version, Onboarding Complete. Public view.
```

---

## Build order & verification
1. List A views 1–6 via list agent → then 7–8 by hand.
2. List B views 1–4 via list agent.
3. List C views 1–4 via list agent.
4. After each list, open the view switcher and confirm each view name appears and filters behave (e.g. Open Actions hides Done/Reference rows; Needs Review shows only Reviewed=No).

**Column-name gotcha:** if the agent reports a column doesn't exist, it's almost always a label mismatch — confirm against `scout_manual_setup_checklist.md` (e.g. Title was renamed to **Email Subject** on List A, **Sender Domain** on List B, **Display Name** on List C).
