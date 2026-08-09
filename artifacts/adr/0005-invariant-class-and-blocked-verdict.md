# 0005 — An invariant is a forbidden, non-exemptible rule, and its failure blocks

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Project owner

## Context

Some violations are not gaps to be closed later. Fabricating customer feedback, presenting an
assumption as a validated conclusion, hiding a maintenance cost, or editing a rule so that it stops
objecting — these do not leave work half-finished. They make the resulting conclusion *invalid*, and
any downstream work resting on it invalid too.

The system is designed for AI agents, which sharpens the problem. An agent optimising for a clean
verdict, faced with `NON_COMPLIANT`, will look for the cheapest way to reach compliance. For most
rules that is exactly right: write the missing section, gather the missing evidence. For this class it
is catastrophic, because the cheapest route to green runs through weakening the check.

So the system needs a signal an agent can act on that means *stop*, distinguishable in the data from
*there is work to do*. The user directive states it directly: the AI must be able to conclude **blocked
by invariant**, and must never be forced to produce a positive recommendation.

## Decision

### Invariant-class is derived, not declared

A rule is **invariant-class** when it is both:

```text
level: forbidden        the behaviour must never occur
nonExemptible: true     and no waiver may permit it
```

No new catalog field. The two existing fields already carry the entire meaning, and a third field
could disagree with them — a rule marked `invariant: true` while `nonExemptible: false` would be a
contradiction the loader would have to arbitrate, and whichever way it arbitrated would surprise
someone. A derived definition cannot contradict itself.

Seven rules are invariant-class: `innovation.no-problem-no-build`, `innovation.no-silent-upgrade`,
`innovation.no-fabricated-evidence`, `innovation.no-hidden-costs`, `innovation.standards-non-bypass`,
`innovation.no-sunk-cost-continuation`, `innovation.integrity-invariant`.

### A fifth compliance status

```text
COMPLIANT  COMPLIANT_WITH_EXCEPTIONS  NON_COMPLIANT  NOT_EVALUATED  BLOCKED_BY_INVARIANT
```

`BLOCKED_BY_INVARIANT` is returned when any invariant-class rule has failed. It **strictly
strengthens**: it can only replace a verdict that would otherwise have been `NON_COMPLIANT`, never one
that would have passed. A failing invariant is by definition a failing rule, so the ordinary
non-compliance path already caught it; this status only changes how it is reported and what an agent
is instructed to do about it.

It exits 1, like non-compliance, because CI consumers already treat 1 as a failed build and inventing
a code they do not handle would make the strongest failure the easiest to miss. The distinction lives
in the status field and in the human output, which states a stop instruction rather than a defect
list.

### A policy cannot downgrade an invariant out of failing

Discovered while implementing this decision, and worth recording because the hole was real and the
fix is a genuine departure from the vendored engine's behaviour.

The inherited evaluator computed a finding's outcome from the level the **policy** selected:
`required` or `forbidden` produced a failure, anything else produced a warning. So a project could
write

```yaml
rules:
  innovation.no-fabricated-evidence:
    level: optional
```

and a fabrication finding would render as a warning, leaving the verdict `COMPLIANT`. The strongest
prohibition in the system would have been switched off by a two-word edit — which is the precise
manipulation [Standard 14](../../standards/14-standards-integrity.md) exists to prohibit, achieved
through the mechanism rather than around it.

**An invariant-class rule now fails regardless of the level a policy selected for it.** A policy may
*choose* a rule's level; selecting `optional` for a rule the catalog defines as forbidden and
non-exemptible is not a choice but a redefinition, and the architecture's governing rule is that the
policy may not redefine what the catalog defines.

The downgrade is *also* reported independently by `innovation.integrity-invariant`, whose detector
looks for exactly this shape. The two are deliberate belt and braces: the detector makes the attempt
visible in the findings, and the evaluator declines to honour it even if the detector were removed.

### An automated finding is never discarded

A second gap, found by the test written for the first one.

The inherited evaluator short-circuited manual-review rules to `not-evaluated` *before* it looked at
whether any finding had been recorded against them. The intent was right — a machine cannot
**establish** a rule whose evaluator is a human — but the implementation went further than the
intent: a detector that **observed** a violation of such a rule had its finding silently dropped, and
the rule reported as merely unreviewed.

