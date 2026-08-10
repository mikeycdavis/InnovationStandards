# INSTRUCTIONS — how to adopt and use these standards

**Operator-facing.** This document tells a human or an AI agent how to consume this repository from
another project. It deliberately does **not** restate the fourteen standards — each of those states its
own requirements — and it does not restate the framework's claims, which are in
[README.md](README.md). This is the workflow around them.

> **Do not copy the standards documents into your repository.** Reference the standards version in your
> `project-policy.yml` and keep only project-specific declarations locally. A copied standard is a
> second definition with no merge path back: it forks the moment either side is edited, the drift is
> silent, and it is discovered only when two projects disagree about what a rule means. The copy is also
> the one an agent will actually follow, because it is the one nearest to hand.

One sentence to keep in view while doing any of this: **a `COMPLIANT` verdict means the reasoning met
the bar, never that the idea is good.** Reaching `reject` is a successful use of this framework.

---

## Minimum adoption recipe

```bash
# 1. Add a project policy and a place to put proposals
cp <standards-repo>/project-policy.yml ./project-policy.yml   # then edit it
mkdir -p artifacts/innovation-proposals
cp <standards-repo>/templates/innovation-proposal.md ./artifacts/innovation-proposals/TEMPLATE.md

# 2. Validate the policy — this checks its shape, not your compliance
node <standards-repo>/scripts/policy.mjs ./project-policy.yml

# 3. Write a proposal, then iterate against the checker
node <standards-repo>/scripts/standards.mjs check artifacts/innovation-proposals/0001-my-idea.md

# 4. See what the tooling observes across the repository
node <standards-repo>/scripts/standards.mjs audit .

# 5. Get the verdict, and resolve every failure: fix it, except it, or declare it not applicable
node <standards-repo>/scripts/standards.mjs validate .
```

**Gate CI on `validate`.** It is the only command that applies your policy and produces a status. Use
`audit` for diagnostics and discovery, and `check` for the drafting loop. They are not aliases, and
their exit codes do not mean the same thing.

---

## What this repository is

A numbered series of fourteen innovation standards, each a normative document stating what a compliant
innovation decision must contain, plus a catalog of thirty machine-identified rules and a command-line
tool that evaluates a proposal against them.

The unit of evaluation is not your repository. It is a **proposal artifact** — a decision about an idea,
made before code exists. See
[artifacts/adr/0004-proposal-artifact-is-the-audit-surface.md](artifacts/adr/0004-proposal-artifact-is-the-audit-surface.md).

| Part | Role |
| --- | --- |
| `standards/01-*.md` … `standards/14-*.md` | What the rules mean. One document per standard |
| [rules/innovation.json](rules/innovation.json) | The catalog — the source of machine truth for rule identity |
| [schemas/project-policy.schema.json](schemas/project-policy.schema.json) | What a valid policy looks like |
| [templates/innovation-proposal.md](templates/innovation-proposal.md) | What you copy into your project |
| [project-policy.yml](project-policy.yml) | This repository's own policy, and the worked example |
| [design/concept-map.md](design/concept-map.md), [design/cli-design.md](design/cli-design.md) | Why the framework has the shape it has |
| [docs/architecture.md](docs/architecture.md) | How the tooling is built and where its limits are |
| **This file** | How to use all of it |

Node ≥ 18. Zero third-party dependencies, and CI has no install step. That is structural: a
supply-chain compromise in a tool that certifies compliance is a compromise of every certification it
has issued.

## Declaring the standards version

One line in `project-policy.yml`:

```yaml
standardVersion: "1.0.0"
```

**This is declarative metadata, not a gate.** It is validated as semver, recorded, and reported in
every verdict envelope so a reader knows which version of the standards you consider yourself held
to. It is **not** used to select or filter rules: nothing compares a rule's `introducedIn` against it,
so declaring `1.0.0` does not prevent a rule introduced in a later version from applying. An
unresolvable version is a **configuration error** — exit `2` — not a compliance failure.

What actually determines which rules run is the **tooling version** — the checkout of this repository
that your CI executes. The two are separate concepts and are not mechanically coupled:

