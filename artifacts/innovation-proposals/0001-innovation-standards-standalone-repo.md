# Proposal 0001 — InnovationStandards as a standalone standards repository

- **Proposal type:** new-project
- **Status:** COMPLETE
- **Target:** InnovationStandards

## Problem

- **Statement:** Decisions about what to build are made without a recorded basis. There is no artifact stating what problem an idea solves, what evidence supports it, what it will cost to maintain, or what would make the work stop — so the decision cannot be reviewed at the time, and cannot be revisited later when the assumptions behind it change.
- **Who is affected:** The people who maintain and operate what gets built, who inherit costs decided in a conversation they were not part of; and the reviewers asked to approve proposals with no way to distinguish an evidenced case from a fluent one.
- **Why it matters now:** AI assistance has changed the economics of idea generation. Producing a plausible, well-structured, persuasive proposal is now nearly free, while the evidence that would justify it costs exactly what it always did. The ratio between how convincing a proposal looks and how well supported it is has broken, and nothing in the existing process notices.

## Evidence

- **E1 [observation]** A sibling repository implements 44 engineering standards with a rule catalog, a policy schema, and a compliance evaluator, and none of its rules concern whether work should be undertaken at all — its subject is implementation state (source: design/concept-map.md)
- **E2 [observation]** Six further domain repositories exist as stubs awaiting the same treatment, so the portfolio pattern is one repository per domain rather than one repository with many domains (source: artifacts/adr/0001-vendored-engine-standalone-repo.md)
- **E3 [technical-evidence]** Roughly seventy percent of the reference implementation's script code is content-agnostic and was copied without modification; the parts requiring rewrite were the detectors and two subcommands, which are domain-specific by nature (source: design/concept-map.md)
- **E4 [observation]** The authored requirement is explicit that this repository must be independently maintained and must not depend on any other standards repository (source: artifacts/prompt/original-prompt.md)
- **E5 [assumption]** Teams will write proposals if the format is checkable and the tool tells them what is missing. This is an assumption, not a finding: no adoption has been observed, because nothing has been adopted yet.
- **E6 [assumption]** The costs of a duplicated engine — a defect fixed in the sibling repository is not fixed here — will be lower over the life of the project than the coupling costs of sharing one. Recorded as an assumption because both sides are estimates.
- **E7 [validated-conclusion]** A standalone repository, vendoring the proven engine and rewriting the domain layer, satisfies the independence requirement at a duplication cost that is real and bounded (from: E1, E2, E3, E4)

## Assumptions and uncertainty

- **Assumption:** Proposal authors will record evidence at its honest level rather than at the level that clears a check. The tooling makes the honest path easy and cannot make the dishonest path impossible.
- **Assumption:** Fourteen standards is the right granularity — broad enough to reason about as principles, fine enough that the thirty rules beneath them map cleanly.
- **Unknown:** Whether the manual-review rules will actually be attested in practice, or whether eight rules reporting `not-evaluated` will be quietly accepted as normal. This is the largest open risk to the framework's usefulness and no mechanism prevents it.
- **Unknown:** Whether the proposal artifact's structure is too heavy for small decisions. There is no lightweight variant, and adding one would risk becoming the default.

## Existing capability

- **Searched:** The sibling engineering standards repository and its 44 standards, its 8 rule categories, and its rule catalog; the six other domain stub repositories; and this repository's own prior state.
- **Finding:** The engineering standards repository has the machinery but not the domain: none of its 24 rules asks whether work should be undertaken, and its unit of evaluation is a repository's implementation state rather than a decision about an idea. Its machinery is directly reusable and was reused. The other six repositories are empty stubs with no capability to inherit. Nothing that exists evaluates innovation decisions.

## Alternatives

