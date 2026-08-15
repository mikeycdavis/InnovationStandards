#!/usr/bin/env bash
#
# The authoritative CI command. Runs the complete pipeline in a disposable Docker environment and
# exits 0 only if every check passed.
#
#   ./scripts/ci.sh                  run the full pipeline
#   ./scripts/ci.sh --verbose        stream each check's output as it runs
#   ./scripts/ci.sh --keep-on-failure  leave the failed container in place for inspection
#   ./scripts/ci.sh --no-docker      run the pipeline directly, for a runner already isolated
#
# This script is the one place the pipeline is invoked from. scripts/submit-pr.sh calls it,
# .github/workflows/ci.yml calls it, and a self-hosted runner would call it. The list of checks
# lives in ci/pipeline.mjs, not here — this file is the isolation boundary, not the pipeline.
#
# Exit 0 pipeline passed, 1 pipeline failed, 2 invocation or environment error.

set -euo pipefail

EXIT_OK=0
EXIT_FAILED=1
EXIT_INVOCATION=2

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Everything below runs from the repository root and addresses files relatively. On Git Bash,
# `docker.exe` is a Windows program that does not understand an MSYS path like /f/Repos/..., and the
# usual automatic conversion is unreliable for arguments that are half path and half not (the
# `container:/path` form given to `docker cp`). Relative paths sidestep the whole problem, and the
# one genuinely container-side path is passed with conversion explicitly disabled for that command.
cd "$ROOT"
COMPOSE_FILE="compose.ci.yml"
OUT_DIR="artifacts/local-ci"

VERBOSE=0
KEEP_ON_FAILURE=0
USE_DOCKER=1

for arg in "$@"; do
  case "$arg" in
    --verbose) VERBOSE=1 ;;
    --keep-on-failure) KEEP_ON_FAILURE=1 ;;
    --no-docker) USE_DOCKER=0 ;;
    -h|--help) sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit $EXIT_OK ;;
    *) echo "ci: unknown option: $arg" >&2; exit $EXIT_INVOCATION ;;
  esac
done

die() { echo "ci: $1" >&2; exit $EXIT_INVOCATION; }

# ---------------------------------------------------------------------------------------------
# What is being verified. Recorded before anything runs, so the record describes the input rather
# than whatever the tree happened to look like afterwards.
# ---------------------------------------------------------------------------------------------
if git rev-parse --git-dir >/dev/null 2>&1; then
  LOCAL_CI_COMMIT="${LOCAL_CI_COMMIT:-$(git rev-parse HEAD)}"
  LOCAL_CI_BRANCH="${LOCAL_CI_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
  # What was actually tested is the working tree, not the commit. When they differ, the record must
  # say so — a result labelled with a SHA whose tree was not the tree under test is exactly the kind
  # of confident wrong answer this repository's standards exist to prevent. submit-pr.sh refuses to
  # run at all in this state, so the distinction only ever appears on a developer's own `ci.sh` run.
  if [ -n "$(git status --porcelain)" ]; then LOCAL_CI_TREE_STATE="dirty"; else LOCAL_CI_TREE_STATE="clean"; fi
else
  LOCAL_CI_COMMIT="${LOCAL_CI_COMMIT:-unknown}"
  LOCAL_CI_BRANCH="${LOCAL_CI_BRANCH:-unknown}"
  LOCAL_CI_TREE_STATE="unknown"
fi
LOCAL_CI_REPOSITORY="${LOCAL_CI_REPOSITORY:-$(basename "$ROOT")}"
export LOCAL_CI_COMMIT LOCAL_CI_BRANCH LOCAL_CI_REPOSITORY LOCAL_CI_TREE_STATE

mkdir -p "$OUT_DIR"

# ---------------------------------------------------------------------------------------------
# The runner-already-isolated path. No Docker, no containers, same pipeline.
# ---------------------------------------------------------------------------------------------
if [ "$USE_DOCKER" -eq 0 ]; then
  command -v node >/dev/null 2>&1 || die "--no-docker requires node on PATH"
  echo "Local CI (no-docker): running the pipeline directly in this environment."
  set +e
  LOCAL_CI_OUT="$OUT_DIR" node ci/pipeline.mjs $([ "$VERBOSE" -eq 1 ] && echo --verbose)
  status=$?
  set -e
  exit $status
fi

command -v docker >/dev/null 2>&1 || die "docker is not on PATH. Install Docker, or run with --no-docker."
docker info >/dev/null 2>&1 || die "the Docker daemon is not reachable. Start Docker Desktop or the docker service."
docker compose version >/dev/null 2>&1 || die "'docker compose' is unavailable. Compose v2 is required."
[ -f "$COMPOSE_FILE" ] || die "missing $COMPOSE_FILE"

