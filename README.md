# InnovationStandards

> **This repository evaluates the quality and integrity of the decision process, not whether the idea
> eventually succeeds.**

A `COMPLIANT` verdict means the reasoning met the bar the standards set. It never means the idea is
good, and it never means the idea will work. A framework that claimed the stronger thing would be
forecasting, and forecasting dressed as compliance is the most dangerous output this system could
produce.

The corollaries are worth stating plainly, because everything downstream depends on them:

- A `build` that later succeeded commercially may have violated these standards badly. It was decided
  without evidence and happened to be right.
- A `reject` can be flawless. Deciding not to build something, for stated reasons, against recorded
  evidence, is the process working.
- A prototype that failed is not a failure of the decision to prototype. The decision was to buy
  information, and the information arrived.
- An experiment that invalidated an idea is a successful innovation process, not a wasted quarter.

## The loop

The centre above says what a verdict means. This says how the framework is meant to be fed:

> **Use generates evidence. Evidence generates proposals. Proposals generate decisions.
> Decisions — not ideas — generate implementation.**

Each arrow is a gate, and the last one is the one most systems skip. Use does not generate features;
it generates *evidence*, and evidence has to survive a decision before anything gets built. Evidence
arriving from real use can just as legitimately change an existing proposal, fire a `RevisitWhen`,
satisfy a kill criterion, or establish that nothing needs to change at all — three of those four
outcomes produce no implementation, and all four are the framework working.

Read backwards it is a prohibition: an implementation with no decision behind it, a decision with no
proposal behind it, or a proposal with no evidence behind it has skipped a gate, and the standards
that guard each one are [1](standards/01-problem-before-solution.md),
[2](standards/02-evidence-taxonomy-and-integrity.md), and
[10](standards/10-innovation-decision-model.md).

## Innovation is not automatically valuable

That is the core principle, and it is the reason this repository exists in the shape it does. Novelty
is not evidence of value. Technical interest is not evidence of value. That a model considered a
proposal good is not evidence of value — it is one of the things this repository explicitly prohibits
relying on ([Standard 2](standards/02-evidence-taxonomy-and-integrity.md)).

The system therefore supports the conclusion **Do not build this** as a *compliant* outcome. Six of the
eight decision outcomes are not "build it", and a fully evidenced `reject` is evaluated exactly as a
fully evidenced `build`. Nothing here can force a positive recommendation; three of the five
conclusions an agent can reach are refusals.

## Adopting these standards

Start with [INSTRUCTIONS.md](INSTRUCTIONS.md) — the operator-facing guide for a human or an AI agent
consuming this repository from another project. It covers declaring a version, adding and validating
`project-policy.yml`, writing and checking a proposal, classifying a rule as failing, not-applicable, or
excepted, attesting a manual-review rule, bootstrapping with `standards init`, upgrading, and what not
to do. It also states the tooling's current limitations, which matter more than the rules when you are
starting out.

## The fourteen standards

Each standard is a normative document stating what a compliant innovation decision must contain. The
"Rules" column lists the catalogued rules that standard defines; "Enforcement" says whether those rules
are checked mechanically, by recorded human review, or both.

