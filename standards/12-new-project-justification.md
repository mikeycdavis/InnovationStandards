# Standard 12 — New-Project Justification

The higher bar a new project must clear, with the burden of proof on separation rather than inclusion:
a new project must justify why the capability does not belong inside something that already exists.

Source: item 12 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies **only** to proposals whose `Proposal type` is `new-project` — a new repository, service,
application, or product that would stand on its own rather than extend something already in the
portfolio. A proposal adding a feature, an enhancement, or an architectural change to an existing
project is out of scope, and the rule this standard defines does not apply to it.

The narrow scope is deliberate. A bar that applied to everything would be routine, and a routine bar is
one people learn to clear without thinking. This one exists to be a genuine obstacle at the one moment
where an obstacle is worth its cost.

## Requirements

### R1 — The burden of proof falls on separation

A new-project proposal MUST justify why the capability does **not** belong in an existing project. It
is not sufficient to show that a new project would work, that the team prefers a clean start, or that
the boundaries are tidier. The question the proposal must answer is why inclusion was rejected.

This is a reversal of the ordinary posture and it is the whole substance of the standard. In the usual
form of the argument, a new project is the default and inclusion must be argued for: *this could go in
the platform repo, but it has different release cadence, different owners, and a different domain.*
Under this standard the default is the other way round. Inclusion is presumed, and separation is the
claim that carries the evidential load.

The reason for the reversal is an asymmetry in who pays. The benefits of a new project accrue
immediately and to the people proposing it: a clean codebase, no legacy constraints, no coordination
with another team's release. The costs accrue later and to everyone else — a second deployment pipeline
to keep working, a second on-call rotation, a second place a user must learn. A default that favours
separation is a default that lets the party enjoying the benefit decide, which is exactly the
circumstance under which a bar is needed.

A proposal MUST therefore name the existing projects that were considered as hosts and state, for each,
the specific reason it cannot or should not own the capability. "None was suitable" is not a reason. As
under [Standard 3](03-existing-capability-and-alternatives.md), a search that was not performed MUST
NOT be reported as a search that found nothing.

### R2 — All eight considerations are answered individually

The source requires consideration of eight things. **Reproduced verbatim from the source:**

- whether an existing project can own the capability
- duplicated infrastructure
- duplicated domain logic
- maintenance cost
- deployment cost
- support burden
- fragmented user experience
- portfolio complexity

Each MUST be answered individually and honestly, as eight separate named fields in the New project
justification section rather than as a paragraph that gestures at several of them:

| Field | The question it answers |
|---|---|
| `Existing project ownership` | Which existing projects were evaluated as hosts, and why each cannot or should not own this |
| `Duplicated infrastructure` | What build, deploy, auth, logging, monitoring, and data plumbing would exist twice |
| `Duplicated domain logic` | Which concepts, rules, or models would be implemented a second time, and what happens when the two definitions drift |
| `Maintenance cost` | What ongoing work this creates — dependency updates, security patching, framework migrations — and who performs it |
| `Deployment cost` | What is added to the release surface: pipelines, environments, secrets, certificates, runbooks |
| `Support burden` | Who answers when it breaks, and how that changes the existing rotation |
| `Fragmented user experience` | What the user must now learn, sign into, or switch between that they did not before |
| `Portfolio complexity` | What this adds to the cost of understanding, governing, and changing the portfolio as a whole |

Eight named fields rather than prose, for the same reason [Standard
3](03-existing-capability-and-alternatives.md) names its four alternatives: a field that must be filled
makes an omission visible, whereas a paragraph that covers five of eight considerations reads as
thorough. The three it skipped are typically the three with no comfortable answer.

### R3 — A real cost is recorded as a cost

Where a cost is real, it is recorded as a cost and weighed — not argued away. A proposal MAY conclude
that a real cost is worth paying; that is a legitimate and common conclusion. What it MUST NOT do is
convert the cost into a non-cost through framing.

The framings that do this are recognisable and each has a tell. *"Infrastructure is mostly automated"*
— automation reduces the marginal cost of a deployment, not the cost of owning a second deployment.
*"The team is small so support is simple"* — team size affects who pays, not whether. *"Users are
technical"* — a technical user experiencing fragmentation experiences it competently.

