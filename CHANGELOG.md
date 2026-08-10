# Changelog

Every entry states what changed in the **normative content** — the standards and the rule catalog —
before it states what changed in the tooling, because a project pins a standards version to know which
rules it is held to, not to know which detectors exist.

## Versioning policy

Semantic, and applied to the catalog rather than to the code:

| Change | Bump |
| --- | --- |
| A new `required` rule | MAJOR |
| A new `forbidden` rule | MAJOR |
| A new `recommended` rule | MINOR |
| Removing a rule | MAJOR |

A new `required` or `forbidden` rule is MAJOR because it can turn a compliant project non-compliant
without that project changing anything. A new `recommended` rule cannot — it reports as a warning and
never fails a build, so it is MINOR. Removing a rule is MAJOR for the mirror-image reason: an exception
or applicability declaration written against it stops resolving, and a project that was relying on the
rule silently loses the check.

Tightening what an existing rule means is the same class of change as adding one, and is treated as
MAJOR. Loosening it, correcting a description, or improving a detector's precision without changing
what the rule demands is a patch.

## 1.0.1 — 2026-08-09

**No normative change.** No standard, rule, level, assurance, or detector was touched. The catalog is
byte-identical to 1.0.0 and a project pinned to either is evaluated identically.

Documentation correction. 1.0.0's adopter guide told every reader that declaring `standardVersion`
"pins which rules apply to you", and that was not true: nothing compares a rule's `introducedIn`
against the declared version, so the declaration selects nothing. The protection it described is real
but comes from a different layer — the checked-out ref of this repository — and 1.0.0 never documented
how to pin that at all. Every command in the guide read `<standards-repo>/scripts/...`, a placeholder
with no accompanying instruction for resolving it.

An overstatement in the adopter-facing guide is the same class of failure as a rule claiming assurance
its check cannot deliver, which is why this is a correction rather than a note.

- Rewrote *Declaring the standards version* to state plainly that `standardVersion` is declarative
  metadata — validated, recorded, and reported, but never used to select or filter rules.
- Separated the two version concepts that 1.0.0 conflated: the **tool version** (the checkout, which
  determines the rules that exist) and the **policy `standardVersion`** (a declaration of intent).
  They are not mechanically coupled; whether they should be is a future innovation decision.
- Added *Obtaining and pinning the tooling*: a CI checkout at an immutable ref, outside the adopter's
  source tree, with the reasoning for preferring it over a submodule and a note that a tag is
  immutable by policy while a commit SHA is immutable by construction.
- Corrected the upgrade procedure, which had the adopter bump the declaration without moving the ref
  — the step that actually changes anything.
- Added the limitation to *Current limitations* and a matching entry to *What not to do*.
- Added two regression tests. The first is coupled to the source: it fails if the guide claims version
  gating while no code implements it, and relaxes automatically if gating is ever added, so it cannot
  become a stale assertion someone deletes. The second requires the guide to document a pinned
  acquisition mechanism at all.

**Provenance of this finding.** It was discovered by the standards author while preparing the first
adoption, not by an adopter. That distinction is recorded deliberately: it would be convenient later
to describe this as "our first adopter found it", and it was not. No project had adopted anything when
this surfaced. It is pre-adoption evidence about the distribution mechanism, and the claim this
repository is still waiting on — that an independent party can understand and use these standards —
remains unestablished.

## 1.0.0 — 2026-08-09

Initial release. The public surface below is what 1.0.0 freezes; anything not listed is internal and
may change without a version bump.

**Standards.** Fourteen normative documents, numbered 1–14 with no gaps, each stating its scope, its
numbered requirements, what it adds beyond the source specification, its relationship to the other
thirteen, and its implementation status.

**Rules.** Thirty catalogued rules, all in category `innovation`, each with a stable id of the form
`innovation.<kebab-case>`, a level, a severity, a validation type, an assurance grade, and the standard
that defines it. Twenty-two are machine-evaluated; eight are `manual-review` with `none` assurance and
are established only by a recorded human attestation. Eleven are prohibitions at `level: forbidden`.
Exactly one — `innovation.experiment-before-build` — is `recommended`, because whether an experiment
should precede a build depends on the cost of the build and the state of the evidence, which the
tooling cannot judge.

**Commands.** Five: `standards init`, `standards check`, `standards explain`, `standards audit`, and
`standards validate`. All accept `--json`. The exit-code contract is `0` clean, `1` findings or
non-compliance, `2` the tool could not run. `validate` is the command CI gates on. Two candidate
commands, `standards plan` and `standards status`, were considered and rejected with reasons recorded
in [design/cli-design.md](design/cli-design.md).

**`BLOCKED_BY_INVARIANT`.** A fifth compliance status, added in this release and not present in the
reference framework this repository's engine came from. A rule that is both `level: forbidden` and
`nonExemptible: true` is invariant-class; its failure yields `BLOCKED_BY_INVARIANT` rather than
`NON_COMPLIANT`. Seven rules qualify. No new catalog field was introduced — the two existing fields
already carry the whole meaning, and a third could contradict them. The reasoning is in
[artifacts/adr/0005-invariant-class-and-blocked-verdict.md](artifacts/adr/0005-invariant-class-and-blocked-verdict.md).

**Decision model.** Eight outcomes — `explore`, `validate`, `prototype`, `build`, `defer`, `reject`,
`merge-with-existing`, `insufficient-evidence` — with no outcome privileged. A fully evidenced `reject`
is evaluated exactly as a fully evidenced `build`.

**Evidence taxonomy.** Eight levels, kept as an axis distinct from audit finding labels and from rule
assurance. The three never merge.

**Decision records.** Five, at `artifacts/adr/0001-vendored-engine-standalone-repo.md` through
`artifacts/adr/0005-invariant-class-and-blocked-verdict.md`.

**Rule identity is frozen for 1.x.** Every rule id was chosen in its canonical form before a single
rule was authored, so there is no legacy spelling to alias. Every `aliases` array is empty and stays
empty in 1.x.

**Dogfooded verdict at release:** `COMPLIANT` — 26 passed, 0 failed, 4 not-evaluated, 4 attested. The
four not-evaluated rules are left unattested deliberately: this repository has no portfolio to judge
prioritization against, no roadmap presentation to inspect, no external standards regime to bypass, and
no revision history of a release objective to compare. Attesting them would be assertion rather than
evidence.
