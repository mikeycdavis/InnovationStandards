# Held-out results — the pre-registered prediction failed

Run 2026-08-12 against the fourteen held-out subjects registered in
[PRE-REGISTRATION.md](PRE-REGISTRATION.md), using `harness.mjs` unchanged at sha256
`d4e0c799c52454247d5483f3e3426a4aa7eed5832abfa4fead092e84dc28df22` — verified before the run, and
committed at `3459fee` before it.

## Result

**Predicted:** `a+c1` classifies all fourteen as `undocumented-decisions`.
**Observed:** ten of fourteen. Four classified `greenfield`.

The pre-registration defined that as failure, in those words: *any held-out subject classifying as
`greenfield` fails the candidate, because that is the direction 0004 exists to close.* Four did.

| Candidate | Held-out score | `greenfield` errors |
| --- | ---: | --- |
| baseline (today) | 1/14 | AICrowd, CarDoc, CritHappens, CrunchDAO, DPTB |
| (a) recursion d2 | 1/14 | AICrowd, CarDoc, CritHappens, CrunchDAO, DPTB |
| (a) recursion d3 | 2/14 | AICrowd, CritHappens, CrunchDAO |
| (b) git evidence | 12/14 | none — two `UNAVAILABLE` |
| (c1) combined | 10/14 | AICrowd, CritHappens, CrunchDAO, DPTB |
| (c2) combined, today's prompt mapping | 1/14 | AICrowd, CarDoc, CritHappens, CrunchDAO, DPTB |
| **a+c1 (the frozen candidate)** | **10/14** | **AICrowd, CritHappens, CrunchDAO, DPTB** |

Per the pre-registration, `existing-with-proposals` answers are 0006's defect and are not counted
against `a+c1`. They are still wrong answers, and they dominate the baseline's failures: of the
baseline's thirteen errors, five are `greenfield` and eight are `existing-with-proposals`.

## Why it failed

The four failures share one cause, and it is not depth:

| Subject | What it is | Markers found at depth 3 |
| --- | --- | --- |
| AICrowd | Python, 43 tracked files | none |
| CritHappens | Godot, 211 `.gd` files | none |
| CrunchDAO | Python, 82 tracked files | none |
| DPTB | Unity, ~75,000 files on disk | `tools/docs/package.json` only, at depth 3 |

**Three of these repositories contain no file the marker list can name, at any depth.** No amount of
recursion finds a marker that is not there. DPTB is the exception that proves it: depth-3 finds an
incidental `package.json` inside a docs tool, so `a-depth3` gets it right for a reason unrelated to
the 75,000 Unity files that make it not-greenfield.

This is a different failure from the one 0004 documents. 0004 says detection looks in the wrong
*place*. The held-out set says the marker list does not describe the *world* — it enumerates the
ecosystems its author works in, and a repository outside them reads as empty. Both defects produce
false `greenfield`, and only the first is fixed by looking harder.

## The reversal

**Git evidence, which the first experiment eliminated, scored highest on held-out data.** Its two
failures are the `UNAVAILABLE` cases recorded in the pre-registration *before* the run: git refused
CrunchDAO and DPTB for dubious ownership. That is a real defect and it fails toward "no history",
which is the greenfield direction — but it is a defect of *availability*, which a caller can detect
and route around, rather than a wrong answer delivered confidently.

The first experiment's conclusion that git evidence "cannot serve as the general mechanism" was drawn
from five subjects, three of which were this portfolio's own standards repositories. It did not
survive contact with fourteen it had not seen.

## Cost, re-measured at scale

Depth-2 stays under 6 ms everywhere including the 75,000-file Unity project. Depth-3 spiked to
32.6 ms on one subject. Git remains 40–75 ms, almost entirely process spawn. No kill criterion fires.

## What this does and does not establish

- **It kills `a+c1` as the implementation.** Not "suggests revisiting" — the failure condition was
  written down before the run and four subjects met it.
- **It does not vindicate any other candidate.** `b-git` was not the pre-registered subject of this
  test, and reading its 12/14 as a result would repeat exactly the error this exercise exists to
  prevent: promoting the best-scoring candidate after seeing the scores.
- **It leaves 0004's release objective untouched and unmet.** No design in front of us satisfies "a
  repository containing shipped work is not classified `greenfield`" on repositories outside the set
  the designs were built from.
- **It says nothing about the two synthetic `greenfield` subjects**, which remain the only evidence
  that any candidate can still reach that mode correctly.

## What it changes about the decision

0004's `build` rationale settled an architectural question — improve detection rather than abolish
it — and settled it on five subjects. Alternatives (d) *require an explicit mode when signals are
weak* and (e) *remove automatic greenfield inference entirely* were declined on that basis. The
held-out set is the first evidence bearing on that choice, and it points the other way: the premise
that file markers can recognise a repository is what failed, on four of fourteen unseen repositories,
in the dangerous direction.

That is a matter for the proposal, not for this document and not for the backlog. The result is
recorded here and in 0004's evidence; whether the authorization still stands is a decision.
