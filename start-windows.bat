@echo off
REM ============================================================
REM  Almerkaz College website - run it on this computer.
REM  Double-click this file. The site opens by itself at:
REM     http://localhost:3000/ar      (website)
REM     http://localhost:3000/admin   (admin panel)
REM  Admin login: admin@almrkz.local / almrkz2008
REM  To stop: close this black window.
REM ============================================================
title Almerkaz College - local website
cd /d "%~dp0"

if not exist package.json (
  echo.
  echo  The ZIP file is not extracted yet.
  echo  Right-click the ZIP file, choose "Extract All",
  echo  then open the NEW folder and double-click start-windows.bat there.
  goto fail
)

REM ---- 1. Node.js installed and new enough (20 or newer)? ----
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed. Opening the download page...
  echo  Install the "LTS" version, RESTART the computer, then double-click this file again.
  start "" https://nodejs.org/
  goto fail
)
for /f "tokens=1 delims=v." %%v in ('node -v') do set NODEMAJOR=%%v
if %NODEMAJOR% LSS 20 (
  echo.
  echo  Node.js on this computer is too old. Opening the download page...
  echo  Install the "LTS" version, RESTART the computer, then double-click this file again.
  start "" https://nodejs.org/
  goto fail
)

REM ---- 2. Run from a short folder (Windows fails with very long paths) ----
set "HOME_DIR=%USERPROFILE%\almrkz-site"
if /i not "%CD%"=="%HOME_DIR%" (
  echo.
  echo  Copying the website to %HOME_DIR% ...
  robocopy "%CD%" "%HOME_DIR%" /E /XD node_modules .next /NFL /NDL /NJH /NJS /NP >nul
  if errorlevel 8 goto fail
)
cd /d "%HOME_DIR%"

REM ---- 3. Install (first time only) ----
if not exist node_modules (
  echo.
  echo  [1/3] Installing - first time only, takes 5-10 minutes...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto fail
)

REM ---- 4. Fill with the design content (first time only) ----
if not exist almrkz-local.db (
  echo.
  echo  [2/3] Filling the website with the content of the design...
  set SEED_ADMIN_EMAIL=admin@almrkz.local
  set SEED_ADMIN_PASSWORD=almrkz2008
  call npm run seed
  if errorlevel 1 (
    if exist almrkz-local.db del /q almrkz-local.db
    goto fail
  )
)

REM ---- 5. Start ----
echo.
echo  [3/3] Starting... the browser opens by itself in a minute.
echo  Keep this window open. Closing it stops the website.
echo  Admin login: admin@almrkz.local / almrkz2008
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 300;$i++){try{Invoke-WebRequest -UseBasicParsing http://localhost:3000/ar -TimeoutSec 120 | Out-Null; Start-Process 'http://localhost:3000/ar'; break}catch{Start-Sleep 2}}"
call npm run dev -- -p 3000
echo.
echo  The website stopped.

:fail
echo.
echo  If something went wrong: take a screenshot of this window and send it to Claude.
pause