- **Do nothing:** Continue deciding what to build without recorded justification. The cost is invisible and cumulative — it appears as maintenance burden on features nobody can now explain, and as the absence of any record of the alternatives that were considered when they were built. This is survivable, which is why it has survived.
- **Build:** Author the domain layer here and vendor the content-agnostic engine. Chosen. The engine's hard-won properties are inherited rather than rediscovered, and the domain layer is written from scratch because it must be.
- **Buy:** Not viable. Product-management and idea-management tools exist and manage pipelines of ideas; none of them is a policy-as-code standards system with a rule catalog, a machine-checkable evidence taxonomy, and a compliance verdict, and none can be gated on in CI. Evaluated against the requirement that an AI agent be able to reach a `blocked by invariant` conclusion mechanically — no surveyed product exposes anything comparable.
- **Integrate:** Not viable as the primary route, for the reason recorded in proposal 0002: depending on the sibling repository is precisely the coupling the independence requirement prohibits. Integration was adopted in the weaker sense that the engine's design was reused wholesale.

## Value and alignment

- **User value:** A reviewer can see, in one artifact, what problem an idea solves, what supports that claim and how well, what it will cost, and what would make it stop — and can tell an evidenced proposal from a fluent one without doing the research themselves.
- **Expected impact:** Fewer things built that should not have been, and — more measurably — a written record for the ones that are. Recorded as an expectation resting on E5 and E6, both assumptions.
- **Differentiation:** The system supports concluding "do not build this" as a compliant outcome, and refuses to let unknown count as a pass. Both are unusual: most idea-management tooling is designed to move ideas forward, and measures itself on throughput.
- **Strategic alignment:** Directly serves the portfolio pattern of one standards repository per domain, and is the reference implementation for the six remaining stubs.

## Costs

- **Implementation:** The machinery port was roughly a day. The fourteen normative documents are the substantial work and are irreducible — that cost is the thinking, not the typing.
- **Maintenance:** Fourteen standards and thirty rules must stay consistent with each other, with the detectors, and with the tests. Every rule added is a `MAJOR` or `MINOR` release decision. The vendored engine is now this repository's own code: a defect fixed in the sibling repository is not fixed here, no mechanism will report that, and finding out requires somebody to look.
- **Operational:** Near zero. There is no service, no database, no scheduled job, and no network access — a short-lived CLI process invoked by a developer, an agent, or a CI step, with no dependencies to patch.
- **Opportunity cost:** The engineering standards repository has an untracked prompt for a second body of work that this effort did not advance, and the six sibling domain stubs remain empty. This work also consumed the review attention that could have gone to adopting the existing standards somewhere rather than authoring more of them.
- **Technical debt:** The vendored engine is duplicated code by construction, and duplication is debt whatever its justification. Additionally, `standards check` and `standards audit` currently walk the whole repository to evaluate one proposal, which is wasteful and will need addressing if a repository ever holds hundreds.

## Security and privacy

- **Implications:** Proposals are Markdown in version control and may contain commercially sensitive strategy, competitor analysis, and unreleased plans — but no personal data, no credentials, and no customer records by design. The tool reads local files, makes no network calls, writes only through `standards init`, and has no third-party dependencies, so it has no supply chain to compromise.
- **Applicable standards:** The repository's own fourteen standards apply to it and are enforced against it in CI. The prohibition on secrets in artifacts applies to proposal documents as it does to any tracked file: evidence citations reference paths and identifiers, never credentials.

## Scope and MVP

- **Release objective:** A standalone repository that can evaluate an innovation proposal, produce an auditable verdict including a stop condition, and be gated on in CI.
- **MVP:** Fourteen standards, a rule catalog, a proposal format, detectors for the mechanically checkable rules, the five commands, a dogfooded policy, and a test suite that proves both a `build` and a `reject` proposal are compliant.
- **Out of scope:** Cross-repository portfolio scanning; any language model inside the CLI; publishing the engine as a package; implementing the other six domain repositories; a web interface; and any integration with an issue tracker.

## Success criteria

- **Criterion:** All seven release commands exit 0 — inventory, fidelity, policy, diagrams, test, audit, validate — with the repository's own policy applied to its own proposals.
- **Criterion:** A fixture proposal concluding `reject` produces no failures, and a fixture that fabricates evidence produces `BLOCKED_BY_INVARIANT`. Both are asserted by tests, so a regression that biased the framework toward building would break the build.
- **Criterion:** Every one of the twenty-seven required areas and every prohibition in the source is owned by exactly one standard, traceable in the standards themselves.

## Kill criteria

