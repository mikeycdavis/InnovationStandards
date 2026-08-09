# Innovation standards — source specification

This document is the canonical, numbered restatement of the authored intent for this repository. The
authoritative expression of that intent is [`../prompt/original-prompt.md`](../prompt/original-prompt.md),
together with the design directives recorded during construction. This file exists because the
enumeration has to be mechanically extractable: `scripts/inventory.mjs` reads the numbered items below
and compares them against the human-reviewed
[`../standards-source-inventory.json`](../standards-source-inventory.json), and `scripts/fidelity.mjs`
verifies that every block a standard document claims is verbatim source actually appears here.

Nothing in this file is a summary. Where the original prompt states a list, that list is reproduced
here exactly, because the standards quote it and the fidelity check compares character for character.

## Core principle

The governing principle, from the source:

> Innovation is not automatically valuable.

A new idea must justify why it should exist, what problem it solves, why the problem matters, why the
proposed solution is appropriate, what it costs, and how success would be measured.

The system must explicitly support the conclusion:

> Do not build this.

## Prohibitions

The following practices are prohibited. Each is owned by exactly one standard below.

- never invent features solely because they are technically interesting
- never treat novelty as evidence of value
- never create a new project when the capability belongs naturally inside an existing project without documenting why separation is justified
- never recommend building something without identifying the problem it solves
- never claim user demand without evidence
- never fabricate market validation
- never fabricate customer feedback
- never fabricate metrics
- never hide major implementation or maintenance costs
- never ignore an existing capability that already solves the problem
- never treat brainstorming as a committed roadmap
- never allow scope creep to silently change the release objective
- never continue investing solely because substantial effort has already been spent
- never present assumptions as facts
- never call an idea validated merely because an AI considers it good
- never prioritize everything
- never allow an idea to bypass security, privacy, engineering, financial, legal, or other applicable standards merely because it is innovative

## The decision model

Where appropriate, ideas should be classifiable as:

- explore
- validate
- prototype
- build
- defer
- reject
- merge with existing capability
- insufficient evidence

The system must not force every idea toward implementation.

## The evidence taxonomy

Standards should identify what evidence is required and distinguish:

- observation
- assumption
- hypothesis
- user evidence
- market evidence
- technical evidence
- experiment result
- validated conclusion

Do not allow evidence levels to be silently upgraded.

## The new-project bar

New projects should face a higher justification threshold than adding functionality to an existing
project. Require consideration of:

- whether an existing project can own the capability
- duplicated infrastructure
- duplicated domain logic
- maintenance cost
- deployment cost
- support burden
- fragmented user experience
- portfolio complexity

## The standards integrity invariant

The repository establishes a global rule:

> A human or AI must never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or manipulate a standard, test, applicability determination, evidence requirement, or verification mechanism solely because it prevents the desired implementation or conclusion.

## The AI conclusion vocabulary

An AI agent using this repository must be able to conclude:

- compliant
- non-compliant
- not applicable
- insufficient evidence / not evaluated
- blocked by invariant

It must never be forced to produce a positive recommendation.

---

# Standards

## 1. Problem Before Solution

A proposal must identify the problem before it proposes a solution, name who is affected, and state
why the problem matters now rather than at some unspecified time. A solution presented without a
problem is a preference, and the strength of the argument for it is unrelated to whether anyone needs
it.

The problem statement must be accompanied by evidence that the problem exists, recorded at its true
level under item 2. Asserted user demand carries no weight on its own: a claim that users want
something is a claim about the world and requires the same evidentiary treatment as any other.

Owns these prohibitions:

- never invent features solely because they are technically interesting
- never recommend building something without identifying the problem it solves
- never claim user demand without evidence

## 2. Evidence Taxonomy and Integrity

Every claim recorded in a proposal carries an explicit evidence level drawn from the taxonomy above.
The taxonomy is a closed set; a claim with no level is not a weaker claim but an unclassifiable one.

Evidence levels must never be silently upgraded. A conclusion may only be recorded at a stronger level
when it cites the specific lower-level entries that now support it, and the citation must be present
in the document rather than in the author's memory.

Assumptions must be declared as assumptions, and material uncertainty must be recorded rather than
resolved by omission. An assumption that is presented as a fact has not become more true; it has
become harder to challenge.

This taxonomy is a distinct axis from the audit finding labels a validator uses to describe its own
epistemic position, and from the assurance level a rule declares about what its check establishes. The
three must never be conflated.

Owns these prohibitions:

- never treat novelty as evidence of value
- never fabricate market validation
- never fabricate customer feedback
- never fabricate metrics
- never present assumptions as facts
- never call an idea validated merely because an AI considers it good

## 3. Existing Capability and Alternatives

Before proposing new work, a proposal must record what already exists that bears on the problem: which
projects, products, or capabilities were examined, what was found, and why what exists does or does not
already solve the problem. A search that was not performed must not be reported as a search that found
nothing.

A proposal must consider alternatives, and the set of alternatives must include doing nothing. Where
the capability could be obtained rather than written, the proposal must address building, buying, and
integrating, and must state why the chosen route was chosen. An alternative that is not viable is
recorded with the reason it is not viable; it is never simply absent.

Owns this prohibition:

- never ignore an existing capability that already solves the problem

## 4. Value and Strategic Alignment

