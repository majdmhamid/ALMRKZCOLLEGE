<#
.SYNOPSIS
  Copies the college's promotional videos from the office network share into
  assets\videos\promo so they can be committed to this repository.

.DESCRIPTION
  This must run on a Windows PC that is on the office network and can see
  \\Desktop-ktffbra. It CANNOT run inside a Claude Code web session: that
  container has no access to the local network at all.

  Files already present and up to date in the destination are skipped, so the
  script is safe to run again after new videos are added to the share.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\copy-promo-videos.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\copy-promo-videos.ps1 -Source "\\other-pc\some\folder"
#>
param(
  [string]$Source = '\\Desktop-ktffbra\חומר משותף\מכללת המרכז\פרסום\סרטונים לפרסום'
)

$ErrorActionPreference = 'Stop'

$repoRoot   = Split-Path -Parent $PSScriptRoot
$dest       = Join-Path $repoRoot 'assets\videos\promo'
$extensions = @('*.mp4', '*.mov', '*.webm', '*.avi', '*.mkv', '*.m4v', '*.wmv')

if (-not (Test-Path -LiteralPath $Source)) {
  Write-Error "Cannot reach '$Source'. Is this PC on the office network, and is Desktop-ktffbra switched on?"
}

New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host '==> copying videos'
Write-Host "    from: $Source"
Write-Host "    to:   $dest"
Write-Host ''

# /E   include subfolders          /XO  skip files already up to date
# /R /W short retry loop           /NP /NDL /NJH quieter output
& robocopy $Source $dest @extensions /E /XO /R:2 /W:2 /NP /NDL /NJH
if ($LASTEXITCODE -ge 8) {
  Write-Error "robocopy failed with exit code $LASTEXITCODE"
}

$files = Get-ChildItem -LiteralPath $dest -Recurse -File -Include $extensions | Sort-Object FullName
if (-not $files) {
  Write-Warning "No video files found under '$Source'."
  exit 0
}

Write-Host ''
Write-Host "==> $($files.Count) video(s) now in assets\videos\promo:"
$tooBig  = @()
$largish = @()
foreach ($f in $files) {
  $mb   = [math]::Round($f.Length / 1MB, 1)
  $flag = ''
  if ($f.Length -gt 100MB)    { $flag = '  <-- OVER 100 MB: GitHub will reject this without Git LFS'; $tooBig  += $f }
  elseif ($f.Length -gt 50MB) { $flag = '  <-- over 50 MB: GitHub warns; consider Git LFS';         $largish += $f }
  $rel = $f.FullName.Substring($repoRoot.Length + 1)
  Write-Host ('    {0,8} MB  {1}{2}' -f $mb, $rel, $flag)
}

Write-Host ''
if ($tooBig.Count -gt 0) {
  Write-Host '!!  Some files are over 100 MB. A plain git push WILL FAIL for them.'
  Write-Host '    Set up Git LFS first (once per machine), then commit as usual:'
  Write-Host '        git lfs install'
  Write-Host '        git lfs track "*.mp4" "*.mov" "*.webm"'
  Write-Host '        git add .gitattributes'
  Write-Host '    (the matching lines in .gitattributes are already there, commented out)'
  Write-Host ''
} elseif ($largish.Count -gt 0) {
  Write-Host '!   Some files are over 50 MB. GitHub accepts them but Git LFS is recommended - see assets\README.md.'
  Write-Host ''
}

Write-Host '==> next: commit and push'
Write-Host '        git add assets/videos/promo'
Write-Host '        git commit -m "Add promotional videos from the office share"'
Write-Host '        git push -u origin HEAD'