The two directions are not the same claim. Not establishing something is honest; discarding an
observation is not, and it is the same false green every other property here exists to prevent.

**A finding now produces a failure whatever the rule's validation type.** Evidence outranks the
absence of an evaluator, exactly as it outranks a contradicting attestation.

### Attestation freshness has two dimensions

Found when proposal 0003 was added, and recorded here because it is a property of the evidence model
rather than of any one attestation.

An attestation carries `reviewedAgainst.paths` and a content `digest`. The digest answers one
question well: **have the reviewed files changed since they were reviewed?** It cannot answer the
other one: **is that list still the whole review surface?**

Adding a third proposal changed nothing about the first two, so every digest still matched and all
four attestations still counted as approved — while each of them silently narrowed from "the
proposals in this repository" to "two of the three". Nothing reported it, because from the digest's
point of view nothing had happened.

So freshness is two-dimensional, and the schema only ever protected one axis:

| Dimension | Question | Protected by |
|---|---|---|
| Content freshness | Have the reviewed files changed? | The `digest`, which goes stale on material change |
| Coverage freshness | Is the reviewed list still complete? | Nothing, until now |

The fix is a repository-level assertion rather than a schema change: **every proposal must be named
by every attestation.** No new field was added, and none was needed — the gap was never in what the
attestation records, only in what was checked about it. A schema change would also have been the
more invasive of the two options for a defect that is really about completeness of review.

The cheaper move was available and would have been dishonest: recompute the digest, leave the paths
and the prose alone, and let the attestation keep asserting more than it had earned. That the honest
route was the more laborious one is the reason this is written down.

### What the mechanism already gives it

Three protections existed in the vendored engine and are inherited rather than added:

- An exception filed against a non-exemptible rule is **rejected** and becomes a failure — not
  honoured, and not quietly ignored.
- An attestation never overrides an automated finding; a human asserting a rule is satisfied while a
  check reports otherwise produces `contradicted-attestation`, a failure.
- A rule nothing evaluated is `skipped`, never `passed`, so an invariant cannot be cleared by removing
  the check that examines it — removal produces not-evaluated, not compliance.

Added here: `innovation.integrity-invariant` (Standard 14), whose detector reports a policy that
declares a rule below its catalog level, and an exception filed against an invariant-class rule.

## Alternatives considered

**A new `disposition` value instead of a status.** Rejected. Disposition describes how one rule's
result was arrived at; a consumer reading the top-level status would still see `NON_COMPLIANT` and
treat the blocking violation as ordinary work. The signal has to be where a consumer looks first.

**A distinct exit code, 3.** Rejected. Existing CI configurations branch on 0 versus non-zero, and
a code nobody handles is a code that gets treated as success by anything doing an equality check
against 1. Making the most severe outcome the least reliably detected is the wrong trade.

**An explicit `invariant: true` catalog field.** Rejected, per the contradiction argument above.

**Making every prohibition invariant-class.** Rejected. Fifteen rules are prohibitions and seven are
invariants. `innovation.novelty-not-value` and `innovation.prioritization-discipline` are genuine
prohibitions, but a project mid-transition may need a time-bounded, approved, expiring waiver against
them, and refusing that would drive the violation out of the record rather than out of the project.
The seven that block are those where a waiver would make the *output* untrustworthy rather than merely
imperfect.

**Blocking on warnings too.** Rejected. Blocking must stay rare enough to mean something. A stop
signal that fires on advisory findings is one an operator learns to route around, which converts the
strongest mechanism in the system into the most ignored.

## Consequences

**Makes easier.** An agent has an unambiguous stop condition and a documented instruction for it:
report, do not route around. A reviewer can see at a glance whether a failure is a gap or a breach.

**Makes harder.** Nothing can clear a blocked verdict except fixing the underlying violation — no
waiver, no attestation, no policy adjustment. That is the intent, and it will occasionally be
inconvenient at exactly the moment inconvenience is doing its job.

**Known limit, stated rather than hidden.** An actor with write access to this repository can edit the
rule, the detector, or the test. `integrity.test.mjs` and the source-inventory and fidelity gates make
that edit visible in CI and in the diff, and Standard 14 records the prohibition — but the protection
is review plus history plus mechanism, not mechanism alone. Claiming otherwise would itself be the
kind of overstated assurance this framework exists to prevent.
