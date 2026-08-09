# Proposal 0002 — Publish the compliance engine as a shared package

- **Proposal type:** architectural-change
- **Status:** COMPLETE
- **Target:** InnovationStandards

## Problem

- **Statement:** The compliance engine exists twice. Roughly 1,500 lines — the catalog loader, the evaluator, the policy checker, the YAML and JSON Schema parsers, and the integrity gates — were copied from the engineering standards repository into this one, and a defect fixed in one is not fixed in the other. Nothing reports the divergence; discovering it requires somebody to go and look.
- **Who is affected:** Whoever maintains any of the seven intended domain standards repositories, each of which would carry its own copy — so a single engine defect would need finding and fixing seven times.
- **Why it matters now:** This repository is the first of the seven. The duplication is currently twofold and cheap to undo; once the remaining six exist it is sevenfold and the cost of consolidating rises with each one.

## Evidence

- **E1 [observation]** The engine was copied verbatim into this repository, and both copies are now maintained independently with no synchronisation mechanism (source: artifacts/adr/0001-vendored-engine-standalone-repo.md)
- **E2 [observation]** This repository's CI has no install step, and the absence is deliberate and documented rather than incidental (source: .github/workflows/ci.yml)
- **E3 [technical-evidence]** Adopting a package dependency requires an install step in CI, which introduces a package registry, a lockfile, and a supply chain into a tool whose output is a compliance certification. A compromise of that chain is a compromise of every verdict the tool has issued (source: design/concept-map.md)
- **E4 [observation]** The authored requirement states the repository must be independently maintained and must not depend on any other standards repository (source: artifacts/prompt/original-prompt.md)
- **E5 [assumption]** Engine defects will be rare. The engine is small, has no I/O beyond reading files, and arrived with a test suite; but it has not been running long enough anywhere for a defect rate to be observed.
- **E6 [assumption]** Divergence between the copies will mostly be intentional — this repository has already added a fifth compliance status the sibling does not have — rather than accidental drift. If that holds, a shared package would have needed a configuration seam at exactly the point the domains differ.
- **E7 [validated-conclusion]** A shared package would violate the independence requirement directly and the zero-dependency constraint structurally, and would do so to buy a benefit whose size rests on an unobserved defect rate (from: E1, E2, E3, E4)

## Assumptions and uncertainty

- **Assumption:** Seven repositories will actually be built. If only two ever exist, the duplication cost is small and this proposal's problem is correspondingly smaller.
- **Assumption:** A shared package would have needed to be configurable at the points where domains genuinely differ, and that configurability would itself have been a maintenance cost — plausibly a larger one than the duplication it removed.
- **Unknown:** The real engine defect rate. E5 records this as an assumption because there is no operational history to draw on, and the whole case for consolidation depends on it.
- **Unknown:** Whether an internal package registry is even available in the environments where these repositories are used. This was not investigated, and it would need to be before any future reconsideration.

## Existing capability

- **Searched:** The current vendoring arrangement in this repository; the sibling engineering standards repository's package manifest and CI configuration; and the zero-dependency constraint as documented in both.
- **Finding:** The capability already exists in the only form the constraints permit — the engine is present and working here, by copy. What does not exist is a synchronisation mechanism, and that is the actual gap. Nothing was found that provides one without introducing a dependency.

## Alternatives

- **Do nothing:** Keep the copies independent. The cost is that engine defects must be fixed in each repository separately and nothing reports the divergence. This is the status quo and it is survivable, because the engine is small, stable, and covered by a transplanted test suite that runs in each repository.
- **Build:** Extract the engine into a published package and depend on it from each domain repository. Rejected — see the decision below.
- **Buy:** Not viable. No third-party package implements this compliance model; that is why the engine was written rather than installed in the first place.
- **Integrate:** Not viable. A git submodule is a dependency with worse ergonomics than a package — it pins a commit, needs a second clone step, and hands an adopter a repository they did not ask for. A monorepo containing all seven domains was also considered and would resolve the duplication cleanly, but it merges seven independently-adoptable repositories into one, which is a larger violation of the independence requirement than the package it replaces.

## Value and alignment

