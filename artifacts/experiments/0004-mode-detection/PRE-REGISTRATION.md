# Pre-registration — re-running the derived candidate `a+c1`

Written 2026-08-12, **before** the run it describes. Committed before the run so that git history,
not this document's own assertion, is what establishes the order. Authorized by
[ST-01](../../backlog/items/ST-01.md) under [proposal 0004](../../innovation-proposals/0004-init-mode-inference-safety.md).

## Why this exists

`a+c1` scored 6/6 in [the first experiment](RESULTS.md). That number is not confirmatory and cannot
be made so by re-running it. It was assembled after seeing which pre-registered candidate won, and
one of its six subjects — `monorepo-bare` — was constructed after that, specifically to falsify the
candidate that had just won. **Both facts stay attached to it permanently.** A result derived from
the data it is then tested against establishes nothing, and 0004's `build` decision does not
retroactively change how the number was produced.

## The candidate, frozen

Bounded recursion composed with the no-early-return rule:

1. Collect implementation markers at directory depth ≤ 2, skipping the declared exclusion list.
2. Collect plan markers and prompt markers, each requiring content rather than mere existence.
3. If **all three** groups are empty → `greenfield`.
4. Else if plan markers are present → `existing-with-proposals`.
5. Else → `undocumented-decisions`.

Prompt artifacts therefore evidence prior work and never recorded decisions. That reading is what
[proposal 0006](../../innovation-proposals/0006-prompt-markers-are-not-recorded-decisions.md) owns;
this experiment uses it as the candidate defines it and settles nothing about it.

Implementation frozen as `harness.mjs` at commit `21b698f`,
sha256 `d4e0c799c52454247d5483f3e3426a4aa7eed5832abfa4fead092e84dc28df22`. **The candidate is not to
be edited between this document and the run.** If it needs to change, that is a new candidate and
this pre-registration is void rather than amended.

## Labelling procedure, stated before any subject was classified

A subject's true mode is assigned by these rules and by nothing else:

- **`existing-with-proposals`** — the repository contains at least one file matching
  `artifacts/innovation-proposals/*.md`. This is definitional, not a heuristic: it *is* what the mode
  names.
- **`greenfield`** — the repository contains no implementation work of any kind on disk.
- **`undocumented-decisions`** — it contains implementation work and no innovation proposals.

"Implementation work" is judged from files present on disk, deliberately **not** from git history, so
that the label does not import the assumption that candidate (b) is built on.

## Subjects

### Derivation set — carried forward, and it cannot falsify anything

The original six. Re-running them detects an accidental change to the harness and nothing more; a
6/6 here is not evidence and must not be reported as though it were.

| Subject | Label |
| --- | --- |
| HouseDoc | `undocumented-decisions` |
| InnovationStandards | `existing-with-proposals` |
| EngineeringStandards | `undocumented-decisions` |
| empty-dir | `greenfield` |
| fresh-git | `greenfield` |
| monorepo-bare (post-hoc falsifier) | `undocumented-decisions` |

### Held-out set — fourteen repositories the candidate has never seen

Labelled by the procedure above, from the facts recorded beside them, before the candidate was run
against any of them. None was consulted while `a+c1` was designed.

| Subject | commits | tracked | proposals | Label |
| --- | ---: | ---: | ---: | --- |
| AICrowd | 14 | 43 | 0 | `undocumented-decisions` |
| AgentRelay | 10 | 151 | 0 | `undocumented-decisions` |
| AudioPal | 37 | 433 | 0 | `undocumented-decisions` |
| BettingStandards | 14 | 155 | 0 | `undocumented-decisions` |
| BottomlessBase | 21 | 124 | 0 | `undocumented-decisions` |
| BurnoutPredictor | 40 | 338 | 0 | `undocumented-decisions` |
| CarDoc | 129 | 544 | 0 | `undocumented-decisions` |
| CareerTwin | 28 | 379 | 0 | `undocumented-decisions` |
| ClaudeSkills | 3 | 24 | 0 | `undocumented-decisions` |
| CritHappens | 110 | 699 | 0 | `undocumented-decisions` |
| CrunchDAO | 77 | 82 | 0 | `undocumented-decisions` |
| DPTB | 18 | 675 | 0 | `undocumented-decisions` |
| DeadInternetDetector | 34 | 223 | 0 | `undocumented-decisions` |
| DecisionSimulator | 20 | 247 | 0 | `undocumented-decisions` |

Two of these are interesting for reasons unrelated to the label. **CritHappens** is a Godot project:
211 `.gd` files, no file extension the marker list was written with in mind. **DPTB** is a Unity
project of roughly 75,000 files on disk. Neither resembles the repositories the marker list was
drawn from, which is the point of holding them out.

## Predictions

**`a+c1` classifies all fourteen held-out subjects as `undocumented-decisions`.** Per subject, not as
a score: a 12/14 that is wrong on CritHappens and CrunchDAO is a different result from a 12/14 that is
wrong on two ordinary Node repositories, and only the per-subject record distinguishes them.

The baseline is recorded alongside for contrast and **no prediction is made about it**.

## Success and failure, decided now

- **Supports the candidate:** all fourteen held-out subjects classify as predicted. The candidate then
  has one falsifiable test behind it that it did not have before, and ST-02 may design from it.
- **Fails the candidate:** any held-out subject classifies as `greenfield`. That is the dangerous
  direction 0004 exists to close, and a single instance means the candidate does not satisfy the
  release objective on repositories outside the set it was built from.
- **Ambiguous, and to be reported as such rather than resolved:** a subject classifies as
  `existing-with-proposals`. That is a wrong answer, but it is
  [0006](../../innovation-proposals/0006-prompt-markers-are-not-recorded-decisions.md)'s defect
  rather than this candidate's, and it must not be counted against `a+c1` here or quietly fixed.

Whatever the result, it belongs in proposal 0004 as evidence. ST-01 records that the work happened;
the proposal remains the authoritative record of what the evidence says.

## What this test still cannot do

- **No held-out subject is `greenfield` or `existing-with-proposals`.** Every real repository
  available has shipped work and no proposals. This test therefore probes exactly one direction —
  that the candidate does not report greenfield for a repository that has shipped work — which is the
  direction 0004 cares about and is not the whole of correctness. The `greenfield` direction is
  covered only by the two synthetic subjects in the derivation set.
- **Sixteen of twenty subjects have one owner.** This measures a portfolio, not a population.
- **Every candidate shares the same thirteen-name marker list.** A repository in an ecosystem none of
  them names is misclassified by all of them equally, and this test cannot see that.
- **The behavioural question is untouched.** Nothing here establishes that the mode changes what an
  adopter does.

## One thing already learned while labelling, before the run

`git` refused to read CrunchDAO and DPTB on the first attempt — `detected dubious ownership in
repository`, because they are not owned by the current user. The initial measurement therefore
reported them as having no commits and no tracked files, which is false; both are ordinary
repositories with 77 and 18 commits. This is a **third** failure mode for candidate (b) beyond the
one E11 records: git evidence is unavailable not only when the target is not a repository, but when
git declines to read one that is — and it fails toward "no history", which is the greenfield
direction. It is recorded here because it was found here. It strengthens E11 and changes nothing
about `a+c1`, which does not consult git.
