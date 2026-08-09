# Standard 8 — Success and Kill Criteria

How success would be recognised by someone who did not write the proposal, the conditions under which
the work would stop, and the rule that effort already spent is not a reason to continue.

Source: item 8 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal that commits resources — every outcome at `validate`,
`prototype`, or `build`. This standard closes the loop
[Standard 1](01-problem-before-solution.md) opens: a success criterion is the problem restated as
something observable, and a kill criterion is the advance admission that the problem might have been
misidentified.

## Requirements

### R1 — Success criteria are observable by someone who did not write the proposal

A proposal MUST record success criteria in its `## Success criteria` section, one or more
`- **Criterion:**` lines, each stated so that a person who had no part in writing the proposal could
determine whether it was met.

The independence test is the whole requirement, and it is stricter than it sounds. It excludes
criteria that depend on the author's judgement ("the architecture is cleaner"), criteria whose subject
is unnamed ("adoption is strong"), and criteria whose measurement method exists only in the author's
head ("performance improves"). Each of those can be honestly believed and none can be independently
falsified, which means none of them can produce the answer *no*. A criterion that cannot produce the
answer no is a description of the hoped-for future rather than a test of it.

What survives the test names the observable, the population, the threshold, and where the measurement
comes from: "sixty percent of support agents resolve a billing dispute without leaving the case view,
measured from the case-tool event log, in the eight weeks after release". A reviewer can disagree with
that number. Disagreement is the point — a criterion nobody could dispute in advance is a criterion
nobody can fail against afterwards.

Success criteria are claims about a future state and carry evidence levels under
[Standard 2](02-evidence-taxonomy-and-integrity.md) where they rest on projections; the projected
value is a `hypothesis` until an `experiment-result` or measured outcome replaces it.

### R2 — Criteria are written before the result is known

Success criteria MUST be recorded before the outcome they measure is observable. Criteria written
after the outcome is visible measure nothing.

This is not a formality about ordering. The reason a pre-registered criterion carries information is
that it was written while more than one answer was still possible; it constrained the future. A
criterion composed after the numbers are in has been selected — consciously or not — from the space of
criteria the numbers happen to satisfy, and it therefore cannot distinguish a success from a failure,
because it was constructed to be satisfied by whatever occurred. The document reads identically in
both cases, which is exactly what makes the failure hard to catch in review.

The failure mode is not usually fabrication. It is the retrospective revision that feels like
clarification: the metric that "was always really about" engagement rather than conversion, the
threshold that "was approximate", the window that quietly extends by a quarter. Each edit is
defensible in isolation and the aggregate is a proposal that could not have failed. Where criteria
genuinely need to change — and sometimes they do, because the world changed — the change is recorded
as a revision with its date and its reason, under
[Standard 13](13-innovation-proposal-artifact.md), so that a reader can see both the criterion that
was met and the criterion that was originally set.

### R3 — A kill criterion has a trigger, a threshold, and an observer

A proposal MUST record kill criteria in its `## Kill criteria` section: the observable conditions
under which the work would stop. Each criterion MUST carry three things.

**A trigger** — the observable event or measurement that would fire it, expressed in the same
independent terms R1 requires of success.

**A threshold** — the value at which it fires. "If adoption is disappointing" has no threshold, and
"disappointing" will be reinterpreted at the moment it becomes inconvenient, which is the only moment
at which its meaning matters.

**An observer** — who is expected to look, and when. This is the part omitted most often and the part
that most reliably determines whether the criterion functions. A threshold nobody is scheduled to
check does not fire; it simply is not evaluated, and the work continues by default while the document
maintains that a stopping rule exists.

**A kill criterion that cannot fire is not a criterion.** The test to apply while writing it is to
describe the world in which it triggers. If that world is not describable, or is one so extreme that
the work would have been abandoned for other reasons long before, the criterion is decorative. Kill
criteria are written to be *plausible*, not merely possible: the honest ones name the outcome the
author privately considers most likely if the idea is wrong.

### R4 — Sunk effort is not a reason to continue

**Reproduced verbatim from the source:**

- never continue investing solely because substantial effort has already been spent

`innovation.no-sunk-cost-continuation` is invariant-class — `level: forbidden`,
`nonExemptible: true` — and its failure produces `BLOCKED_BY_INVARIANT`
([ADR 0005](../artifacts/adr/0005-invariant-class-and-blocked-verdict.md)).

The correct question at every review point is whether the **remaining** work is worth its **remaining
cost**, judged from where the work now stands. Money and effort already spent are gone under both
options; they are identical in the continue branch and the stop branch, and a quantity identical in
both branches of a comparison cannot discriminate between them. This is arithmetic rather than
temperament, which is worth stating plainly, because sunk-cost reasoning survives in organisations by
presenting itself as resolve.

