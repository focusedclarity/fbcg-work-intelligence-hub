#!/usr/bin/env python3
"""
Step 3 of the CMO -> master contracts consolidation: build the reconciliation audit.

READ-ONLY. Makes no changes to any sheet. Two GET calls, then writes CSVs.

Usage (PowerShell):
    $env:SMARTSHEET_ACCESS_TOKEN = "..."
    python audit_pairs.py --outdir .

Outputs (in --outdir):
    audit_pairs.csv        one row per CMO contract with its matched master twin and a
                           recommended survivor -- this is what Contracts staff sign off
    audit_master_only.csv  master Division=CMO rows with no CMO twin (leave alone; listed for review)
    audit_summary.txt      counts to sanity-check before the cutover window

Matching: exact row Created timestamp first (copy-row twins share it), then a normalized
Description + Value ($) fallback.
"""
import argparse
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter

MASTER_ID = 1551069754642308   # /CBO/Contracts Database
CMO_ID = 8818557085241220      # /CMO TEAM ONLY/Contracts/CMO Contracts Database
API = "https://api.smartsheet.com/2.0"

FIELDS = ["Status", "Vendor Name", "Description", "Value ($)", "Division",
          "Start Date", "End date", "Executed Date", "Fully Executed Contract On File"]


def get_sheet(sheet_id, token):
    url = (API + "/sheets/" + str(sheet_id)
           + "?include=attachments,discussions,rowPermalink&pageSize=10000")
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        sys.exit("Smartsheet API %s on sheet %s: %s" % (e.code, sheet_id, body))


def normalize(sheet):
    """Return one dict per row: tracked field values plus attachment/comment counts."""
    titles = {c["id"]: c["title"] for c in sheet["columns"]}
    out = []
    for r in sheet.get("rows", []):
        vals = {}
        for c in r.get("cells", []):
            t = titles.get(c.get("columnId"))
            if t in FIELDS:
                vals[t] = c.get("displayValue") or c.get("value")
        attachments = r.get("attachments") or []
        discussions = r.get("discussions") or []
        row = {
            "row_id": r["id"],
            "row_number": r.get("rowNumber"),
            "created": r.get("createdAt"),
            "modified": r.get("modifiedAt"),
            "permalink": r.get("permalink"),
            "attachments": len(attachments),
            "attachment_names": "; ".join(a.get("name", "") for a in attachments)[:400],
            "comment_threads": len(discussions),
            "comments": sum(len(d.get("comments") or []) for d in discussions),
        }
        for f in FIELDS:
            row[f] = vals.get(f)
        out.append(row)
    return out


def fallback_key(row):
    desc = re.sub(r"[^a-z0-9]", "", (row.get("Description") or "").lower())[:60]
    val = re.sub(r"[^0-9.]", "", str(row.get("Value ($)") or ""))
    return (desc, val) if desc else None