| Concept | Question it answers | Where it lives | Does it gate rules? |
| --- | --- | --- | --- |
| Tool version | Which implementation and catalog am I executing? | The checked-out ref of this repository | **Yes** — the rules that exist are the rules in that checkout |
| `standardVersion` | Which standards version does this project declare itself against? | `project-policy.yml` | No — declarative only |

Whether they should eventually be coupled is an open question and a future innovation decision, not
a defect to work around. Until then, **pin the checkout** and treat `standardVersion` as a statement
of intent that a reviewer can compare against the tool version in the envelope.

## Obtaining and pinning the tooling

Do not vendor this repository into yours. Check it out in CI at an immutable ref, outside your source
tree, so the standards machinery never becomes part of your project's topology:

```yaml
- uses: actions/checkout@v4                 # your repository

- uses: actions/checkout@v4                 # the standards
  with:
    repository: mikeycdavis/InnovationStandards
    ref: v1.0.1
    path: .standards/innovation

- run: node .standards/innovation/scripts/standards.mjs validate .
```

Nothing needs installing — Node ≥ 18 and no third-party dependencies, so there is no lockfile to
reconcile and no supply chain to inherit.

**A tag is immutable by policy; a commit SHA is immutable by construction.** `ref: v1.0.1` is the
readable form and is the right default for a first adoption. Where a governance layer wants stronger
guarantees it should record the release name alongside the commit the release resolved to, check out
the SHA, and report the readable name — so a moved tag is detectable rather than silently followed.

A submodule also works and is deliberately not recommended: it puts the standards implementation into
every adopter's repository topology, requires submodule handling on every clone, and produces
dependency-bump commits in a project that has no dependency on this code at runtime. This is CI
governance tooling, not project source.

## Adding `project-policy.yml`

Copy [project-policy.yml](project-policy.yml) from this repository and edit it. It is a starting point,
not a default: a policy nobody edited declares nothing about your project.

Three constraints the schema enforces immediately:

- **Rule IDs are canonical kebab-case.** `innovation.no-hidden-costs`, never `innovation.noHiddenCosts`.
  Identity was fixed in this form before a single rule was authored, so there is no legacy spelling and
  no alias mechanism — the schema rejects anything else.
- **Levels, not booleans.** `required`, `recommended`, `forbidden`. `true` cannot express a considered
  partial adoption.
- **A policy selects and configures rules; it never redefines them.** If you need a rule to mean
  something different, that is an exception or a decision record, not a policy edit.

A fourth constraint applies only to invariant-class rules: **a policy may not set one below its catalog
level.** Such a declaration is reported by `innovation.integrity-invariant` and refused by the evaluator
regardless. A prohibition a project can switch off is not a prohibition.

## Validating the policy

```bash
node <standards-repo>/scripts/policy.mjs ./project-policy.yml
```

| Exit | Means |
| --- | --- |
| `0` | The policy is well-formed and internally consistent |
| `1` | The policy is valid but a compliance condition fails — an expired exception, or a rule declared both not-applicable and excepted |
| `2` | The policy could not be evaluated — unreadable, unparseable, or schema-invalid |

**A valid policy says nothing about whether you comply.** It says the declaration is well-formed.
Compliance comes from a `validate` run.

The YAML parser is a deliberately small strict subset: no anchors, no block scalars, no flow
collections, no duplicate keys, no tabs. All of those are hard errors rather than guesses. The parser
failing loudly is the design working.

## Writing an innovation proposal

Copy [templates/innovation-proposal.md](templates/innovation-proposal.md) to the canonical path:

```text
artifacts/innovation-proposals/NNNN-<kebab-slug>.md
```

**Only files at that path are parsed as proposals.** This is a path check, not a heuristic, which is why
a document merely *discussing* the taxonomy — a standard, a design note, this file — produces no
findings.

The structure is parsed, not merely read. Keep the `## Section` headings and the `- **Field:** value`
lines as written; a renamed section is an absent section as far as the tooling is concerned. Prose
inside a field is yours.

