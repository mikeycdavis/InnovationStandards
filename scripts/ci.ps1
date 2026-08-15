<#
.SYNOPSIS
  Runs the complete local CI pipeline in Docker. Windows entry point.

.DESCRIPTION
  A wrapper, deliberately. The pipeline logic lives once, in scripts/ci.sh, so that Windows, macOS,
  Linux, GitHub Actions, and any future self-hosted runner all execute the same code. A parallel
  PowerShell implementation would be a second definition of CI, and two definitions of CI are how a
  repository ends up with two different answers to "did it pass".

  Requires Git for Windows (which supplies bash) and Docker Desktop.

.EXAMPLE
  .\scripts\ci.ps1
.EXAMPLE
  .\scripts\ci.ps1 --verbose --keep-on-failure
#>

$ErrorActionPreference = 'Stop'

$bash = & "$PSScriptRoot\_find-bash.ps1"
$script = (Join-Path $PSScriptRoot 'ci.sh')

& $bash $script @args
exit $LASTEXITCODE
