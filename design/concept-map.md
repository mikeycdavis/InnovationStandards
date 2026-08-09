# Concept map — what this repository adopts, adapts, and rejects

This document is the investigation record required before implementation. A standards system assembled
by copying another domain's vocabulary inherits that domain's assumptions silently. So every concept
below carries a verdict — **adopt**, **adapt**, **reject** — and the reasoning that produced it.

The reference implementation examined was `EngineeringStandards`, a policy-as-code standards
repository for software engineering practice. This repository is **independent of it**: the
content-agnostic machinery was copied into this repository, and there is no runtime, build, package,
submodule, or path dependency on that repository or any other. The reasoning for copying rather than
depending is recorded in [ADR 0001](../artifacts/adr/0001-vendored-engine-standalone-repo.md), and
the alternative was evaluated as a real proposal that concluded **reject**
([proposal 0002](../artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md)).

## The philosophical center

> **This repository evaluates the quality and integrity of the decision process, not whether the idea
> eventually succeeds.**

Every other decision recorded below is downstream of that sentence, and several of them only make
sense in its light:

- A `build` that later succeeded commercially may have violated these standards badly — it was decided
  without evidence and happened to be right.
- A `reject` can be flawless. Deciding not to build something, for stated reasons, against recorded
  evidence, is the process working.
- A prototype that failed is not a failure of the decision to prototype. The decision was to buy
  information, and the information arrived.
- An experiment that invalidated an idea is a successful innovation process, not a wasted quarter.

This is why compliance is orthogonal to outcome, why no outcome is privileged, and why `COMPLIANT`
must never be read as "this is a good idea". It means the reasoning met the bar the standards set, and
nothing more. A framework that claimed the stronger thing would be forecasting, and forecasting
dressed as compliance is the most dangerous output this system could produce.

### The loop that feeds it

The sentence above says what a verdict means. Its companion says where the input comes from:

> **Use generates evidence. Evidence generates proposals. Proposals generate decisions.
> Decisions — not ideas — generate implementation.**

The precision is in the first and last arrows. Use does not generate *features* — it generates
evidence, and evidence still has to survive a decision. Evidence from real use can equally change an
existing proposal, fire a `RevisitWhen`, satisfy a kill criterion, or establish that nothing needs to
change; three of those produce no implementation and all four are the process working.

That is also why this repository does not carry a roadmap. Proposal 0003 defers a rule and records
the observation that would reopen it, so the next version's content is specified as *evidence that
would justify it* rather than as a list of intended features. Inventing the list would be starting at
the wrong end of the loop — and would be the failure the standards were written to prevent, committed
by the repository that defines them.

## The domain, stated plainly

Engineering standards audit **a repository**: does it have architecture documentation, are there
tests, is a secret embedded in an artifact. The subject is code and the artifacts around it.

Innovation standards audit **a decision about an idea**: should this be built, is there a problem,
what is the evidence, what does it cost, what would make us stop. The subject is a judgement made
before code exists — and often a judgement whose correct conclusion is *do not build this*.

That difference drives three of the four genuine departures below: the unit of evaluation is a
**proposal artifact**, not a repository; the system needs a **decision outcome** vocabulary that does
not privilege building; and it needs an **evidence taxonomy** for claims about the world, which the
engineering framework never needed because code either exists or does not.

## Concept verdicts

### Requirement — adopt

A rule with `level: required`. Unchanged from the reference model. The project's policy may select a
rule's level but must never redefine what the rule means.

### Prohibition — adopt, and promote to first-class

A rule with `level: forbidden`, catalogued exactly like a requirement: an id, a severity, a
description, a rationale, a remediation, and a standard document that defines it.

Prohibitions are **not** inverted requirements and are not documentation prose. The user directive
this repository was built from is explicit: *"must never be done" rules are first-class standards;
they must not be buried in documentation.* Concretely, that means a prohibition here is queryable
(`standards explain innovation.no-fabricated-evidence`), has a machine identity a finding can bind to,
and appears in the same catalog and the same verdict as everything else. Eleven of this repository's
thirty rules are prohibitions, and seven of those eleven are invariant-class.