- **User value:** None directly. No adopter of these standards experiences the duplication; the benefit would accrue entirely to the maintainers of the domain repositories, and consists of not fixing the same defect more than once.
- **Expected impact:** Removes an estimated six future copies of the engine. The magnitude depends entirely on the engine defect rate, which is unknown (E5), so the impact estimate is a hypothesis rather than a projection.
- **Differentiation:** None. This is an internal packaging decision with no external visibility.
- **Strategic alignment:** Negative. The stated direction is independently maintained per-domain repositories with no cross-dependencies, and this proposal is a cross-dependency by construction.

## Costs

- **Implementation:** Moderate — extract the engine, define its public interface, set up publishing, and update this repository plus the sibling to consume it.
- **Maintenance:** An eighth thing to version and release, with its own compatibility surface. Every domain repository's release would become gated on the package's, and a breaking engine change would need coordinating across seven consumers.
- **Operational:** A package registry becomes infrastructure this system depends on. If it is unavailable, CI cannot run — for a tool whose whole purpose is to be gated on in CI.
- **Opportunity cost:** The work would come out of authoring the remaining domain standards, which is where the actual value of this portfolio is.
- **Technical debt:** Would remove the duplication debt and add a coupling debt. Coupling is the harder of the two to reverse: un-duplicating is a merge, while un-coupling means re-vendoring into every consumer under whatever deadline forced the decision.

## Security and privacy

- **Implications:** Introduces a supply chain where none exists. The tool issues compliance certifications, so a compromised dependency does not merely misbehave — it invalidates every verdict already issued, retroactively and invisibly.
- **Applicable standards:** The zero-dependency constraint recorded in ADR 0001, and the prohibition on bypassing applicable standards for the sake of an appealing idea. That prohibition is why this proposal was written and evaluated rather than quietly abandoned.

## Scope and MVP

- **Release objective:** Eliminate duplicated engine code across the domain standards repositories.
- **MVP:** The engine published as a package, consumed by this repository and the engineering standards repository, with both test suites passing.
- **Out of scope:** A monorepo restructure; changing the compliance model itself; any change to the domain layers.

## Success criteria

- **Criterion:** An engine defect fixed once is fixed in every consuming repository without any per-repository edit, observable by a version bump propagating.
- **Criterion:** No consuming repository's CI acquires an install step — a criterion this proposal cannot satisfy, which is itself the finding.

## Kill criteria

- **Criterion:** If the zero-dependency constraint remains in force, this proposal cannot proceed, because its MVP requires an install step in a pipeline that must not have one. Observer: the CI configuration; trigger: immediately, and it fired.
- **Criterion:** If the independence requirement remains in force, a cross-repository dependency is prohibited regardless of its engineering merit. Observer: the authored requirement; trigger: immediately, and it fired.

## Experiment plan

- **Question:** How large is the duplication cost in practice — how often does an engine defect require the same fix twice?
- **Method:** Observe the two existing copies over the period in which the remaining domain repositories are authored, and record every engine change and whether it needed applying to both.
- **Supports proceeding:** Engine defects recur often enough that per-repository fixing becomes a measurable burden, and the constraints have changed.
- **Does not support proceeding:** Engine changes are rare, or are domain-specific divergences that a shared package would have had to be configured around anyway — which is the pattern E6 predicts and the one already observed once, in the fifth compliance status this repository added and the sibling does not have.

## Portfolio

- **Overlap:** Directly overlaps the vendoring decision recorded in ADR 0001; this proposal is that decision's rejected alternative, evaluated properly rather than dismissed in a sentence.
- **Cannibalization:** Would replace the vendoring arrangement entirely. That is the intent rather than a side effect, and it is why the two cannot both be adopted.
- **Priority:** Low, and below every remaining domain repository. The duplication is a maintenance cost paid by maintainers; the missing domain standards are the reason the portfolio exists.

## Decision

- **Outcome:** reject
- **Rationale:** Two independent constraints each rule it out on their own. The authored requirement prohibits depending on another standards repository, and a shared engine package is that dependency however it is packaged. The zero-dependency constraint is structural — CI has no install step, deliberately, because a supply-chain compromise in a tool that certifies compliance retroactively invalidates every certification it has issued. Against those, the benefit rests on an engine defect rate nobody has observed, and the one divergence that has actually occurred is an intentional domain difference a shared package would have had to be configured around rather than a defect it would have prevented. The duplication cost is real and is recorded in proposal 0001's cost section rather than argued away; this is a decision to pay it knowingly. Recorded as `reject` rather than `defer` because the constraints are not expected to change, and a deferral with no plausible revisit trigger would be an abandonment dressed as a plan.
- **Decided:** 2026-08-09
