# Standard 3 — Existing Capability and Alternatives

The question asked immediately after the problem is established: does something already solve this,
and what else could?

Source: item 3 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal. This standard is where most proposals should die, and the
reason the series places it third: a real problem, honestly evidenced, is frequently already solved by
something the author had not looked for.

## Requirements

### R1 — Record what was searched, and what was found

A proposal MUST record the existing-capability analysis it performed: which projects, products, or
capabilities were examined, and what was found in each. Both halves are required, because a finding
with no search behind it is an assertion, and a search with no finding recorded is unfalsifiable.

**A search that was not performed MUST NOT be reported as a search that found nothing.** The two are
written identically in careless prose — "there is no existing capability for this" — and they are
completely different claims. The first is an observation; the second is an absence of information. The
required form names what was looked at, so a reviewer can see the boundary of the search and judge
whether it was wide enough.

Where the answer is that something exists but does not solve the problem, the proposal must say *why*
it does not, specifically enough that a reader who knows that capability can disagree.

### R2 — Ignoring an existing capability is prohibited

**Reproduced verbatim from the source:**

- never ignore an existing capability that already solves the problem

This is the prohibition the standard exists for. Building a second solution to a solved problem costs
more than the build: it splits the users, splits the maintenance, splits the data, and creates a
migration nobody has scheduled. The cost is paid indefinitely and by people who were not in the room.

Where an existing capability solves the problem, the honest outcome is `merge-with-existing` or
`reject` under [Standard 10](10-innovation-decision-model.md). `merge-with-existing` is the outcome
for a real problem whose solution belongs inside something that already exists — it is a decision to
act, not a decision to stop, and it exists precisely so that finding a prior solution does not
terminate the work that motivated the proposal.

### R3 — Alternatives include doing nothing

A proposal MUST record the alternatives it considered, and the set MUST include **doing nothing**.

Do-nothing is not a formality. It is the baseline every other option is measured against, and it is
the option that wins more often than proposal documents suggest, because the cost of doing nothing is
usually the only cost that is already being paid and therefore already survivable. A proposal that
cannot articulate what happens if nothing is done has not established that the problem has
consequences.

### R4 — Build, buy, and integrate are each addressed

Where the capability could be obtained rather than written, the proposal MUST address building it,
buying it, and integrating something that exists, and MUST state why the chosen route was chosen.

Each of the three is recorded with a substantive answer. **An alternative that is not viable is
recorded with the reason it is not viable; it is never simply absent.** "Buy: no vendor offers this
for a workload of our shape — evaluated Acme and Contoso, both cap at 10k events/day" is an answer.
An empty field is not, and an empty field is what a proposal produces when the author never looked.

The asymmetry worth naming: building is the option whose costs are most familiar to the person writing
the proposal and least visible to the person approving it, which is why the default drifts toward
build even when it is not the cheapest route. Standard 5's cost accounting is what makes the
comparison honest.

## Additions this standard makes beyond the source

- R1's rule that a search not performed must not be recorded as a search that found nothing, and the
  requirement to name the boundary of the search.
- R2's mapping from "an existing capability solves it" to the `merge-with-existing` outcome, and the
  observation that duplicated solutions impose their cost on people who were not in the room.
- R3's argument that do-nothing is the baseline rather than a formality.
- R4's requirement that a non-viable alternative is recorded *with its reason*, and the note about
  build being the option whose costs are most familiar to its author.

## Relationship to other standards

[Standard 1](01-problem-before-solution.md) establishes the problem this standard searches for prior
solutions to. [Standard 5](05-cost-accounting.md) supplies the cost dimensions that make a
build-versus-buy comparison more than a preference.
[Standard 11](11-portfolio-coherence-and-prioritization.md) asks the same question at portfolio scale
— R1 asks whether this problem is solved, Standard 11 asks whether this *proposal* duplicates another
proposal. [Standard 12](12-new-project-justification.md) is R1 applied with the burden of proof
reversed: for a new project, the question is not merely whether something exists but whether something
existing should own the capability.

## Implementation

`innovation.existing-capability-analysis` (required, `document`, `partial`) checks that the Existing
capability section is present with non-empty `Searched` and `Finding` fields.

`innovation.alternatives-considered` (required, `document`, `partial`) checks that the Alternatives
section names all four of `Do nothing`, `Build`, `Buy`, and `Integrate`, each with a non-empty value.
Checking for four named fields rather than searching the prose is deliberate: it is what makes the
absence of the do-nothing option a detectable finding rather than a matter of interpretation.

Neither rule can establish that the search was adequate, that the capabilities named actually exist,
or that the stated reason an alternative is non-viable is true. **A proposal that writes "Buy: not
viable" with no reasoning satisfies the field-presence check and fails the standard.** That gap is
human review and is published in the limitations table in [`INSTRUCTIONS.md`](../INSTRUCTIONS.md).