def recommend(master_twin):
    """Survivor recommendation + reason. Staff may override in the sheet."""
    if master_twin is None:
        return "CMO (move in)", "no master twin"
    blank = not (master_twin.get("Status") or "").strip()
    if master_twin["attachments"] == 0 and master_twin["comment_threads"] == 0:
        return "CMO", ("master twin is an empty shell" if blank
                       else "master twin has no files or comments")
    if blank:
        return "Both - merge files", (
            "master twin has %d file(s) / %d thread(s) to rescue, blank Status"
            % (master_twin["attachments"], master_twin["comment_threads"]))
    return "REVIEW", ("both sides have content and master Status = %r"
                      % master_twin.get("Status"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--outdir", default=".")
    args = ap.parse_args()

    token = os.environ.get("SMARTSHEET_ACCESS_TOKEN")
    if not token:
        sys.exit("Set SMARTSHEET_ACCESS_TOKEN first "
                 "(Smartsheet -> Account -> Personal Settings -> API Access).")

    print("Reading master ...", flush=True)
    master = normalize(get_sheet(MASTER_ID, token))
    print("Reading CMO ...", flush=True)
    cmo = normalize(get_sheet(CMO_ID, token))

    master_cmo = [r for r in master if (r.get("Division") or "").strip().upper() == "CMO"]

    by_created = {}
    by_fallback = {}
    for r in master_cmo:
        by_created.setdefault(r["created"], []).append(r)
        k = fallback_key(r)
        if k:
            by_fallback.setdefault(k, []).append(r)

    matched_master_ids = set()
    pairs = []
    for c in cmo:
        twin = None
        how = "none"
        cands = [x for x in by_created.get(c["created"], [])
                 if x["row_id"] not in matched_master_ids]
        if cands:
            twin, how = cands[0], "created timestamp"
        else:
            k = fallback_key(c)
            cands = [x for x in by_fallback.get(k, []) if x["row_id"] not in matched_master_ids] if k else []
            if cands:
                twin, how = cands[0], "description+value"
        if twin:
            matched_master_ids.add(twin["row_id"])
        survivor, why = recommend(twin)
        pairs.append((c, twin, how, survivor, why))

    os.makedirs(args.outdir, exist_ok=True)
    pair_csv = os.path.join(args.outdir, "audit_pairs.csv")
    with open(pair_csv, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow([
            "Survivor (confirm)", "Reviewed by", "Notes",
            "Recommended", "Why", "Match method",
            "Vendor", "Description", "Value ($)",
            "CMO Status", "Master Status",
            "CMO files", "Master files", "CMO threads", "Master threads",
            "CMO modified", "Master modified", "Created (shared)",
            "CMO row #", "Master row #", "CMO link", "Master link",
            "CMO files listed", "Master files listed",
        ])
        for c, m, how, survivor, why in pairs:
            m = m or {}
            w.writerow([
                "", "", "", survivor, why, how,
                c.get("Vendor Name"), c.get("Description"), c.get("Value ($)"),
                c.get("Status"), m.get("Status"),
                c["attachments"], m.get("attachments", 0),
                c["comment_threads"], m.get("comment_threads", 0),
                c["modified"], m.get("modified"), c["created"],
                c["row_number"], m.get("row_number"),
                c["permalink"], m.get("permalink"),
                c["attachment_names"], m.get("attachment_names"),
            ])

    only_csv = os.path.join(args.outdir, "audit_master_only.csv")
    with open(only_csv, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["Master row #", "Status", "Vendor", "Description", "Value ($)",
                    "files", "threads", "created", "modified", "link"])
        for r in master_cmo:
            if r["row_id"] not in matched_master_ids:
                w.writerow([r["row_number"], r.get("Status"), r.get("Vendor Name"),
                            r.get("Description"), r.get("Value ($)"),
                            r["attachments"], r["comment_threads"],
                            r["created"], r["modified"], r["permalink"]])

    rec = Counter(p[3] for p in pairs)
    rescue = [p for p in pairs if p[1] and p[1]["attachments"] > 0]
    blank_master = sum(1 for r in master_cmo if not (r.get("Status") or "").strip())
    lines = [
        "CMO -> master consolidation, Step 3 reconciliation audit",
        "",
        "master rows total ................. %d" % len(master),
        "master rows Division=CMO .......... %d" % len(master_cmo),
        "master CMO rows, blank Status ..... %d" % blank_master,
        "CMO sheet rows .................... %d" % len(cmo),
        "",
        "CMO rows matched to a master twin . %d" % sum(1 for p in pairs if p[1]),
        "CMO rows with no twin (move in) ... %d" % sum(1 for p in pairs if not p[1]),
        "master CMO rows with no twin ...... %d  (leave alone)"
        % (len(master_cmo) - len(matched_master_ids)),
        "",
        "recommended survivor:",
    ]
    lines += ["  %-22s %d" % (k, v) for k, v in rec.most_common()]
    lines += [
        "",
        "pairs where the MASTER row holds files to rescue before deletion: %d" % len(rescue),
        "  total master-side files to re-upload: %d" % sum(p[1]["attachments"] for p in rescue),
        "",
        "attachments: master %d, CMO %d" % (sum(r["attachments"] for r in master),
                                           sum(r["attachments"] for r in cmo)),
        "expected master row count after migration: %d"
        % (len(master) - len(matched_master_ids) + len(cmo)),
        "",
        "wrote " + pair_csv,
        "wrote " + only_csv,
    ]
    summary = "\n".join(lines)
    with open(os.path.join(args.outdir, "audit_summary.txt"), "w", encoding="utf-8") as fh:
        fh.write(summary + "\n")
    print("\n" + summary)


if __name__ == "__main__":
    main()