Required sections: Problem; Evidence; Assumptions and uncertainty; Existing capability; Alternatives;
Value and alignment; Costs; Security and privacy; Scope and MVP; Success criteria; Kill criteria;
Portfolio; Decision. Two are conditional: Experiment plan, and New project justification — the latter
required if and only if `Proposal type` is `new-project`.

Evidence entries have their own grammar, so that a level is a parsed token rather than a word in a
sentence:

```text
- **E1 [observation]** the claim (source: path-or-url)
- **E4 [validated-conclusion]** the claim (from: E1, E3)
```

The eight levels are `observation`, `assumption`, `hypothesis`, `user-evidence`, `market-evidence`,
`technical-evidence`, `experiment-result`, and `validated-conclusion`. A `validated-conclusion` must
cite the entries that support it, and those must not be only assumptions or hypotheses.

**Recording an honest `assumption` is always better than an unsupported `user-evidence`.** Two real
proposals are committed here as worked examples — one concluding `build`
([0001](artifacts/innovation-proposals/0001-innovation-standards-standalone-repo.md)) and one
concluding `reject`
([0002](artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md)) — and both label their
weakest claims `assumption` rather than dressing them up.

## Checking a proposal

This is the drafting loop. Run it as you write, not once at the end.

```bash
node <standards-repo>/scripts/standards.mjs check artifacts/innovation-proposals/0001-my-idea.md
node <standards-repo>/scripts/standards.mjs check --all
node <standards-repo>/scripts/standards.mjs check --all --json
```

`check` reports one conclusion per proposal, in the vocabulary an agent needs:

| Conclusion | Means |
| --- | --- |
| `compliant` | Everything that was evaluated passed |
| `non-compliant` | A rule that applies failed. There is work to do |
| `not applicable` | The rule has no subject here, or its conditional trigger is absent |
| `insufficient evidence / not evaluated` | Nothing examined it. Neither a pass nor a failure |
| `blocked by invariant` | Stop and report. Do not route around it |

`check` is deterministic — a pure function of the catalog, the policy, and the files on disk. Two runs
over unchanged input produce byte-identical output.

## Explaining why a rule applies

```bash
node <standards-repo>/scripts/standards.mjs explain innovation.no-problem-no-build
node <standards-repo>/scripts/standards.mjs explain artifacts/innovation-proposals/0001-my-idea.md
```

For a rule, `explain` prints its level and severity under **this project's policy**, whether it is
invariant-class, what triggers it conditionally, what satisfies it, its remediation, the standard
requirement that defines it, and — for anything below `full` assurance — what the check does **not**
establish. For a proposal, it prints every rule, whether it applies to that proposal, and why.

Applicability here is partly conditional on what a proposal says, which is why "does this apply to me"
has a real answer that is not obvious from reading the standard:

| Rule | Applies when |
| --- | --- |
| `innovation.new-project-justification` | the proposal's `Proposal type` is `new-project` |
| `innovation.revisit-conditions` | the outcome is `defer` or `insufficient-evidence` |
| `innovation.experiment-before-build` | the outcome is `build` |
| `innovation.no-problem-no-build` | the outcome is `build` or `prototype` |

Conditional applicability cannot be declared in a policy, because it is a property of the individual
proposal rather than of the project. It never merges with declared applicability: declared
applicability says *this repository has no such subject*; conditional applicability says *this proposal
did not invoke this rule*.

`explain` is read-only and mutates nothing.

## Running the audit

```bash
node <standards-repo>/scripts/standards.mjs audit .
node <standards-repo>/scripts/standards.mjs audit ../Other
node <standards-repo>/scripts/standards.mjs audit . --json
node <standards-repo>/scripts/standards.mjs audit . --strict
```

`audit` reports what the tooling observed and **never produces a compliance status**. It needs no
policy, which is what makes it the right command for discovery and diagnostics.

| Exit | Means |
| --- | --- |
| `0` | The survey completed |
| `1` | `--strict` was given and something needs attention |
| `2` | Invocation error |

`--strict` promotes warnings to failures. Think before making it a CI gate: a build that breaks on a
heuristic is a build somebody disables. **Do not gate CI on `audit`** — it produces evidence, not a
verdict, and a green audit is not a compliant project.

