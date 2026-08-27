# Results — inference versus refusal, run once against the sixteen held-out subjects

**Run:** 2026-08-27 · **Repository:** `9321faa` · **Node:** v24.15.0
**Raw record:** [`RESULT.json`](RESULT.json) · sha256 `952d588c0f18fe26e5ec838821b4e13f6abc8210d745fc568c2cfc895264b3ec`

The run used exactly the frozen apparatus. The manifest it emitted carries
`candidates.mjs` `931d3da6…`, `run.mjs` `37a080cd…`, `GROUND-TRUTH.json` `6dcd84b9…`,
`AMENDMENT-01.md` `92525990…`, `AMENDMENT-02.md` `163d5719…` — every value matching
[`FREEZE.md`](FREEZE.md), which is how a result proves it ran the frozen components rather than a
later reconstruction. Nothing was edited after any result was seen.

Population: 16 subjects, 0 `MISSING`, 0 `INDETERMINATE`. Refusal denominator **16**, threshold **8**.

---

# Part 1 — Raw outputs

Every subject × candidate, as reported. `GREEN` = `greenfield`, `undoc` = `undocumented-decisions`,
`exist` = `existing-with-proposals`, `REFUSE` = declined, `UNAVL` = signal unavailable.

| Subject | Ground truth | c0 baseline | c1 recursion | c2 git | c3 content | c4 refuse-weak | c5 never-green |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EMOS | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| Encore | `undocumented-decisions` | undoc | undoc | undoc | undoc | undoc | undoc |
| ExcuseGenerator | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| FantasyManager | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| Forecast | `undocumented-decisions` | **GREEN** | undoc | UNAVL | UNAVL | REFUSE | undoc |
| GoalBridge | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| GradePal | `AMBIGUOUS-0006` | exist | undoc | UNAVL | UNAVL | undoc | undoc |
| GreenThumb | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| HowLongUntil | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| IceBox | `AMBIGUOUS-0006` | **GREEN** | undoc | UNAVL | UNAVL | REFUSE | undoc |
| LifeHub | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| LifeInWeeks | `undocumented-decisions` | undoc | undoc | undoc | undoc | undoc | undoc |
| Moneyball | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| PvsNP | `AMBIGUOUS-0006` | **GREEN** | undoc | undoc | undoc | REFUSE | undoc |
| ShouldILiveHere | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |
| WorkSimulator | `AMBIGUOUS-0006` | exist | undoc | undoc | undoc | undoc | undoc |

## The three constructed gates, re-run in the same execution

| Candidate | housedoc-shape | bare-monorepo | genuinely-empty |
| --- | --- | --- | --- |
| `0-baseline` | `greenfield` ✗ | `greenfield` ✗ | `greenfield` ✓ |
| `1-recursion-no-early-return` | `undocumented-decisions` ✓ | **`greenfield` ✗** | `greenfield` ✓ |
| `2-git-evidence` | `greenfield` ✗ | `greenfield` ✗ | `greenfield` ✓ |
| `3-content-shaped` | `undocumented-decisions` ✓ | `undocumented-decisions` ✓ | `greenfield` ✓ |
| `4-refuse-when-weak` | `refused` — recorded | `refused` — recorded | `greenfield` ✓ |
| `5-never-infer-greenfield` | `undocumented-decisions` ✓ | `undocumented-decisions` ✓ | `greenfield` ✓ |

Identical to the values published in `FREEZE.md` before ground truth existed. `refused` on the first
two gates is recorded and not disqualifying, per Amendment 01's resolution written before any subject
was opened.

## An execution artifact found in the raw output, corrected nowhere

`2-git-evidence` and `3-content-shaped` reported `UNAVAILABLE` — evidence string *"not a git
repository"* — on Forecast, GradePal and IceBox. **All three are git repositories.** The cause is this
machine's git `safe.directory` ownership check:

```
fatal: detected dubious ownership in repository at 'F:/Repos/Forecast'
```

This is a property of the environment the run happened in, not of the subjects. It was found by
inspecting the raw output and is recorded here **without changing the candidates, the ground truth,
or the recorded outcomes** — the run stands as executed. Its consequences are carried into the
evaluation below rather than edited out.

---

# Part 2 — Derived classifications

Outcome counts under the pre-registered four-outcome taxonomy and harm ordering
`false-greenfield > false-recorded > refused > correct`. No composite score, no weights.