Why not model prohibitions as requirements phrased negatively ("evidence must be genuine")? Because
the remediation differs in kind. A failed requirement is completed. A violated prohibition is
*undone*, and often the work that depends on it is invalid. Collapsing the two loses that.

### Recommendation — adopt, and use sparingly

`level: recommended`, severity `warning`. Exactly one rule uses it
(`innovation.experiment-before-build`), because whether an experiment should precede a build depends
on how expensive the build is and how uncertain the evidence — a judgement the tooling cannot make.

Everything else is required or forbidden deliberately. Innovation discipline degrades fastest through
soft norms: a recommendation is what a team under delivery pressure skips first, and a standards
system full of recommendations records preferences rather than governing anything.

### Decision rule — adapt, and split into two named things

The reference framework has one "decision rule": how findings become a verdict. This domain needs
two, and conflating them would be a design error, so they are named separately and never share
vocabulary:

1. **Verdict computation** — catalog + policy + findings → a compliance status. Lives in
   `scripts/compliance.mjs`. Status is computed from rules, never from a score.
2. **The decision model** — a proposal's conclusion about an idea: `explore`, `validate`,
   `prototype`, `build`, `defer`, `reject`, `merge-with-existing`, `insufficient-evidence`. Defined by
   [Standard 10](../standards/10-innovation-decision-model.md) and
   [ADR 0002](../artifacts/adr/0002-eight-outcome-decision-model.md).

A proposal can be **compliant** (verdict) while concluding **reject** (decision). Those are
orthogonal, and the fixture `test/fixtures/compliant-rejection/` exists to hold that orthogonality
mechanically. If the two were one concept, "compliant" would come to mean "approved for building",
which is precisely the pressure this repository exists to resist.

### Applicability — adopt, and extend with a conditional form

Two forms, kept distinct:

**Declared applicability** (adopted unchanged). A project's `project-policy.yml` may declare a rule
`not-applicable` with a required `reason`, a `reviewedAt` date, and a `revisitWhen` condition. This
is a claim about the project, not about the rule.

**Conditional applicability** (new). Some innovation rules apply *because of what a proposal says*:

| Rule | Applies when |
|---|---|
| `innovation.new-project-justification` | the proposal's `Proposal type` is `new-project` |
| `innovation.revisit-conditions` | the proposal's `Outcome` is `defer` or `insufficient-evidence` |
| `innovation.experiment-before-build` | the proposal's `Outcome` is `build` |
| `innovation.no-problem-no-build` | the proposal's `Outcome` is `build` or `prototype` |

These triggers cannot be declared in a policy, because they are not properties of the project — they
are properties of the individual proposal, and one repository holds many proposals with different
answers. They are therefore computed per-proposal by the detectors, and `standards explain` prints the
trigger so an author can see why a rule does or does not apply to what they wrote.

The two forms never merge. Declared applicability says *this repository has no such subject*.
Conditional applicability says *this proposal did not invoke this rule*. A rule can be declared
applicable to the repository while not being triggered by a given proposal.

### Evidence — adopt, and extend with a domain taxonomy

Three layers exist, and this repository's central conceptual claim is that they are **three different
axes that must never be merged**:

| Axis | Vocabulary | Grades |
|---|---|---|
| Proposal evidence level (new here) | `observation`, `assumption`, `hypothesis`, `user-evidence`, `market-evidence`, `technical-evidence`, `experiment-result`, `validated-conclusion` | how well a claim *inside a proposal* is supported |
| Audit finding label (adopted) | `OBSERVED`, `INFERRED`, `CONFIRMED_BY_OWNER`, `UNKNOWN` | how the *auditor* knows what it is reporting |
| Rule assurance (adopted) | `full`, `partial`, `none` | how much of a *rule* a mechanical check establishes |

A detector that reports "this proposal labels an entry `validated-conclusion` with no citation" is
making an `OBSERVED` finding (axis 2) about an evidence level (axis 1) under a rule whose assurance is
`partial` (axis 3). Merging any two of these produces a system that cannot say what it does not know.
Recorded in [ADR 0003](../artifacts/adr/0003-evidence-taxonomy-is-a-distinct-axis.md).

