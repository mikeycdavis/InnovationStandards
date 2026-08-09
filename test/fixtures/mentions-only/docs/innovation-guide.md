# Our internal guide to the innovation standards

This document *describes* the innovation standards. It is documentation, not a decision record, and
nothing in it should be parsed as a proposal. It exists as a fixture precisely because it is written
to look as much like a proposal as prose can — every section name, every field name, every closed-set
token appears below.

## Problem

- **Statement:** New joiners do not know how the proposal format works.
- **Who is affected:** Everyone writing their first proposal.
- **Why it matters now:** We just adopted the standards.

## Evidence

The eight evidence levels are `observation`, `assumption`, `hypothesis`, `user-evidence`,
`market-evidence`, `technical-evidence`, `experiment-result`, and `validated-conclusion`. An entry is
written like this:

- **E1 [observation]** the claim (source: some/path.md)
- **E9 [validated-conclusion]** a conclusion with no citation at all

Note that the second example above would violate `innovation.no-silent-upgrade` if it appeared in a
real proposal. It appears here to show what the violation looks like, which is exactly why a detector
that searched for this pattern anywhere would be useless.

## Decision

- **Outcome:** build
- **Rationale:** This is illustrative text, not a decision.

## Costs

Nothing here is a cost estimate. The five cost dimensions are Implementation, Maintenance,
Operational, Opportunity cost, and Technical debt.

## What this fixture proves

Files outside `artifacts/innovation-proposals/` are never parsed as proposals. The guard is a path
check rather than a heuristic, which is why no amount of proposal-shaped prose in a documentation
file can trigger it. A test asserts this directory produces zero proposal findings.
