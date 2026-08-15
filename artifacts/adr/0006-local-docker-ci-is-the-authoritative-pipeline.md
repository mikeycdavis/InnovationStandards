# 0006 — Local Docker CI is the authoritative pipeline, and a PR carries the commit that passed it

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Project owner

## Context

GitHub remains this repository's source control, pull-request, and review system. What it was also
serving as, until now, was the place a branch proved itself: `.github/workflows/ci.yml` held the
seven commands that constitute this repository's build, and running them was something that happened
after a push, on someone else's machine, on a runner that might or might not be available.

Three problems with that, in increasing order of seriousness.

**The pipeline was defined in YAML that nobody ran locally.** A developer's `npm test` and the
workflow's `npm test` were the same command by coincidence and convention, not by construction. That
is the ordinary way pipelines drift: a step is added to the workflow, the local recipe is not
updated, and eventually "CI passed" means two different things depending on who says it.

**The hosted runner is not guaranteed to be there.** GitHub-hosted Actions can be unavailable for
reasons that have nothing to do with the code — quota, billing, a disabled workflow. A verification
story that stops working when an account setting changes is not a verification story.

**It was verifying a push, not a commit.** A workflow triggered by a push tests whatever arrived. The
developer's local state at the moment of pushing, and the commit that ends up on the pull request,
were never mechanically tied together.

There is also a specific defect this decision surfaced, which is worth recording because it argues
the case better than the reasoning does. The workflow ran `npm test`, which was
`node --test "test/*.test.mjs"` — a quoted glob that only Node 22 and later expand. The workflow
pinned Node 20. **The test step could not have passed on the runner it was configured for.** Nobody
noticed, because the developer's Node is newer and the hosted run was not being watched. Containerising
the pipeline found it on the first attempt.

## Decision

### The pipeline is defined once, in `ci/pipeline.mjs`

An ordered array of checks, each naming an `npm run` script so that `package.json` stays the single
place a command line is written. `scripts/ci.sh` runs it, `.github/workflows/ci.yml` runs
`scripts/ci.sh`, and a self-hosted runner would run `scripts/ci.sh`. The YAML no longer restates any
check, and `test/local-ci.test.mjs` fails if it starts to.

The rationale comments that used to sit beside each workflow step moved into the array with the
checks. A gate whose reason has been left behind in a file that no longer defines it is a gate that
eventually looks arbitrary and gets deleted.

### Docker is the isolation boundary, and the repository is copied in

Not bind-mounted. The image is built from the working tree, which means the run cannot be perturbed
by a concurrent edit, and the test suite — which genuinely writes to the source tree — cannot modify
the developer's checkout. `.dockerignore` excludes `.git`, so no history and no credential reaches
the image; the commit under verification is passed in as an environment variable. The container runs
as a non-root user, with `network_mode: none`, with no host mount and no Docker socket.

The base image is pinned by digest rather than by tag. A CI image that changes underneath you turns
"this commit passed" into a claim about a moment rather than about a commit.

### A PR may only carry a commit that passed

`scripts/submit-pr.sh` refuses a dirty tree, records `HEAD`, runs the pipeline, re-reads `HEAD`,
refuses if it moved, and pushes the recorded SHA **by value** rather than by ref name. This is the
invariant, and it is stated as one sentence deliberately:

> The commit pushed for a PR is exactly the commit that passed the complete local Docker CI pipeline.

The dirty-tree refusal is load-bearing rather than fastidious. CI verifies a tree; a PR carries a
commit. If those can differ, there is nothing left to enforce.

### GitHub Actions is kept, subordinated

Deleting it would have been the easy move and the wrong one. It is a second, independent execution of
the same pipeline, on a machine that is not the author's — which is worth having whenever it is
available. It is no longer the definition of anything.

## Consequences

**Docker becomes a prerequisite for the authoritative CI run.** This is a real cost in a repository
whose defining constraint is zero third-party dependencies, and it deserves to be named rather than
waved past. It is not a violation of ADR 0001: nothing was added to `package.json`, no code in
`scripts/` gained an import, and the shipped tool still runs anywhere Node 18 runs. What changed is
how the *repository's own* verification is performed, not what the repository depends on. The
`--no-docker` path exists so the pipeline is still runnable where Docker is not.

**The pattern is portable.** The scripts contain no knowledge of this repository beyond the check
list and the project-name prefix. Reuse is four edits, documented in `docs/local-ci.md`.

**Local CI cannot verify a merge.** GitHub's `pull_request` event builds a merge of the branch into
its base; local CI verifies the commit as it stands. A base branch that moved after you branched is
not accounted for. This is a genuine gap, documented rather than papered over, and it is the main
argument for keeping the hosted workflow alive.

**One repository behaviour changed.** `npm test` became bare `node --test`, which discovers the same
135 tests and works on Node 18 through 24. The directory form `node --test test/` was tried first and
rejected: it works on Node 20 and fails on Node 24, which would have moved the portability defect
rather than removed it. This is a portability fix, not a relaxation — no test was skipped, disabled,
or weakened, and the count is identical before and after.

## Alternatives considered

**Leave CI in GitHub Actions only.** Rejected on the three problems above, and by the discovered
defect: the pipeline as configured could not pass on its own runner.

**Duplicate the pipeline in both a script and the YAML.** Rejected. Two definitions of CI is the
failure mode this decision exists to remove, and it would have removed nothing.

**Use a git `pre-push` hook instead of a submission script.** Rejected. Hooks are per-clone,
bypassable with `--no-verify`, and cannot verify a `HEAD` that moved during the run, because they run
with the push already in flight. A hook is a convenience; the invariant needs a gate.

**Introduce a CI platform — Jenkins, Woodpecker, GitLab CI.** Rejected, and out of scope by the
owner's instruction. The requirement is a repository-local pipeline plus GitHub for SCM and PRs; a
server to maintain would be a larger commitment than the problem justifies.
