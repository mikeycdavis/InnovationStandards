# Amendment 01 — implementation degrees of freedom, resolved before any subject is inspected

**Written:** 2026-08-27 · **Amends:** [`PRE-REGISTRATION.md`](PRE-REGISTRATION.md) · **Status:** frozen

The pre-registration froze six candidates **by description**. Translating those descriptions into
executable code exposed choices the prose does not determine — thresholds, traversal limits,
tie-breaking, what counts as contradictory evidence, and when refusal fires. Every one of them is
settled here, while the sixteen held-out subjects are still genuinely held out.

**No subject has been opened.** Nothing below was chosen with knowledge of any subject's contents.

## The rule this amendment exists to obey

> If any candidate implementation proves ambiguous while being translated from prose to code, stop
> and amend the pre-registration before inspecting subjects. Do not resolve ambiguity after ground
> truth exists.

A description that leaves a threshold open is not frozen. The first implementation choice made after
inspecting a subject can carry that subject's information into the candidate, and it would do so
invisibly — the prose would still read as though it had been fixed in advance. Amending now is what
makes the freeze real rather than nominal.

## Candidates whose descriptions were already complete

**Candidate 0 — baseline.** Imports `detectMode` from `scripts/init.mjs` directly rather than
restating it. A re-implementation would be a reconstruction of the baseline, not the baseline; and
importing means candidate 0 cannot drift without `scripts/` changing, which the seven gates would
notice.

**Candidate 1 — bounded recursion + no early return.** Fully determined by the first experiment,
which froze it as `a+c1` and declared its parameters before its own run: implementation markers at
directory depth ≤ 2, the fourteen-name `EXCLUDE` list, plan and prompt markers requiring content,
all three groups empty → `greenfield`, else plan markers present → `existing-with-proposals`, else
`undocumented-decisions`. **Those values are inherited, not re-chosen.** Re-picking a depth now
would make this a different candidate wearing the same name.

**Candidate 2 — git evidence.** The first experiment declared `commits > 1 && tracked > 4` and
recorded that the thresholds were declared rather than derived — that being the finding about this
candidate rather than an accident. **Inherited unchanged**, for the same reason: a threshold
re-chosen today would be chosen with more knowledge than the one it replaces. Not a git repository
yields `refused`.

## Ambiguities resolved, with the choice recorded

### Candidate 3 — what "documentation, configuration or framework scaffolding" means

The description says *any file under version control that is not documentation, configuration or
framework scaffolding*. Those three words are the whole candidate, and they are the largest free
parameter in this experiment — a category list adjusted per subject would tune the candidate to the
data. Fixed here, by rule and not by example:

| Category | Rule |
| --- | --- |
| Documentation | extension `.md` `.markdown` `.rst` `.txt` `.adoc`; or any path under `docs/`; or basename `LICENSE` `COPYING` `NOTICE` `CHANGELOG` `AUTHORS` `README`, with or without extension |
| Configuration | extension `.json` `.yml` `.yaml` `.toml` `.ini` `.cfg` `.conf` `.properties` `.lock` `.xml`; or any path component beginning with `.` (dotfiles and `.github/`, `.vscode/`, `.idea/` alike) |
| Framework scaffolding | any path whose first component is in the inherited `EXCLUDE` list |

Everything else is a **substantive artifact**. One is enough: the description says *any file at all*,
so the threshold is one and is not a tunable number.

`.xml` is classified as configuration despite being a plausible source extension. That is a
deliberate false-negative bias, declared now: this candidate is meant to answer *has this repository
produced artefacts*, and counting `pom.xml` as an artefact would make it agree with the marker-based
candidates for the wrong reason.

### Candidates 3 and 5 — the mode split still uses root-only plan markers

Deciding `existing-with-proposals` versus `undocumented-decisions` is definitional, not inferential:
the mode names the presence of `artifacts/innovation-proposals/*.md`. Every candidate uses the same
root-only, content-requiring check for it. **This experiment varies how implementation is detected
and nothing else.** Varying two things at once would make a difference in results unattributable to
either.

### Candidate 4 — which signals, and what "agree" means

The description says *classify only where signals agree*. It names neither the signals nor
agreement. Fixed:

