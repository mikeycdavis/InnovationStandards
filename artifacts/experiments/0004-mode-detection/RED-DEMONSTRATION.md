# Red demonstration — the two falsifiers fail against the shipping `detectMode`

**Date:** 2026-08-26 · **Repository commit:** `1be7c6d` (tag `v1.0.2`) · **Node:** v24.15.0
**Subject:** `scripts/init.mjs`, unchanged — `sha256:2586fe8e0edee85dc48d8defd144fcc5dbd328cb92914b774ad8fdf5c1bf58f0`
**Runner:** `artifacts/experiments/0004-mode-detection/falsifiers.mjs` —
`sha256:0994b71f9954ce9fe3bf1c4b6e17931198087f6a5e4c2c85cc9476e59f1716aa`

This records the half of [ST-03](../../backlog/items/ST-03.md) that does not need a correction to
exist: the two cases were built, run against the current implementation, and shown red. No
post-correction assertion was written, and `detectMode` was not touched.

**Why a demonstration rather than a test.** A case that is expected to fail cannot live in
`test/*.test.mjs` here. The pipeline requires all seven gates green and `scripts/submit-pr.sh`
refuses to push anything that does not pass, so a deliberately-red assertion could not land. ST-01
met the same wall and resolved it the same way — run the thing, commit the record of what came back
(`fdcc809`, *"Run the pre-registered test, and record that it failed"*). The runner is expected to go
green on its own, unedited, once ST-02's correction exists.

## Result

```
1 of 3 satisfied.
Not satisfied: housedoc-shape, bare-monorepo.
```

Exit code `1`. That exit code is the evidence.

| Case | Provenance | Expected | Actual | |
| --- | --- | --- | --- | --- |
| `housedoc-shape` | OBSERVED | not-greenfield | `greenfield` | **FAIL** |
| `bare-monorepo` | POST-HOC FALSIFIER | `undocumented-decisions` | `greenfield` | **FAIL** |
| `genuinely-empty` | CONTROL | `greenfield` | `greenfield` | PASS |

Every one of the three reported the same evidence string: `no implementation markers found`.

## What each case demonstrated

### `housedoc-shape` — the observed misclassification

Built from HouseDoc's actual layout at adoption: `backend-api/pyproject.toml` and `backend-api/app/`,
`mobile-app/package.json`, `database/`, `infrastructure/`, an **empty** `artifacts/innovation-proposals/`,
and `artifacts/prompts/` with content. Not one top-level directory name appears in
`IMPLEMENTATION_MARKERS`, and `has()` looks only at the root, so `implementation.length === 0` and the
function returns `greenfield` before any other signal is read.

The consequence is the one that earned proposal 0004: a repository with 80 commits of shipped work is
told to begin recording decisions as though it had none.

**This case asserts only that the mode is not `greenfield`.** It does not name the correct mode, and
the restraint is deliberate. HouseDoc holds `artifacts/prompts/` and no proposals, so naming its
correct mode would decide whether a prompt artifact counts as a recorded innovation decision — which
is [proposal 0006](../../innovation-proposals/0006-prompt-markers-are-not-recorded-decisions.md)'s open
question. A falsifier that answered it would settle an undecided proposal by test, which is the
failure ST-02's scope constraint exists to prevent.

### `bare-monorepo` — the post-hoc falsifier

`packages/api/package.json`, `packages/api/src/`, `packages/web/package.json`, `packages/web/src/`, and
no `artifacts/` directory at all. Correct mode is unambiguous — work exists, nothing is recorded —
so this one names it.

**It was constructed after the experiment, to break the candidate that had just won.** It is not
pre-registered evidence and must not be described as part of the original experiment. Its value is
that it isolates a second failure from the first: removing the early return does not help here,
because the markers are never seen at all. Depth is the failing dimension, not ordering.

### `genuinely-empty` — the control

Passes now and must go on passing. It is the direction a one-sided fix breaks: widening detection
until nothing reads `greenfield` trades one wrong answer for another and makes the mode unreachable.
This case failing later would be as much a defect as the two above failing now.

## One thing observed that was not being looked for

**All three cases emit the identical evidence string.** A genuinely empty directory and a monorepo
with two packages, four source trees and two manifests are reported to the operator in exactly the
same words: `no implementation markers found`.

That is true as written — no marker was found *at the root* — and it is the shape of a claim that
cannot be checked. ST-02 requires that "the reported evidence must still say what the tool saw and
mark the judgement `INFERRED`". The judgement is marked `INFERRED` today. What the tool saw is not
reported: nothing in the output distinguishes *looked and found nothing* from *did not look there*,
so an operator reading the greenfield verdict on HouseDoc had no way to notice it was wrong.

This is recorded as an observation about the current implementation, not as a requirement, a design,
or a case. It bears on ST-02 and is offered back to proposal 0004 for the owner to decide what, if
anything, it means.

## What this does not establish

- **It does not select a design.** ST-01 falsified the pre-registered candidate on four of fourteen
  unseen repositories, and nothing here proposes a replacement. Bounded recursion would satisfy both
  falsifiers, and would still have missed three of ST-01's four errors, which contain no marker at
  any depth. That these two cases are reachable by depth is not evidence that depth is the answer.
- **It does not decide 0006.** See `housedoc-shape` above.
- **It does not complete ST-03.** The post-correction direction has no correction to be green
  against, and is untouched.
- **It does not change 0004's `build` authorization**, which remains the proposal's to hold or
  withdraw.

## Limitation

Both failing cases are constructed rather than observed. That is a deliberate improvement on
`harness.mjs`, whose strongest rows were three real repositories it states plainly it cannot recreate
— these run identically on any machine. The cost is real and runs the other way: a constructed shape
is a model of the observation, and a model can be wrong in the direction that makes it pass. The
`housedoc-shape` case is built from that repository's recorded layout rather than from memory of it,
which bounds the risk without removing it.