### Running validate — the verdict

```bash
node <standards-repo>/scripts/standards.mjs validate .
node <standards-repo>/scripts/standards.mjs validate . --json
```

| Exit | Means |
| --- | --- |
| `0` | Compliant, including `COMPLIANT_WITH_EXCEPTIONS` |
| `1` | Evaluated, and not compliant — **including `BLOCKED_BY_INVARIANT`** |
| `2` | Invocation, configuration, or schema error, including no `project-policy.yml` |

A blocked verdict exits `1` rather than a distinct third code, because CI consumers already treat `1`
as "fail the build", and inventing a code they do not handle would make the strongest failure the
easiest to miss. The distinction is carried in the status field and in the human output, where it reads
as a stop instruction rather than a defect list.

`validate` prints the verdict, the score, the rule counts, and the coverage line together:

```text
Compliance
  Status: COMPLIANT
  Score:  100%  (required-level rules that were evaluated: 22)
  Rules:  26 passed, 0 failed, 0 warning(s), 4 skipped
  Cover:  22 automated, 4 manual-review, 4 not-evaluated
```

**Read those four lines together.** 100% means every required rule that was *checked* passed. The
coverage line says how many were not checked at all. The framework line printed below them says how
much of the framework has been turned into machine-represented rules in the first place. None of the
three combines into the others, and none of them is a statement about whether the idea is any good.

## Classifying required / not-applicable / exception

Every rule you do not satisfy is exactly one of four things, and it must be recorded as such. **There
is no fifth category, and specifically no *silently absent*.**

| Classification | Means | Where it goes |
| --- | --- | --- |
| **Failure** | The rule applies and is not met. Work is outstanding | Nowhere — it stays visible as a failure |
| **Not applicable** | The rule's subject does not exist in your project | `applicability:`, with a reason, a `reviewedAt`, and a `revisitWhen` |
| **Exception** | The rule applies, is not met, and that is approved | `exceptions:`, with reason, approver, date, and usually an expiry |
| **Attestation** | The rule applies, a human reviewed it, and it **is** satisfied | `attestations:`, with reviewer, date, and what was examined |

The distinction that matters most: **not-applicable is a claim about your project, not about the
rule.** *We have no portfolio to overlap with* stops being true the day you have one — which is exactly
what `revisitWhen` records.

**Invariant-class rules admit no exception.** An exception filed against one of the seven is rejected
rather than honoured or silently ignored, and the rejection is itself a failure. If such a rule
genuinely has no subject in your project, `not-applicable` is a different claim and is permitted — but
be honest about which one you are making.

This repository's own policy files no exceptions and no applicability declarations at all, and leaves
four rules reporting `not-evaluated` rather than attesting them. That is the pattern to copy.

## Attesting a manual-review rule

Eight of the thirty rules are `manual-review` with `none` assurance. Without an attestation they report
`not-evaluated` — which means **nobody looked**, not that nothing was wrong. An attestation is the only
thing that establishes them.

```yaml
attestations:
  innovation.no-fabricated-evidence:
    status: approved
    reviewedBy: "project-owner"
    reviewedAt: "2026-08-09"
    evidence: "What was actually examined, and what was found. Specific enough that a second reviewer could repeat it."
    reference: "standards/02-evidence-taxonomy-and-integrity.md"
    reviewedAgainst:
      paths:
        - artifacts/innovation-proposals/0001-my-idea.md
      digest: "<validate prints it>"
```

Four rules bind it:

- **An attestation is evidence, not a waiver.** It cannot override an automated finding, and an attested
  rule is simply satisfied — it does **not** make you `COMPLIANT_WITH_EXCEPTIONS`.
- **It cannot be used on a rule the catalog does not mark attestable.**
- **It goes stale.** When the reviewed paths change materially the digest stops matching and the rule
  returns to `not-evaluated` rather than to passing. Silence is the correct failure direction.
- **An expired attestation is not verified.**

Omit `digest` on a first pass; `validate` prints the current one so you can record it.

