# Pre-registration — inference versus refusal, for proposal 0004

**Written:** 2026-08-26 · **Repository:** `e85e471` · **Status:** frozen, not yet run

This pre-registers the experiment that decides **how** proposal 0004's release objective is met. The
objective itself is not in question and is not being re-litigated:

> Prevent a repository with shipped work from being silently treated as `greenfield`.

What is in question is whether that is best served by improving inference or by refusing to infer.

## Why a second experiment exists

The first one answered a question that is now closed, and its answer did not survive:

| | |
| --- | --- |
| E9 | Six candidates were pre-registered against five subjects; one classified all five |
| E14 | A composition derived **after** seeing that result, against a subject built after it too |
| E15 | Pre-registered against fourteen unseen repositories, and **failed** — 10/14, four false `greenfield` |
| E16 | Three of those four contain no marker at any depth. Recursion cannot find what is absent |
| E17 | Git evidence, eliminated on five subjects, scored highest on fourteen — recorded as a correction to E11's generality, never as a recommendation |
| E19 | ST-03 converted the defect from prose into executable falsification: two shapes red, control green |

So the design question is open, and it is open in a specific way. **Defect existence is settled.**
What is unsettled is design selection under failed prior evidence.

## The trap this experiment is built to avoid

ST-03's two falsifiers are both satisfied by bounded recursion. That is a fact about those two cases
and **not** evidence that depth is the answer — depth scored 1/14 and 2/14 on the held-out set, and
three of its four errors were unreachable at any depth. A design chosen because it passes the two
falsifiers we happen to possess would be derived from the data it is then tested against, which is
precisely the error the first pre-registration existed to prevent, recurring one level up.

**The falsifiers are therefore a gate, not a score.** Failing them disqualifies a candidate. Passing
them earns a candidate nothing.

## The two classes

They are not variants of one design. They disagree about whether the tool should answer at all.

**Class I — inference.** Improve `detectMode` so it classifies from repository evidence. 0004's
alternatives (a), (b), (c) and the `integrate` option live here.

**Class II — refusal.** When evidence is insufficient or contradictory, decline to classify, exit
non-zero, and name what the operator must pass. 0004's alternatives (d) and (e) live here. These were
declined on five subjects in the first experiment and have never been tested on a held-out set.

## The comparison problem, and how it is resolved before the run

**The two classes cannot be scored on one accuracy number,** because a refusing strategy declines to
produce the value accuracy is computed over. Scoring refusal as a miss assumes the conclusion;
scoring it as a hit makes refusing everything optimal. Both are decided by the scale rather than by
the evidence, so the scale is fixed here, in advance.

Every subject × candidate produces exactly one of four outcomes:

| Outcome | Meaning |
| --- | --- |
| `correct` | The mode matches ground truth |
| `false-greenfield` | Classified `greenfield` when ground truth is not `greenfield` |
| `false-recorded` | Classified `existing-with-proposals` when ground truth is `undocumented-decisions` |
| `refused` | Declined to classify and told the operator what to pass |

**Pre-registered harm ordering, worst first:**

```
false-greenfield  >  false-recorded  >  refused  >  correct
```

`false-greenfield` is worst because it is the objective's own failure and it fails silently: a
suppressed warning leaves no trace, and the fabricated retrospective proposal it enables is
indistinguishable from a real one once written. `false-recorded` is an error and a lesser one — it
asserts decisions exist, which an operator can contradict from knowledge they already have.
`refused` does no harm and is not free: it costs the operator a flag and, at volume, makes the tool
useless.

**No composite score, no weights.** Weights chosen now would decide the outcome by arithmetic and
would be indistinguishable, afterwards, from weights chosen to produce it. Candidates are compared on
the ordered vector of counts, and where the vector does not separate two candidates they are recorded
as tied.

## Ground truth, and the order operations must happen in

Ground truth is a human judgement about each repository, and it is the input most easily corrupted by
knowing what the candidates would say. The ordering below is part of the pre-registration and a run
that departs from it is void:

```
1.  freeze the candidates          — committed, hashed, before any subject is opened
2.  freeze the subject list        — committed, before any subject is opened
3.  establish ground truth         — per subject, by inspection, recorded with its reasoning
4.  run                            — candidates unchanged
5.  record                         — every subject × candidate, including the disagreements
```

**Ground truth is recorded per subject with the evidence for it, never as a total.** "14/16" is
compatible with being right for the wrong reason twice.

**Ground truth for a subject holding `artifacts/prompts/` and no proposals is recorded as
`AMBIGUOUS-0006` rather than as a mode.** Whether a prompt artifact is a recorded innovation decision
is [proposal 0006](../../innovation-proposals/0006-prompt-markers-are-not-recorded-decisions.md)'s
open question, and answering it here to make an experiment scoreable would settle an undecided
proposal by measurement. Those subjects contribute to the `false-greenfield` count — which is
well-defined without 0006, since `greenfield` is wrong either way — and are excluded from the
`false-recorded` count. This is stated now so it cannot look like an exclusion invented after seeing
which candidate it helps.

## Subjects

**The first held-out set is spent.** All fourteen, plus the six derivation subjects, have been seen
by a designer and cannot be used again.

The new set is drawn from repositories on the same disk that no subject list has named. **No subject
below has been opened while writing this.** Only directory names were read, which reveals nothing
about markers, depth or history.

**Sixteen subjects**, frozen here:

```
EMOS            Encore          ExcuseGenerator   FantasyManager
Forecast        GoalBridge      GradePal          GreenThumb
HowLongUntil    IceBox          LifeHub           LifeInWeeks
Moneyball       PvsNP           ShouldILiveHere   WorkSimulator
```

