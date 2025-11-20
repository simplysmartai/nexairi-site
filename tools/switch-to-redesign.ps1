Param(
  [string]$PrototypePath = "nexairi-redesign-prototype",
  [string]$DistDir = "dist",
  [string]$SiteDir = "site",
  [switch]$DryRun,
  [switch]$NoBackup
)

$ErrorActionPreference = 'Stop'

function Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Fail($msg){ Write-Host "[FAIL] $msg" -ForegroundColor Red; exit 1 }

if(-not (Test-Path $PrototypePath)){ Fail "Prototype folder not found: $PrototypePath" }

$distPath = Join-Path $PrototypePath $DistDir
if(-not (Test-Path $distPath)){
  Warn "Prototype build output not found: $distPath"
  Warn "Run:  cd $PrototypePath; npm ci; npm run build"
  Fail "Aborting switch."
}

if(-not (Test-Path $SiteDir)){ Fail "Site folder not found: $SiteDir" }

# Folders in site/ to preserve (content + assets)
$keep = @('posts','thanksgiving','sandbox','tools','images','Images','css','assets')

Info "Preparing to switch shell to '$distPath' while preserving: $($keep -join ', ')"

$backupName = "${SiteDir}_backup_{0:yyyyMMdd_HHmmss}" -f (Get-Date)
if(-not $NoBackup){
  Info "Backup folder will be: $backupName"
}

# Enumerate removals (top-level entries in site that are not in keep list)
$toRemove = Get-ChildItem $SiteDir -Force | Where-Object { $keep -notcontains $_.Name }
$toCopy = Get-ChildItem $distPath -Force -Recurse

Info "Items to remove from '$SiteDir': $($toRemove.Count)"
Info "Items to copy from '$distPath': $($toCopy.Count)"

if($DryRun){
  Write-Host "\n--- DRY RUN: would remove ---" -ForegroundColor DarkGray
  $toRemove | ForEach-Object { $_.FullName }
  Write-Host "\n--- DRY RUN: would copy ---" -ForegroundColor DarkGray
  $toCopy | ForEach-Object { $_.FullName }
  Info "Dry run complete. No changes made."
  exit 0
}

if(-not $NoBackup){
  Info "Creating backup: $backupName"
  Copy-Item -Recurse -Force $SiteDir $backupName
}

Info "Removing old shell files from '$SiteDir'..."
$toRemove | ForEach-Object {
  if($_.PsIsContainer){ Remove-Item -Recurse -Force $_.FullName }
  else { Remove-Item -Force $_.FullName }
}

Info "Copying prototype build to '$SiteDir'..."
Copy-Item -Recurse -Force (Join-Path $distPath '*') $SiteDir

# Ensure header logo path and asset
$targetLogo = Join-Path $SiteDir 'images\nexairi_header_logo.png'
$srcLogoCandidates = @(
  (Join-Path $SiteDir 'Images\Nexairi Mentis_logo_banner_noBackground.png'),
  (Join-Path $SiteDir 'images\nexairi_header_logo.png')
)
$srcLogo = $srcLogoCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if($srcLogo){
  New-Item -ItemType Directory -Force (Split-Path $targetLogo) | Out-Null
  Copy-Item -Force $srcLogo $targetLogo
  Info "Ensured header logo at: $targetLogo"
} else {
  Warn "Transparent header logo not found; please place one at $targetLogo"
}

# Normalize header logo references across HTML
Info "Normalizing header logo references to /images/nexairi_header_logo.png ..."
Get-ChildItem $SiteDir -Recurse -Include *.html | ForEach-Object {
  $c = Get-Content -Raw $_.FullName
  $c = $c -replace 'src\s*=\s*"[^"]*(nexairi[^"/]*logo[^"/]*)"','src="/images/nexairi_header_logo.png"'
  Set-Content -NoNewline -Path $_.FullName -Value $c
}

# Patch CSS for header logo size and CTA ghost button contrast
$cssPath = Join-Path $SiteDir 'css\styles.css'
if(Test-Path $cssPath){
  Info "Adjusting CSS in $cssPath (logo size, CTA contrast)"
  $css = Get-Content -Raw $cssPath
  $css = [regex]::Replace($css, '(?s)\.nx-logo\s*\{.*?height:\s*\d+px;', ".nx-logo {`n  display: block;`n  height: 88px;")
  if($css -notmatch "@media \(max-width: 768px\)"){ $css += "`n@media (max-width: 768px) { .nx-logo { height: 56px; } }`n" }
  if($css -notmatch "\.nx-cta \.nx-btn--ghost"){ $css += "`n.nx-cta .nx-btn--ghost { background: #6d768c; border-color: #6d768c; color: #f5f2ee; }`n.nx-cta .nx-btn--ghost:hover { background: #8a93a8; }`n" }
  Set-Content -NoNewline -Path $cssPath -Value $css
} else {
  Warn "CSS not found at $cssPath - ensure the prototype build includes or references your stylesheet."
}

Info "Switch complete. Review locally, then commit and push the 'redesign' branch."


