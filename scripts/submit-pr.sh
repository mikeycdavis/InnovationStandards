#!/usr/bin/env bash
#
# Verified PR submission. Enforces one invariant:
#
#   The commit pushed for a PR is exactly the commit that passed the complete local Docker CI
#   pipeline.
#
#   ./scripts/submit-pr.sh                       verify, push, open a PR against the default branch
#   ./scripts/submit-pr.sh --base develop        target a different base
#   ./scripts/submit-pr.sh --draft               open the PR as a draft
#   ./scripts/submit-pr.sh --title "..." --body-file NOTES.md
#   ./scripts/submit-pr.sh --no-pr               verify and push, but do not create a PR
#   ./scripts/submit-pr.sh --verbose             stream CI output
#
# This script never commits, never amends, never rebases, and never force-pushes. If the working
# tree is dirty or HEAD moves during verification it stops; making the tree clean is the developer's
# decision, not this script's.
#
# Exit 0 submitted, 1 verification failed, 2 invocation or environment error.

set -euo pipefail

EXIT_OK=0
EXIT_FAILED=1
EXIT_INVOCATION=2

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Run from the repository root and address everything relatively. Passing an MSYS path such as
# /f/Repos/... to git.exe under Git Bash is unreliable; not passing one is not.
cd "$ROOT"

# Overridable so the behaviour of this script can be tested against a fake pipeline without running
# Docker. Nothing else should set it — the default is the authoritative pipeline.
CI_COMMAND="${LOCAL_CI_COMMAND:-$SCRIPT_DIR/ci.sh}"
REMOTE="${SUBMIT_PR_REMOTE:-origin}"

BASE=""
DRAFT=0
TITLE=""
BODY=""
BODY_FILE=""
CREATE_PR=1
VERBOSE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="${2:-}"; shift 2 ;;
    --draft) DRAFT=1; shift ;;
    --title) TITLE="${2:-}"; shift 2 ;;
    --body) BODY="${2:-}"; shift 2 ;;
    --body-file) BODY_FILE="${2:-}"; shift 2 ;;
    --no-pr) CREATE_PR=0; shift ;;
    --verbose) VERBOSE=1; shift ;;
    -h|--help) sed -n '2,19p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit $EXIT_OK ;;
    *) echo "submit-pr: unknown option: $1" >&2; exit $EXIT_INVOCATION ;;
  esac
done

die() { echo "submit-pr: $1" >&2; exit $EXIT_INVOCATION; }
refuse() { echo "$1" >&2; exit $EXIT_FAILED; }

# ---------------------------------------------------------------------------------------------
# 1. A git repository.
# ---------------------------------------------------------------------------------------------
git rev-parse --git-dir >/dev/null 2>&1 || die "not a git repository: $ROOT"

# ---------------------------------------------------------------------------------------------
# 2. A branch appropriate for a PR.
# ---------------------------------------------------------------------------------------------
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" != "HEAD" ] || refuse "Detached HEAD. Check out a branch before submitting."

DEFAULT_BRANCH="$(git symbolic-ref --quiet --short "refs/remotes/$REMOTE/HEAD" 2>/dev/null | sed "s#^$REMOTE/##" || true)"
if [ -z "$DEFAULT_BRANCH" ]; then
  for candidate in main master; do
    if git show-ref --verify --quiet "refs/heads/$candidate"; then DEFAULT_BRANCH="$candidate"; break; fi
  done
fi
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
BASE="${BASE:-$DEFAULT_BRANCH}"

if [ "$BRANCH" = "$DEFAULT_BRANCH" ]; then
  refuse "Refusing to submit from '$BRANCH', the default branch. Create a feature branch first."
fi
if [ "$BRANCH" = "$BASE" ]; then
  refuse "Refusing to submit '$BRANCH' against itself. Choose a different --base."
fi

# ---------------------------------------------------------------------------------------------
# 3. A clean working tree.
#
# Not a formality. CI runs against the tree; the PR carries a commit. If they can differ, the
# invariant this script exists to enforce is unenforceable, because the thing that passed and the
# thing that is pushed are not the same thing.
# ---------------------------------------------------------------------------------------------
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit or stash your changes before submitting." >&2
  echo "" >&2
  git status --short >&2
  exit $EXIT_FAILED
fi

# ---------------------------------------------------------------------------------------------
# 4. The commit to be verified.
# ---------------------------------------------------------------------------------------------
SHA_BEFORE="$(git rev-parse HEAD)"

echo "Verifying before submission"
echo "  branch: $BRANCH"
echo "  base:   $BASE"
echo "  commit: $SHA_BEFORE"
echo ""

# ---------------------------------------------------------------------------------------------
# 5-6. Run the authoritative pipeline. Stop on failure, having changed nothing.
# ---------------------------------------------------------------------------------------------
[ -x "$CI_COMMAND" ] || [ -f "$CI_COMMAND" ] || die "CI command not found: $CI_COMMAND"
set +e
if [ "$VERBOSE" -eq 1 ]; then
  "$CI_COMMAND" --verbose
