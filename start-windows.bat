@echo off
REM ============================================================
REM  Almerkaz College website - run it on this computer.
REM  Double-click this file. The site opens by itself at:
REM     http://localhost:3000/ar      (website)
REM     http://localhost:3000/admin   (admin panel)
REM  Admin login: admin@almrkz.local / almrkz2008
REM  To stop: close this black window.
REM ============================================================
cd /d "%~dp0"
title Almerkaz College - local website

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed. Opening the download page...
  echo  Install the "LTS" version, then double-click this file again.
  start "" https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo.
  echo  [1/3] Installing - first time only, takes a few minutes...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto fail
)

if not exist almrkz-local.db (
  echo.
  echo  [2/3] Filling the website with the content of the design...
  set SEED_ADMIN_EMAIL=admin@almrkz.local
  set SEED_ADMIN_PASSWORD=almrkz2008
  call npm run seed
  if errorlevel 1 goto fail
)

echo.
echo  [3/3] Starting... the browser opens by itself in a moment.
echo  Admin login: admin@almrkz.local / almrkz2008
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 200;$i++){try{Invoke-WebRequest -UseBasicParsing http://localhost:3000/ar -TimeoutSec 60 | Out-Null; Start-Process 'http://localhost:3000/ar'; break}catch{Start-Sleep 2}}"
call npm run dev
goto end

:fail
echo.
echo  Something went wrong. Take a screenshot of this window and send it to Claude.
pause
:end