- **Criterion:** If the mechanically checkable rules cannot be made to establish anything beyond section presence — that is, if the tool's honest assurance across the board is `none` — the framework is documentation with a build step, and the CLI should be abandoned in favour of a written checklist. Observer: the assurance breakdown printed by `standards validate`; trigger: zero rules at `partial` or better.
- **Criterion:** If proposals in practice are written to satisfy the checker rather than to record a decision — detectable as proposals that pass cleanly while their reviewers report learning nothing from them — the format is producing compliance theatre and must be redesigned or withdrawn. Observer: the reviewers; trigger: the first review cycle where this is reported.

## Experiment plan

- **Question:** Can the engine's compliance semantics survive a change of domain without weakening, or does innovation evaluation need a different evaluator?
- **Method:** Port the engine unchanged, write the domain layer against it, and record every place the semantics had to change.
- **Supports proceeding:** The engine transfers with additions only — no existing guarantee removed or relaxed.
- **Does not support proceeding:** Any existing guarantee has to be weakened to make innovation evaluation work, which would indicate the evaluator is the wrong shape for this domain.
- **Result:** One addition was required — a fifth status, `BLOCKED_BY_INVARIANT` — and it strictly strengthens, since it can only replace what would otherwise have been `NON_COMPLIANT`. One genuine hole was found and closed during implementation: a policy could downgrade an invariant rule to `optional` and convert its failure into a warning. Nothing was weakened. This supports proceeding.

## Portfolio

- **Overlap:** Overlaps the engineering standards repository in machinery and in nothing else. The two evaluate different subjects — implementation state versus the reasoning behind a proposed decision — and a project may adopt either, both, or neither.
- **Cannibalization:** None. This does not replace or reduce the value of the engineering standards repository; a project running both gets two verdicts about two different things.
- **Priority:** First of the seven domain repositories, because it is the reference implementation the remaining six will follow and because its subject — deciding what to build — governs whether the others should be built at all.

## New project justification

- **Existing project ownership:** The engineering standards repository could host these rules as a fifteenth category, and should not. Its subject is implementation practice; innovation decisions precede implementation and are made by different people at a different time. More decisively, the authored requirement is that this domain be independently maintained and depend on no other standards repository — a project adopting innovation standards must not thereby acquire 44 engineering standards it did not ask for.
- **Duplicated infrastructure:** Real and accepted. The catalog loader, compliance evaluator, policy checker, YAML and JSON Schema parsers, and the inventory, fidelity, and diagram gates are copied — roughly 1,500 lines that now exist twice. There is no mechanism that will propagate a fix from one to the other.
- **Duplicated domain logic:** Minimal. The compliance semantics are shared by copy, but the rules, standards, detectors, proposal format, evidence taxonomy, and decision model are wholly distinct and have no counterpart in the sibling repository.
- **Maintenance cost:** A second repository to version, release, document, and keep internally consistent, plus the vendored engine as described in Costs. Paid indefinitely.
- **Deployment cost:** Low relative to the others. There is nothing to deploy: no service, no package published, no infrastructure. The cost is a second CI configuration and a second release process.
- **Support burden:** A second place for adopters to ask questions, and the standing risk that someone gates CI on the wrong repository's `validate`. Mitigated only by documentation, which is a weak control.
- **Fragmented user experience:** Genuine. A project adopting both repositories has two `project-policy.yml` conventions, two rule catalogs, two `standards` commands with the same name, and two verdicts to reconcile. This is the strongest argument against separation and it is not fully answered — it is accepted, because the independence requirement is a hard constraint and because most adopters will want one domain rather than both.
- **Portfolio complexity:** Adds one of an intended seven domain repositories. The pattern's cost is that understanding the whole portfolio means understanding seven repositories with near-identical machinery; its benefit is that each can be adopted, versioned, and abandoned independently.

## Decision

- **Outcome:** build
- **Rationale:** The problem is evidenced, the independence requirement is a hard constraint that rules out the two alternatives that would have avoided duplication, and the duplication cost is real, bounded, and recorded rather than argued away. The fragmented-experience cost is the weakest part of this case and is accepted rather than answered.
- **Decided:** 2026-08-09