A proposal must state the value it creates for a user or customer, the impact expected if it succeeds,
what differentiates it from what already exists, and how it aligns with the strategy of the portfolio
it would join. Expected impact is a claim about the world and carries an evidence level like any other.

The existence of a competitor offering something is not by itself a justification for building it.
Parity is a market claim, and it requires market evidence.

## 5. Cost Accounting

A proposal must account for cost across every dimension that will be paid, not only the dimension that
is easiest to estimate. At minimum: implementation complexity, maintenance burden, operational burden,
the opportunity cost of the work not done instead, and the technical debt the approach would incur.

A cost that is known and omitted is a misrepresentation of the proposal, not an oversight of detail.
Costs that cannot be estimated are recorded as unknown at their true uncertainty rather than left
blank.

Owns this prohibition:

- never hide major implementation or maintenance costs

## 6. Security, Privacy, and Standards Non-Bypass

A proposal must state its security and privacy implications, including what data it would touch, what
new exposure it would create, and which existing standards and obligations apply to it.

Novelty confers no exemption. An idea does not become exempt from security, privacy, engineering,
financial, legal, or any other applicable standard by virtue of being innovative, experimental, a
prototype, or a pilot.

Owns this prohibition:

- never allow an idea to bypass security, privacy, engineering, financial, legal, or other applicable standards merely because it is innovative

## 7. Scope and MVP Discipline

A proposal must record a release objective — the single statement of what the release is for — and a
minimum viable definition of what would satisfy it. Anything deliberately excluded is recorded as out
of scope, so that later inclusion is a visible decision rather than a drift.

Scope may change. It must never change silently: a change to the release objective is a change to what
the proposal is, and it is recorded as such with its date and its reason.

Owns this prohibition:

- never allow scope creep to silently change the release objective

## 8. Success and Kill Criteria

A proposal must state how success would be measured, in terms observable by someone who did not write
the proposal, and before the result is known. Criteria written after the outcome is visible measure
nothing.

A proposal must also state its kill criteria: the observable conditions under which the work would
stop. A kill criterion with no trigger, no threshold, and no observer is not a criterion.

Effort already spent is not a reason to continue. The question is always whether the remaining work is
worth its remaining cost, judged from where the work now stands.

Owns this prohibition:

- never continue investing solely because substantial effort has already been spent

## 9. Experiment Before Build

Where the decisive uncertainty could be reduced more cheaply by an experiment than by building, the
experiment should come first, and the proposal should state what the experiment would test, what
result would support proceeding, and what result would not.

An experiment that becomes the implementation by default has not been evaluated. Promotion of a
prototype to production is a new decision, recorded as one.

## 10. Innovation Decision Model

A decided proposal records exactly one outcome from the closed set given above. No outcome is
privileged: a properly evidenced decision not to build is as compliant as a properly evidenced decision
to build, and the system must not force every idea toward implementation.

An outcome of defer or insufficient evidence must record the condition under which the decision is to
be revisited. A suspension with no revisit condition is indistinguishable from something that was
forgotten.

Brainstorming is not a roadmap. An idea that has been generated but not decided carries no commitment,
and must not be presented, aggregated, or scheduled as though it did.

Owns this prohibition:

- never treat brainstorming as a committed roadmap

## 11. Portfolio Coherence and Prioritization

A proposal must state its relationship to the rest of the portfolio: what it overlaps with, what it
would duplicate, and what it would cannibalize. Two efforts solving one problem is a portfolio defect
whether or not either effort is individually sound.

Prioritization must discriminate. A priority scheme in which everything is a priority conveys no
information and defers the real decision to whoever is loudest.

Owns this prohibition:

- never prioritize everything

## 12. New-Project Justification

Creating an entirely new project faces a higher justification threshold than adding functionality to an
existing one, and the burden of proof falls on separation rather than on inclusion.

A new-project proposal must address each of the considerations listed above, individually and
honestly. Where a cost is real, it is recorded as a cost and weighed, not argued away.

Owns this prohibition:

- never create a new project when the capability belongs naturally inside an existing project without documenting why separation is justified

## 13. Innovation Proposal Artifact

Innovation decisions are recorded in proposal artifacts at a canonical, versioned path, in a structure
that a validator can parse: named sections, named fields, and an evidence grammar in which a level is a
token rather than a word in a sentence.

Only artifacts at the canonical path are evaluated as proposals. Prose elsewhere that describes the
system is documentation, not a decision record.

Recorded evidence and recorded decisions are not silently altered. A change to either is accompanied by
a visible revision entry stating what changed and why.

## 14. Standards Integrity

The integrity invariant given above is a first-class standard of this repository, not a statement of
aspiration. Its subject is the standards system itself: the rules, the tests, the applicability
determinations, the evidence requirements, and the verification mechanisms.

The invariant is protected mechanically where mechanism can protect it: a waiver filed against a
non-exemptible rule is rejected rather than honoured, a human attestation never overrides what an
automated check observed, a rule that nothing evaluated is reported as unevaluated rather than as
passing, and a policy that declares a rule below the level its catalog defines is itself a finding.

The limits of that protection are stated rather than implied. An actor with write access to this
repository can edit a rule, a detector, or a test. What the mechanism provides is that such an edit is
visible — in the verdict, in the test suite, and in version history — not that it is impossible.
