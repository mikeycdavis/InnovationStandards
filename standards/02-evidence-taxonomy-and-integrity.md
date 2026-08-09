# Standard 2 — Evidence Taxonomy and Integrity

The eight levels a claim can hold, the rule that a level never rises without citation, and the six
prohibitions that keep the record honest.

Source: item 2 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every claim recorded in an innovation proposal. This standard supplies the vocabulary every
other standard in the series depends on: when Standard 1 requires evidence of a problem, Standard 4
requires a claim about impact, or Standard 5 requires a cost estimate, the thing they require is an
entry classified here.

## Requirements

### R1 — Every claim carries a level from the closed set

**Reproduced verbatim from the source:**

- observation
- assumption
- hypothesis
- user evidence
- market evidence
- technical evidence
- experiment result
- validated conclusion

In a proposal these are written in kebab-case as parsed tokens: `observation`, `assumption`,
`hypothesis`, `user-evidence`, `market-evidence`, `technical-evidence`, `experiment-result`,
`validated-conclusion`. The set is closed. A claim with no level is not a weaker claim; it is an
unclassifiable one, and it fails `innovation.evidence-labels`.

What each level means, stated tightly enough to be assigned:

| Level | The claim rests on |
|---|---|
| `observation` | something directly seen in a system, a document, or a record, which a reader could go and see too |
| `assumption` | something taken as true without support, held deliberately and stated as such |
| `hypothesis` | a proposition formulated to be tested, with a test in mind that has not been run |
| `user-evidence` | what identified users did or said — interviews, tickets, usage data, recorded requests |
| `market-evidence` | what the market shows — competitor behaviour, pricing, analyst data, published research |
| `technical-evidence` | what a technical investigation established — a spike, a benchmark, a feasibility check |
| `experiment-result` | the outcome of an experiment designed in advance to discriminate between outcomes |
| `validated-conclusion` | a conclusion that lower-level entries now support, and which cites them |

The levels are not a ranking to be climbed. A proposal resting entirely on well-labelled assumptions
is a legitimate proposal — at `explore` or `validate`, not at `build`.

### R2 — Levels are never silently upgraded

**Reproduced verbatim from the source:**

> Do not allow evidence levels to be silently upgraded.

An entry may be recorded at a stronger level only when it cites the specific entries that now support
it, using the `(from: E1, E3)` form. This makes an upgrade a visible edit with a visible basis rather
than a change of adjective.

`innovation.no-silent-upgrade` is invariant-class: `forbidden`, non-exemptible, and its failure blocks.
It fires when a `validated-conclusion` entry carries no citation, or when every entry it cites is
itself an `assumption` or a `hypothesis` — a chain that terminates in nothing observed is not
validation, however many steps it has.

What the check cannot establish is whether the cited evidence actually supports the conclusion. That
is human review, and the rule's assurance note says so rather than implying a stronger guarantee.

### R3 — Assumptions are declared, and uncertainty is recorded

A proposal MUST record its assumptions as assumptions and MUST record what it does not know. An
unknown that is omitted has not been resolved; it has been made harder to raise, because there is now
no place in the document where raising it is the expected thing to do.

**Reproduced verbatim from the source:**

- never present assumptions as facts

The prohibition targets presentation, not belief. Acting on an assumption is normal and often
necessary. Recording it in the grammar reserved for observations is what converts a manageable risk
into an invisible one, and it is invariant-class through
`innovation.no-fabricated-evidence` when the assumption is dressed as a source that does not exist.

### R4 — Evidence is not fabricated

**Reproduced verbatim from the source:**

- never fabricate market validation
- never fabricate customer feedback
- never fabricate metrics

These three are one prohibition with three surfaces, and they are grouped under
`innovation.no-fabricated-evidence` — `forbidden`, non-exemptible, and invariant-class. Fabricated
evidence does not make a proposal incomplete. It makes every conclusion resting on it invalid, and it
makes the proposal actively worse than one with no evidence at all, because it forecloses the enquiry
that would have found the truth.

This is the prohibition most exposed to AI assistance, and the exposure is structural rather than
malicious. A model asked to write a compelling proposal will produce plausible-sounding user quotes,
plausible-sounding market sizes, and plausible-sounding metrics, because that is what compelling
proposals contain. None of it is flagged as invented, because the generation process does not
distinguish. **A citation an agent produced from its own fluency, rather than from a source it
retrieved, is fabricated evidence** — the intent was not deceptive and the effect is identical.

