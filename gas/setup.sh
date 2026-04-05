#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "=== One-Time Secret — Google Apps Script Setup ==="
echo ""

# 1. Check prerequisites
if ! command -v clasp &>/dev/null; then
  echo "Error: clasp not found. Install with: npm install -g @google/clasp"
  exit 1
fi

if ! clasp login --status &>/dev/null 2>&1; then
  echo "Not logged in to clasp. Opening browser for authentication..."
  clasp login
fi

# 2. Install dependencies
echo "Installing dependencies..."
npm install --silent

# 3. Create Apps Script project (if not already set up)
if [ ! -f .clasp.json ] || grep -q '<YOUR_SCRIPT_ID>' .clasp.json 2>/dev/null; then
  echo "Creating new Apps Script web app project..."
  rm -f .clasp.json
  clasp create --type webapp --title "One-Time Secret"
  # clasp create puts .clasp.json in cwd but rootDir defaults to "."
  # We need rootDir to be "dist"
  SCRIPT_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('.clasp.json','utf8')).scriptId)")
  echo "{\"scriptId\":\"${SCRIPT_ID}\",\"rootDir\":\"dist\"}" > .clasp.json
  echo "Created project with script ID: ${SCRIPT_ID}"
else
  SCRIPT_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('.clasp.json','utf8')).scriptId)")
  echo "Using existing project: ${SCRIPT_ID}"
fi

# 4. Build and push
echo "Building..."
cd .. && node gas/build.mjs && cd gas
echo "Pushing to Apps Script..."
clasp push --force

# 5. Deploy as web app
echo "Deploying..."
DEPLOY_OUTPUT=$(clasp deploy --description "One-Time Secret")
echo "${DEPLOY_OUTPUT}"
DEPLOY_ID=$(echo "${DEPLOY_OUTPUT}" | grep -oE 'AKfycb[a-zA-Z0-9_-]+')

# 6. Print result
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Web app URL:"
echo "  https://script.google.com/macros/s/${DEPLOY_ID}/exec"
echo ""
echo "On first visit, the app will automatically create a Google Sheet"
echo "for storing encrypted secrets."
echo ""
echo "Optional: set up hourly cleanup by running:"
echo "  clasp open"
echo "  Then: Triggers → Add → cleanupExpired → Time-driven → Hours → Every hour"
