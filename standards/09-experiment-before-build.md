# Standard 9 — Experiment Before Build

Where the decisive uncertainty could be resolved more cheaply by finding out than by building, finding
out comes first — and the only recommended-level rule in the catalog, with the reason it is not
required.

Source: item 9 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to proposals whose outcome is `build`. It is the last question the series asks before
committing: given everything Standards 1 through 8 established, is the remaining uncertainty something
this build would resolve expensively when something smaller would resolve it cheaply. Proposals at
`explore`, `validate`, or `prototype` are already doing what this standard recommends, which is why
the rule's conditional trigger is `build` alone.

## Requirements

### R1 — The experiment comes first where it is the cheaper way to learn

Where the decisive uncertainty in a proposal could be reduced more cheaply by an experiment than by
building, the experiment SHOULD come first.

Two words carry the requirement. **Decisive** narrows it: every proposal contains dozens of
uncertainties, and almost all of them are survivable in either direction. The decisive one is the
uncertainty whose resolution would change the decision — the assumption that, if false, means the work
should not happen at all. Most proposals have one, and a proposal that cannot identify its own is
usually a proposal whose author has not yet distinguished the parts of the idea they are confident
about from the parts they are attached to.

**Cheaper** is a comparison, not a preference. An experiment is worth running when its cost is small
relative to the build *and* its result would actually move the decision. Where the cheapest honest way
to learn whether something works is to build it — because it is a week of work, or because the
uncertainty is about integration behaviour that only appears at full scale — the build is the
experiment, and the recommendation is satisfied by saying so.

Under [Standard 2](02-evidence-taxonomy-and-integrity.md), an experiment's output is an
`experiment-result`, which is the level immediately below `validated-conclusion` and is the ordinary
route to reaching it. A proposal moving from `assumption` and `hypothesis` entries straight to a
`build` outcome is skipping the level that would have made the conclusion citable.

### R2 — The experiment states what result would not support proceeding

Where a proposal records an experiment in its `## Experiment plan` section, it MUST state three
things: what the experiment tests, what result would support proceeding, and what result would not.

The third is the one that makes the first two mean anything. **A test that cannot fail is not a
test.** An experiment with a stated success condition and no stated failure condition will be read as
supporting whatever it produced, because there was never a description of the outcome that would have
counted against the idea, and in its absence any result is compatible with continuing. This is R3 of
[Standard 8](08-success-and-kill-criteria.md) applied one stage earlier, and it fails the same way: a
criterion selected after the result cannot discriminate.

Both conditions are written before the experiment runs, for the reason
[Standard 8](08-success-and-kill-criteria.md) gives — a condition written while more than one outcome
was possible constrains something; one written afterwards constrains nothing.

The most useful discipline here is to describe, in advance, the result the author would find most
unwelcome, and to state plainly whether that result would stop the work. Where the honest answer is
that it would not — that the work would proceed regardless — the experiment is not decision-relevant
and the proposal should say so rather than run it for the appearance of rigour.

### R3 — A prototype does not become the production build by default

An experiment or prototype MUST NOT silently become the production implementation. Promotion is a new
decision and is recorded as one: a fresh `build` outcome under
[Standard 10](10-innovation-decision-model.md), with the cost accounting of
[Standard 5](05-cost-accounting.md) redone against what promotion actually requires, and the security
and privacy review of [Standard 6](06-security-privacy-and-standards-non-bypass.md) applied to a
system that is now production whatever anyone calls it.

An experiment that becomes the implementation by default has not been evaluated — not badly evaluated,
but not evaluated at all, because the decision to build it never occurred as a decision. The
prototype was authorised as a purchase of information, on a cost basis that assumed it would be thrown
away and a risk basis that assumed it would not carry load. Neither assumption survives promotion, and
neither is revisited, because there is no moment at which anyone is asked to revisit them. The
capability simply is in production one day, having been in production for some weeks.

