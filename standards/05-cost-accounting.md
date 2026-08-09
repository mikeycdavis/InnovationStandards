# Standard 5 — Cost Accounting

The five dimensions along which a proposal will actually be paid for, and the rule that a known cost
left out of the record is a misrepresentation rather than a gap in detail.

Source: item 5 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal. Cost is the counterweight to everything
[Standard 4](04-value-and-strategic-alignment.md) claims: value with no cost beside it is not an
argument, it is an advertisement. It is also what makes the build-versus-buy comparison in
[Standard 3](03-existing-capability-and-alternatives.md) more than a preference, because the route
that looks cheapest is usually the one whose costs the author is most practised at not counting.

## Requirements

### R1 — All five cost dimensions are recorded

A proposal MUST record cost across five named dimensions, each as a field in the `## Costs` section of
the proposal artifact: **Implementation** complexity, **Maintenance** burden, **Operational** burden,
**Opportunity cost**, and **Technical debt**. Five fields rather than a single "Cost" paragraph is
deliberate, because a single paragraph is always filled with the dimension the author finds easiest to
estimate, and the omission of the other four is invisible in prose.

**Implementation** is the build: the engineering effort, the integration work, the migration, the
coordination across teams that do not report to the proposer. It is the dimension most proposals
estimate and the one least likely to dominate the total over the life of the thing.

**Maintenance** is what the capability costs to keep working after it exists — dependency upgrades,
breakage under change elsewhere, the bug reports, the documentation that goes stale. It is a recurring
cost and it is charged against a budget the proposal does not name.

**Operational** burden is what running it costs: infrastructure spend, on-call load, incident
response, support volume, the runbook someone has to write and someone else has to follow at three in
the morning. A capability with an operational cost of zero exists only if nothing depends on it.

**Technical debt** is the cost the chosen approach defers rather than avoids: the shortcut taken to
ship, the abstraction not built, the data model that will need to change. Debt is legitimate and often
correct; debt that is not recorded is simply a cost transferred to someone who did not agree to it.

**Opportunity cost** is treated separately in R3, because it fails differently from the other four.

### R2 — A known cost that is omitted is a misrepresentation

**Reproduced verbatim from the source:**

- never hide major implementation or maintenance costs

`innovation.no-hidden-costs` is invariant-class — `level: forbidden`, `nonExemptible: true` — and its
failure produces `BLOCKED_BY_INVARIANT` rather than ordinary non-compliance
([ADR 0005](../artifacts/adr/0005-invariant-class-and-blocked-verdict.md)). The reason it sits at that
level rather than at `required` is the nature of the failure. An incomplete cost section is a document
that needs more work. A cost the author knew and left out is a document engineered to produce a
decision that the full picture would not have produced, and every approval downstream of it was
obtained under a false description of the proposition.

The distinction the standard draws is between *not knowing* and *not saying*. Nobody is required to
estimate accurately; the domain does not permit it. What is prohibited is the removal of a cost the
proposer was aware of because including it would weaken the case. The proposal is the record of a
decision, and a record with a material term deleted is not a weaker record — it is a false one.

This prohibition is `manual-review` with assurance `none`, and it has to be. No parser can see what
was in the author's head. What the mechanism supplies is the shape that makes an omission *visible*:
five named fields mean a missing dimension is an empty field rather than an unwritten sentence.

### R3 — Opportunity cost names the work not done instead

A proposal MUST record what will not happen because this happens. Opportunity cost is the hardest of
the five to see, for a structural reason: the other four are costs of the thing in front of you, and
this one is a cost of something that will now never be in front of anyone. It has no advocate in the
room, because the people who would have benefited from the displaced work do not know they are in the
conversation.

The recordable form is concrete. "There is always an opportunity cost" is not an entry. "Two engineers
for six weeks, which is the migration off the legacy scheduler, which then slips past the vendor
support cutoff" is an entry, because a reader can disagree with it. Where the honest answer is that
the work would be done by people who have no competing commitment, that is a legitimate and unusually
strong answer — it must simply be stated rather than left as a silence that reads the same as an
oversight.

### R4 — Cost estimates are evidence entries with real levels

