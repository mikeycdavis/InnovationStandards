# Standard 1 — Problem Before Solution

The ordering constraint the rest of the series depends on: a proposal establishes the problem, who has
it, and why it matters, before it proposes anything.

Source: item 1 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal — a new feature, a major enhancement, an architectural or product
change, a new product, or a new project. This is the first of the series because every other standard
measures something *against* the problem: value is value to whoever has it, cost is cost relative to
what the problem is worth, and a kill criterion is the observation that the problem was not what we
thought.

## Requirements

### R1 — The problem is stated before the solution

A proposal MUST record a problem statement: what is wrong, who is affected, and why it matters now.
All three are required, and each fails in a distinctive way when omitted.

**What is wrong** must describe a condition in the world, not the absence of the proposed solution.
"We do not have a dashboard" is not a problem; it is the solution written as a lack. The test is
whether the statement survives deleting the proposal: if the problem disappears when the idea does,
the problem was the idea.

**Who is affected** must name someone other than the author. A proposal whose only beneficiary is the
team that thought of it is not disqualified, but it must say so plainly, because that is a materially
different proposition from one that serves a customer.

**Why it matters now** distinguishes a problem from a permanent condition. Many true statements about
what is imperfect have been true for years and will be true for years more. What makes one of them
actionable is a change — in scale, in cost, in obligation, in what a competitor or a regulator did.
Without that, the proposal is answering "why not" rather than "why".

### R2 — Technical interest is not a reason

**Reproduced verbatim from the source:**

- never invent features solely because they are technically interesting

This prohibition is first in the series because it is the most common failure in AI-assisted
innovation and the least likely to be recognised as one. An agent asked what could be built will
produce things that are buildable, and buildability correlates with technical interest far more than
with need. The output is fluent, plausible, and unmoored.

The prohibition is not against interesting work. It is against interest functioning as the
justification. A proposal may say the approach is elegant; it may not offer that as the reason the
work should happen. Where the honest answer to "who has this problem" is "nobody yet", the honest
outcome is `explore` under [Standard 10](10-innovation-decision-model.md), not `build`.

### R3 — No build without an identified problem

**Reproduced verbatim from the source:**

- never recommend building something without identifying the problem it solves

This is invariant-class: `innovation.no-problem-no-build` is `forbidden` and non-exemptible, and its
failure produces `BLOCKED_BY_INVARIANT` rather than ordinary non-compliance
([ADR 0005](../artifacts/adr/0005-invariant-class-and-blocked-verdict.md)). A recommendation to build
something whose problem was never identified is not an incomplete recommendation that further work
would finish. It is a recommendation with no basis, and everything downstream of it — the estimate,
the design, the schedule — inherits that.

The rule triggers conditionally: it applies when a proposal's outcome is `build` or `prototype`. A
proposal at `explore` may legitimately be searching for the problem, which is what `explore` is for.

### R4 — Claimed demand requires evidence

**Reproduced verbatim from the source:**

- never claim user demand without evidence

"Users are asking for this" is a claim about the world and is treated exactly like any other: it is
recorded as an evidence entry at its true level under
[Standard 2](02-evidence-taxonomy-and-integrity.md), with a source. Where the real basis is the
author's intuition, the honest level is `assumption`, and an assumption is a perfectly respectable
thing to record — it simply must not be spelled `user-evidence`.

The failure this prevents is specific and is worse under AI assistance: a generated proposal can
assert demand in confident, well-formed prose without any underlying observation, and nothing in the
prose distinguishes it from a proposal resting on twelve interviews. The evidence grammar is what
makes the difference visible.

### R5 — User and customer value is stated in their terms

A proposal MUST state what changes for the affected party if the work succeeds, expressed as something
they would notice. "Improved architecture" is not user value; "a report that took two days arrives in
an hour" is. Where the beneficiary is internal — a platform capability, a reduction in operational
toil — that is stated as such rather than dressed as customer value.

## Additions this standard makes beyond the source

- R1's three-part decomposition of a problem statement, the deletion test for a solution-shaped
  problem, and the requirement that "why now" name a change.
- R3's conditional trigger — the prohibition binds at `build` and `prototype`, not at `explore` — so
  that a genuine search for a problem is not itself a violation.
- R4's rule that asserted demand is an ordinary evidence entry with an ordinary level, and the note
  about generated prose being indistinguishable from evidenced prose.
- R5 in full.

## Relationship to other standards

[Standard 2](02-evidence-taxonomy-and-integrity.md) supplies the levels that make R4 checkable, and
owns the prohibitions on fabricating the evidence R4 demands.
[Standard 3](03-existing-capability-and-alternatives.md) is the immediate next question: a real
problem may already be solved. [Standard 8](08-success-and-kill-criteria.md) closes the loop, since a
success criterion is the problem stated as an observable, and a kill criterion is the admission that
the problem was misidentified. [Standard 10](10-innovation-decision-model.md) supplies the outcome
vocabulary R3 conditions on.

## Implementation

`innovation.problem-statement` (required, `document`, `partial` assurance) checks that the Problem
section exists and that its three fields are present and non-empty.
`innovation.no-problem-no-build` (forbidden, non-exemptible, `document`, `partial`) fires when a
proposal whose outcome is `build` or `prototype` has an empty or missing problem statement.

Both establish presence, not adequacy. **No mechanical check can tell whether a stated problem is
real**, whether the named affected party actually exists, or whether "why now" describes a genuine
change. A problem statement reading "users are frustrated" satisfies both rules and may be worthless.
That gap is human review, and it is published in the limitations table in
[`INSTRUCTIONS.md`](../INSTRUCTIONS.md) rather than left for an adopter to discover.

R2 is carried by `innovation.novelty-not-value` (Standard 2), which is manual-review and attestable:
whether technical interest was the real motivation is not visible in the text of a document written to
obscure it.