This is the counterpart to [Standard 6](06-security-privacy-and-standards-non-bypass.md)'s "it's just
a prototype": that standard governs the prototype while it claims not to count, and this requirement
governs the moment it starts counting without saying so. The two together close a loop that is
otherwise open at both ends.

Promotion is frequently the right answer. A prototype that works, that was built well enough, and
whose cost to rebuild exceeds its cost to harden should be promoted. What the requirement demands is
that the answer be produced by a decision rather than by a Tuesday.

## Additions this standard makes beyond the source

- R1's narrowing of "the decisive uncertainty" to the assumption whose falsity would change the
  decision, and the explicit acknowledgement that sometimes the build genuinely is the cheapest
  experiment.
- R1's mapping onto the evidence taxonomy: `experiment-result` is the level that a `build` outcome
  reached from assumptions has skipped.
- R2's argument that the disconfirming condition is what makes the confirming one meaningful, and the
  discipline of naming in advance the result the author would least like to see.
- R3's requirement that promotion redo the cost accounting and the security review, and the framing of
  a prototype as a purchase of information whose authorising assumptions do not survive promotion.
- The explanation, below, of why this is the catalog's only recommended-level rule.

## Relationship to other standards

[Standard 2](02-evidence-taxonomy-and-integrity.md) defines `experiment-result` and the citation
mechanism by which an experiment supports a `validated-conclusion`.
[Standard 5](05-cost-accounting.md) supplies the comparison R1 depends on — an experiment is cheaper
than a build only against a cost estimate that counted all five dimensions.
[Standard 6](06-security-privacy-and-standards-non-bypass.md) is R3's other half.
[Standard 7](07-scope-and-mvp-discipline.md) describes the same drift mechanism at feature scale that
R3 describes at system scale. [Standard 8](08-success-and-kill-criteria.md) supplies the logic R2
reuses: a test constructed to be passed measures nothing.
[Standard 10](10-innovation-decision-model.md) supplies `prototype` and `validate` as first-class
outcomes, which is what makes "run the experiment first" a decision the system can record rather than
a delay it can only describe.

## Implementation

`innovation.experiment-before-build` (**recommended**, severity `warning`, `document`, `partial`
assurance) is the only recommended-level rule in the entire catalog. Everything else is `required` or
`forbidden`, deliberately: innovation discipline degrades fastest through soft norms, and a
recommendation is what a team under delivery pressure skips first.

The reason this one rule is recommended is that its subject is a judgement the tooling cannot make.
Whether an experiment should precede a build depends on how expensive the build is and how uncertain
the evidence, and those are properties of a specific idea in a specific organisation at a specific
moment. A one-week build with a well-understood integration should not be gated behind an experiment;
a two-quarter build resting on an untested assumption about user behaviour should not proceed without
one. A required rule would have to treat both identically, and the only way to write it so that the
first case passes is to write it so weakly that the second case passes too. A warning that a human
reads and dismisses with a reason is more honest than a requirement satisfied by a formality.

The detector fires as a **warning** when a proposal's `Outcome` is `build` and it carries zero
evidence entries at `experiment-result`, `user-evidence`, or `technical-evidence`. The applicability
trigger is the outcome, so `standards explain innovation.experiment-before-build` prints why the rule
does or does not apply to a given proposal.

What that check establishes is narrow: that a proposal committing to a build cites no entry at any of
the three levels that would represent something actually investigated. **It cannot establish that an
experiment was warranted, that the decisive uncertainty was correctly identified, that the experiment
described in `## Experiment plan` was run, that its stated failure condition was capable of firing, or
that a prototype was not promoted to production without a new decision.** A proposal carrying a single
`technical-evidence` entry of no relevance to its decisive uncertainty clears the rule entirely.

R3 in particular has no mechanical surface at all. Promotion happens outside the artifact, and the
only signal this repository can offer is the absence of a second proposal recording the `build`
decision — an absence that is indistinguishable from a prototype that was correctly thrown away. That
gap is human review, and it is published in the limitations table in
[`INSTRUCTIONS.md`](../INSTRUCTIONS.md) rather than left for an adopter to discover.
