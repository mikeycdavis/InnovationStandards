# Standard 14 — Standards Integrity

The global invariant of this repository: no human and no AI may weaken, reclassify, reinterpret, or
falsify evidence for a standard because it prevents a desired conclusion. Everything else in the series
is only as strong as this.

Source: item 14 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to the standards system itself rather than to any one proposal: the rules, the tests, the
applicability determinations, the evidence requirements, and the verification mechanisms. It binds
every actor with access to those things — the author of a proposal, the maintainer of the catalog, the
reviewer, and any AI agent operating on the repository.

It is placed last because it is the standard the other thirteen depend on. Each of them can be defeated
by editing it, and a rule that can be edited by the party it constrains, at the moment it constrains
them, is not a rule. This one is about that move.

## Requirements

### R1 — The invariant

**Reproduced verbatim from the source:**

> A human or AI must never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or manipulate a standard, test, applicability determination, evidence requirement, or verification mechanism solely because it prevents the desired implementation or conclusion.

Two features of that sentence carry the weight.

**It names a human or an AI, and binds them equally.** No allowance is made for an agent acting on
instruction, in a hurry, or under an operator's explicit direction. An agent told to make the check
pass is bound by this exactly as a person told the same thing would be, and the correct response is to
report the conflict rather than resolve it. This is stated because agents are the more likely violator:
an agent optimising for a clean verdict has no independent stake in the standard's purpose, and
weakening the check is very often the cheapest available path to the state it is optimising for.

**Its qualifier is "solely because it prevents the desired implementation or conclusion".** That
qualifier is not a loophole; it is the entire discrimination the standard makes, and R5 develops it.

### R2 — The subject is the standards system itself

The invariant's subject is enumerated, and each item is a distinct attack surface worth naming:

| Subject | The move it forbids |
|---|---|
| A standard | Rewriting or deleting the normative text so the requirement no longer says what it said |
| A test | Deleting, skipping, or loosening a test so the failure stops being reported |
| An applicability determination | Declaring a rule `not-applicable` to escape it, or changing a proposal's `Proposal type` or `Outcome` so a conditional rule stops triggering |
| An evidence requirement | Lowering what counts as support, or relabelling an entry so a weaker basis satisfies a stronger claim |
| A verification mechanism | Removing a detector, weakening a policy level, or filing a waiver against a rule that admits none |

Two of these deserve emphasis because they do not look like tampering while they are being done. A
conditional-applicability change — editing `Outcome: build` to `Outcome: explore` so
`innovation.no-problem-no-build` stops applying — is a one-token edit to a document the author owns, and
it presents as correcting a field. Filing a `not-applicable` declaration with a plausible reason
presents as configuration. Both are squarely within the invariant when the motive is escaping the
finding, and the record of both is visible: the token changed in a diff, the declaration sits in
`project-policy.yml` with its required reason and date.

### R3 — What the mechanism actually provides

Four protections are mechanical and are stated precisely, because a protection described more strongly
than it is provides less security than one described accurately.

**A waiver against a non-exemptible rule is rejected rather than honoured.** It is not silently
ignored, either — the rejection is itself a failure, and it appears in the results. A prohibition a
project can switch off is not a prohibition, and an exception mechanism that quietly discarded invalid
waivers would leave an author believing they had cover.

**An attestation never overrides an automated finding.** Where a human asserts a rule is satisfied and
a check reports otherwise, the result is `contradicted-attestation`, which is a failure. Attestation
adds knowledge the machine does not have; it does not subtract knowledge the machine does have.

**A rule nothing evaluated is reported unevaluated rather than passing.** This is the deepest property
in the system, and its consequence is direct: deleting a check does not produce compliance. It produces
`NOT_EVALUATED`, which is louder than a pass and impossible to mistake for one. The asymmetry that
motivates it is that a false red has a complainant — someone blocked will come and argue — while a
false green has none, because nobody arrives to report that a check quietly approved something it never
examined.