In practice the argument rarely appears in the form the prohibition names. It appears as "we're
eighty percent done" — a claim about the past dressed as a claim about the remaining twenty percent,
usually made by the same estimate that produced the eighty. It appears as reluctance to have spent the
quarter for nothing, which misdescribes the alternative: stopping does not spend the quarter for
nothing, it declines to spend the next one too. And it appears as reputational cost, which is real,
and which belongs in the decision as an honestly named cost rather than as an unstated force that
bends the reading of the evidence.

The re-judgement this requirement demands is
[Standard 5](05-cost-accounting.md)'s five dimensions re-run from the current position, and
[Standard 10](10-innovation-decision-model.md) supplies the outcome that records the result. Stopping
work that is no longer worth its remaining cost is the process functioning: this repository evaluates
the quality and integrity of the decision process, not whether the idea eventually succeeded.

### R5 — Two further prohibitions follow from R2 and R3

Two prohibitions are recorded explicitly because they are the failures R2 and R3 exist to prevent, and
naming them makes them findable rather than leaving them as reasoning inside a requirement.

A proposal MUST NOT write success criteria after the results are known. A proposal MUST NOT write kill
criteria that cannot trigger. Both are forms of the same manoeuvre — constructing a test whose outcome
was determined before it was applied — and both leave a document that is indistinguishable from a
compliant one on its face. That is why they are prohibitions rather than notes: the remediation is not
to complete something, it is to undo a criterion and everything concluded from it.

## Additions this standard makes beyond the source

- R1's independence test, and the argument that a criterion which cannot produce the answer *no* is a
  description of a hoped-for future rather than a test.
- R2's account of why pre-registration carries information — the criterion constrained the future
  while more than one answer was possible — and the identification of retrospective revision as the
  usual mechanism rather than fabrication.
- R3's three-part decomposition of a kill criterion into trigger, threshold, and observer, the
  observation that a threshold nobody is scheduled to check does not fire, and the requirement that
  kill criteria be plausible rather than merely possible.
- R4's arithmetical framing — a quantity identical in both branches cannot discriminate between them —
  and the three disguises sunk-cost reasoning wears: percentage-complete, aversion to a wasted
  quarter, and unstated reputational cost.
- R5's promotion of the two derived prohibitions to named, findable rules.

## Relationship to other standards

[Standard 1](01-problem-before-solution.md) supplies what a success criterion is a restatement of; a
criterion that does not correspond to the stated problem indicates that one of the two is wrong.
[Standard 2](02-evidence-taxonomy-and-integrity.md) supplies the levels a projected criterion carries,
and its prohibition on fabricated metrics covers a reported result that was not measured.
[Standard 5](05-cost-accounting.md) supplies the accounting R4 re-runs from the current position.
[Standard 7](07-scope-and-mvp-discipline.md) supplies the release objective these criteria measure —
criteria that survive a scope change unamended are measuring something the release is no longer for.
[Standard 9](09-experiment-before-build.md) shares R3's logic: a test that cannot fail is not a test,
whether it is a kill criterion or an experiment.
[Standard 10](10-innovation-decision-model.md) supplies the outcome a fired kill criterion produces.

## Implementation

`innovation.success-criteria` (required, `document`, `partial` assurance) checks that the
`## Success criteria` section exists with at least one non-empty `- **Criterion:**` line.

`innovation.kill-criteria` (required, `document`, `partial`) checks the same for
`## Kill criteria`.

`innovation.no-sunk-cost-continuation` (forbidden, non-exemptible, `manual-review`, assurance `none`)
is invariant-class. **No automated check evaluates it.** It reports `not-evaluated` unless a human
attestation records that someone examined the continuation decision, what they examined, and what they
found — an unattested clean run means nobody looked, not that no sunk-cost reasoning occurred. Where
an attestation records a violation the verdict is `BLOCKED_BY_INVARIANT`, and a waiver filed against
it is rejected rather than honoured ([Standard 14](14-standards-integrity.md)).

The two `partial` rules establish presence of a section and at least one non-empty criterion line.
**They cannot establish that a criterion is observable, that a threshold is meaningful, that an
observer exists or is scheduled, that a kill criterion could ever fire, or — most importantly — when
any of them was written.** A `## Kill criteria` section reading "Criterion: we will stop if the
project is clearly failing" passes both rules and fails the standard completely. Timing in particular
is invisible to a document detector: the artifact contains the criterion, not the moment it was
authored, and only version history distinguishes a pre-registered criterion from one added after the
result. That gap is human review, and it is published in the limitations table in
[`INSTRUCTIONS.md`](../INSTRUCTIONS.md) rather than left for an adopter to discover.