**Human attestation** (adopted unchanged) is the fourth evidence mechanism: a recorded human review
carrying `reviewedBy`, `reviewedAt`, an `evidence` description of what was examined, and
`reviewedAgainst` paths with an optional content digest. An attestation never overrides an automated
finding, and a stale digest silently returns the rule to not-evaluated rather than to passing.

### Verification — adopt

Four mechanisms, in descending strength: schema validation (the policy must parse and conform);
structural and document detectors (presence and shape of proposal sections, evidence grammar,
citations that resolve); attestation (recorded human review); and meta-tests (the repository's own
tests, including tests that guard the integrity invariant).

Honesty about verification strength is carried in the catalog: every rule declares an `assurance`, and
every rule below `full` carries an `$assuranceNote` stating in words what the check establishes and
what it does not. Most innovation rules are `partial`, because presence of a "Costs" section is
mechanically checkable and the *adequacy* of what it says is not.

### Exceptions — adopt

Time-bounded waivers with a reason, an approver, an approval date, and an optional expiry. Kept,
because a standards system with no waiver path does not eliminate violations — it drives them
underground, into quiet edits of the rules themselves.

But an exception filed against an invariant-class rule is **rejected**, not honoured and not silently
ignored, and the rejection is itself a failure. A prohibition a project can switch off is not a
prohibition.

### Severity — adopt

`error`, `warning`, `info`, unchanged. Severity describes how loudly a finding reports; `level`
describes what the rule demands. They are independent, and a `recommended` rule with `warning`
severity is the only combination this repository currently uses below error.

### Invariants — adopt as a new, derived class

**New in this repository.** An *invariant-class rule* is one that is both `level: forbidden` and
`nonExemptible: true`. Its failure produces the verdict **`BLOCKED_BY_INVARIANT`**, which ranks above
`NON_COMPLIANT`.

No new catalog field was introduced, deliberately. The two existing fields already carry the whole
meaning — forbidden says the behaviour must never occur, non-exemptible says no waiver can permit it —
and a third field would create a state where the three disagree. The derived definition cannot
disagree with itself. Recorded in
[ADR 0005](../artifacts/adr/0005-invariant-class-and-blocked-verdict.md).

Seven rules are invariant-class: `innovation.no-problem-no-build`, `innovation.no-silent-upgrade`,
`innovation.no-fabricated-evidence`, `innovation.no-hidden-costs`,
`innovation.standards-non-bypass`, `innovation.no-sunk-cost-continuation`, and
`innovation.integrity-invariant`.

`BLOCKED_BY_INVARIANT` exists because an AI agent needs a signal distinguishable from ordinary
non-compliance. Non-compliance means *there is work to do*. Blocked means *stop; do not route around
this*. Without the distinction, an agent optimising for a green verdict has no way to tell the
difference between fixing a gap and defeating a safeguard.

### Revisit conditions — adopt, and extend to a second surface

Two surfaces, one semantic: a claim recorded at a moment stops being true when the world changes, and
the condition that would invalidate it must be written down, or the claim is indistinguishable from
something forgotten.

- **Policy surface** (adopted): `revisitWhen` on an applicability declaration.
- **Proposal surface** (new): `RevisitWhen` in a Decision section, required when the outcome is
  `defer` or `insufficient-evidence`. A deferral with no revisit condition is not a deferral; it is an
  abandonment that reads like a plan.

### Not-applicable — adopt

A per-rule skip carrying a required reason. Excluded from the score's denominator, but **visible in
the results** — never a silent omission. The distinction from an exception is load-bearing and the two
must never collapse into one mechanism: not-applicable means the rule has no subject here; an
exception means the rule applies and the project is knowingly not satisfying it.

### Not-evaluated — adopt, and treat as the system's deepest rule

A rule nothing examined is `skipped`, never `passed`. Manual-review rules are never established by an
automated run, however clean it is.