**A policy that declares a rule below its catalog level is itself a finding.** A project's policy may
select which rules apply to it; it may never redefine what a rule means or how strongly it binds.
Downgrading `forbidden` to `recommended` in `project-policy.yml` is detected and reported rather than
applied.

### R4 — Invariant-class rules and the blocked verdict

A rule is **invariant-class** when it is both `level: forbidden` and `nonExemptible: true`. There is no
separate `invariant: true` field, deliberately: the two existing fields already carry the whole meaning
— the behaviour must never occur, and no waiver may permit it — and a third field could contradict
them, leaving the loader to arbitrate. A derived definition cannot disagree with itself. See
[ADR 0005](../artifacts/adr/0005-invariant-class-and-blocked-verdict.md).

Seven rules are invariant-class: `innovation.no-problem-no-build`, `innovation.no-silent-upgrade`,
`innovation.no-fabricated-evidence`, `innovation.no-hidden-costs`, `innovation.standards-non-bypass`,
`innovation.no-sunk-cost-continuation`, and `innovation.integrity-invariant`.

The failure of any of them produces the verdict `BLOCKED_BY_INVARIANT`, the fifth of the five
compliance statuses alongside `COMPLIANT`, `COMPLIANT_WITH_EXCEPTIONS`, `NON_COMPLIANT`, and
`NOT_EVALUATED`. It maps to the AI conclusion **blocked by invariant**, and it exists because an agent
needs a signal in the data that is distinguishable from ordinary non-compliance. `NON_COMPLIANT` means
*there is work to do*. `BLOCKED_BY_INVARIANT` means *stop; do not route around this*.

**On a blocked verdict, an AI agent MUST stop and report.** It MUST NOT edit the rule, the detector,
the test, the policy, or the standard document in order to clear it — **because that edit is itself the
violation**, and it converts a recoverable finding into a compromised record. The instruction is
written this plainly because the failure it prevents is not malice but optimisation: an agent given a
goal state of "green" and write access to the definition of green will reach it, and will report
success, and nothing in its output will indicate which route it took.

Nothing clears a blocked verdict except fixing the underlying violation. No waiver, no attestation, no
policy adjustment. That is the intent, and it will occasionally be inconvenient at exactly the moment
inconvenience is doing its job.

### R5 — Legitimate change is not prohibited

A standard may be revised. It may be revised because it was wrong, because it was ambiguous, because
the domain moved, because a rule proved unenforceable in practice, or because experience showed it
demanded the wrong thing. Revision through a **visible, reasoned, recorded change** is how a standards
system stays worth obeying, and a framework that forbade it would ossify into ritual within a year.

The distinction is the motive and the manner, and it is sharp enough to apply:

| Legitimate revision | Violation |
|---|---|
| Argued on the merits of the rule | Argued from the inconvenience of a specific finding |
| Made as its own change, with its reasoning recorded | Made inside the change it unblocks |
| Applies to every future proposal, including ones the author will dislike | Scoped, in effect, to the case at hand |
| Would be made the same way if the current proposal did not exist | Would not have been raised but for the current proposal |
| The finding is discussed, then the rule is changed | The rule is changed, and the finding disappears |

The last row is the practical test, and the sequencing question — *would this change have been proposed
if the check had passed?* — resolves nearly every real case. A maintainer who believes
`innovation.experiment-before-build` is miscalibrated should say so, propose the change, and let it be
reviewed on that basis; the fact that a proposal is currently failing it is context, not
justification. What the invariant forbids is the change made **solely because** it prevents a desired
conclusion — the edit whose only argument is the outcome it produces.

### R6 — The limits of the protection, stated

An actor with write access to this repository **can** edit a rule, a detector, or a test. Nothing here
prevents that, and this standard does not claim to.

What the mechanism provides is that such an edit is **visible** — in the verdict, in the test suite,
and in version history — not that it is impossible. `integrity.test.mjs` fails when the catalog's
invariant-class set changes, the source-inventory gate fails when a standard stops corresponding to its
source item, and the fidelity gate fails when a block claimed as verbatim source no longer matches. Each
turns a quiet edit into a loud one. None turns it into an impossible one.