else
  "$CI_COMMAND"
fi
CI_STATUS=$?
set -e

if [ "$CI_STATUS" -ne 0 ]; then
  refuse "CI failed. No branch was pushed and no PR was created."
fi

# ---------------------------------------------------------------------------------------------
# 7-8. The commit must not have moved while CI was running.
#
# This is the invariant. A passing pipeline certifies one tree; if HEAD advanced during the run —
# an amend, a commit in another terminal, a rebase, a hook — the certificate belongs to a commit
# that is no longer the one about to be pushed, and it is worthless.
# ---------------------------------------------------------------------------------------------
SHA_AFTER="$(git rev-parse HEAD)"
if [ "$SHA_AFTER" != "$SHA_BEFORE" ]; then
  echo "HEAD changed after CI verification. The current commit has not been verified. Re-run CI before submitting." >&2
  echo "" >&2
  echo "  verified: $SHA_BEFORE" >&2
  echo "  current:  $SHA_AFTER" >&2
  echo "No branch was pushed and no PR was created." >&2
  exit $EXIT_FAILED
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "The working tree became dirty during verification. The current state has not been verified." >&2
  echo "No branch was pushed and no PR was created." >&2
  exit $EXIT_FAILED
fi

# ---------------------------------------------------------------------------------------------
# 9. Push exactly the verified commit.
#
# By SHA, not by ref name. If anything moved the branch between the check above and this line, the
# push still carries the commit that passed, and the post-push assertion catches the discrepancy.
# ---------------------------------------------------------------------------------------------
echo ""
echo ">> pushing verified commit $SHA_BEFORE to $REMOTE/$BRANCH"
git push --set-upstream "$REMOTE" "$SHA_BEFORE:refs/heads/$BRANCH"

PUSHED="$(git ls-remote "$REMOTE" "refs/heads/$BRANCH" | awk '{print $1}')"
if [ "$PUSHED" != "$SHA_BEFORE" ]; then
  refuse "The remote branch is at $PUSHED, not the verified commit $SHA_BEFORE. No PR was created."
fi
echo "   remote $REMOTE/$BRANCH is at the verified commit"

# ---------------------------------------------------------------------------------------------
# 10. Open the PR, recording what was actually verified and by what.
# ---------------------------------------------------------------------------------------------
if [ "$CREATE_PR" -eq 0 ]; then
  echo ""
  echo "Verified commit pushed. --no-pr was given, so no pull request was created."
  exit $EXIT_OK
fi

if ! command -v gh >/dev/null 2>&1; then
  echo ""
  echo "Verified commit pushed. GitHub CLI is not installed, so no pull request was created."
  echo "Open one manually against $BASE, for commit $SHA_BEFORE."
  exit $EXIT_OK
fi
if ! gh auth status >/dev/null 2>&1; then
  echo ""
  echo "Verified commit pushed. GitHub CLI is not authenticated ('gh auth login'), so no pull request was created."
  exit $EXIT_OK
fi

# The developer's existing gh session is used as-is. No token is read, written, or stored by this
# script, and none is baked into any image.
USER_BODY=""
if [ -n "$BODY_FILE" ]; then
  [ -f "$BODY_FILE" ] || die "--body-file not found: $BODY_FILE"
  USER_BODY="$(cat "$BODY_FILE")"
elif [ -n "$BODY" ]; then
  USER_BODY="$BODY"
fi

# Appended, never substituted: whatever the developer wrote stays, and the verification block is
# added beneath it. The wording names local Docker verification explicitly and claims nothing about
# GitHub-hosted Actions, which this script does not run and cannot speak for.
EVIDENCE="$(cat <<EOF

---

## Local CI

Verified commit: \`$SHA_BEFORE\`
Result: PASS
Environment: Docker (\`./scripts/ci.sh\`, pipeline defined in \`ci/pipeline.mjs\`)
Verified at: $(date -u +%Y-%m-%dT%H:%M:%SZ)

This is local containerized verification performed before the push. It is **not** a report of a
GitHub-hosted Actions run. See \`docs/local-ci.md\`.
EOF
)"

BODY_TMP="$(mktemp)"
trap 'rm -f "$BODY_TMP"' EXIT
printf '%s%s\n' "$USER_BODY" "$EVIDENCE" > "$BODY_TMP"

GH_ARGS=(pr create --base "$BASE" --head "$BRANCH" --body-file "$BODY_TMP")
[ "$DRAFT" -eq 1 ] && GH_ARGS+=(--draft)
if [ -n "$TITLE" ]; then
  GH_ARGS+=(--title "$TITLE")
else
  GH_ARGS+=(--title "$(git log -1 --format=%s "$SHA_BEFORE")")
fi

echo ""
echo ">> creating pull request"
gh -R "$(git remote get-url "$REMOTE" | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')" "${GH_ARGS[@]}"

echo ""
echo "Submitted. The commit on the pull request is the commit that passed local CI: $SHA_BEFORE"
exit $EXIT_OK