Write the `evidence` line as though a sceptic will read it, because the whole strength of the mechanism
is in that field. Compare the four attestations in [project-policy.yml](project-policy.yml): each names
the specific entries examined and the specific failure it was looking for.

## The decision model

A decided proposal records exactly one outcome from a closed set of eight, and **no outcome is
privileged**:

```text
explore  validate  prototype  build  defer  reject  merge-with-existing  insufficient-evidence
```

A fully evidenced `reject` is evaluated exactly as a fully evidenced `build`. Both are compliant. Six of
the eight are not "build it", and the framework is designed so that concluding **do not build this** is
a complete, successful, compliant result rather than a failure to reach one.

`defer` and `insufficient-evidence` require a `RevisitWhen` condition. A suspension with no trigger is
indistinguishable from something forgotten — an abandonment that reads like a plan.

Two things this model is not. It is **not** the compliance verdict: a proposal can be compliant while
concluding `reject`, and those two vocabularies never share words. And it is **not** a prediction: the
outcome records what was decided from the evidence available, and later events do not retroactively
make the decision non-compliant. See
[standards/10-innovation-decision-model.md](standards/10-innovation-decision-model.md) and
[artifacts/adr/0002-eight-outcome-decision-model.md](artifacts/adr/0002-eight-outcome-decision-model.md).

## The standards integrity invariant

A rule that is both `level: forbidden` and `nonExemptible: true` is **invariant-class**. Seven qualify:

```text
innovation.no-problem-no-build          innovation.no-silent-upgrade
innovation.no-fabricated-evidence       innovation.no-hidden-costs
innovation.standards-non-bypass         innovation.no-sunk-cost-continuation
innovation.integrity-invariant
```

Their failure produces `BLOCKED_BY_INVARIANT`, which ranks above `NON_COMPLIANT` and can only ever
replace a verdict that would otherwise have been `NON_COMPLIANT` — never one that would have passed.

`NON_COMPLIANT` means *there is work to do*. `BLOCKED_BY_INVARIANT` means *stop; do not route around
this*. The last of the seven, `innovation.integrity-invariant`, is the one that closes the loop: the
easiest way to clear any of the other thirteen standards is to weaken the standard, the detector, the
test, or the policy that reports it, and that edit is itself the violation. See
[standards/14-standards-integrity.md](standards/14-standards-integrity.md).

Be clear about what this buys you. The invariant makes such an edit **visible** — in the catalog, in
the tests, in the integrity gates, and in version history. It does not make it impossible. An actor
with write access can change anything in this repository. Claiming otherwise would be exactly the
overstated assurance the framework exists to prevent.

## How AI agents should use this repository

Point your agent instruction files at this file, then at the project's own declarations, then at
individual standards on demand. Do not paste rules into an instruction file — an instruction file
should get *shorter* as the standards grow, and a pasted rule becomes the one the agent actually
follows.

The operating loop:

1. **init** — `node <standards-repo>/scripts/standards.mjs init . --dry-run`, then without `--dry-run`.
2. **explain** — `standards explain <rule-id>`, to understand a rule *before* trying to satisfy it.
3. **draft** — write the proposal from
   [templates/innovation-proposal.md](templates/innovation-proposal.md) at the canonical path.
4. **check** — `standards check <proposal>`, to find out what is missing.
5. **gather or request evidence** — gather what you can verify yourself; **REQUEST it from a human**
   where the evidence must come from users, customers, or the market. An agent cannot run an interview,
   and a plausible-sounding user quote is a fabrication whether or not it was meant as one. Record every
   claim at its true level.
6. **re-check** — repeat 4 and 5 until the conclusion is `compliant`, or until the honest conclusion is
   that the proposal should be `reject`, `defer`, or `insufficient-evidence`.
7. **validate** — `standards validate .` for the repository-level verdict.
8. **conclude** — report the conclusion, the evidence behind it, and what was not evaluated.

Four behaviours the framework requires, which change how an agent works rather than what it produces:

- **On `blocked-by-invariant`, stop and report.** Do **not** edit the rule, the detector, the test, the
  policy, or the standard to clear it. That edit is itself the violation, and it is the one thing this
  repository is least able to detect after the fact. Report the block, name the rule, quote its
  remediation, and hand the decision to a human.