The rule's `validationType` is `manual-review` and its assurance is `none`. Nothing mechanical can
tell a real interview from an invented one. What the tooling provides is that citations to
repository-relative paths must resolve (`innovation.evidence-citations`), which closes the cheapest
form, and that the rule is attestable — a human can record that they checked, and what they checked
against.

### R5 — Novelty is not value, and neither is an AI's approval

**Reproduced verbatim from the source:**

- never treat novelty as evidence of value

That something has not been done before is a fact about the past, not a claim about demand. Often it
has not been done because it is not worth doing, and that possibility is precisely what the evidence
requirement exists to test.

The second half of this requirement is this repository's own reflexive rule, **reproduced verbatim
from the source:**

- never call an idea validated merely because an AI considers it good

A language model's assessment that an idea is
strong is not `validated-conclusion`, not `market-evidence`, and not evidence of any level. It is not
recordable in the taxonomy at all, because the taxonomy classifies claims by what supports them, and
model confidence supports nothing. Where a model's analysis is genuinely useful — a feasibility
argument, a synthesis of retrieved sources — the recordable entry is the underlying finding at its own
level, with its own citation.

### R6 — The taxonomy is a distinct axis

This taxonomy MUST NOT be conflated with the two vocabularies the validator uses for its own
epistemics:

| Axis | Vocabulary | What it grades |
|---|---|---|
| Evidence level (this standard) | the eight levels above | how well a claim in a proposal is supported |
| Finding label | `OBSERVED`, `INFERRED`, `CONFIRMED_BY_OWNER`, `UNKNOWN` | how the auditor knows what it reports |
| Rule assurance | `full`, `partial`, `none` | how much of a rule a mechanical check establishes |

They compose rather than compete: a detector makes an `OBSERVED` finding that an entry labelled
`validated-conclusion` cites nothing, under a rule whose assurance is `partial`. Merging any two of
them removes the system's ability to say what it does not know. See
[ADR 0003](../artifacts/adr/0003-evidence-taxonomy-is-a-distinct-axis.md).

## Additions this standard makes beyond the source

- R1's definitions of the eight levels, and the statement that the levels are not a ladder to be
  climbed.
- R2's citation mechanism — `(from: ...)` — as the concrete meaning of "not silently upgraded", and
  the rule that a chain terminating in assumptions is not validation.
- R4's identification of AI fluency as a fabrication mechanism that requires no intent, and the honest
  statement that the rule's assurance is `none`.
- R5's ruling that model approval is not recordable in the taxonomy at any level.
- R6 in full, and the three-axis table.

## Relationship to other standards

Every standard that requires a claim requires it at a level defined here — Standard 1 for problem
evidence, [Standard 4](04-value-and-strategic-alignment.md) for impact,
[Standard 5](05-cost-accounting.md) for cost estimates,
[Standard 9](09-experiment-before-build.md) for experiment results.
[Standard 13](13-innovation-proposal-artifact.md) defines the grammar in which a level is written.
[Standard 14](14-standards-integrity.md) generalises R4: falsifying evidence to reach a desired
conclusion is the integrity invariant's central case.

## Implementation

`innovation.evidence-labels` (required, `document`, `full`) — every evidence entry carries a bracketed
label drawn from the closed set. This is one of the few `full`-assurance rules in the catalog, because
membership of a closed set is the entire requirement.

`innovation.evidence-citations` (required, `document`, `partial`) — `(source: ...)` paths that are
repository-relative must exist, and `(from: En)` references must resolve to entries in the same
proposal. URLs and absolute paths are skipped rather than guessed at.

`innovation.no-silent-upgrade` (forbidden, non-exemptible, `document`, `partial`) — as R2.

`innovation.assumptions-declared` (required, `document`, `partial`) — the Assumptions and uncertainty
section exists with at least one entry.

`innovation.no-fabricated-evidence` (forbidden, non-exemptible, `manual-review`, `none`) and
`innovation.novelty-not-value` (forbidden, `manual-review`, `none`) — **no automated check evaluates
either.** They report `not-evaluated` unless a human attestation records that someone looked, what
they examined, and what they found. That is the honest position: an unattested clean run means nothing
was checked, not that nothing was wrong.