| # | Standard | Rules it contributes | Enforcement |
| --- | --- | --- | --- |
| 1 | [Problem Before Solution](standards/01-problem-before-solution.md) | `problem-statement`, `no-problem-no-build` | Automated |
| 2 | [Evidence Taxonomy and Integrity](standards/02-evidence-taxonomy-and-integrity.md) | `evidence-labels`, `evidence-citations`, `no-silent-upgrade`, `no-fabricated-evidence`, `assumptions-declared`, `novelty-not-value` | Mixed |
| 3 | [Existing Capability and Alternatives](standards/03-existing-capability-and-alternatives.md) | `existing-capability-analysis`, `alternatives-considered` | Automated |
| 4 | [Value and Strategic Alignment](standards/04-value-and-strategic-alignment.md) | `value-articulation` | Automated |
| 5 | [Cost Accounting](standards/05-cost-accounting.md) | `cost-accounting`, `no-hidden-costs` | Mixed |
| 6 | [Security, Privacy, and Standards Non-Bypass](standards/06-security-privacy-and-standards-non-bypass.md) | `security-privacy-review`, `standards-non-bypass` | Mixed |
| 7 | [Scope and MVP Discipline](standards/07-scope-and-mvp-discipline.md) | `scope-baseline`, `mvp-definition`, `no-silent-scope-change` | Mixed |
| 8 | [Success and Kill Criteria](standards/08-success-and-kill-criteria.md) | `success-criteria`, `kill-criteria`, `no-sunk-cost-continuation` | Mixed |
| 9 | [Experiment Before Build](standards/09-experiment-before-build.md) | `experiment-before-build` | Automated |
| 10 | [Innovation Decision Model](standards/10-innovation-decision-model.md) | `decision-recorded`, `revisit-conditions`, `brainstorm-not-roadmap` | Mixed |
| 11 | [Portfolio Coherence and Prioritization](standards/11-portfolio-coherence-and-prioritization.md) | `portfolio-overlap`, `prioritization-discipline` | Mixed |
| 12 | [New-Project Justification](standards/12-new-project-justification.md) | `new-project-justification` | Automated |
| 13 | [Innovation Proposal Artifact](standards/13-innovation-proposal-artifact.md) | `proposal-artifact` | Automated |
| 14 | [Standards Integrity](standards/14-standards-integrity.md) | `integrity-invariant` | Automated |

Rule ids are shown without their `innovation.` prefix for width; the canonical id of every rule is
`innovation.<name>`, and that is the only spelling a policy, an exception, or a finding may use. The
catalog is [rules/innovation.json](rules/innovation.json); the canonical enumeration of the series is
[artifacts/standards-source-inventory.json](artifacts/standards-source-inventory.json), reviewed once
against [artifacts/prompts/innovation-standards-spec.md](artifacts/prompts/innovation-standards-spec.md)
and committed rather than re-derived on each run.

Thirty rules in total, all in category `innovation`. Eleven are prohibitions at `level: forbidden`.
Exactly one is `recommended` — `innovation.experiment-before-build` — because whether an experiment
should precede a build depends on how expensive the build is and how uncertain the evidence, and that
is a judgement the tooling cannot make. Everything else is `required` or `forbidden`, deliberately:
innovation discipline degrades fastest through soft norms, and a standards system full of
recommendations records preferences rather than governing anything.

## The decision model

A decided proposal records exactly one outcome from a closed set of eight. **No outcome is
privileged.** See [Standard 10](standards/10-innovation-decision-model.md) and
[artifacts/adr/0002-eight-outcome-decision-model.md](artifacts/adr/0002-eight-outcome-decision-model.md).

| Outcome | Means |
| --- | --- |
| `explore` | The problem is not yet understood well enough to decide. Go and look |
| `validate` | The problem is understood; the proposed answer is not yet supported. Go and test it |
| `prototype` | Build something disposable to resolve a decisive uncertainty |
| `build` | Commit to delivering it |
| `defer` | Not now. Requires a `RevisitWhen` condition |
| `reject` | Do not build this. A complete, compliant, successful outcome |
| `merge-with-existing` | Something in the portfolio already addresses this; fold the work into it |
| `insufficient-evidence` | The decision cannot honestly be made yet. Requires a `RevisitWhen` condition |

`defer` and `insufficient-evidence` require a revisit condition because a suspension with no trigger is
indistinguishable from something forgotten — an abandonment that reads like a plan.

## The evidence taxonomy

Every claim recorded in a proposal carries exactly one level from a closed set of eight, parsed as a
token rather than read as a word in a sentence. See
[Standard 2](standards/02-evidence-taxonomy-and-integrity.md).

| Level | What it asserts |
| --- | --- |
| `observation` | Something directly seen, with a place the reader can see it too |
| `assumption` | Something taken as true without support, and named as such |
| `hypothesis` | Something that would be tested, and has not been |
| `user-evidence` | Something a user or customer actually said or did |
| `market-evidence` | Something established about the market outside this organisation |
| `technical-evidence` | Something established about feasibility, performance, or cost by technical means |
| `experiment-result` | The outcome of an experiment that was actually run |
| `validated-conclusion` | A conclusion drawn from cited supporting entries that are not themselves only assumptions or hypotheses |