Plus the three constructed controls already on `main`, which are **gates rather than subjects** —
they are scored separately and never enter the count above:

```
housedoc-shape    must not be greenfield
bare-monorepo     must be undocumented-decisions
genuinely-empty   must be greenfield
```

**Deliberately excluded, with the reason, so the selection cannot be re-drawn afterwards:**

- **Every `*Standards*`, `StandardsEnforcer*`, `StandardsOrchestrator` repository.** They are this
  framework's own ecosystem and share a layout by construction. The first experiment's own
  limitation section says three of its five derivation subjects were this portfolio's standards
  repositories and that E11's conclusion did not survive contact with anything else.
- **Every worktree, clone or variant** — `*-adapter`, `*-verify`, `SE-*`, `ES-*`, `MB-*`,
  `*.tier1/2/3`, `*;F`, `*-backup`. They are the same project counted twice, and duplicates inflate a
  score without adding a case.
- **`kaggle`, `bitgrit`, `drivendata`, `zindi`, `Numerai`, `QuantConnect`, `Quantiacs`** — competition
  scratch areas whose ground truth is arguably "not a project at all", a fourth category this
  experiment does not have and will not invent mid-run.

## Candidates

Frozen before any subject is opened. At least one from each class, and **at least one Class I
candidate whose primary signal is not a filename**, so the design space is not silently reduced to
choosing a recursion depth:

| # | Class | Candidate |
| --- | --- | --- |
| 0 | — | **Baseline.** Today's shipping `detectMode`, unchanged. Scored 1/14 previously |
| 1 | I | **Bounded recursion + no early return.** The `a+c1` composition E14 names. Included because it must be measured, not because it is preferred |
| 2 | I | **Git evidence, non-filename.** Commit count and tracked-file count. `UNAVAILABLE` on a non-repository is recorded as `refused`, which is what it behaves as |
| 3 | I | **Content-shaped, non-filename.** Any file at all under version control that is not documentation, configuration or framework scaffolding. Answers "has this repository produced artefacts" without a marker list |
| 4 | II | **Refuse when weak.** Classify only where signals agree; otherwise refuse, naming what the operator must pass |
| 5 | II | **Never infer `greenfield`.** 0004's alternative (e). `greenfield` becomes declarable only; absence of evidence yields refusal |

Candidates 2 and 3 exist because of E16: three of the four prior failures contain no marker the list
can name at any depth, so a marker-based experiment cannot even represent the failure mode that
falsified the last design.

## What supports each class

Declared now, per class, so that neither can be judged by the other's yardstick after the fact.

**Class I is supported when a candidate achieves all of:**

- Zero `false-greenfield` across all sixteen subjects. **This is a hard gate, not a score** — it is
  the release objective, and a strategy that fails it once has not met the objective.
- Passes the three constructed gates.
- For every subject, the reported evidence distinguishes **looked everywhere and found nothing** from
  **looked only at the root and found nothing**. E20 records that today's output cannot: an empty
  directory and a two-package monorepo are described in identical words, which is why the wrong
  HouseDoc verdict was unnoticeable. A Class I strategy that classifies correctly and cannot explain
  itself has not earned implementation, because its next wrong answer is equally invisible.
- No third-party dependency; detection cost below a full `standards validate`. Both are existing kill
  criteria and both still apply.

**Class II is supported when a candidate achieves all of:**

- Zero `false-greenfield` **and** zero `false-recorded` across all sixteen subjects.
- `genuinely-empty` classifies `greenfield` **without** requiring an override. A refusal strategy that
  makes an empty directory demand a flag has moved the cost onto the one case that was always
  answerable, and is not supported.
- The refusal names what the operator must pass and what evidence was inconclusive. A bare non-zero
  exit is not a supported outcome.
- `refused` on at most **half** the sixteen subjects. Declared here rather than derived, and declared
  as a threshold this experiment can fail: a tool that refuses on most real repositories has replaced
  a wrong answer with no answer, which is a different failure and not obviously a smaller one.

**Neither class is supported when** no candidate in either clears its own bar. That is a real and
pre-registered outcome, not a fallback. It would mean the release objective is not currently
achievable by either strategy on the evidence available, and 0004 would return to `explore` with that
recorded — leaving [ST-02](../../backlog/items/ST-02.md) blocked and its authorization open to
withdrawal by the owner. **Nothing about that decision is anticipated here.**

**Where both classes are supported**, the choice is not settled by this experiment and must not be
presented as though it were. Both meeting their bars is itself a finding — it would mean the
objective is achievable two ways, and the decision becomes a cost and reversibility judgement for the
proposal rather than a measurement.

## What this experiment cannot establish

- **It measures one owner's portfolio, not a population.** The first pre-registration recorded this
  limitation and it is not fixed here — sixteen new subjects from the same disk are still one
  person's repositories. Any conclusion generalises to this portfolio and is a hypothesis about
  anything else.
- **It cannot validate ground truth.** Ground truth is a human judgement recorded before the run.
  Recording the reasoning per subject bounds the risk; it does not remove it.
- **It says nothing about whether the warning changes behaviour.** 0004's second assumption is still
  unmeasured, and no candidate here addresses it.
- **It does not decide 0006.** See the `AMBIGUOUS-0006` rule above.

## Failure conditions for this pre-registration itself

Recorded so that this document can be wrong rather than merely optimistic:

- A candidate is edited after step 3. The run is void and the subjects are spent.
- A subject is opened before its ground truth is recorded, or its ground truth is revised after seeing
  a candidate's output. That subject is void and is reported as void.
- The harm ordering or either bar is changed after any result is seen. The experiment is void, and the
  fact that it was voided is the finding.