Each of these costs is paid **indefinitely and mostly by people who were not in the room**. The
proposal is written once; the second pipeline is patched every quarter for years, by whoever holds the
rotation then. That asymmetry between a one-time decision and a permanent obligation is precisely why
the cost must appear as a number or a stated unknown in the record, where a later reader can weigh it
against what actually happened.

Costs that cannot be estimated are recorded as unknown at their true uncertainty, per
[Standard 5](05-cost-accounting.md), rather than left blank or minimised.

### R4 — Creating a new project where one is not justified is prohibited

**Reproduced verbatim from the source:**

- never create a new project when the capability belongs naturally inside an existing project without documenting why separation is justified

The prohibition is on the undocumented case specifically. It does not forbid new projects, and it does
not forbid a new project where an existing one could plausibly have hosted the capability. It forbids
making that choice without recording the reasoning, which is the state in which the choice cannot be
reviewed, cannot be revisited, and cannot be learned from.

Where an existing project can own the capability, the honest outcome is `merge-with-existing` under
[Standard 10](10-innovation-decision-model.md). This matters for how the standard is experienced: the
alternative to a rejected new project is not "do nothing". It is "do this, in the place where it
belongs". `merge-with-existing` is a decision to act, and it exists so that failing this standard's bar
does not terminate the work that motivated the proposal.

## Additions this standard makes beyond the source

- R1's argument for *why* the burden reverses — the asymmetry between who receives the benefit of
  separation and who pays for it — and the requirement to name candidate host projects individually.
- R2's translation of the eight considerations into eight named fields, with a definition of the
  question each one answers.
- R3's naming of the specific rhetorical moves that convert a real cost into a non-cost, and the
  statement that these costs are paid indefinitely and mostly by people who were not in the room.
- R4's mapping from a failed separation argument to the `merge-with-existing` outcome, and the point
  that the alternative to a new project is not inaction.

## Relationship to other standards

[Standard 3](03-existing-capability-and-alternatives.md) is this standard with the burden of proof the
other way round: it asks whether something existing already solves the problem, while this asks whether
something existing should own the solution even though it does not yet.
[Standard 5](05-cost-accounting.md) supplies the cost discipline R3 depends on, and its invariant-class
`innovation.no-hidden-costs` is what a knowingly omitted duplication cost breaches.
[Standard 11](11-portfolio-coherence-and-prioritization.md) owns the portfolio-complexity concern at
large; this standard applies it to the single decision that adds most of it.
[Standard 10](10-innovation-decision-model.md) supplies `merge-with-existing`.
[Standard 13](13-innovation-proposal-artifact.md) defines the `Proposal type` field that triggers this
standard and the conditional New project justification section it requires.

## Implementation

`innovation.new-project-justification` (required, `document`, `partial`) — the New project
justification section is present and all eight named fields are present and non-empty.

Applicability is **conditional**: the rule applies **if and only if** the proposal's `Proposal type`
field is `new-project`. It is not triggered by a policy declaration, because whether a proposal creates
a project is a property of that proposal and one repository holds many proposals with different
answers. For any other proposal type the rule reports `not-applicable` with the trigger stated, and
`standards explain <proposal-path>` prints why.

The check establishes that the eight fields were answered. **It cannot establish that any answer is
true, complete, or honestly reasoned.** A proposal writing "Maintenance cost: minimal" in each of the
eight fields passes the rule and fails the standard entirely. Nor can any mechanism verify the central
claim of R1 — that no existing project could have owned the capability — because that requires knowing
what the other projects are, which this repository does not and will not.

There is also a boundary condition worth stating plainly: the rule reads the `Proposal type` field, so
a proposal that creates a new project while declaring itself an enhancement is never evaluated against
this standard at all. The field is a self-declaration, and self-declarations are exactly what a
standard cannot verify. Both gaps are human review and are published in the limitations table in
[`INSTRUCTIONS.md`](../INSTRUCTIONS.md).