- **S1** — root-only implementation markers (candidate 0's signal)
- **S2** — depth ≤ 2 implementation markers (candidate 1's signal)
- **S3** — substantive tracked files (candidate 3's signal); `UNAVAILABLE` outside a git repository

Each reduces to one boolean: *does this repository contain implementation*. **Agreement means every
available signal returns the same boolean.** Disagreement yields `refused`, naming which signals
disagreed. Fewer than two available signals yields `refused`, because agreement among one signal is
not agreement.

### Candidate 5 — the contradiction between "never infer greenfield" and its own bar

The pre-registration requires Class II candidates to classify `genuinely-empty` as `greenfield`
**without an override**, while candidate 5 is defined as making `greenfield` declarable only. Read
literally, candidate 5 must refuse on the empty control and so must fail a bar written for it.
**This is a defect in the pre-registration, found in translation, and it is resolved here rather
than left to be discovered mid-run.**

The resolution distinguishes **absence of evidence** from **evidence of absence**:

- A directory containing nothing at all except `.git` is *verifiably empty*. That is evidence of
  absence, and candidate 5 infers `greenfield` from it.
- A directory containing files, none of which register on S1, S2 or S3, is *unexplained*. That is
  absence of evidence, and candidate 5 refuses.

This preserves the candidate's intent — never call something greenfield merely because the detector
failed to see it — while leaving the empty control answerable, which is what that clause of the bar
was protecting.

## A hole in the Class I bar, found in translation and closed here

The Class I bar requires zero `false-greenfield`, the three constructed gates, explanatory evidence,
no dependency and bounded cost. **It does not require a Class I candidate to answer.** As written,
an inference candidate that refused on all sixteen subjects would satisfy every clause of its own bar
while classifying nothing — inheriting Class II's escape without Class II's refusal threshold.

Closed now, before any result exists:

> A Class I candidate must return a classification for every subject on which its defining signal is
> available. `refused` from a Class I candidate is permitted **only** where that signal is
> unavailable — for candidates 2 and 3, where the subject is not a git repository. A Class I
> candidate whose defining signal is unavailable on more than half the subjects is **not supported**,
> because it cannot be applied to this population regardless of its accuracy on the remainder.

Unavailable subjects are reported as `UNAVAILABLE`, separately from `refused`, so that a candidate
which could not run is never mistaken for one that declined to answer.

## What a gate means when a candidate refuses

The three gates carry expectations written before refusal was a candidate class: `housedoc-shape`
must not be `greenfield`, `bare-monorepo` must be `undocumented-decisions`, `genuinely-empty` must be
`greenfield`. A refusing candidate satisfies the first (refusal is not `greenfield`) and fails the
second, on the same behaviour. **That inconsistency is an artefact of the gates predating Class II,
not a finding about the candidates.**

Resolved, before ground truth exists:

> A gate disqualifies a candidate when the candidate returns a **wrong classification**. `refused` on
> `housedoc-shape` or `bare-monorepo` is **recorded, not disqualifying**, because refusal is the
> declared behaviour of Class II and the harm ordering already ranks it below both error types.
> `genuinely-empty` is the exception and keeps its literal reading: it must classify `greenfield`,
> and a refusal there **is** disqualifying — the pre-registration says so explicitly for Class II,
> and that clause would be redundant under any other reading.

Treating refusal as a gate failure everywhere would disqualify Class II by construction, using gates
built before the class existed. That would decide the experiment by apparatus rather than by
evidence.

## A published claim this apparatus falsified before the experiment ran

Running the six candidates against the three gates — controls already on `main`, not held-out
subjects — falsified **E21**, recorded in proposal 0004 and merged the same day:

> Both falsifiers are satisfied by bounded recursion, which E10 and E15 falsified.

**They are not.** Candidate 1 is the frozen `a+c1` composition at depth ≤ 2, and it classifies
`bare-monorepo` as `greenfield` — a gate failure. The manifests sit at `packages/api/package.json`,
which is depth 3:

```
depth 1: []
depth 2: []
depth 3: [packages/api/src, packages/api/package.json, packages/web/src, packages/web/package.json]
```

E21 said *bounded recursion* where it was entitled to say only *recursion bounded at depth 3 or
deeper*. The claim was written to warn against inferring a design from two falsifiers, and it
overstated in the direction of that warning — the safe direction rhetorically, and still wrong.

The correction is recorded in proposal 0004 as **E22**. E21 is not deleted, for the reason the
2026-08-26 revision entry already establishes: a corrected record has to show what was corrected.

## Ground truth — the first experiment's rule, and where this one departs

The first experiment fixed a labelling procedure and it is **carried forward unchanged** except as
stated below:

- `existing-with-proposals` — at least one `artifacts/innovation-proposals/*.md`. Definitional.
- `greenfield` — no implementation work of any kind on disk.
- `undocumented-decisions` — implementation work and no proposals.
- Implementation work is judged **from files on disk, never from git history**, so that the label
  does not import the assumption candidate 2 is built on.

**The one departure.** The first rule would label a subject holding `artifacts/prompts/` and no
proposals `undocumented-decisions`. This experiment labels it `AMBIGUOUS-0006` instead, because
whether a prompt artifact is a recorded innovation decision is
[proposal 0006](../../innovation-proposals/0006-prompt-markers-are-not-recorded-decisions.md)'s open
question, and answering it to make an experiment scoreable would settle an undecided proposal by
measurement. Such subjects count toward `false-greenfield` — well-defined either way, since
`greenfield` is wrong under both readings — and are excluded from `false-recorded`.

This departure is recorded here rather than presented later as a clarification.

## Subject resolution

Subjects are the sixteen names frozen in the pre-registration, resolved as siblings of this
repository. A name that does not resolve is reported as `MISSING` and is not silently dropped, and
the subject list is not re-drawn to replace it.

## What this amendment does not do

- **It does not change the harm ordering or either class bar**, except to close the Class I refusal
  hole above — a restriction on what counts as support, made before any result is visible.
- **It does not add, remove or reorder candidates or subjects.**
- **It does not decide 0006.**
- **It does not run anything.** No candidate has been executed against any subject.
