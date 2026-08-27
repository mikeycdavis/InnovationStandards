# Amendment 02 — `INDETERMINATE` ground truth, added before any subject is inspected

**Written:** 2026-08-27 · **Amends:** [`PRE-REGISTRATION.md`](PRE-REGISTRATION.md) and
[`AMENDMENT-01.md`](AMENDMENT-01.md) · **Status:** frozen

**No subject has been opened.** Nothing below was chosen with knowledge of any subject's contents,
and no candidate has been executed against any subject. `GROUND-TRUTH.json` does not exist.

## The gap this closes

The pre-registration gives ground truth three possible values: one of the three modes,
`AMBIGUOUS-0006`, or — implicitly, by the subject failing to resolve — absent. It has no
representation for a subject that resolves, is inspectable, and still cannot be labelled.

That is not a hypothetical shape. `greenfield`, `undocumented-decisions` and
`existing-with-proposals` between them assume the inspector can tell whether implementation work
exists. A directory can defeat that assumption in ways unrelated to proposal 0006 — a shape the
labelling procedure was not written to adjudicate, a repository whose contents belong to some other
category the experiment does not have.

Without a representation for it, such a subject has exactly two fates, and the pre-registration
forbids both. Forcing it into a mode invents a domain assumption *while labelling*, which is the
corruption ground truth is most vulnerable to. Dropping it silently re-draws the subject list, which
the pre-registration prohibits in the same breath as `MISSING`.

**So the state is added now, while the sixteen are still genuinely held out**, under the standing
rule that ambiguity found during translation is resolved before ground truth exists and never after.

## `INDETERMINATE`

> **`INDETERMINATE`** — the subject cannot be classified without introducing a **new domain
> assumption** that the pre-registration does not already supply.

The test is not difficulty and not doubt. It is whether the label can be reached from the labelling
procedure already fixed in `AMENDMENT-01.md`:

- `existing-with-proposals` — at least one `artifacts/innovation-proposals/*.md`. Definitional.
- `greenfield` — no implementation work of any kind on disk.
- `undocumented-decisions` — implementation work and no proposals.
- Implementation work is judged **from files on disk, never from git history**.

A subject a careful inspector can label by applying those rules is labelled, however unusual it
looks. A subject that can only be labelled by first deciding some *new* question — one whose answer
the procedure does not contain — is `INDETERMINATE`, and the new question is written down.

**Uncertainty is not the trigger. A new assumption is.** Recording an honest label the procedure
does supply is what the experiment asks for; `INDETERMINATE` is for the case where supplying one
would mean inventing the rule that produced it.

## `INDETERMINATE` is not `AMBIGUOUS-0006`, and the two never substitute

They look adjacent and they are not the same kind of thing.

| | `AMBIGUOUS-0006` | `INDETERMINATE` |
| --- | --- | --- |
| Cause | One **named, open** question: is a prompt artifact a recorded innovation decision? | Some **other** question the procedure does not answer |
| Trigger | `artifacts/prompts/` present, no proposals — a stated, checkable condition | Judged per subject, and the reason written out |
| Known before inspection? | Yes. The condition was declared before any subject was seen | No. It can only be found by inspecting |
| Is `greenfield` wrong? | **Yes, under both readings of 0006.** That is why the label is scoreable | **Unknown.** If it were known, the subject would not be indeterminate |
| Scoring | Counts toward `false-greenfield`; excluded from `false-recorded` | **Excluded from every metric** |
| Resolved by | Deciding proposal 0006 | Nothing this experiment does |

The load-bearing difference is the fourth row. `AMBIGUOUS-0006` is a subject whose label is
*undecided* but whose **wrongness is decided** — `greenfield` is a false answer whichever way 0006
goes, so the harm the experiment exists to measure is still measurable there. `INDETERMINATE` gives
up that guarantee: a candidate answering `greenfield` on such a subject might be right, and counting
it as a false `greenfield` would manufacture the experiment's central statistic out of the
inspector's own inability to label.

**Therefore neither may be recorded in the other's place.** Using `INDETERMINATE` where the 0006
condition holds would erase a scoreable `false-greenfield` and quietly weaken the release objective's
own gate. Using `AMBIGUOUS-0006` where it does not hold would attribute an unrelated difficulty to an
open proposal and count a `false-greenfield` the evidence does not support. The runner rejects a
subject that claims `AMBIGUOUS-0006` without the condition being asserted, and rejects
`INDETERMINATE` without a reason.

## A written reason, per subject, or the run refuses

Every `INDETERMINATE` subject carries in `GROUND-TRUTH.json`:

- **`reason`** — prose, non-empty, saying what was found.
- **`assumptionRequired`** — the specific new domain assumption a label would have needed. This is
  the field that makes the state falsifiable: if it can be written down and it turns out the
  procedure already answers it, the subject was mislabelled and the label is wrong on its face.

**Both are mechanically required.** `run.mjs --subjects` exits 2 when an `INDETERMINATE` subject is
missing either. An unexplained exclusion is the failure mode this state could otherwise introduce —
a place to put any subject that would have scored badly — and it is refused rather than discouraged.

## Excluded from metrics, never scored

An `INDETERMINATE` subject produces the row outcome `indeterminate-not-scored` for **every**
candidate, including candidates that refuse.

It is excluded from:

- `correct`, `false-greenfield`, `false-recorded`, `incorrect` — every accuracy count;
- the `refused` count and the Class II refusal threshold, **numerator and denominator both**.

That last clause matters and is stated so it cannot be chosen later. The Class II bar is *`refused`
on at most half the sixteen subjects*. Leaving an excluded subject in the denominator would make
exclusions loosen the threshold — every indeterminate subject buying a refusing candidate half a
free refusal. Removing it from both keeps the threshold a **proportion of the subjects actually
scored**. The denominator is therefore no longer sixteen by definition, and the runner reports the
population it used:

```
scoredSubjects, excludedIndeterminate, excludedAmbiguous0006, missing
```

**A pre-registered failure condition for this amendment:** if the number of `INDETERMINATE` subjects
reaches **five of sixteen**, no class is supported on this evidence regardless of any candidate's
counts, and that is the finding. A held-out set a third of which could not be labelled has not tested
anything, and the honest report of it is that the population defeated the procedure — not a
percentage computed over the remainder. Declared now, with a number, before a single subject is
opened.

## No candidate result may influence the label — and the runner enforces it

The ordering is `apparatus frozen → ground truth frozen → candidate execution`, and nothing may flow
backward across either arrow. `INDETERMINATE` is the state most able to carry a result backward:
marking a subject indeterminate *after* seeing the candidates disagree on it would launder a bad
result into an exclusion, and the file would read exactly the same as an honest one.

Three mechanical guards, all in `run.mjs --subjects`, each exiting 2:

1. **`GROUND-TRUTH.json` must exist.** Already enforced. No candidate runs against an unlabelled
   subject.
2. **Its newline-normalised sha256 must match the value recorded in `FREEZE.md`.** Ground truth is
   hashed and published before any candidate executes; a label edited afterwards changes the hash and
   the runner stops. This is what makes "frozen" checkable rather than asserted.
3. **It must be unmodified against `HEAD`.** `git status --porcelain` must report nothing for the
   file. Uncommitted ground truth cannot be run against, so the labels a result cites are always
   labels already in history.

Guard 2 is the load-bearing one and it inverts the previous arrangement deliberately: the freeze
record is written **first** and the runner is made to obey it, rather than the runner reporting
whatever it finds and the freeze record being updated to match.

None of this prevents a determined author from editing the labels, re-hashing, amending `FREEZE.md`
and committing all three. It makes doing so a **visible, attributable act in git history** rather
than an invisible one — which is the same standard of protection Standard 14 already claims for the
integrity invariant, and it is claimed here on the same honest terms.

## Ground-truth record shape

```json
{
  "<Subject>": {
    "label": "greenfield | undocumented-decisions | existing-with-proposals | AMBIGUOUS-0006 | INDETERMINATE",
    "reason": "what was found, in prose",
    "evidence": ["paths or observations the label rests on"],
    "assumptionRequired": "INDETERMINATE only — the new domain assumption a label would have needed",
    "promptArtifacts": true
  }
}
```

`reason` and `evidence` are required for **every** label, not only the two special ones — the
pre-registration already requires ground truth be recorded per subject with the evidence for it, and
the runner now checks that rather than trusting it. `promptArtifacts` asserts the 0006 condition and
is required to be `true` on any `AMBIGUOUS-0006` subject.

## What this amendment does not do

- **It does not change the harm ordering, the four outcomes, or either class bar** — except to fix
  the refusal threshold's denominator, which was undefined for excluded subjects and is now defined
  in the direction that cannot be gamed.
- **It does not add a scoring category.** An excluded subject is excluded. Nothing is scored `INDETERMINATE`.
- **It does not add, remove or reorder candidates or subjects.**
- **It does not decide 0006.**
- **It does not touch `candidates.mjs`.** No candidate's behaviour changes; the six frozen
  implementation hashes are unchanged by this amendment and are re-published unchanged in `FREEZE.md`.
- **It does not run anything against a subject.**