- **Never upgrade an evidence level to clear a check.** Relabelling an `assumption` as `user-evidence`
  turns a failing check green and a truthful proposal into a false one. `innovation.no-silent-upgrade`
  is invariant-class for this reason.
- **Nothing here can force a positive recommendation.** Three of the five conclusions an agent can
  reach are refusals. `reject`, `defer`, and `insufficient-evidence` are **successful outcomes** and
  should be reported as such, without apology and without a softening recommendation attached.
- **Verify rather than assert.** Run `check` and `validate`; do not declare a proposal compliant from
  inspection. And do not treat a clean run as a statement about the idea — read the coverage line.

## Bootstrapping — `standards init`

```bash
node <standards-repo>/scripts/standards.mjs init . --dry-run   # see what would happen
node <standards-repo>/scripts/standards.mjs init .             # do it
```

`init` creates `project-policy.yml`, `PROJECT.md`, the agent instruction files,
`artifacts/innovation-proposals/` seeded with the proposal template, and `artifacts/adr/`. It detects
which of three situations the target is in — greenfield, existing-with-plan, or
reconstruction-required — and routes accordingly. **Mode detection is a guess and says so**: it is
reported `INFERRED` with the evidence it used, and `--mode=<mode>` overrides it as `CONFIRMED_BY_OWNER`.

The safety contract:

- **It never overwrites.** A file that exists and differs is reported as a **conflict** and nothing is
  changed. Overwriting requires naming the exact path: `--force-overwrite=PROJECT.md`. Approving one
  path does not approve another.
- **`--dry-run` predicts the real run exactly**, because they are the same computation. There is one
  plan function and two consumers — a dry run computed separately from the apply is not a preview, it
  is a second implementation that agrees until it does not, and the moment it disagrees is exactly when
  someone is relying on it.
- **Re-running is safe.** A second run recognises its own output and preserves it.

| Exit | Means |
| --- | --- |
| `0` | Completed, no conflicts |
| `1` | Conflicts — nothing was changed, and you have to decide |
| `2` | init could not run |

`init` reports the mode it detected and the evidence for that judgement, because a wrong guess is
recoverable only if the reader can see which guess was made. Where a project has shipped work whose
decisions were never recorded, it creates the proposal directory **empty** and says so: back-filling
proposals for work that already happened produces a decision record nobody actually made that way,
and once written it is indistinguishable from a real one. Apply the standards to the next decision
instead.

## Upgrading to a newer standards version

1. Read [CHANGELOG.md](CHANGELOG.md) for everything that changed at your current version and above.
2. **Move the pinned ref** in your CI workflow to the new release. This is the step that actually
   changes which rules you are evaluated against; the declaration in step 3 does not.
3. Bump `standardVersion` in `project-policy.yml` to match, so the declaration and the tool version
   agree. They are not coupled mechanically, so keeping them in step is a discipline rather than
   something the tooling enforces — a mismatch is visible in the verdict envelope, which reports the
   declared version while the checkout determines the rules.
4. Re-validate the policy. A rule that no longer exists surfaces here.
5. Re-run `validate` and classify every newly-applicable rule per *Classifying required /
   not-applicable / exception*.
6. Record the upgrade if it changed anything material.

A new `required` or `forbidden` rule is a MAJOR change upstream; a new `recommended` rule is MINOR;
removing a rule is MAJOR. Migration is incremental and non-destructive — you are not required to reach
full compliance in one step, and partial adoption should be a declared state rather than a hidden one.

Rule identity is frozen for 1.x. Every id was chosen in its canonical form before any rule was written,
so there are no aliases to resolve and none will be added in 1.x.

## What not to do

- **Do not gate CI on `audit`.** It produces evidence, not a verdict, and it needs no policy. Gate on
  `validate`.
- **Do not declare a rule not-applicable to avoid a failure.** Not-applicable means the rule has no
  subject in your project. If the rule applies and you are not meeting it, that is a failure or an
  exception — and invariant-class rules admit no exception at all.