Stating this is not a caveat appended for completeness; it is a requirement of the standard. **Claiming
otherwise would itself be the overstated assurance this framework exists to prevent.** A system
described as tamper-proof invites reliance proportional to the claim, and the reliance is what does the
damage when the claim turns out to be a claim about review discipline rather than about mechanism. The
honest description is that the protection is mechanism plus review plus history — three things, of which
only the first is automatic, and the automatic one is the one that shouts rather than the one that
stops.

The practical consequence for an adopter is that these checks are worth what the review around them is
worth. A repository where nobody reads the diff on `catalog/` has the appearance of this protection and
very little of its substance.

## Additions this standard makes beyond the source

- R2's enumeration of each subject of the invariant as a distinct attack surface, and the observation
  that applicability edits and policy declarations are the two moves that do not look like tampering
  while they are being made.
- R3's statement of the four mechanical protections in the precise form they actually hold, including
  the false-red/false-green asymmetry that motivates not-evaluated.
- R4's derived definition of invariant-class, the mapping to `BLOCKED_BY_INVARIANT` and the AI
  conclusion vocabulary, and the explicit stop instruction with its reasoning — that the clearing edit
  is the violation.
- R5 in full: the five-row table distinguishing legitimate revision from violation, and the sequencing
  test.
- R6's insistence that the limits are a requirement rather than a caveat, and the consequence that
  these checks are worth what the review around them is worth.

## Relationship to other standards

This standard generalises the others. [Standard 2](02-evidence-taxonomy-and-integrity.md)'s prohibition
on fabricated evidence is the invariant's central case applied to a proposal's claims, and its
`innovation.no-silent-upgrade` is the same move applied to a level.
[Standard 6](06-security-privacy-and-standards-non-bypass.md) is the invariant applied to standards
outside this repository — security, privacy, engineering, financial, legal — through
`innovation.standards-non-bypass`. [Standard 13](13-innovation-proposal-artifact.md)'s R5 is the
artifact-level companion: it governs silent alteration of a record, where this governs silent alteration
of the system that judges it. [Standard 10](10-innovation-decision-model.md) supplies the outcome field
whose alteration R2 names as an applicability attack.

## Implementation

`innovation.integrity-invariant` (**forbidden**, **non-exemptible**, `configuration`, `partial`) —
**invariant-class**; its failure produces `BLOCKED_BY_INVARIANT`.

The detector reads configuration, not intent. It reports two things:

1. A `project-policy.yml` that declares a rule **below** the level its catalog entry defines — a
   `forbidden` rule selected as `recommended`, or a `required` rule selected as `recommended`.
2. An exception filed **against an invariant-class rule**, which is rejected rather than honoured, and
   whose filing is itself the finding.

Both are structural facts about files, which is why the rule is `configuration` rather than
`manual-review`, and why it can block at all: a rule that blocked on an inference would be a rule that
blocked on a guess.

**What it cannot establish is the invariant itself.** The invariant is about motive — an edit made
*solely because* it prevents a desired conclusion — and no detector reads motive. Specifically, this
rule does not and cannot detect:

- A standard document rewritten to demand less.
- A detector edited so it stops finding what it found.
- A test deleted, or narrowed until it passes.
- An `Outcome` or `Proposal type` field changed so a conditional rule stops triggering.
- A `not-applicable` declaration filed with a plausible-sounding reason that is not the real one.

Every one of those is a violation of this standard and none of them is caught by this rule. What
catches them, imperfectly, is the surrounding machinery — `integrity.test.mjs`, the source-inventory
gate, the fidelity gate, `git log`, and a reviewer who reads the diff. That is the honest position, it
is published in the limitations table in [`INSTRUCTIONS.md`](../INSTRUCTIONS.md), and R6 exists so that
it is stated in the standard as well and not only in the small print.
