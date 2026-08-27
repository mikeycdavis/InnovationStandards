# Ground truth — the sixteen held-out subjects, labelled before any candidate was run

**Written:** 2026-08-27 · **Apparatus frozen at:** `4d0ca23` · **Status:** frozen

This is step 3 of the pre-registered ordering and step 4 of the working sequence. Every subject was
opened, inspected and labelled here. **No candidate was invoked against any subject**, and
`run.mjs --subjects` refused to run throughout, which is what made that a property rather than a
promise.

## How the subjects were inspected

By directory listing and file search only — `ls`, `find`, and reading the contents of nothing except
the two definitional markers' presence. Specifically:

- whether `artifacts/innovation-proposals/*.md` exists (definitional for `existing-with-proposals`);
- whether `artifacts/prompts/` exists (the declared `AMBIGUOUS-0006` condition);
- whether implementation work exists on disk, judged from files, **never from git history**, per the
  labelling procedure carried forward in `AMENDMENT-01.md`.

None of the six candidates was imported, called, or consulted. The labels below were reached from the
labelling procedure alone.

## The labels

| Subject | Label | Prompts | Proposals |
| --- | --- | --- | --- |
| EMOS | `AMBIGUOUS-0006` | present | absent |
| Encore | `undocumented-decisions` | **absent** | absent |
| ExcuseGenerator | `AMBIGUOUS-0006` | present | absent |
| FantasyManager | `AMBIGUOUS-0006` | present | absent |
| Forecast | `undocumented-decisions` | **absent** | absent |
| GoalBridge | `AMBIGUOUS-0006` | present | absent |
| GradePal | `AMBIGUOUS-0006` | present | absent |
| GreenThumb | `AMBIGUOUS-0006` | present | absent |
| HowLongUntil | `AMBIGUOUS-0006` | present | absent |
| IceBox | `AMBIGUOUS-0006` | present | absent |
| LifeHub | `AMBIGUOUS-0006` | present | absent |
| LifeInWeeks | `undocumented-decisions` | **absent** | absent |
| Moneyball | `AMBIGUOUS-0006` | present | absent |
| PvsNP | `AMBIGUOUS-0006` | present | absent |
| ShouldILiveHere | `AMBIGUOUS-0006` | present | absent |
| WorkSimulator | `AMBIGUOUS-0006` | present | absent |

```
AMBIGUOUS-0006          13
undocumented-decisions   3
greenfield               0
existing-with-proposals  0
INDETERMINATE            0
```

Per-subject reasoning and evidence are in
[`GROUND-TRUTH.json`](GROUND-TRUTH.json), which the runner validates rather than trusts.

## No subject was labelled `INDETERMINATE`, and that is the honest outcome

Amendment 02 added the state yesterday and it went **unused**. Every one of the sixteen was labelled
by applying the procedure already fixed in Amendment 01; not one required a new domain assumption.

That is recorded plainly rather than softened. The state was added because the procedure *could* be
defeated, not because it was predicted to be, and using it here to justify having added it would be
the exact contamination the amendment exists to prevent. **An unused guard that fails closed is a
guard that cost nothing and proved nothing** — its value, if any, arrives on some future population.

## Every subject has implementation work on disk, and that is load-bearing

Verified per subject, because the `AMBIGUOUS-0006` scoring rule depends on it. The pre-registration
counts an ambiguous subject toward `false-greenfield` on the grounds that `greenfield` is wrong
**under both readings of 0006** — a claim that holds only where implementation work exists. A subject
holding `artifacts/prompts/` and *no* implementation would break that reasoning: `greenfield` could
be right under the reading where a prompt artifact is not a recorded decision, and counting it would
have manufactured a false-greenfield out of an open question.

No such subject exists in this set. The smallest, IceBox, carries a six-project .NET solution;
the sparsest by marker, PvsNP, carries 237 of its own `.lean` files outside `.lake/`. The rule's
premise was checked rather than assumed.

## What this population can and cannot test — recorded before any candidate runs

**Fully testable: the release objective's own gate.** No subject is `greenfield`. Therefore *any*
candidate answering `greenfield` on *any* of the sixteen is a `false-greenfield`, and both class bars
require zero of them. The primary gate has sixteen chances to fail and the population supports it
completely.

**Testable on three subjects only: `false-recorded`.** Thirteen subjects are excluded from that count
by the pre-registered 0006 rule, leaving Encore, Forecast and LifeInWeeks. Class II's bar requires
zero `false-recorded`, so its second clause rests on three cases. **This is a genuine weakness in the
experiment's power and it is stated now, before any result, so it cannot later be presented either as
a discovered caveat or as a reason to reweight anything.**

**The refusal denominator is sixteen.** Nothing is excluded from it — `AMBIGUOUS-0006` subjects
remain in the refusal count, and there are no `INDETERMINATE` or `MISSING` subjects. Class II's
threshold is therefore **8**, its declared value.

**Not testable here at all: correct behaviour on a genuinely empty repository.** The set contains no
`greenfield` subject, so nothing in the sixteen exercises the case where answering `greenfield` is
right. That job belongs entirely to the `genuinely-empty` gate, which is a control on `main` and not
a subject. A candidate that never says `greenfield` cannot be distinguished from a correct one by
this population — which is precisely why the gate exists and why Class II's bar names it explicitly.

**The 0006 condition dominates this portfolio, and that is itself a finding.** Thirteen of sixteen
repositories drawn without looking hold a prompt artifact and no proposal. Whatever this experiment
concludes about strategy selection, it has established that the question proposal 0006 leaves open is
not a corner case in this portfolio — it is the majority shape. That belongs to 0006 and is recorded
here without being acted on.

## What has not happened

- **No candidate has been executed against any subject.**
- **No label was influenced by a candidate result**, because no candidate result exists.
- **Nothing in `scripts/`, `test/`, the backlog, or ST-02 has been touched.**
- **Proposal 0006 is not decided.**
