# Standard 11 — Portfolio Coherence and Prioritization

What a proposal overlaps with, what it would duplicate, and what it would cannibalize — and the rule
that a prioritization scheme which ranks everything first has ranked nothing.

Source: item 11 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal that would join a portfolio containing anything else. Where
[Standard 3](03-existing-capability-and-alternatives.md) asks whether the *problem* is already solved,
this standard asks the adjacent and easily-missed question: whether this *proposal* collides with
another proposal, another product, or another team's plan. A proposal can pass Standard 3 honestly —
nothing shipped solves this — and still be the second of two efforts building the same thing in
parallel.

## Requirements

### R1 — State overlap, duplication, and cannibalization

A proposal MUST record its relationship to the rest of the portfolio under three distinct headings, and
the three are not paraphrases of each other.

**Overlap** is shared surface: another product, project, or in-flight proposal that touches the same
users, the same data, the same workflow, or the same domain. Overlap is common and usually benign, but
it is where integration cost, migration cost, and user confusion originate, and it is invisible unless
it is written down.

**Duplication** is the same capability built twice. It is recorded whether or not the duplication is
intentional, because an intentional duplication that nobody outside the room knows about behaves
exactly like an accidental one.

**Cannibalization** is this work reducing the value of something the organisation already has —
displacing its users, undercutting its revenue, or hollowing out the case for maintaining it.

Where the honest answer to any of the three is "none", that is recorded as a finding with the search
behind it, not as an empty field. As under
[Standard 3](03-existing-capability-and-alternatives.md), a search that was not performed MUST NOT be
reported as a search that found nothing; the two are written identically in careless prose and are
completely different claims.

### R2 — Two efforts solving one problem is a portfolio defect

Where two efforts address one problem, that is a defect **whether or not either effort is individually
sound**. This is the requirement's whole point, and it is the one most often argued away, because the
argument against it is always available: each proposal, read alone, is well evidenced, well costed, and
answers a real need. Both can be right and the portfolio can still be wrong.

The cost of duplication is not the duplicated build. It is the split that follows: split users, split
data, split maintenance, split support, and a migration nobody has scheduled and nobody owns. That cost
is paid indefinitely, mostly by people who were not in the room when either decision was made, and it
is not visible in either proposal's cost section because neither one is paying it alone.

The honest outcomes when duplication is found are `merge-with-existing` for one of the efforts, or
`reject`, under [Standard 10](10-innovation-decision-model.md). Choosing to proceed with both is
permitted — parallel exploration of a genuinely uncertain space can be worth its cost — but it MUST be
recorded as that choice, with the reason, rather than left as an unremarked coincidence.

### R3 — Cannibalization is a decision, not a surprise

Cannibalization is **not automatically disqualifying**. Replacing your own weaker product with a
stronger one is frequently the right call, and an organisation unwilling to do it will be replaced by
one that was. The requirement is not that cannibalization be avoided; it is that it be **decided**.

The distinction is between two documents that look similar and differ entirely. In the first, the
proposal states that it will draw roughly the current user base of an existing product, names that
product, states what happens to those users and to the team maintaining it, and concludes that the trade
is worth making. In the second, the proposal says nothing, ships, and the existing product's usage
declines for eighteen months while its owners attribute the decline to something else.

A proposal MUST therefore name what it would cannibalize, estimate the effect, and state the intended
disposition of the affected capability — sunset with a date, maintain in reduced form, or migrate. An
unstated cannibalization is a hidden cost, and it engages
[Standard 5](05-cost-accounting.md)'s prohibition on hiding costs as directly as any implementation
estimate does.

### R4 — Prioritization must discriminate

**Reproduced verbatim from the source:**

- never prioritize everything

A prioritization scheme MUST distinguish. Where a proposal states a priority, it MUST state what that
priority is relative to and what was ranked below it. A scheme in which everything is a priority
conveys no information and defers the real decision to whoever is loudest — which is a decision
procedure, just not one anybody would defend if it were written down as the policy.

The failure has a characteristic shape and it is worth naming so it can be recognised. It begins with a
ranking that is genuine, then acquires a tier above the top tier because something urgent arrived, then
acquires a second one, and ends with a list on which four fifths of the items are critical. At that
point the list has stopped ordering work and has become a record of how strongly each item was argued
for. Sequencing then happens anyway — it always does — but it happens in corridors, without a record,
and without anyone being accountable for it.

Discrimination is what makes prioritization falsifiable. If a scheme cannot produce the sentence "this
is above that, and here is why", it has not prioritized; it has labelled. A proposal SHOULD state what
it displaces, because the cost of doing this instead of the next thing is the one cost that is always
real and almost never written down — the opportunity cost
[Standard 5](05-cost-accounting.md) requires.

## Additions this standard makes beyond the source

- R1's separation of overlap, duplication, and cannibalization into three distinct questions with
  distinct failure modes, and the rule that "none" is recorded with the search behind it.
- R2's account of *why* two efforts on one problem is a defect independent of either effort's merit —
  the split cost that neither proposal's cost section carries — and the route to
  `merge-with-existing` or `reject`.
- R3 in full: cannibalization is legitimate but must be a decision rather than a surprise, and the
  requirement to state the intended disposition of the affected capability.
- R4's characterisation of tier inflation, the rule that a priority is stated relative to what it
  outranks, and the identification of "whoever is loudest" as an unwritten decision procedure.

## Relationship to other standards

[Standard 3](03-existing-capability-and-alternatives.md) is the same question at a different scale: it
asks whether the problem is already solved, this standard asks whether the proposal collides with
another proposal. [Standard 5](05-cost-accounting.md) owns the opportunity cost that R4's displacement
question surfaces, and the hidden-cost prohibition that R3's unstated cannibalization would breach.
[Standard 10](10-innovation-decision-model.md) supplies `merge-with-existing`, the usual honest outcome
when R2 finds duplication. [Standard 12](12-new-project-justification.md) applies this standard's
portfolio-complexity concern to the specific case of creating a new project.
[Standard 13](13-innovation-proposal-artifact.md) defines the Portfolio section these requirements
fill.

## Implementation

`innovation.portfolio-overlap` (required, `document`, `partial`) — the Portfolio section is present with
non-empty `Overlaps with`, `Would duplicate`, and `Would cannibalize` fields. Three named fields rather
than a prose scan, for the same reason Standard 3 names four alternatives: it makes an omission a
detectable finding rather than a matter of interpretation.

`innovation.prioritization-discipline` (forbidden, `manual-review`, `none`) — **no automated check
evaluates this rule.** Whether a priority scheme discriminates is a fact about a body of decisions, not
about one document. It reports `not-evaluated` unless a human attestation records that someone looked,
what they examined, and what they found. It is not invariant-class; a time-bounded, approved waiver is
available, because driving this violation out of the record would not drive it out of the
organisation.

**No cross-repository portfolio scanning exists, and none is planned.** This repository parses proposal
artifacts under `artifacts/innovation-proposals/` in the repository it is run against. It does not
enumerate an organisation's products, query a portfolio management system, or read another repository's
proposals. It therefore **cannot detect an overlap the author did not write down**, and it has no basis
whatever for contradicting one they did.

The check establishes that the author **addressed** overlap. It never establishes that they were
**right** about it. A proposal recording "Overlaps with: nothing" passes `innovation.portfolio-overlap`
while duplicating a project two floors away, and the rule's assurance note says so rather than implying
a stronger guarantee. That gap is human review — specifically, review by someone with a portfolio-wide
view, which is a different reviewer from the one who checks the evidence — and it is published in the
limitations table in [`INSTRUCTIONS.md`](../INSTRUCTIONS.md).
