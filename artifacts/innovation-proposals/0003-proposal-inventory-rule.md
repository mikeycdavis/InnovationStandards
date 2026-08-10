# Proposal 0003 — A repository-level proposal-inventory rule

- **Proposal type:** feature
- **Status:** COMPLETE
- **Target:** InnovationStandards

## Problem

- **Statement:** A repository with no proposals and a repository whose decisions are all recorded produce the same silence from this tooling. `standards audit` emits one informational finding and `standards validate` returns `COMPLIANT`, so a project that has adopted the standards and then never used them is indistinguishable from one with genuinely nothing under governance.
- **Who is affected:** A reviewer or an approver reading a `COMPLIANT` verdict for a project whose decisions are actually being made in tickets and chat threads, and who has no signal that the framework is being bypassed rather than satisfied.
- **Why it matters now:** 1.0.0 is the first release anyone can adopt. The failure mode is specific to adoption — it cannot occur before there are adopters, and every adopter reaches this state on their first day, when the repository has a policy and no proposals yet.

## Evidence

- **E1 [observation]** The detector emits an informational finding when no proposals are found and no rule binds to it, so it can never affect a verdict (source: scripts/standards.mjs)
- **E2 [observation]** A fixture directory containing documentation and no proposals produces zero rule findings, which is the intended mentions-versus-uses behaviour and also the blind spot described here (source: test/fixtures/mentions-only/docs/innovation-guide.md)
- **E3 [observation]** The limitation was identified during implementation and published rather than left to be discovered (source: INSTRUCTIONS.md)
- **E4 [technical-evidence]** The proposal walk already collects the canonical directory and knows whether it is absent, empty, or populated, so the signal a rule would need is present and requires no new traversal (source: scripts/standards.mjs)
- **E5 [assumption]** Adopters will reach this state and it will matter to them. No adoption has occurred, so nothing observed supports this yet.
- **E6 [assumption]** A repository-level rule is the right shape for the answer, rather than a report line, a distinct exit code, or a `standards check --all` warning. Each of the four would surface the same fact differently and none has been compared against the others.
- **E7 [hypothesis]** The rule would need a declared-applicability escape for repositories that genuinely govern no innovation decisions, or it becomes a rule most adopters immediately declare not-applicable — which would train them to reach for that mechanism casually, and the applicability escape is precisely the one that must not become routine.
- **E8 [observation]** The state this proposal describes has occurred. HouseDoc adopted v1.0.1 and its first `standards validate` returned `COMPLIANT` — 22 rules passed, 0 failed — against a repository holding zero proposals. Added 2026-08-09 when the RevisitWhen below fired (source: observed during the HouseDoc adoption, commit 44f3bab on branch develop)
- **E9 [observation]** HouseDoc's emptiness is correct and documented. It has 80 commits of shipped work whose decisions were never recorded, and writing proposals for them would be fabrication — which `standards init` itself says in the mode this repository's own tooling exists to detect. The silence is the intended state, not a lapse (source: observed during the HouseDoc adoption; recorded in that repository's artifacts/innovation/governance.md)
- **E10 [technical-evidence]** Every adopter passes through this state legitimately. On the day of adoption a repository has a populated policy and no proposals by construction, and it stays that way until its next genuine decision — which may be months away and may correctly never come. A rule firing on "policy present, proposals absent" cannot distinguish that from a repository that has stopped recording, because at the instant it fires the two are the same repository (from: E8, E9)
- **E11 [assumption]** The distinction could be drawn if a governance-effective date existed, so the rule could ask "no proposals since adoption" rather than "no proposals". No such mechanism exists in v1.0.1, and whether one should is an undecided question this proposal does not own.
- **E12 [observation]** No reviewer has yet read a proposal-free `COMPLIANT` verdict and drawn a wrong conclusion from it. The second half of the RevisitWhen trigger has not fired; only the first half has (source: observed during the HouseDoc adoption)

## Assumptions and uncertainty

- **Assumption:** Silence is read as approval by someone. Plausible and unverified; it is equally possible that nobody ever reads a verdict for a repository with no proposals, in which case the problem has no consequence.
- **Assumption:** The distinction can be drawn mechanically at all. Distinguishing "no decisions to record" from "decisions not being recorded" may require knowledge of the project that no file in the repository carries.
- **Unknown:** What the threshold would be. A repository with one stale proposal from a year ago is arguably a worse case than one with none, and no proposed design addresses it.
- **Unknown:** Whether adopters would experience the rule as useful or as nagging. This determines whether it is adopted or immediately waived, and it cannot be answered without an adopter.

## Existing capability

- **Searched:** The thirty rules in this repository's catalog; the descriptive `detected-proposals` finding in the CLI; the `frameworkCoverage` block that already travels beside every verdict; and the `Current limitations` table in the adoption guide.
- **Finding:** Nothing addresses it. All thirty rules take an individual proposal as their subject; none has the repository as its subject, so there is no rule that could fire when the repository holds no proposals. The descriptive finding reports the fact but is informational by construction and bound to no rule. The limitation is currently handled by documentation alone, which is a real control only for someone who reads the documentation.

## Alternatives

- **Do nothing:** The limitation stays published in the adoption guide and unenforced. The cost is borne only when someone reads a `COMPLIANT` verdict for an empty repository and draws the wrong conclusion — which has not yet happened to anyone, because nobody has adopted this yet.
- **Build:** Add `innovation.proposal-inventory` as a repository-scoped rule with a declared-applicability escape. Deferred rather than rejected; see the decision.
- **Buy:** Not viable. No product supplies a rule for this framework's catalog, and the rule is three lines of detector against a signal the walk already has.
- **Integrate:** Not viable in the sense of adopting something external. The nearest real option is to surface the fact through an existing mechanism instead of a new rule — a warning from `check --all`, or a distinct exit code — and that is one of the design questions E6 records as unresolved rather than a separate route to the same place.

## Value and alignment

- **User value:** A reviewer can tell the difference between a project with nothing to govern and a project that has stopped recording its decisions, without knowing the project.
- **Expected impact:** Removes one specific way a `COMPLIANT` verdict can be read as more than it means. The size of that is unknown and rests on E5, an assumption.
- **Differentiation:** None claimed against anything external. Internally it is the first rule whose subject would be the repository rather than a proposal, which is a genuine extension of the model rather than another instance of it.
- **Strategic alignment:** Directly serves the philosophical centre — that a verdict must never claim more than it establishes — and would close the gap between what `COMPLIANT` means and what a reader is likely to take it to mean.

## Costs

- **Implementation:** Small. One catalog entry, one detector against a signal already computed, one fixture pair, and two tests.
- **Maintenance:** One more rule to keep consistent across the catalog, the standards, the dogfooded policy, the adopter template, and the README index. Small individually, and this is the cost that recurs for every rule ever added.
- **Operational:** None. No new traversal, no new I/O, no new dependency.
- **Opportunity cost:** Modest in effort, but it would be spent adding governance surface rather than validating the surface that already exists — and 1.0.0 has thirty rules that no adopter has yet used in earnest.
- **Technical debt:** Introduces the first repository-scoped rule into a catalog whose every other rule is proposal-scoped. Done carelessly that becomes two implicit rule kinds distinguished only by convention, which is the kind of split that is cheap to introduce and expensive to reverse. It needs a decided shape, not an ad-hoc addition.

## Security and privacy

- **Implications:** None. The rule would read the presence and count of files in a directory already walked. No new data is touched, stored, or emitted.
- **Applicable standards:** This repository's own fourteen, which govern it as they govern any adopter. Adding a rule is a versioning event under the release policy: a new `required` rule is a MAJOR change.

## Scope and MVP

- **Release objective:** Make a repository that is not recording its innovation decisions distinguishable from one that has none to record.
- **MVP:** A single rule reporting when a repository has a policy declaring innovation rules and no proposal artifacts, with declared applicability available for repositories that genuinely govern none.
- **Out of scope:** Staleness detection on existing proposals; any judgement about whether the proposals present are the right ones; cross-repository comparison; and any inference about decisions recorded outside this repository.

## Success criteria

- **Criterion:** A fixture repository with a populated policy and no proposals produces a finding, while `test/fixtures/mentions-only` — which legitimately holds no proposals and no policy — continues to produce none. Observable by running the suite; both directions asserted, because a rule that fires on every repository without proposals would be worse than the silence it replaces.

## Kill criteria

- **Criterion:** If the rule cannot be written without most adopters immediately declaring it not-applicable, it stops. Observer: the first three adopting repositories; trigger: two of the three file an applicability declaration against it in their first policy. Routine use of the applicability escape is a worse outcome than the gap, because it teaches adopters that the mechanism separating "no subject here" from "failing here" is a formality.
- **Criterion:** If no adopter reports having been misled by silence within two release cycles of adoption, the problem is theoretical and the rule is withdrawn rather than carried. Observer: adoption feedback; trigger: two releases with no such report.

## Experiment plan

- **Question:** Does an adopter actually misread silence as governance, and would a rule change what they do?
- **Method:** Adopt 1.0.0 in a real project, leave the gap in place, and observe what the first reviewer of a proposal-free `COMPLIANT` verdict concludes without being prompted.
- **Supports proceeding:** A reviewer states or acts on the belief that the project's decisions are under governance when they are not.
- **Does not support proceeding:** Reviewers reach the correct conclusion unaided, or no reviewer ever looks at a verdict for a repository with no proposals — in which case the rule would fire into an empty room.

## Portfolio

- **Overlap:** Overlaps the descriptive `detected-proposals` finding, which already reports the same fact without binding it to a rule. Any implementation should bind that existing signal rather than compute it a second time.
- **Cannibalization:** None. It would add a rule rather than replace one, and nothing currently occupies this position.
- **Priority:** Below validating the existing thirty rules against real adoption. The framework's next most valuable information is whether what exists works, not whether it can be extended.

## Revision history

### 2026-08-09 — reconsidered because the RevisitWhen fired

**What triggered it.** HouseDoc adopted InnovationStandards v1.0.1 and reached exactly the state this
proposal names: a populated policy, zero proposals, and a `COMPLIANT` verdict. That is the first half
of the recorded trigger, and it fired eleven hours after the deferral was written.

**What changed in this document.** Evidence entries E8 through E12 were added. The recorded outcome
was reconsidered and is unchanged. The `RevisitWhen` was rewritten, because the old one has been
consumed and a deferral whose trigger has already fired has no trigger. Nothing else was altered:
E1–E7 stand as written, including E5 and E6, which the new evidence does not touch.

**What the new evidence settles.** E5 was an assumption that adopters would reach this state. They do —
the first one did, immediately. That half is now observed. The other half of E5, that it would *matter*
to them, is not: E12 records that no reviewer has been misled, and the only person who has looked at
HouseDoc's verdict wrote the tool. One contaminated observation is not evidence of harm.

**What the new evidence unsettles.** E10 is the finding that matters, and it cuts against building.
HouseDoc's silence is *correct* — the emptiness is principled, documented, and exactly what `init`'s
undocumented-decisions mode instructs. A rule firing on "policy present, proposals absent" would have
fired on the first adopter on day one and been wrong. Worse, it would have been wrong in the way E7
predicted: HouseDoc's only available response would have been an applicability declaration against a
rule that genuinely applies to it, which is precisely the misuse of the applicability mechanism this
proposal was deferred to avoid teaching.

So the adoption did not resolve the decisive uncertainty. It sharpened the problem statement and made
the design harder: the rule cannot be written correctly without a way to say *since when*, and E11
records that no such mechanism exists. The gap this proposal describes turns out to be downstream of
the governance-effective-date gap that HouseDoc's own governance record also names as unenforced.

**Why the outcome does not change.** E7's kill criterion asks whether adopters would routinely reach
for the applicability escape, and sets its threshold at two of the first three adopters. There has been
one. One adopter is not a sample, and this one argues for continued deferral rather than against it.
Converting `defer` to `build` here would be treating a fired trigger as a mandate — the trigger obliges
a reconsideration, and this is it.

## Decision

- **Outcome:** defer
- **Rationale:** The gap is real, observed, and already published rather than hidden. What is missing is not the implementation — that is small and well understood — but the evidence that would tell us the right shape. E5 through E7 record three open questions, and the decisive one is E7: a rule most adopters immediately declare not-applicable would damage the applicability mechanism more than the silence damages the verdict, and nothing available today tells us which way that goes. Building now would spend a MAJOR version on a design chosen without the information that determines it. Recorded as `defer` rather than `reject` because the problem does not go away and the revisit trigger is concrete and expected; recorded as `defer` rather than `build` because 1.0.0's release gate is green and moving the definition of done after the fact is exactly the scope change Standard 7 R4 prohibits.
- **RevisitWhen:** Rewritten 2026-08-09; the original trigger fired and is recorded in the revision history above. Three conditions, any one of which reopens this: a third repository adopts, so that E7's kill criterion has the sample it names; or a reviewer reports having read a proposal-free `COMPLIANT` verdict as evidence that a project's decisions were under governance, which is E12's outstanding half and the only observation that would establish harm; or a governance-effective-date mechanism is decided, since E10 and E11 say the rule cannot be written correctly without one and its absence is what blocks the design rather than the appetite.
- **Decided:** 2026-08-09, reconsidered 2026-08-09. The reconsideration is recorded in the revision history above and did not change the outcome.