Recording an honest `assumption` is always better than an unsupported `user-evidence`. Raising a level
to clear a check is the violation `innovation.no-silent-upgrade` exists to catch, and it is
invariant-class.

## The three epistemic axes

The subtlest thing in the system and the one most easily destroyed by a well-meant simplification.
Three vocabularies grade three different things. **They compose; they never merge.**

| Axis | Vocabulary | Grades | Lives in |
| --- | --- | --- | --- |
| Evidence level | `observation`, `assumption`, `hypothesis`, `user-evidence`, `market-evidence`, `technical-evidence`, `experiment-result`, `validated-conclusion` | how well a claim *in a proposal* is supported | proposal artifacts |
| Finding label | `OBSERVED`, `INFERRED`, `CONFIRMED_BY_OWNER`, `UNKNOWN` | how the *auditor* knows what it reports | detector findings |
| Assurance | `full`, `partial`, `none` | how much of a *rule* a mechanical check establishes | the rule catalog |

A single detector output exercises all three: an `OBSERVED` finding (axis 2) that an entry labelled
`validated-conclusion` (axis 1) cites nothing, under a rule whose assurance is `partial` (axis 3)
because citation presence is checkable and citation validity is not. Merging any two of them produces a
system that cannot say what it does not know. The reasoning is in
[artifacts/adr/0003-evidence-taxonomy-is-a-distinct-axis.md](artifacts/adr/0003-evidence-taxonomy-is-a-distinct-axis.md).

## Invariant-class rules and `BLOCKED_BY_INVARIANT`

A rule that is both `level: forbidden` and `nonExemptible: true` is **invariant-class**. No new catalog
field was introduced to mark them: the two existing fields already carry the whole meaning — forbidden
says the behaviour must never occur, non-exemptible says no waiver can permit it — and a third field
would create a state in which the three can disagree
([artifacts/adr/0005-invariant-class-and-blocked-verdict.md](artifacts/adr/0005-invariant-class-and-blocked-verdict.md)).

Seven of the eleven prohibitions qualify:

| Rule | Standard | The behaviour it forbids |
| --- | --- | --- |
| `innovation.no-problem-no-build` | [1](standards/01-problem-before-solution.md) | Recommending build or prototype with no identified problem |
| `innovation.no-silent-upgrade` | [2](standards/02-evidence-taxonomy-and-integrity.md) | Presenting a claim at a stronger evidence level than its support carries |
| `innovation.no-fabricated-evidence` | [2](standards/02-evidence-taxonomy-and-integrity.md) | Inventing user quotes, market sizes, or metrics |
| `innovation.no-hidden-costs` | [5](standards/05-cost-accounting.md) | Omitting a known cost because it weakens the case |
| `innovation.standards-non-bypass` | [6](standards/06-security-privacy-and-standards-non-bypass.md) | Claiming an exemption from an applicable standard on grounds of novelty |
| `innovation.no-sunk-cost-continuation` | [8](standards/08-success-and-kill-criteria.md) | Continuing because of effort already spent |
| `innovation.integrity-invariant` | [14](standards/14-standards-integrity.md) | Weakening the standards system to permit a desired conclusion |

Their failure produces the verdict `BLOCKED_BY_INVARIANT`, which ranks above `NON_COMPLIANT` and can
only ever replace a verdict that would otherwise have been `NON_COMPLIANT` — never one that would have
passed.

**The stop condition.** `NON_COMPLIANT` means *there is work to do*. `BLOCKED_BY_INVARIANT` means
*stop; do not route around this*. An exception filed against an invariant-class rule is rejected rather
than honoured, and the rejection is itself a failure — a prohibition a project can switch off is not a
prohibition. An agent that reaches this verdict reports it and stops. It does not edit the rule, the
detector, the test, the policy, or the standard to clear it, because that edit is precisely what
[Standard 14](standards/14-standards-integrity.md) prohibits.

## Compliance statuses

Computed by the evaluator from rules — **never from the score.** There is no percentage at which
compliance is granted or withdrawn.

| Status | Meaning |
| --- | --- |
| `COMPLIANT` | Everything that was evaluated passed |
| `COMPLIANT_WITH_EXCEPTIONS` | As above, with approved, unexpired waivers recorded |
| `NON_COMPLIANT` | A required or forbidden rule failed. There is work to do |
| `NOT_EVALUATED` | No policy, so no verdict is possible |
| `BLOCKED_BY_INVARIANT` | An invariant-class rule failed. Stop; do not route around |

