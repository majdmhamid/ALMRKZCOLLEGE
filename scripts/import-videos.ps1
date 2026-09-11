<#
.SYNOPSIS
  Copies the college's promo videos from the shared drive into assets\videos\promo.

.DESCRIPTION
  Run from the repo folder on a Windows machine that can see the shared computer:

      powershell -ExecutionPolicy Bypass -File scripts\import-videos.ps1

  Copies every video file (mp4, mov, webm, m4v, avi, mkv) from the shared folder,
  prints the size of each one, and flags files GitHub will refuse (100 MB or more).
  Nothing is deleted from the shared drive. Re-running just overwrites the copies.

  To import from a different folder:

      powershell -ExecutionPolicy Bypass -File scripts\import-videos.ps1 -Source "D:\videos"
#>
param(
  [string]$Source = "\\Desktop-ktffbra\חומר משותף\מכללת המרכז\פרסום\סרטונים לפרסום"
)

$ErrorActionPreference = "Stop"

$repoRoot   = Split-Path -Parent $PSScriptRoot
$dest       = Join-Path $repoRoot "assets\videos\promo"
$limitBytes = 100MB                      # GitHub hard limit per file (without LFS)
$videoExts  = @(".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv")

if (-not (Test-Path -LiteralPath $Source)) {
  Write-Host ""
  Write-Host "Cannot open:  $Source" -ForegroundColor Red
  Write-Host "Is the shared computer switched on and are you on the same network?"
  exit 1
}

New-Item -ItemType Directory -Force -Path $dest | Out-Null

$files = Get-ChildItem -LiteralPath $Source -File -Recurse |
         Where-Object { $videoExts -contains $_.Extension.ToLower() } |
         Sort-Object Name

if (-not $files) {
  Write-Host "No video files found in $Source"
  exit 0
}

Write-Host ""
Write-Host "Copying $($files.Count) video(s) to $dest"
Write-Host ""

$tooBig = @()
$total  = 0

foreach ($f in $files) {
  Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $dest $f.Name) -Force
  $total += $f.Length
  $mb = [math]::Round($f.Length / 1MB, 1)
  if ($f.Length -ge $limitBytes) {
    $tooBig += $f.Name
    Write-Host ("{0,8} MB   {1}   <-- too big for GitHub" -f $mb, $f.Name) -ForegroundColor Yellow
  } else {
    Write-Host ("{0,8} MB   {1}" -f $mb, $f.Name)
  }
}

Write-Host ""
Write-Host ("Total: {0} MB" -f [math]::Round($total / 1MB, 1))

if ($tooBig.Count -gt 0) {
  Write-Host ""
  Write-Host "GitHub refuses files of 100 MB or more. These will not upload as they are:" -ForegroundColor Yellow
  $tooBig | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
  Write-Host ""
  Write-Host "Ask Claude to either shrink them (re-encode under 100 MB) or enable Git LFS for videos."
  Write-Host "See assets\videos\promo\README.md."
} else {
  Write-Host ""
  Write-Host "All good. Now tell Claude:  ارفع الشغل على GitHub" -ForegroundColor Green
}