- **Do not lower a rule's level to avoid writing an exception.** Same outcome, hidden. For an
  invariant-class rule it is also reported by `innovation.integrity-invariant`.
- **Do not upgrade an evidence level to clear a check.** Record the claim at the level its support
  actually carries. An honest `assumption` is worth more than a false `user-evidence`.
- **Do not rely on `standardVersion` to hold your rule set steady.** It does not gate anything. Pin
  the checked-out ref of this repository in CI; that is the pin that works.
- **Do not copy the standards into a consuming repository.** Reference the version; keep declarations
  local. A copy forks with no merge path back.
- **Do not fabricate user quotes, market sizes, or metrics.** No tooling here can detect a
  well-constructed fabrication. That rule is `manual-review` with `none` assurance precisely because the
  only defence is a person reading it, and it is invariant-class because there is no recovering from it.
- **Do not edit a rule, a test, a detector, or a policy to clear a blocked verdict.** That edit is the
  violation.
- **Do not treat a clean run as compliance with the framework.** It means everything that was evaluated
  passed. Read the coverage line.
- **Do not treat a score as proof.** Status is the verdict; a percentage is a summary statistic, and
  there is no percentage at which compliance is granted.
- **Do not read `COMPLIANT` as approval of the idea.** It is a statement about the reasoning, and it is
  the single most likely misreading of everything in this repository.

## Current limitations

Stated here rather than discovered later. Each is recorded in the `## Implementation` section of the
standard that specifies it, and in [docs/architecture.md](docs/architecture.md).

| Limitation | Consequence for you |
| --- | --- |
| Content adequacy is not machine-checkable | Every `document`-type rule establishes that a section and its fields are present and non-empty. A problem statement reading "users are frustrated" satisfies `innovation.problem-statement`. Whether the content is any good is human review |
| Fabrication detection is human-only | `innovation.no-fabricated-evidence` is `manual-review` with `none` assurance. The tooling verifies that repository-relative citations resolve, which closes the cheapest form and nothing more. An invented customer quote passes every automated check |
| Whether an evidence label is the *right* label is a judgement | The check verifies that a label is present and drawn from the closed set. It cannot tell an honest `technical-evidence` from an `assumption` wearing that word |
| The integrity invariant makes tampering visible, not impossible | An actor with write access can edit a rule, a detector, or a test. The gates, the tests, and version history make the edit visible. They do not prevent it, and claiming otherwise would be the overstated assurance this framework exists to prevent |
| No cross-repository portfolio scanning | `innovation.portfolio-overlap` checks that the author addressed overlap, not that they were right about it. Nothing scans your other projects, and two teams building the same thing in two repositories is invisible here |
| A repository that keeps its proposals elsewhere gets no findings at all | Only files at `artifacts/innovation-proposals/NNNN-slug.md` are parsed. If your decisions live in a wiki, a ticket tracker, or a chat thread, the tooling reports nothing — and reports nothing rather than warning you that your decisions are undocumented. A clean run on a repository with no proposals means only that there was nothing to check |
| `standards check` walks the whole repository to evaluate one proposal | The repository walk happens before the single-proposal filter, so checking one file costs a full scan. Noticeable on a large repository, and the drafting loop runs this command many times |
| `standardVersion` does not gate rules | It is validated, recorded, and reported, but nothing compares a rule's `introducedIn` against it. Declaring `1.0.0` does not stop a rule introduced later from applying. What determines the rules you are evaluated against is the checkout of this repository your CI runs — pin that. Whether the two should be coupled is a future innovation decision, not a defect to route around |
| `init` infers the project's mode from file presence | The mode it reports is `INFERRED`, not observed, and it can be wrong. It prints the evidence for the judgement and accepts `--mode` to override it, but it cannot tell a project whose decisions are undocumented from one whose proposals simply live somewhere it does not look |
| Manual-review rules stay `not-evaluated` until somebody attests them | Eight of the thirty rules have no automated check. Nothing forces an attestation, so a project can run indefinitely with eight rules unexamined and a `COMPLIANT` verdict. The verdict names them every time, and that visibility is the only pressure the tooling applies |