| Candidate | false-greenfield | false-recorded | refused | UNAVAILABLE | correct | ambiguous-not-scored |
| --- | --- | --- | --- | --- | --- | --- |
| `0-baseline` | **3** | 0 | 0 | 0 | 2 | 11 |
| `1-recursion-no-early-return` | 0 | 0 | 0 | 0 | 3 | 13 |
| `2-git-evidence` | 0 | 0 | 0 | 3 | 2 | 11 |
| `3-content-shaped` | 0 | 0 | 0 | 3 | 2 | 11 |
| `4-refuse-when-weak` | 0 | 0 | 3 | 0 | 2 | 11 |
| `5-never-infer-greenfield` | 0 | 0 | 0 | 0 | 3 | 13 |

The baseline's three `false-greenfield` are Forecast, IceBox and PvsNP. That is the defect proposal
0004 exists to remove, reproduced on a held-out set: three of sixteen real repositories, all of them
carrying substantial implementation work, would today have their back-fill warning suppressed.

`4-refuse-when-weak` refused on those same three subjects. Its refusals name both the disagreement
and the remedy, e.g. *"signals disagree — implementation seen by [S2 depth<=2 markers, S3 substantive
files], not by [S1 root markers]; pass --mode"*.

## Detection cost, measured against the pre-registered kill criterion

Proposal 0004's kill criterion is specific: *if detection cost on a large repository exceeds the
whole runtime of `standards validate`, the design is abandoned*. Measured on PvsNP, the largest
subject, seven runs each:

| | median | range |
| --- | --- | --- |
| `standards validate` (the bound) | **107 ms** | 96–121 |
| `1-recursion-no-early-return` | 1.2 ms | 0.9–1.9 |
| `3-content-shaped` | **144.7 ms** | 123.5–153.1 |
| `2-git-evidence` | **158.4 ms** | 130.8–181.6 |

`3-content-shaped`'s **entire range sits above `validate`'s entire range.** This is not measurement
noise, and it is the clause deciding Class I below.

---

# Part 3 — Evaluation against the pre-registered bars

Each candidate is judged **only** against its own class bar and the three gates. Candidate 0 is the
baseline and belongs to no class; it is measured, not judged.

## Class I — inference

Bar: zero `false-greenfield` across all sixteen · passes the three gates · evidence distinguishes
looked-everywhere from looked-only-at-the-root · no third-party dependency · cost below a full
`standards validate` · (Amendment 01) must classify wherever its signal is available.

| Candidate | Gates | 0 false-green | Explains scope | No dependency | Cost | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `1-recursion-no-early-return` | **fails `bare-monorepo`** | yes | yes | yes | yes | **not supported** |
| `2-git-evidence` | **fails 2 of 3** | yes | yes | yes | **no** | **not supported** |
| `3-content-shaped` | passes | yes | yes | yes | **no** | **not supported** |

**No Class I candidate is supported.**

`1-recursion-no-early-return` is disqualified by a gate, exactly as `FREEZE.md` predicted before
ground truth existed — the `bare-monorepo` manifests sit at depth 3 and this composition stops at 2.
`2-git-evidence` was already disqualified by two gates before the run and was executed anyway,
deliberately, because dropping it would have narrowed the comparison after seeing evidence.

**`3-content-shaped` is the consequential one.** It cleared every gate, produced zero
`false-greenfield`, explained its scope on every subject, and added no dependency. It fails on cost
alone. That is a pre-registered kill criterion with a named observer and a named trigger, written
into proposal 0004 long before this experiment existed, and it is applied here as written.

## Class II — refusal

Bar: zero `false-greenfield` **and** zero `false-recorded` · `genuinely-empty` classifies `greenfield`
without an override · refusals name what to pass and what was inconclusive · `refused` on at most half
the subjects.

| Candidate | 0 false-green | 0 false-recorded | empty→greenfield | Refusal names remedy | Refused ≤ 8 | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `4-refuse-when-weak` | yes | yes | yes | yes | 3 | **supported** |
| `5-never-infer-greenfield` | yes | yes | yes | **never refused** | 0 | **supported** |

**Both Class II candidates meet their bar.**

## The result

**Exactly one class earned support: Class II, refusal.** Within it the experiment has **narrowed to
two candidates and selected neither.** There is no winner here and none is declared.

---

# Part 4 — What this result does not establish

## The two classes were not judged on equal terms