# ---------------------------------------------------------------------------------------------
# Isolation. A unique project name per run scopes every container, network, and volume this run
# creates, so teardown can be total without touching anything else on the machine. Two repositories
# using this pattern, or two runs of this one, cannot collide.
# ---------------------------------------------------------------------------------------------
RUN_ID="$(date -u +%Y%m%d%H%M%S)-$$"
PROJECT="instd-ci-${RUN_ID}"
CONTAINER="${PROJECT}-run"
COMPOSE=(docker compose -f "$COMPOSE_FILE" -p "$PROJECT")

CLEANED=0
cleanup() {
  local code=$?
  if [ "$CLEANED" -eq 1 ]; then return; fi
  CLEANED=1
  if [ "$code" -ne 0 ] && [ "$KEEP_ON_FAILURE" -eq 1 ]; then
    echo ""
    echo "Left in place for inspection (--keep-on-failure):"
    echo "  container: $CONTAINER"
    echo "  project:   $PROJECT"
    echo "  logs:      docker logs $CONTAINER"
    echo "  shell:     docker run --rm -it ${LOCAL_CI_IMAGE:-innovation-standards-ci:local} sh"
    echo "  clean up:  docker compose -f compose.ci.yml -p $PROJECT down --volumes --remove-orphans"
    return
  fi
  # Scoped to this run's project. Unrelated containers, networks, volumes, and databases are not
  # visible to this command and cannot be removed by it.
  "${COMPOSE[@]}" down --volumes --remove-orphans --timeout 10 >/dev/null 2>&1 || true
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "Local CI"
echo "  repository: $LOCAL_CI_REPOSITORY"
echo "  branch:     $LOCAL_CI_BRANCH"
echo "  commit:     $LOCAL_CI_COMMIT"
echo "  project:    $PROJECT"
if [ "$LOCAL_CI_TREE_STATE" = "dirty" ]; then
  echo ""
  echo "  NOTE: the working tree has uncommitted changes, so this run verifies the tree, not"
  echo "        commit $LOCAL_CI_COMMIT. The result record says so. submit-pr.sh refuses this state."
fi
echo ""

# ---------------------------------------------------------------------------------------------
# 1. Build.
# ---------------------------------------------------------------------------------------------
echo ">> building CI image"
if [ "$VERBOSE" -eq 1 ]; then
  "${COMPOSE[@]}" build
else
  "${COMPOSE[@]}" build --quiet
fi

# ---------------------------------------------------------------------------------------------
# 2. Start dependency services and wait for them to be genuinely ready.
#
# `--wait` blocks on each service's declared healthcheck rather than on a sleep. This repository
# declares no dependency services, so the loop below finds none and says so; a repository that adds
# one to compose.ci.yml gets the health-gated wait without editing this script.
# ---------------------------------------------------------------------------------------------
DEPS="$("${COMPOSE[@]}" config --services | grep -v '^ci$' || true)"
if [ -n "$DEPS" ]; then
  echo ">> starting dependencies: $(echo "$DEPS" | tr '\n' ' ')"
  # shellcheck disable=SC2086
  "${COMPOSE[@]}" up -d --wait --wait-timeout 180 $DEPS
  echo "   all dependency healthchecks reported healthy"
else
  echo ">> dependencies: none declared (this repository has no database or service dependency)"
fi

# ---------------------------------------------------------------------------------------------
# 3. Run the pipeline.
# ---------------------------------------------------------------------------------------------
echo ">> running pipeline"
echo ""
set +e
"${COMPOSE[@]}" run --no-TTY --name "$CONTAINER" ci node ci/pipeline.mjs $([ "$VERBOSE" -eq 1 ] && echo --verbose)
PIPELINE_STATUS=$?
set -e

# ---------------------------------------------------------------------------------------------
# 4. Recover the machine-readable record from the container before it is destroyed.
# ---------------------------------------------------------------------------------------------
if MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' \
    docker cp "$CONTAINER:/app/artifacts/local-ci/latest.json" "$OUT_DIR/latest.json" >/dev/null 2>&1; then
  :
else
  echo "ci: warning — no result record was produced by the container" >&2
fi

echo ""
echo "-----------------------------------------------------------------"
echo "Repository:  $LOCAL_CI_REPOSITORY"
echo "Branch:      $LOCAL_CI_BRANCH"
echo "Commit:      $LOCAL_CI_COMMIT"
echo "Environment: Docker (project $PROJECT)"
if [ "$PIPELINE_STATUS" -eq 0 ]; then
  echo "Result:      PASS"
else
  echo "Result:      FAIL"
fi
# The stage and check lines are printed by the pipeline itself, above, so that the summary reports
# what actually ran rather than what this script assumes ran.
if [ -f "$OUT_DIR/latest.json" ]; then
  echo "Record:      artifacts/local-ci/latest.json"
fi
echo "Completed:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "-----------------------------------------------------------------"

if [ "$PIPELINE_STATUS" -ne 0 ]; then
  exit $EXIT_FAILED
fi
exit $EXIT_OK
