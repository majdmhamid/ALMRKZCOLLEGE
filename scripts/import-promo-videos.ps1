<#
.SYNOPSIS
  Copies the college's marketing videos from the internal network share into
  assets/videos/promo/_inbox/ so they can be sorted by type.

.DESCRIPTION
  Claude Code web sessions cannot reach \\Desktop-ktffbra, so run this on a
  Windows machine that is on the college network, from the repo root:

      .\scripts\import-promo-videos.ps1
      .\scripts\import-promo-videos.ps1 -Source '\\other-pc\some\folder'

  Only video files are copied. Subfolders on the share are preserved inside the
  inbox (their names are often already the "type"). Files already present with
  the same size are skipped, so re-running is safe. The inbox is gitignored:
  nothing is committed until the videos are sorted into
  assets/videos/promo/<type>/ and listed in manifest.json.
#>
[CmdletBinding()]
param(
  [string]$Source = '\\Desktop-ktffbra\חומר משותף\מכללת המרכז\פרסום\סרטונים לפרסום',
  [string]$Dest   = (Join-Path $PSScriptRoot '..\assets\videos\promo\_inbox')
)

$ErrorActionPreference = 'Stop'
$videoExtensions = '.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.wmv'

if (-not (Test-Path -LiteralPath $Source)) {
  throw "Cannot open '$Source'. Is this computer on the college network, and is Desktop-ktffbra switched on and sharing the folder?"
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null
$Dest   = (Resolve-Path -LiteralPath $Dest).Path
$Source = (Resolve-Path -LiteralPath $Source).Path.TrimEnd('\')

$files = Get-ChildItem -LiteralPath $Source -Recurse -File |
  Where-Object { $videoExtensions -contains $_.Extension.ToLowerInvariant() }

if (-not $files) {
  Write-Warning "No video files found under $Source"
  exit 0
}

$copied = 0
$skipped = 0
foreach ($f in $files) {
  $relative = $f.FullName.Substring($Source.Length + 1)
  $target   = Join-Path $Dest $relative
  $targetDir = Split-Path -Parent $target
  if (-not (Test-Path -LiteralPath $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  }
  if ((Test-Path -LiteralPath $target) -and ((Get-Item -LiteralPath $target).Length -eq $f.Length)) {
    $skipped++
    continue
  }
  Write-Host "  copying $relative ($([math]::Round($f.Length / 1MB, 1)) MB)"
  Copy-Item -LiteralPath $f.FullName -Destination $target
  $copied++
}

Write-Host ""
Write-Host "Copied $copied file(s), skipped $skipped already present."
Write-Host "Inbox: $Dest"
Write-Host ""

Get-ChildItem -LiteralPath $Dest -Recurse -File |
  Sort-Object FullName |
  Select-Object @{ n = 'File'; e = { $_.FullName.Substring($Dest.Length + 1) } },
                @{ n = 'MB';   e = { [math]::Round($_.Length / 1MB, 1) } },
                LastWriteTime |
  Format-Table -AutoSize

$large = Get-ChildItem -LiteralPath $Dest -Recurse -File | Where-Object { $_.Length -gt 10MB }
if ($large) {
  Write-Host "$($large.Count) file(s) are over 10 MB: set up Git LFS before committing them (see assets/README.md)."
}
Write-Host "Next: sort the inbox into assets/videos/promo/<type>/ and fill in manifest.json (see assets/videos/promo/README.md)."
