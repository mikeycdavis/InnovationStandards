# 0003 — The proposal evidence taxonomy is a third axis, not a relabelling of the existing two

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Project owner

## Context

Innovation proposals rest on claims about the world: that a problem exists, that users want
something, that a market has room, that an approach is technically feasible. Those claims differ
enormously in how well they are supported, and the difference is exactly what gets lost when a
proposal is summarised. "Users need this" reads identically whether it came from twelve interviews or
from one person's intuition ten minutes ago.

The vendored engine already carries two vocabularies that sound like they could serve:

- **Finding labels** — `OBSERVED`, `INFERRED`, `CONFIRMED_BY_OWNER`, `UNKNOWN`.
- **Rule assurance** — `full`, `partial`, `none`.

Reusing one of them would be cheaper than introducing a third. It would also be wrong.

## Decision

Introduce a third, independent axis: the **evidence level** of a claim recorded inside a proposal.

```text
observation  assumption  hypothesis  user-evidence
market-evidence  technical-evidence  experiment-result  validated-conclusion
```

The three axes answer three different questions and are never merged:

| Axis | Question it answers | Subject |
|---|---|---|
| Evidence level | How well is this claim supported? | a claim in a proposal |
| Finding label | How does the auditor know what it is reporting? | a finding produced by a check |
| Assurance | How much of the rule does this check establish? | a rule in the catalog |

They compose rather than compete. A detector makes an `OBSERVED` finding (axis 2) that an entry
labelled `validated-conclusion` (axis 1) cites nothing, under a rule whose assurance is `partial`
(axis 3) because presence of a citation is checkable and its validity is not.

**No silent upgrades.** An entry's level may only rise when the entry cites the lower-level entries
that now support it, using `(from: E1, E3)`. `innovation.no-silent-upgrade` checks that a
`validated-conclusion` carries citations and that they do not resolve solely to assumptions or
hypotheses. It cannot check that the cited evidence *actually supports* the conclusion, and the rule
says so in its assurance note rather than implying otherwise.

Defined normatively by [Standard 2](../../standards/02-evidence-taxonomy-and-integrity.md).

## Alternatives considered

**Reuse the finding labels.** Rejected. They describe the auditor's epistemic position, not the
claim's support. A proposal's `assumption` entry is something the tool `OBSERVED` perfectly well — the
label is about the observation, the level is about what was observed. Merging them would make it
impossible to say "I definitely observed that this is only an assumption", which is the single most
useful sentence this system produces.

**Reuse assurance.** Rejected. Assurance is a property of a *rule and its implementation*, fixed in
the catalog and identical for every project. Evidence level is a property of an individual claim,
varying entry by entry. They have different lifetimes, different owners, and different cardinality.

**Two levels: evidenced / not evidenced.** Rejected. It puts a market analysis and a completed
experiment in one bucket, and it gives an author no gradient to move along — which is what makes
"gather more evidence" an actionable instruction rather than a mood.

**A numeric confidence score per claim.** Rejected. Numbers invite averaging, and averaging evidence
strength is how a single fatal assumption disappears into a comfortable mean. Named levels cannot be
averaged, which is the point.

**Let authors define their own levels per proposal.** Rejected. Nothing could be checked, and nothing
could be compared across a portfolio. A closed set is what makes `innovation.evidence-labels` a
`full`-assurance rule.

## Consequences

**Makes easier.** An entry's support is visible without reading the surrounding argument. An agent
can be told to gather evidence *at a named level*. The strongest claim in a proposal can be traced to
the entries beneath it.

**Makes harder.** Authors must classify every claim, and classification is a judgement — the boundary
between `hypothesis` and `assumption`, or between `user-evidence` and `market-evidence`, will be
argued about. Standard 2 defines each level to narrow that, but it cannot eliminate it. The tooling
checks that a label is present and drawn from the set; whether it is the *right* label is human
review, and that limit is published in the limitations table rather than hidden.

**Commits the project to.** Keeping the three axes separate in every output format, and never adding
a derived "overall evidence score" that would collapse them.
