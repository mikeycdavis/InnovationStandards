# Standard 4 — Value and Strategic Alignment

What the work is worth if it succeeds, to whom, how it differs from what exists, and whether it belongs
in this portfolio at all.

Source: item 4 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal. Where [Standard 1](01-problem-before-solution.md) establishes
that a problem exists, this standard establishes that solving it is worth something — a separate
question, and one a proposal can fail while passing the first. Real problems of no consequence are
common.

## Requirements

### R1 — State user value in the affected party's terms

A proposal MUST state what changes for the affected party if the work succeeds, expressed as something
that party would notice. The test is whether the statement could be read back to the user and
recognised.

"Reduced coupling between the ingestion and reporting layers" is not user value; it may be a genuine
benefit, but the person who has the problem does not experience coupling. "A figure that was wrong
until the next morning is right immediately" is. Where the beneficiary is internal — a platform
capability, a reduction in operational toil — the proposal says so, because an internal benefit
presented as customer value inflates the case in a way that is hard to see later.

### R2 — Expected impact is a claim with an evidence level

A proposal MUST state the impact expected if it succeeds, and that statement is an evidence entry
under [Standard 2](02-evidence-taxonomy-and-integrity.md) like any other. Most expected-impact claims
are honestly `hypothesis` or `assumption`, and recording them at that level is not a weakness of the
proposal — it is what makes the later comparison against
[Standard 8](08-success-and-kill-criteria.md)'s measured result meaningful.

An impact estimate with no level is the single most common route by which a guess becomes a business
case. Once written as a bare number, it is quoted, then aggregated, then planned against, and at no
point in that chain does anything record that it was invented.

### R3 — Differentiation is stated against what already exists

A proposal MUST state what distinguishes the proposed work from what already exists — both inside the
portfolio and outside it. This is the outward-facing counterpart to
[Standard 3](03-existing-capability-and-alternatives.md) R1: that requirement asks whether the problem
is already solved, this one asks why *this* solution is worth having given everything else that
addresses it.

**Competitor existence alone is not a justification.** That a competitor ships something establishes
that they decided to; it establishes nothing about whether their customers use it, whether it works,
or whether it is why anyone chooses them. Parity is a market claim, and under Standard 2 it requires
`market-evidence` — the same standard of proof as any other claim about the world. A proposal whose
differentiation section says only that a competitor has this feature has recorded a reason to
investigate, not a reason to build.

### R4 — Strategic alignment is stated, including when it is absent

A proposal MUST state how the work aligns with the strategy of the portfolio it would join: which
stated objective it serves, and how.

Where there is no alignment, that is a legitimate finding and it is recorded as one. A proposal that
serves a real problem for a real user while falling outside the portfolio's direction is a genuine
decision to make — it might be `reject`, it might be `defer` until the strategy changes, and the
revisit condition writes itself. What it must not do is acquire a vague alignment claim in order to
clear a section. **Alignment prose that could be attached to any proposal has aligned nothing**, and
its presence makes the section useless for every proposal that follows.

## Additions this standard makes beyond the source

- R1's read-it-back test for user value, and the requirement to declare an internal beneficiary as
  internal.
- R2's ruling that expected impact is an ordinary evidence entry, and the description of how an
  unlevelled estimate becomes a business case without anyone deciding that it should.
- R3's treatment of competitor parity as a market claim requiring market evidence — recorded here as
  an addition beyond the source, since the source does not name it.
- R4's rule that absent alignment is recorded rather than manufactured, and the observation that
  universal alignment prose aligns nothing.

## Relationship to other standards

[Standard 2](02-evidence-taxonomy-and-integrity.md) supplies the levels R2 and R3 depend on and owns
the prohibition against treating novelty as value — R3's parity rule is that prohibition applied to a
competitor's roadmap. [Standard 5](05-cost-accounting.md) is the other half of the judgement: value
without cost is not a case. [Standard 11](11-portfolio-coherence-and-prioritization.md) extends R4
from alignment to coherence, asking not only whether the work fits the strategy but whether it
collides with something else already serving it.

## Implementation

`innovation.value-articulation` (required, `document`, `partial`) checks that the Value and alignment
section is present and that its four fields — `User value`, `Expected impact`, `Differentiation`,
`Strategic alignment` — are present and non-empty.

The rule establishes presence and nothing more. **It cannot tell whether stated value is real, whether
an impact estimate is plausible, whether a differentiation claim would survive contact with the
competitor, or whether alignment prose is generic.** R3's parity rule and R4's generic-alignment
failure are both invisible to it — they are human review, carried in part by
`innovation.novelty-not-value` (Standard 2), which is manual-review and attestable.

This is a case worth being explicit about, because the section is the one most likely to be written
persuasively by a language model and least likely to be checked: fluent value prose is exactly what
generation is good at, and none of it constitutes evidence.
