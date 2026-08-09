# 0002 — A proposal's conclusion is one of eight outcomes, and none of them is privileged

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Project owner

## Context

The purpose of these standards is to make AI-assisted innovation disciplined rather than to generate
features endlessly. The governing principle is that innovation is not automatically valuable, and the
system must explicitly support the conclusion *do not build this*.

A standards system can undermine that principle without ever saying so, through its data model. If
the only recorded state is "approved" or "not yet approved", then every proposal is a build waiting
for enough paperwork, and deciding not to build looks like a process failure — an unfinished item, a
stalled ticket, a red mark. Under that shape, the cheapest way for an author or an agent to reach a
clean state is to keep pushing until the answer is yes.

## Decision

A proposal that has been decided records exactly one **outcome**, drawn from a closed set of eight:

```text
explore  validate  prototype  build  defer  reject  merge-with-existing  insufficient-evidence
```

Three properties are load-bearing.

**No outcome is privileged.** The evaluator treats a fully-evidenced `reject` exactly as it treats a
fully-evidenced `build`. Both are `compliant`. Compliance measures whether the *decision was made
properly*, never whether the decision was favourable. This is held mechanically by
`test/fixtures/compliant-rejection/` and the test that asserts it produces no failures — a change that
started penalising `reject` would break that test, which is why the fixture exists.

**Six of the eight are not "build it."** `explore`, `validate`, and `prototype` are commitments to
learn, each stating what evidence it is expected to produce, so re-entering the model later is a
citation-backed level change rather than a rewrite. `defer` and `insufficient-evidence` are honest
suspensions and each **requires** a `RevisitWhen`. `merge-with-existing` is the outcome for a real
problem whose solution belongs inside something that already exists. `reject` is a conclusion, not a
failure.

**`insufficient-evidence` is a first-class outcome.** It is the decision-model analogue of the
evaluator's refusal to let unknown count as a pass. Without it, a proposal with weak evidence has
nowhere honest to land and drifts toward whichever of `build` or `reject` the author already
preferred.

Defined normatively by [Standard 10](../../standards/10-innovation-decision-model.md); checked by
`innovation.decision-recorded` (outcome present and in the set) and `innovation.revisit-conditions`
(a revisit condition present when, and only when, the outcome is `defer` or `insufficient-evidence`).

## Alternatives considered

**A simple approve / reject pair.** Rejected. It collapses "we do not know yet" into one of two
positions the evidence does not support, and it gives an agent no way to say *stop and find out*.

**A numeric score with a build threshold.** Rejected for the same reason the compliance status is
never computed from a score: a threshold gets negotiated, and a weighted average lets a strong score
on cheap-to-satisfy dimensions outvote a fatal one. It also implies the dimensions are commensurable,
which cost and evidence quality are not.

**An open, free-text conclusion.** Rejected. Free text cannot be checked, cannot be aggregated across
a portfolio, and permits "approved pending further discussion", which is four states pretending to be
one.

**A workflow state machine with permitted transitions.** Rejected for 1.0. It presumes a
process we have not observed, and the transitions people actually need — reject after prototype,
build after a deferral expires — are better recorded as a new decision on the proposal with its own
date and rationale than as an enforced graph.

## Consequences

**Makes easier.** "Do not build this" is a recordable, compliant, auditable answer. A portfolio can be
counted by outcome. An agent has three refusals available to it and is never cornered into a positive
recommendation.

**Makes harder.** Eight values must be documented, taught, and kept stable — the set is part of the
frozen public surface, so adding a ninth is a `MAJOR` release. Authors must choose, and the choice
between `defer` and `reject` is a real judgement the tooling cannot make for them.

**Commits the project to.** Never adding a mechanism that ranks or scores outcomes, and never letting
the compliance verdict depend on which outcome was chosen.
