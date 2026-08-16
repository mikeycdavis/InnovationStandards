# Experiment results — proposal 0004, mode detection

Run 2026-08-12 by `harness.mjs` in this directory. The proposal that authorized this experiment is
[0004](../../innovation-proposals/0004-init-mode-inference-safety.md), outcome `explore`.

**Question, as pre-registered.** Which signal actually separates a repository that has shipped work
from one that has not, and does any candidate get all three modes right at once?

## What was fixed before the run, and what was not

Fixed beforehand: the question, the six candidates, the five subjects, the exclusion list, and the
ground-truth label for each subject.

Not fixed beforehand, and reported separately for that reason:

- **`monorepo-bare`** was constructed *after* seeing `c1-combined` win, specifically to probe the
  weakness its design implies. It is a falsification test, not a sixth observation.
- **`a+c1`** was derived *after* the run by composing two candidates. Its 6/6 is not a
  pre-registered result and must not be read as one.

## Ground truth, and the judgement in it

| Subject | Label | Why |
| --- | --- | --- |
| HouseDoc | `undocumented-decisions` | 81 commits of shipped work, zero innovation proposals |
| InnovationStandards | `existing-with-proposals` | shipped work, five proposals |
| EngineeringStandards | `undocumented-decisions` | 102 commits of shipped work, zero innovation proposals |
| empty-dir | `greenfield` | synthetic, nothing in it |
| fresh-git | `greenfield` | synthetic, one commit, one README |
| monorepo-bare | `undocumented-decisions` | synthetic, post-hoc; markers one level down, no artifacts |

The two `undocumented-decisions` labels are a judgement, and they determine every score below. They
rest on reading "existing with proposals" as *this framework's* proposals — the eight-outcome,
evidence-cited artifact — rather than any record of prior thinking. Both repositories hold
`artifacts/prompts/`, and if that were held to mean recorded decisions, `baseline` and `c2` would
score higher and this document would reach a different conclusion. That reading is what proposal
0006 exists to settle, and it is why 0006 is separate from 0004 rather than folded into it.

## Classifications

```
                     HouseDoc  InnovationStd  EngineeringStd  empty  fresh-git  monorepo-bare  score
baseline (today)     X green   v              X existing      v      v          X green        3/6
(a) recursion d2     X existing v             X existing      v      v          v              4/6
(a) recursion d3     X existing v             X existing      v      v          v              4/6
(b) git evidence     v         v              v               X n/a  v          X green        4/6
(c1) prompts != prop v         v              v               v      v          X green        5/6
(c2) prompts == prop X existing v             X existing      v      v          X green        3/6
--- derived after the run ---
(a+c1)               v         v              v               v      v          v              6/6
```

## Findings

**1. Two independent defects exist; the proposal documents one.** `EngineeringStandards` is
misclassified today at the root, with no recursion involved: `package.json` is present, so the
greenfield early return never fires, and `artifacts/prompts/` then routes it to
`existing-with-proposals`. The depth defect 0004 describes is not implicated. This is a second
misclassification of a second real repository, by a second mechanism.

**2. Bounded recursion alone does not satisfy 0004's release objective.** On HouseDoc it moves the
answer from `greenfield` to `existing-with-proposals` — still wrong, and wrong in a direction the
proposal did not consider: instead of inviting a back-fill, it asserts that decisions are already
recorded. Alternative (a) is the cheapest-looking remedy and it does not work by itself.

**3. Git evidence cannot be the general mechanism.** It returns `UNAVAILABLE` on a directory that is
not a repository, which `init` must support. Its "has shipped work" thresholds — more than one
commit and more than four tracked files — are declared, not derived, and `monorepo-bare` (2 commits,
3 files) falls through them into `greenfield`. Fitting the thresholds to make that row pass would be
fitting to the test set.

**4. Cost does not approach the kill criterion.** Depth-2 costs ~1–2 ms on the largest subject;
depth-3 ~4.5 ms across 39 directories. The git candidate costs ~40–48 ms, almost all of it process
spawn. A full `standards validate` is orders of magnitude above any of them. No candidate needs a
third-party dependency, so that kill criterion is not triggered either.

**5. The kill criterion that would have stopped the work did not fire.** No design was found that
fixes the monorepo case at the cost of misclassifying an empty repository — `a+c1` holds both.

## What this experiment does not establish

- **That the missing warning changes anybody's behaviour.** Nobody has been observed acting on it or
  failing to. This experiment measured classification accuracy, which is upstream of the harm.
- **That `a+c1` is correct.** It is correct on six subjects, one of which was built to break its
  predecessor and one of which is this repository. It has not been pre-registered and re-run.
- **That the marker list is right.** Every candidate here inherits the same thirteen filenames. A
  repository written in an ecosystem none of them names is misclassified by all six equally.
- **Anything about repositories outside this portfolio.** Three real subjects, one owner.

## Reproducing

```bash
node artifacts/experiments/0004-mode-detection/harness.mjs
```

The three real repositories are sibling directories on the machine where this ran; rows for any that
are absent are skipped with a printed note, and the synthetic three still run. Their commit counts
also move — `EngineeringStandards` reported 103 commits during the first pass of this experiment and
102 during the recorded one, because other work is live in that repository. Neither number changes
any classification here, and the drift is recorded rather than smoothed over.
