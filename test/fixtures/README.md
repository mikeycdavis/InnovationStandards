# Fixtures — worked examples of compliant and non-compliant innovation decisions

Each directory is a miniature repository. Together they are the examples the standards promise, and
the mutation instrument the detectors are proved against: **every defect fixture must fail its rule
before the compliant ones are trusted.** A check that cannot be provoked reports green forever, and
the engine this repository vendored has shipped exactly that bug once already — a freshness check
that matched on first lines and so reported clean on the one edit it existed to catch.

`test/fixtures/` is in the audit's skip list, so these planted defects never contaminate this
repository's own verdict. They are audited explicitly with `--dir=`.

All seven proposal fixtures derive from one base document —
`compliant-proposal/artifacts/innovation-proposals/0001-add-export-to-csv.md` — by a single named
mutation, so what each one is testing is exactly the difference from a document that passes.

## Compliant

| Fixture | Outcome | What it demonstrates |
|---|---|---|
| `compliant-proposal/` | `build` | A complete proposal. Zero findings, verdict `COMPLIANT` |
| `compliant-rejection/` | `reject` | **The most important fixture here.** A properly evidenced decision *not to build* is compliant, and is evaluated identically to a decision to build. The test asserting this is what would break first if the framework ever started biasing toward implementation |
| `compliant-deferral/` | `defer` | A suspension carrying the revisit condition that makes it a deferral rather than an abandonment |

## Non-compliant

| Fixture | Mutation | Rules it must fire | Verdict |
|---|---|---|---|
| `fabricated-evidence/` | A `validated-conclusion` citing nothing, and an `experiment-result` citing a file that does not exist | `innovation.no-silent-upgrade`, `innovation.evidence-citations` | `BLOCKED_BY_INVARIANT` |
| `forced-build/` | A `build` decision with the problem statement deleted and the kill criterion replaced by "we will know if it is not working" | `innovation.no-problem-no-build`, `innovation.problem-statement`, `innovation.kill-criteria` | `BLOCKED_BY_INVARIANT` |
| `skipped-capability-analysis/` | The existing-capability finding replaced with "nothing exists that does this", and the do-nothing alternative removed | `innovation.existing-capability-analysis`, `innovation.alternatives-considered` | `NON_COMPLIANT` |
| `defer-without-revisit/` | `defer` with no `RevisitWhen` | `innovation.revisit-conditions` | `NON_COMPLIANT` |
| `new-project-thin/` | Retyped as `new-project`, answering two of the eight separation considerations | `innovation.new-project-justification` | `NON_COMPLIANT` |
| `integrity-downgrade/` | A policy declaring two invariant rules at `optional`/`recommended` and filing an exception against a third | `innovation.integrity-invariant`, plus the rejected waiver | `BLOCKED_BY_INVARIANT` |

Note that `defer-without-revisit` and `skipped-capability-analysis` are ordinary non-compliance
rather than blocked. That is deliberate and is asserted: blocking has to stay rare to mean anything,
so only invariant-class failures halt work.

## Guards

| Fixture | What it proves |
|---|---|
| `mentions-only/` | A document that *describes* the evidence taxonomy and the outcome vocabulary — including an entry that would violate `innovation.no-silent-upgrade` if it were in a proposal — produces **zero** findings, because it sits outside `artifacts/innovation-proposals/`. The guard is a path check, not a heuristic, so no amount of proposal-shaped prose can defeat it |
| `policies/` | Known-negative policy documents: wrong shape, an uncatalogued rule id, a camelCase id, an expired waiver, and a waiver against a rule that admits none. Each must be rejected for its own reason rather than merely producing some error |
| `diagrams/` | Mermaid freshness, including the mutation test that catches a stale embedded copy |