Class I's bar carries a cost clause and a dependency clause. **Class II's bar carries neither.**
`5-never-infer-greenfield` costs a median of ~110 ms and up to 204 ms on the largest subject — it
would fail the very clause that eliminated `3-content-shaped` if that clause applied to it.

This asymmetry was fixed in the pre-registration before any subject was opened, so it stands and the
result is recorded under it. **But "Class II is supported and Class I is not" must not be read as
"refusal outperformed inference."** On this evidence the single deciding clause between the surviving
inference candidate and the surviving refusal candidates is one that was only ever applied to one of
them. That is a defect in the pre-registration, found at evaluation time, and it is recorded rather
than repaired — repairing it now would be reweighting after seeing results.

## The three pre-result limitations, preserved

1. **`INDETERMINATE` was available and went unused.** No subject required it. That establishes
   nothing whatever about its usefulness — not that it was needed, and not that it was not.
2. **`false-recorded` had only three scored subjects.** The thirteen `AMBIGUOUS-0006` cases are
   excluded from that dimension by the pre-registered 0006 rule. Both Class II candidates cleared a
   zero-`false-recorded` clause tested on three cases.
3. **There are no held-out true-`greenfield` subjects.** Avoiding `greenfield` on this set is
   therefore *not* sufficient evidence of correctness — a candidate that never emits `greenfield`
   is indistinguishable here from a correct one. The constructed `genuinely-empty` gate remains the
   **only** positive check that `greenfield` is still reachable when it is the right answer.

## Further limitations found in this run

4. **`5-never-infer-greenfield` never refused.** Its refusal quality is therefore untested by this
   population; it satisfied the refusal-naming clause vacuously.
5. **Three subjects were scored with two candidates' primary signal unavailable** for an
   environmental reason. `2-git-evidence` and `3-content-shaped` were never really exercised on
   Forecast, GradePal or IceBox. Neither candidate is supported anyway, so this changes no verdict —
   but their zero `false-greenfield` counts rest on 13 exercised subjects, not 16.
6. **One owner's portfolio, still.** Carried forward from the pre-registration and not fixed here.

---

# Part 5 — The portfolio observation, kept separate from strategy selection

**Thirteen of sixteen held-out repositories hold `artifacts/prompts/` and no
`artifacts/innovation-proposals/`.**

This is strong evidence about the **prevalence** of the condition proposal
[0006](../../innovation-proposals/0006-prompt-markers-are-not-recorded-decisions.md) leaves open. It
is not a corner case in this portfolio; it is the majority shape, in a set drawn without looking.

**It does not decide 0006, and this experiment was not designed to.** Two things are deliberately
withheld:

- The shipping baseline classifies twelve of those thirteen as `existing-with-proposals`, evidence
  string *"prompt artifacts: artifacts/prompts"*. **The tool as shipped already embodies one reading
  of 0006.** That is a fact about current behaviour, recorded because it is load-bearing for 0006 —
  not an argument that the reading is right.
- Every non-baseline candidate answered `undocumented-decisions` on those subjects, embodying the
  other reading. **This unanimity is not evidence for that reading.** Candidate results cannot decide
  0006: the candidates were built to detect implementation, the labels were held ambiguous precisely
  so the experiment could not settle it by measurement, and using their agreement now would be
  answering an open proposal with a tool that was never designed to test it.

What is established: 0006 is **prevalent**, and deciding it changes the correct label on 13 of 16
real repositories. That is a reason to prioritise 0006, and it is the only conclusion this experiment
supports about it.

---

# Part 6 — What happens next, and what does not

**Evidence for 0004:** the defect is real on held-out data — the shipping baseline produced three
`false-greenfield` on sixteen unseen repositories. One strategy class, refusal, has candidates that
clear a pre-registered bar. Inference has none that clear its own, on a cost clause.

**Stopping here, deliberately:**

- **ST-02 is not touched** and remains `BLOCKED`.
- **Nothing is implemented.** `scripts/init.mjs` is unchanged.
- **No seventh candidate is designed.** Class I's failure on a cost clause is an obvious invitation to
  propose a cheaper inference candidate; doing so in this evidentiary step would be deriving a design
  from the data it would then be tested against — the exact error this pre-registration was built to
  avoid, recurring one level up.
- **0006 is not decided.**
- **No candidate is declared the winner.** Two cleared their bar. The experiment narrowed the field
  and stopped there, which is what it was designed to do.
