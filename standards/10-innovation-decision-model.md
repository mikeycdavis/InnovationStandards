# Standard 10 — Innovation Decision Model

The closed set of eight outcomes a decided proposal may record, and the rule that none of them is
privileged — a properly evidenced decision not to build is exactly as compliant as a decision to build.

Source: item 10 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to the Decision section of every innovation proposal, and to any place where an undecided idea
might be presented as though it had been decided. This standard supplies the outcome vocabulary the
rest of the series conditions on: [Standard 1](01-problem-before-solution.md)'s no-build prohibition
triggers at `build` and `prototype`, [Standard 3](03-existing-capability-and-alternatives.md) routes a
solved problem to `merge-with-existing`, and [Standard 9](09-experiment-before-build.md) asks whether a
`build` should have been an experiment first. The design rationale is
[ADR 0002](../artifacts/adr/0002-eight-outcome-decision-model.md).

## Requirements

### R1 — A decided proposal records exactly one outcome from the closed set

A proposal that has been decided MUST record exactly one outcome, and that outcome MUST be a member of
the closed set. **Reproduced verbatim from the source:**

- explore
- validate
- prototype
- build
- defer
- reject
- merge with existing capability
- insufficient evidence

In a proposal these are written as parsed tokens: `explore`, `validate`, `prototype`, `build`,
`defer`, `reject`, `merge-with-existing`, `insufficient-evidence`. The set is closed and is part of the
frozen public surface; adding a ninth value is a breaking change, not a configuration option.

