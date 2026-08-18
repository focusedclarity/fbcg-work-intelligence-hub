#!/usr/bin/env bash
# PreCompact hook: auto-commit + push whatever is pending before context is compacted,
# so a mid-session compaction never strands work between the two computers.
set -uo pipefail

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git add -A
  if git commit -m "Auto-checkpoint before context compaction ($(date -u +%Y-%m-%dT%H:%M:%SZ))" >/dev/null 2>&1; then
    if git push >/dev/null 2>&1; then
      echo '{"systemMessage": "Checkpoint: uncommitted progress was auto-committed and pushed before context compaction. Pull on the other computer to resume."}'
    else
      echo '{"systemMessage": "Checkpoint: progress was committed locally before compaction, but git push failed (check network/auth) - push it manually so the other computer can see it."}'
    fi
  else
    echo '{"systemMessage": "Checkpoint: git commit failed before compaction - check git status manually."}'
  fi
else
  echo '{"systemMessage": "Context compaction: nothing uncommitted, no checkpoint needed."}'
fi
