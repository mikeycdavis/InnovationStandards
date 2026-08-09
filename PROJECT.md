# PROJECT — InnovationStandards

The project manifest: what this repository is for, what it is held to, how it is built, and how to run
it. It is the file a fresh engineer or agent reads first when they have to continue the work without
the conversation that produced it.

## Purpose

A standalone, zero-dependency, policy-as-code standards repository for **innovation decisions** — the
judgements made about whether an idea should be pursued, before any code exists.

It publishes fourteen numbered standards, a catalog of thirty machine-identified rules, and a
command-line tool that evaluates an innovation proposal against them.

Its central claim, and the one every design decision here is downstream of: **it evaluates the quality
and integrity of the decision process, not whether the idea eventually succeeds.** A `COMPLIANT`
verdict means the reasoning met the bar. It never means the idea is good. The framework explicitly
supports the conclusion *do not build this* as a compliant outcome, and six of its eight decision
outcomes are not "build it".

Users are the people and AI agents who decide what gets built.

## Standards

This repository is held to its own standards, and is the dogfooded instance of them.

| | |
| --- | --- |
| Standards | Fourteen, at `standards/01-*.md` through `standards/14-*.md` |
| Rules | Thirty, all in category `innovation`, catalogued in [rules/innovation.json](rules/innovation.json) |
| Policy | [project-policy.yml](project-policy.yml) — this repository's own declarations |
| Policy schema | [schemas/project-policy.schema.json](schemas/project-policy.schema.json) |
| Source of record | [artifacts/prompts/innovation-standards-spec.md](artifacts/prompts/innovation-standards-spec.md), enumerated in [artifacts/standards-source-inventory.json](artifacts/standards-source-inventory.json) |
| Decision records | [artifacts/adr/0001-vendored-engine-standalone-repo.md](artifacts/adr/0001-vendored-engine-standalone-repo.md) through [artifacts/adr/0005-invariant-class-and-blocked-verdict.md](artifacts/adr/0005-invariant-class-and-blocked-verdict.md) |
| Design | [design/concept-map.md](design/concept-map.md), [design/cli-design.md](design/cli-design.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Adoption guide | [INSTRUCTIONS.md](INSTRUCTIONS.md) |

Of the thirty rules, twenty-two are machine-evaluated and eight are `manual-review` with `none`
assurance, established only by a recorded human attestation. Eleven are prohibitions at
`level: forbidden`, and seven of those are invariant-class — both `forbidden` and `nonExemptible`,
producing `BLOCKED_BY_INVARIANT` on failure. Exactly one rule is `recommended`.

## Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js ≥ 18, ES modules (`"type": "module"`) |
| Dependencies | **None.** Zero third-party packages; CI has no install step |
| Tests | `node:test` with `node:assert/strict`, run by `node --test "test/*.test.mjs"` |
| Configuration | YAML (a strict hand-written subset parser) and JSON Schema (a hand-written evaluator) |
| Normative content | Markdown, with a parseable field grammar |
| Diagrams | Mermaid; `.mmd` is canonical and any Markdown copy is derived |
| CI | GitHub Actions |

The zero-dependency constraint is structural rather than aspirational: a supply-chain compromise in a
tool that certifies compliance is a compromise of every certification it has issued. This was evaluated
as a real proposal — [artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md](artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md)
— and rejected.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | The test suite |
| `npm run audit` | Evidence discovery across the repository. No verdict |
| `npm run audit:strict` | The same, with warnings promoted to failures |
| `npm run validate` | The authoritative, policy-aware compliance verdict. **The CI gate** |
| `npm run check` | Evaluate every proposal and report its conclusion. The drafting loop |
| `npm run policy` | Validate `project-policy.yml` against the schema. Shape, not compliance |
| `npm run inventory` | Prove the standards enumeration extracted from the spec still agrees with the committed inventory |
| `npm run fidelity` | Prove every block a standard claims is verbatim source actually appears in the spec |
| `npm run diagrams` | Prove every `.mmd` appears verbatim as an embedded fence and any committed `.svg` records its source hash |

The CLI itself is `scripts/standards.mjs`, with five subcommands — `init`, `check`, `explain`, `audit`,
`validate` — all accepting `--json`. Exit codes are `0` clean, `1` findings or non-compliance
(including `BLOCKED_BY_INVARIANT`), `2` the tool could not run.

`inventory`, `fidelity`, and `diagrams` are integrity gates rather than checks: they produce no verdict
and only detect drift. All three ran green **before the first standard was written**, which is what
makes them constraints on the normative content rather than a description of it added afterwards.

## Environments

There is one, and it is short-lived. This is a command-line tool, not a service.

| | |
| --- | --- |
| Runtime processes | One per invocation. No state persists between runs |
| Server, database, scheduler, worker | None |
| Network access | None |
| Filesystem writes | Only `standards init`. Every other subcommand is read-only |
| Secrets, credentials, configuration | None. There is nothing to configure outside `project-policy.yml` |
| Local development | `git clone`, then run any npm script. There is nothing to install |
| CI | GitHub Actions, with no install step. `validate` is the gate |

## Architectural rules

Five, in the order in which breaking them does the most damage.

**1. Catalog, policy, and evaluator each own one thing, and none may redefine the others.**

> The **catalog** defines rule identity and metadata.
> **`project-policy.yml`** defines project applicability.
> The **evaluator** produces evidence.

This is why the build order was catalog-before-evaluator: an evaluator built first inevitably grows a
private copy of rule metadata, and then two things define what a rule means. `assertBindings` enforces
the boundary mechanically — a detector reporting a rule id the catalog does not define throws rather
than being quietly accepted.

**2. Skipped is never passed.** A rule nothing examined is `skipped` — neither a pass nor a failure.
Manual-review rules are never established by an automated run, however clean it is. This is the
property everything else protects, and the reason is asymmetric: a false red has a complainant, because
someone whose work is blocked will come and argue. A false green has none, by construction. Nobody
arrives to report that a check quietly passed something it never looked at.

For the same reason, coverage ships *beside* the verdict and never inside it. `frameworkCoverage` sits
outside the status on purpose, so that a coverage improvement can never read as a compliance
improvement.

**3. Zero dependencies.** No third-party package enters this repository, and CI has no install step.
See *Stack* above for why. A change that adds a dependency is a change to what the tool's verdicts are
worth.

**4. `check` and `explain` are deterministic.** Both are pure functions of the catalog, the policy, and
the files on disk. Two runs over unchanged input produce byte-identical output: no model call, no
network, no clock dependence beyond an explicitly passed date. A standards tool whose output varies
between identical runs cannot be audited, and its verdicts cannot be reproduced by a reviewer. This is
also why there is no LLM-driven behaviour anywhere inside the CLI.

**5. Derived copies are checked, never trusted.** `.mmd` is the canonical diagram source and the
Markdown fence is derived; CI compares them. Nothing generated is hand-edited, and the committed
inventory is never regenerated by the parser that reads it — a parser that becomes more forgiving must
not be able to redefine how many standards exist.

Two supporting conventions worth stating: **mentions versus uses** — detectors parse only the canonical
proposal path and only the specific entry grammar, so documents *describing* the system produce no
findings; and **mutation testing** — every check is proved by reintroducing the defect it guards and
confirming the check fails, before the passing case is trusted.

## Artifact locations

```text
README.md                          What the framework is and what it claims.
INSTRUCTIONS.md                    How to adopt and use it from another project.
PROJECT.md                         This file.
VERSION                            The published framework version.
CHANGELOG.md                       What each version changed.
project-policy.yml                 This repository's own policy.
standards/NN-<kebab-title>.md      The fourteen normative documents.
rules/innovation.json              The rule catalog.
schemas/                           JSON Schema for the policy.
scripts/                           The CLI, the evaluation engine, and the integrity gates.
templates/                         What an adopting project copies.
design/                            The concept-map investigation and the CLI design.
docs/                              Architecture reference; .mmd diagram sources are canonical.
test/                              Tests and fixtures.
artifacts/prompt/                  The authored intent, untouched.
artifacts/prompts/                 The numbered source of record.
artifacts/standards-source-inventory.json   The committed, human-reviewed enumeration.
artifacts/adr/                     Five decision records.
artifacts/innovation-proposals/    Real proposals — this repository's own decisions.
```

Standards files are named `NN-<kebab-title>.md` with single digits zero-padded, so a directory listing
sorts in numeric order.

## Current state

**Version 1.0.0.** See [CHANGELOG.md](CHANGELOG.md) for what the release freezes.

All fourteen standards are written and all thirty rules are catalogued across all fourteen of them.
All five commands are operable. Twenty-two rules are machine-evaluated; the remaining eight are
`manual-review` with `none` assurance and are established only by a recorded human attestation.

**Dogfooded verdict: `COMPLIANT`** — 26 passed, 0 failed, 4 not-evaluated, 4 attested, evaluated over
two real proposals: [0001](artifacts/innovation-proposals/0001-innovation-standards-standalone-repo.md),
outcome `build`, and [0002](artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md),
outcome `reject`.

The four not-evaluated rules — `innovation.standards-non-bypass`,
`innovation.no-silent-scope-change`, `innovation.brainstorm-not-roadmap`, and
`innovation.prioritization-discipline` — are left unattested deliberately. This repository has no
portfolio to judge prioritization against, no roadmap presentation to inspect, no external standards
regime to bypass, and no revision history of a release objective to compare. Attesting them would be
assertion rather than evidence, and `not-evaluated` is the honest report.

Read that verdict the way the tool prints it: `COMPLIANT` means everything that was actually evaluated
passed. It does not mean everything was checked, and it does not mean any idea recorded here is a good
one.