This is the single property everything else protects. A false red has a complainant — someone whose
work is blocked will come and argue. A false green has none, by construction: nobody arrives to report
that a check quietly passed something it never looked at. In this domain the stakes are specific: an
AI agent that can reach "compliant" by having nothing examined can manufacture approval for any idea.

Maps to the AI conclusion **insufficient evidence / not evaluated**.

### Compliant / non-compliant — adopt, and extend

`COMPLIANT`, `COMPLIANT_WITH_EXCEPTIONS`, `NON_COMPLIANT`, `NOT_EVALUATED` adopted unchanged, plus the
new `BLOCKED_BY_INVARIANT`. Status is computed from rules and never from the score; there is no
percentage at which compliance is granted or withdrawn.

## Domain additions not present in the reference model

| Addition | Why the reference framework did not need it |
|---|---|
| **Proposal artifact** (`artifacts/innovation-proposals/NNNN-slug.md`) | Engineering audits a repository's structure; innovation audits a decision. The decision needs a place to live before it can be checked. [Standard 13](../standards/13-innovation-proposal-artifact.md), [ADR 0004](../artifacts/adr/0004-proposal-artifact-is-the-audit-surface.md) |
| **Decision outcomes** (8 values) | Code either exists or does not. An idea has eight defensible fates, six of which are not "build it". |
| **Evidence taxonomy** (8 levels) | Engineering claims are about the repository and are directly observable. Innovation claims are about users, markets, and futures, and differ enormously in how well they are supported. |
| **`BLOCKED_BY_INVARIANT`** | Engineering standards are read by humans who can be told "stop". An AI agent needs the stop signal in the data. |
| **`check` and `explain` subcommands** | Drafting a proposal is an iterative loop over one artifact, and an agent must be able to ask *why does this rule apply to me*. See [cli-design.md](cli-design.md). |

## Explicitly rejected

| Rejected | Reasoning |
|---|---|
| A `standards plan` subcommand | `init --dry-run` already is the mutation plan, and dry-run and apply derive from the same `plan()` call. A second planning concept would be a second source of truth about what a mutation does, and the two would drift. |
| A `standards status` subcommand | `validate --json` is already the machine-readable status. A friendlier summary command invites CI to gate on the wrong thing, and the exit-code contract is the gate. |
| A rule-alias mechanism | The reference repository needed one because two spellings of rule identity were written before the canonical form was chosen. This repository fixed identity as `innovation.<kebab-case>` before authoring a single rule, so there is no legacy to alias. Every `aliases` array is empty and stays empty in 1.x. |
| A numeric compliance threshold | Status must never be computed from a score. "87% compliant" invites negotiating the threshold instead of fixing the rule, and averages hide exactly the failures that matter most. |
| A separate `invariant: true` catalog field | Redundant with `forbidden` + `nonExemptible`, and redundant fields can disagree. See ADR 0005. |
| Third-party dependencies | The framework is zero-dependency and CI has no install step. That is structural, not aspirational: a supply-chain compromise in a tool that certifies compliance is a compromise of every certification it issued. |
| LLM-driven behaviour inside the CLI | `check` and `explain` are deterministic functions of the catalog, the policy, and the proposal text. A standards tool whose output varies between identical runs cannot be audited, and "the model considered it good" is itself one of this repository's prohibitions (`innovation.novelty-not-value`, Standard 2). |

## Mapping to the AI conclusion vocabulary

The five conclusions an AI agent must be able to reach map onto the machinery as follows. Nothing in
this system can force a positive recommendation, and three of the five conclusions are refusals.

| AI conclusion | Produced by |
|---|---|
| compliant | `COMPLIANT` or `COMPLIANT_WITH_EXCEPTIONS` |
| non-compliant | `NON_COMPLIANT` |
| not applicable | a per-rule result with disposition `not-applicable`, or a conditional rule whose trigger is absent |
| insufficient evidence / not evaluated | `NOT_EVALUATED`, or per-rule `skipped` with disposition `not-evaluated` |
| blocked by invariant | `BLOCKED_BY_INVARIANT` — stop work, report, do not route around |