## Commands

| Command | Job |
| --- | --- |
| `standards init [--dry-run] [--force-overwrite=<path>] [--mode=<mode>]` | Bootstrap a project: proposal directory, seeded proposal template, policy, and agent instruction files. Creates what is missing; never overwrites without a per-path opt-in |
| `standards check <proposal>` / `--all` | Evaluate one proposal (or every proposal) and report its conclusion. This is the drafting loop |
| `standards explain <rule-id>` / `<proposal>` | Read-only. Why a rule applies, what satisfies it, its remediation, and the requirement that defines it |
| `standards audit [path] [--strict]` | Evidence discovery. Reports what exists; produces no verdict |
| `standards validate [path]` | The authoritative, policy-aware verdict, including `BLOCKED_BY_INVARIANT`. **This is the command CI gates on** |

All five accept `--json`; `audit`, `validate`, and `check` accept `--dir=<path>`. Exit codes are `0`
clean, `1` findings or non-compliance (including `BLOCKED_BY_INVARIANT`), `2` the tool could not run —
a bad invocation, an unreadable or schema-invalid policy, an unloadable catalog. A blocked verdict
exits `1` rather than a distinct third code, because CI consumers already treat `1` as "fail the build"
and inventing a code they do not handle would make the strongest failure the easiest to miss.

`check` and `explain` are deterministic: pure functions of the catalog, the policy, and the files on
disk. Two runs over unchanged input produce byte-identical output. No model call, no network, no clock
dependence beyond an explicitly passed date. A standards tool whose output varies between identical
runs cannot be audited, and its verdicts cannot be reproduced by a reviewer.

The npm scripts that exist: `test`, `audit`, `validate`, `check`, `inventory`, `fidelity`, `policy`,
`diagrams`, and `audit:strict`.

## Coverage honesty

This section is not a disclaimer. It is the part of the framework that makes the rest of it worth
reading, and it belongs beside the verdict rather than in a footnote.

Thirty rules are catalogued. **Twenty-two are machine-evaluated, and most of those carry `partial`
assurance** — they establish that a section and its fields are present and non-empty, not that what
they say is adequate, honest, or right. A problem statement reading "users are frustrated" satisfies
`innovation.problem-statement`. **Eight rules have no automated check at all**; they are `manual-review`
with `none` assurance, and the only thing that establishes them is a recorded human attestation.

Three consequences follow, and the tool prints all three on every run:

1. **`COMPLIANT` means "everything that was actually evaluated passed".** It never means "everything was
   checked". A rule nothing examined is `skipped` — neither a pass nor a failure — and manual-review
   rules are never established by an automated run, however clean it is.
2. **Framework coverage ships beside the verdict and is never folded into it.** How much of the
   framework has been turned into machine-represented rules is a statement about the maturity of the
   tooling. How compliant a project is, is a statement about the project. The two never combine into one
   number, because a coverage improvement that read as a compliance improvement would be a lie the
   system told itself.
3. **A false green has no complainant.** A false red does: someone whose work is blocked will come and
   argue. Nobody arrives to report that a check quietly passed something it never looked at. That
   asymmetry is why "skipped is never passed" is the property everything else in this repository
   protects — and in this domain the stakes are specific, because an agent that can reach `compliant` by
   having nothing examined can manufacture approval for any idea.

The full list of known gaps — content adequacy, fabrication detection, evidence-label judgement, the
limits of the integrity invariant, and the absence of portfolio scanning — is in
[INSTRUCTIONS.md](INSTRUCTIONS.md) and in [docs/architecture.md](docs/architecture.md).

## Repository layout