Every cost figure a proposal records is a claim about the world and carries an evidence level under
[Standard 2](02-evidence-taxonomy-and-integrity.md) like any other. An estimate derived from a spike
or a comparable prior build is `technical-evidence`. An estimate produced by a competent engineer
thinking hard for an hour with nothing to calibrate against is an `assumption`, and it is a perfectly
respectable one — it simply must not be spelled in the grammar reserved for something that was
measured.

This matters more for cost than for most claims, because cost estimates arrive wearing numbers, and a
number reads as an observation whether or not anything was observed. "Six to eight weeks" and "roughly
$40k/year in infrastructure" carry an air of derivation that the underlying basis often does not
support. The evidence level is what restores the distinction that the numeral erased.

### R5 — Unknown costs are recorded as unknown, at their true uncertainty

Costs that cannot be estimated MUST be recorded as unknown, with the reason they are unknown and what
would reduce the uncertainty. They MUST NOT be left blank, and they MUST NOT be given a plausible
number to fill the space.

A blank field and an unknown cost are different states that look identical in a finished document. The
first says nobody considered this dimension; the second says somebody considered it and could not
bound it — which is itself a finding, and frequently the most important sentence in the proposal. A
proposal whose operational cost is genuinely unbounded should be visibly a proposal whose operational
cost is unbounded, not one with a tidy figure that survived review because it looked like the others.

An unknown of consequence is also the strongest possible argument for
[Standard 9](09-experiment-before-build.md): where the decisive uncertainty is a cost, the cheap way
to resolve it is usually to go and find out rather than to build and discover.

## Additions this standard makes beyond the source

- R1's decomposition of the source's list into five *named fields* of the proposal artifact, and the
  argument that a single cost paragraph structurally hides four of the five dimensions.
- R2's reading of omission as misrepresentation rather than incompleteness, and the explicit
  distinction between not knowing a cost and not saying it.
- R3's requirement that opportunity cost name specific displaced work, and the observation that
  maintenance, operational burden, and opportunity cost are all paid by people who are not in the room
  when the proposal is approved.
- R4's ruling that a cost figure is an ordinary evidence entry, and the note that a numeral confers an
  unearned appearance of derivation.
- R5's distinction between a blank field and a recorded unknown, and the requirement to state what
  would reduce the uncertainty.

## Relationship to other standards

[Standard 2](02-evidence-taxonomy-and-integrity.md) supplies the levels R4 requires and the
prohibition on fabricated metrics that a cost figure invented for effect would violate.
[Standard 3](03-existing-capability-and-alternatives.md) depends on this standard: build, buy, and
integrate cannot be compared without the same five dimensions applied to each.
[Standard 4](04-value-and-strategic-alignment.md) is the other side of the ledger, and neither side
means anything alone. [Standard 8](08-success-and-kill-criteria.md) uses cost prospectively — the
remaining-cost half of the sunk-cost question is this standard's accounting re-run from where the work
now stands. [Standard 12](12-new-project-justification.md) applies these dimensions at their
harshest, because a new project pays duplicated infrastructure, deployment, and support costs that an
addition to an existing project does not.

## Implementation

`innovation.cost-accounting` (required, `document`, `partial` assurance) checks that the `## Costs`
section exists and that all five named fields — `Implementation`, `Maintenance`, `Operational`,
`Opportunity cost`, `Technical debt` — are present and non-empty.

`innovation.no-hidden-costs` (forbidden, non-exemptible, `manual-review`, assurance `none`) is
invariant-class. **No automated check evaluates it.** It reports `not-evaluated` unless a human
attestation records that someone examined the cost section, what they compared it against, and what
they found. An unattested clean run means nobody looked, not that nothing was hidden. Where a human
attestation does record a violation, the verdict is `BLOCKED_BY_INVARIANT`, and no waiver can be filed
against it — an exception lodged against a non-exemptible rule is rejected, and the rejection is
itself a failure ([Standard 14](14-standards-integrity.md)).

What the mechanical check establishes is presence of a section and non-empty named fields. **It cannot
establish that an estimate is plausible, that the five dimensions were actually thought about, that
the numbers were derived rather than invented, or that a material cost known to the author is
missing.** A `## Costs` section reading "Implementation: medium. Maintenance: low. Operational: low.
Opportunity cost: some. Technical debt: minimal." passes every mechanical rule in this standard and
tells a reader nothing. That gap is human review, and it is published in the limitations table in
[`INSTRUCTIONS.md`](../INSTRUCTIONS.md) rather than left for an adopter to discover.