Exactly one is required because the alternatives are worse in specific ways. Zero outcomes is a
proposal that has been written but not decided, which is the state
[R6](#r6--a-brainstormed-idea-is-not-a-roadmap-item) governs. Two outcomes — "build, but defer the
second phase" — is two decisions wearing one label, and the moment they diverge nobody can say which
one the record committed to. Free text is unaggregatable and permits "approved pending further
discussion", which is several states pretending to be one.

The eight, defined tightly enough to be chosen between:

| Outcome | What it commits to | Chosen when |
|---|---|---|
| `explore` | Learning what the problem actually is, at low cost, with no commitment to a solution | A real signal exists but the problem is not yet stated well enough to evaluate |
| `validate` | Testing whether a stated problem is real and material for identified people | The problem is stated but rests on `assumption` or `hypothesis` entries |
| `prototype` | Building something disposable to answer a technical or usability question | The decisive uncertainty is whether the thing can be made to work at all |
| `build` | Implementing and shipping, with the costs recorded and the kill criteria set | Problem, evidence, alternatives, cost, and success criteria all hold up |
| `defer` | Doing nothing now, deliberately, with a stated condition for reconsidering | The case may be sound but the timing, capacity, or dependency is not |
| `reject` | Not doing this, with the reasoning recorded so it need not be re-argued | The problem is not real, not material, already solved, or not worth its cost |
| `merge-with-existing` | Solving the problem inside a capability that already exists | The problem is real and something already in the portfolio should own it |
| `insufficient-evidence` | Recording that the evidence does not support any of the other seven | The proposal cannot honestly be decided on what is written |

### R2 — No outcome is privileged

The evaluator MUST treat a properly evidenced `reject` exactly as it treats a properly evidenced
`build`. Both are `COMPLIANT`. Compliance measures whether the decision was made properly; it never
measures whether the decision was favourable. **Reproduced verbatim from the source:**

> The system must not force every idea toward implementation.

This is the load-bearing sentence of the whole repository, and it is defended in the data model rather
than in exhortation. If the only recorded states were "approved" and "not yet approved", then every
proposal would be a build waiting for enough paperwork, and the cheapest route to a clean record would
run through pushing until the answer is yes. The eight-value enum removes that gradient: six of the
eight are not "build it", and none of them is a lower grade of the others.

The orthogonality is held mechanically. `test/fixtures/compliant-rejection/` is a fully evidenced
`reject` that must produce no failures, and a change that started penalising rejection would break that
test. That fixture exists for the same reason a seatbelt exists — not because anyone plans to need it,
but because the failure it prevents is silent and expensive.

A2 — **an additional prohibition this standard introduces**: never treat `reject`, `defer`, or
`insufficient-evidence` as process failures. They MUST NOT be reported as incomplete work, counted
against a team, surfaced as a red state in any dashboard derived from these artifacts, or described in
review as a proposal that "did not make it". An experiment that invalidated an idea is a successful
innovation process, and a quarter that produced four rejections and no builds may have been the most
valuable quarter the portfolio had.

### R3 — Suspension requires a revisit condition

An outcome of `defer` or `insufficient-evidence` MUST record a `RevisitWhen` condition: the observable
event, date, or state change that would cause the decision to be taken up again. No other outcome may
carry one, because a revisit condition on a `build` or a `reject` is either noise or a second,
unrecorded decision.

A suspension with no trigger is indistinguishable from something that was forgotten. Both look
identical in the record — an idea that was written down and then not acted on — and the difference
between them is precisely the thing a reader needs. "Revisit when the EU accessibility deadline is
confirmed" and "revisit when we next have capacity" differ in kind: the first names something that will
observably happen, the second names a feeling that never arrives. A condition SHOULD be written so that
someone other than the author can tell whether it has occurred.

`insufficient-evidence` deserves particular care here, because its revisit condition is usually a
statement about *what evidence would settle it* — and writing that down converts a dead end into a
piece of work someone can do.

### R4 — Learning outcomes state what evidence they will produce

`explore`, `validate`, and `prototype` are commitments to learn, and each MUST state what evidence it
is expected to produce, in the vocabulary of
[Standard 2](02-evidence-taxonomy-and-integrity.md). An `explore` that will produce observations says
so; a `validate` that will produce `user-evidence` from eight interviews says so; a `prototype` that
will produce `technical-evidence` about throughput says so.

The reason is re-entry. A proposal decided `validate` comes back, and when it does, the honest form of
its return is a citation-backed level change: the entries that were `hypothesis` are now
`experiment-result`, and the conclusion cites them under `(from: ...)`. Without a stated expectation,
re-entry is a rewrite — a fresh document with fresh confidence and no visible relationship to what was
believed before — and nobody can tell whether the evidence improved or the prose did.

This also makes a learning outcome falsifiable in a way that "we'll look into it" is not. If the
`prototype` produced no evidence of the kind it promised, that is a finding, and it belongs in the
record before the next decision is taken.

### R5 — `insufficient-evidence` is a first-class outcome

`insufficient-evidence` MUST be available and MUST NOT be treated as a failure to decide. It is the
decision-model analogue of the evaluator's refusal to let unknown count as a pass: the same principle
that makes an unexamined rule report `NOT_EVALUATED` rather than passing makes an unevidenced proposal
report `insufficient-evidence` rather than resolving.

Without it, a weak proposal has nowhere honest to land, and what it does instead is drift toward
whichever of `build` or `reject` the author already preferred. That drift is invisible, because the
document that results looks like a decision — it has a conclusion, a rationale, and a confident tone —
and the only thing missing is the part that would have made it true. Under AI assistance this is
sharper still, since a model asked to conclude will conclude, and the fluency of the output is
unrelated to the strength of what it rests on.

Choosing `insufficient-evidence` is therefore not an admission of defeat. It is the one available move
that keeps the record accurate, and with R3's `RevisitWhen` attached it is also a piece of actionable
work.

### R6 — A brainstormed idea is not a roadmap item

**Reproduced verbatim from the source:**

- never treat brainstorming as a committed roadmap

An idea that has been generated but not decided carries no commitment, and MUST NOT be presented,
aggregated, or scheduled as though it did. Concretely: it does not appear in a roadmap, a plan, a
capacity forecast, or a stakeholder communication as work that will happen; it is not counted in a
portfolio total of committed effort; and it is not cited by another proposal as an existing plan.

The mechanism of this failure is mundane and almost never deliberate. A list of possibilities is
generated, it is tidied, it is pasted into a slide, and by the third retelling the tidying has become
commitment — nobody decided anything, and yet something is now on a plan. AI assistance industrialises
the first step: a model can produce forty plausible, well-formed, confidently-phrased ideas in a minute,
and volume is exactly what makes a list look like a considered plan. The generated list is not
evidence, is not a decision, and its length says nothing about its value.

The remedy is the outcome field. An idea with no recorded outcome is undecided by definition, and
undecided is a state the record can express.

## Additions this standard makes beyond the source

- R1's table defining each of the eight outcomes, the kebab-case token spellings, and the argument for
  why exactly one outcome is recorded rather than zero, two, or free text.
- R2's additional prohibition A2 — never treat `reject`, `defer`, or `insufficient-evidence` as process
  failures — and the fixture-based mechanism that holds outcome orthogonality.
- R3's requirement that a revisit condition be observable by someone other than the author, and the
  rule that no outcome other than `defer` and `insufficient-evidence` carries one.
- R4 in full: the requirement that learning outcomes declare their expected evidence, and the re-entry
  argument that makes it matter.
- R5's identification of `insufficient-evidence` as the decision-model analogue of not-evaluated, and
  the drift-toward-preference failure it prevents.
- R6's specific list of what "presented, aggregated, or scheduled" prohibits, and the observation about
  generated volume.

## Relationship to other standards

[Standard 2](02-evidence-taxonomy-and-integrity.md) supplies the levels R4 and R5 depend on; the
relationship is close enough that `insufficient-evidence` is best read as the decision-level
consequence of the evidence taxonomy's honesty rules.
[Standard 1](01-problem-before-solution.md) conditions its invariant on `build` and `prototype`.
[Standard 3](03-existing-capability-and-alternatives.md) supplies the `merge-with-existing` case, and
[Standard 12](12-new-project-justification.md) supplies the other one.
[Standard 8](08-success-and-kill-criteria.md) governs what a `build` must carry with it, and
[Standard 9](09-experiment-before-build.md) asks whether `prototype` or `validate` should have been
chosen instead. [Standard 13](13-innovation-proposal-artifact.md) defines the Decision section this
standard fills. [Standard 14](14-standards-integrity.md) prohibits changing an outcome to clear a
check.

## Implementation

`innovation.decision-recorded` (required, `document`, **`full`** assurance) — the Decision section
carries an `Outcome` field whose value is a member of the closed set. This is one of the few
`full`-assurance rules in the catalog, and the reason is narrow: membership of a closed set *is* the
entire requirement. There is no adequacy question hiding behind it, because the rule does not claim the
outcome was the right one.

`innovation.revisit-conditions` (required, `document`, **`full`**) — `RevisitWhen` is present if and
only if the outcome is `defer` or `insufficient-evidence`. Applicability is **conditional**: the rule is
triggered by what the proposal says, not by a policy declaration, and `standards explain <proposal>`
prints the trigger so an author can see why it does or does not apply. Assurance is `full` on the same
narrow basis — the biconditional between outcome and field presence is fully mechanical.

`innovation.brainstorm-not-roadmap` (forbidden, `manual-review`, `none`) — **no automated check
evaluates this rule.** Whether an undecided idea was presented elsewhere as a commitment is a fact about
slides, plans, and conversations that this repository cannot see. It reports `not-evaluated` unless a
human attestation records that someone looked, what they examined, and what they found. It is not
invariant-class: a project mid-transition may need a time-bounded, approved waiver, and refusing one
would drive the violation out of the record rather than out of the project.

**What none of these establishes is whether the recorded outcome is the honest one.** A proposal whose
evidence supports `insufficient-evidence` and whose author wrote `build` passes
`innovation.decision-recorded` cleanly, because `build` is in the set. The other standards constrain
that from the sides — an unevidenced `build` fails
[Standard 1](01-problem-before-solution.md)'s invariant, an uncosted one fails
[Standard 5](05-cost-accounting.md)'s — but no rule here reads the decision and judges it. That gap is
human review, and it is published in the limitations table in
[`INSTRUCTIONS.md`](../INSTRUCTIONS.md).
