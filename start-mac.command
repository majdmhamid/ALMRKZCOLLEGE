#!/bin/bash
# ============================================================
#  Almerkaz College website - run it on this computer.
#  Double-click this file. The site opens by itself at:
#     http://localhost:3000/ar      (website)
#     http://localhost:3000/admin   (admin panel)
#  Admin login: admin@almrkz.local / almrkz2008
#  To stop: close this window.
# ============================================================
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Opening the download page..."
  echo "Install the LTS version, then double-click this file again."
  open https://nodejs.org/
  read -r -p "Press Enter to close"
  exit 1
fi

fail() { echo; echo "Something went wrong. Take a screenshot of this window and send it to Claude."; read -r -p "Press Enter to close"; exit 1; }

if [ ! -d node_modules ]; then
  echo "[1/3] Installing - first time only, takes a few minutes..."
  npm install --no-audit --no-fund || fail
fi

if [ ! -f almrkz-local.db ]; then
  echo "[2/3] Filling the website with the content of the design..."
  SEED_ADMIN_EMAIL=admin@almrkz.local SEED_ADMIN_PASSWORD=almrkz2008 npm run seed || fail
fi

if [ ! -f .next/BUILD_ID ] || [ -n "$(find src package.json -newer .next/BUILD_ID -print -quit)" ]; then
  echo "[3/3] Preparing the fast version of the website - 3-5 minutes..."
  npm run build || fail
fi

echo "Starting... the browser opens by itself in a moment."
echo "Admin login: admin@almrkz.local / almrkz2008"
( for i in $(seq 1 200); do
    if curl -s -o /dev/null -m 60 http://localhost:3000/ar; then open http://localhost:3000/ar; break; fi
    sleep 2
  done ) &
npm run start -- -p 3000