```text
README.md            This file — what the framework is and what it claims.
INSTRUCTIONS.md      How to adopt and use it from another project. Start here.
PROJECT.md           This repository's own manifest.
VERSION              The published framework version.
CHANGELOG.md         What each version changed, and what 1.0.0 freezes.
project-policy.yml   This repository's own policy — the dogfooded instance.
standards/           Fourteen normative documents, 01-*.md through 14-*.md.
rules/               The rule catalog. The source of machine truth for rule identity.
schemas/             JSON Schema for project-policy.yml.
scripts/             The CLI, the evaluation engine, and the integrity gates.
templates/           What an adopting project copies.
design/              The concept-map investigation and the CLI design.
docs/                Architecture reference, local CI guide, canonical Mermaid sources.
test/                Tests and fixtures.
ci/                  The CI pipeline definition and its container image.
compose.ci.yml       The ephemeral Docker environment CI runs in.
artifacts/
  prompt/            The authored intent, untouched.
  prompts/           The numbered source of record the standards were written from.
  adr/               Six decision records.
  innovation-proposals/  Real proposals, evaluated by this repository against itself.
```

## Design and decisions

- [design/concept-map.md](design/concept-map.md) — what this framework adopts, adapts, and rejects
  from the reference model, with the reasoning for each verdict.
- [design/cli-design.md](design/cli-design.md) — the command surface, the exit-code contract, and two
  candidate commands that were rejected with reasons.
- [docs/architecture.md](docs/architecture.md) — the architecture reference: separation of powers,
  data flow, integrity gates, and honest limits.
- [artifacts/adr/0001-vendored-engine-standalone-repo.md](artifacts/adr/0001-vendored-engine-standalone-repo.md)
  — why the engine was copied rather than depended on.
- [artifacts/adr/0002-eight-outcome-decision-model.md](artifacts/adr/0002-eight-outcome-decision-model.md)
  — why eight outcomes, and why none is privileged.
- [artifacts/adr/0003-evidence-taxonomy-is-a-distinct-axis.md](artifacts/adr/0003-evidence-taxonomy-is-a-distinct-axis.md)
  — why evidence level, finding label, and assurance stay separate.
- [artifacts/adr/0004-proposal-artifact-is-the-audit-surface.md](artifacts/adr/0004-proposal-artifact-is-the-audit-surface.md)
  — why the unit of evaluation is a proposal, not a repository.
- [artifacts/adr/0005-invariant-class-and-blocked-verdict.md](artifacts/adr/0005-invariant-class-and-blocked-verdict.md)
  — invariant-class rules and the fifth status.
- [artifacts/adr/0006-local-docker-ci-is-the-authoritative-pipeline.md](artifacts/adr/0006-local-docker-ci-is-the-authoritative-pipeline.md)
  — why CI is defined once and run in Docker before a push, not in workflow YAML after one.

## Verifying a change

The pipeline is defined once, in [ci/pipeline.mjs](ci/pipeline.mjs), and runs in a disposable Docker
environment. GitHub Actions runs the same script rather than a second copy of it.

```bash
./scripts/ci.sh          # run the seven checks in Docker
./scripts/submit-pr.sh   # verify, then push and open a PR for exactly the commit that passed
```

The rule `submit-pr` enforces: **the commit pushed for a PR is exactly the commit that passed the
complete local Docker CI pipeline.** A dirty tree, a failed check, or a `HEAD` that moved during the
run all stop it, and nothing is pushed. See [docs/local-ci.md](docs/local-ci.md).

## Dogfooding

This repository is evaluated by its own tooling against its own
[project-policy.yml](project-policy.yml), over two real proposals:

- [artifacts/innovation-proposals/0001-innovation-standards-standalone-repo.md](artifacts/innovation-proposals/0001-innovation-standards-standalone-repo.md)
  — outcome `build`.
- [artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md](artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md)
  — outcome `reject`. The alternative that would have avoided a duplicated engine, evaluated properly
  and turned down.

Current verdict: **`COMPLIANT`** — 26 passed, 0 failed, 4 not-evaluated, 4 attested. The four
not-evaluated rules are unattested on purpose. This repository has no portfolio to judge prioritization
against, no roadmap presentation to inspect, no external standards regime to bypass, and no revision
history of a release objective to compare. Attesting them would be assertion rather than evidence, and
`not-evaluated` is the honest report.

**Version 1.0.0** — see [CHANGELOG.md](CHANGELOG.md). Node ≥ 18, zero third-party dependencies, and CI
has no install step. That constraint is structural rather than aspirational: a supply-chain compromise
in a tool that certifies compliance is a compromise of every certification it has issued.
