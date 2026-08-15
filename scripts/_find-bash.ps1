<#
.SYNOPSIS
  Resolves the bash that the PowerShell entry points delegate to. Internal.

.DESCRIPTION
  Git for Windows' bash, specifically. `C:\Windows\System32\bash.exe` is the WSL launcher: it runs
  inside a different filesystem namespace, where this repository's path and Docker Desktop's socket
  are reached differently, so a script that works under Git Bash can fail confusingly under it. It
  is excluded rather than tried and hoped for.
#>

$ErrorActionPreference = 'Stop'

$candidates = @()

$git = Get-Command git.exe -ErrorAction SilentlyContinue
if ($git) {
  # <install>\cmd\git.exe -> <install>\bin\bash.exe
  $candidates += (Join-Path (Split-Path (Split-Path $git.Source -Parent) -Parent) 'bin\bash.exe')
}
$candidates += 'C:\Program Files\Git\bin\bash.exe'
$candidates += 'C:\Program Files (x86)\Git\bin\bash.exe'

foreach ($candidate in $candidates) {
  if ($candidate -and (Test-Path -LiteralPath $candidate)) { return (Resolve-Path -LiteralPath $candidate).Path }
}

foreach ($found in (Get-Command bash.exe -All -ErrorAction SilentlyContinue)) {
  if ($found.Source -notmatch '\\System32\\|\\Sysnative\\') { return $found.Source }
}

throw "Could not find Git Bash. Install Git for Windows (https://git-scm.com/download/win), or run scripts/ci.sh from a bash shell directly."
