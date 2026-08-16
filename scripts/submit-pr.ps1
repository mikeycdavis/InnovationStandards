<#
.SYNOPSIS
  Verifies the current commit with local Docker CI and, only if it passes, pushes it and opens a PR.
  Windows entry point.

.DESCRIPTION
  A wrapper over scripts/submit-pr.sh for the same reason ci.ps1 is a wrapper over ci.sh: the
  invariant is enforced in one place. See docs/local-ci.md.

  Requires Git for Windows (which supplies bash), Docker Desktop, and — for PR creation — an
  authenticated GitHub CLI session.

.EXAMPLE
  .\scripts\submit-pr.ps1
.EXAMPLE
  .\scripts\submit-pr.ps1 --draft --base develop
#>

$ErrorActionPreference = 'Stop'

$bash = & "$PSScriptRoot\_find-bash.ps1"
$script = (Join-Path $PSScriptRoot 'submit-pr.sh')

& $bash $script @args
exit $LASTEXITCODE
