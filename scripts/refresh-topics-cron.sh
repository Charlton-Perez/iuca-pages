#!/bin/zsh
# Scheduled wrapper for refresh-topics.mjs — computes SciVal topic clusters
# (needs a SciVal-entitled network: campus or VPN) and pushes the updated
# snapshot to GitHub, which triggers a Vercel deploy.
# Installed as a launchd agent: com.iuca.refresh-topics

set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$HOME/Library/Logs/iuca-refresh-topics.log"
exec >> "$LOG" 2>&1

echo "── $(date '+%Y-%m-%d %H:%M:%S') refresh starting"

cd "$REPO"

# Refuse to run with local uncommitted changes to avoid committing WIP
if ! git diff --quiet -- src/topics-snapshot.js; then
  echo "topics-snapshot.js has uncommitted local changes — skipping"
  exit 0
fi

if ! /usr/bin/env node scripts/refresh-topics.mjs; then
  echo "refresh failed (off-campus / no VPN?) — will retry next run"
  exit 0
fi

if git diff --quiet -- src/topics-snapshot.js; then
  echo "snapshot unchanged — nothing to push"
  exit 0
fi

git add src/topics-snapshot.js
git commit -m "chore: scheduled topics snapshot refresh"
git push
echo "pushed updated snapshot"
