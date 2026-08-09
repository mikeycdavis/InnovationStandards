# Standard 7 — Scope and MVP Discipline

The single statement of what a release is for, the minimum that would satisfy it, and the rule that
scope may change but never silently.

Source: item 7 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal that contemplates delivering something — in practice every
proposal whose outcome is `prototype` or `build`, and usefully to those at `validate`, where the
release objective is the thing being validated. A proposal at `explore` or `reject` may record a
release objective that names what it decided not to pursue.

## Requirements

### R1 — A release objective is one statement of what the release is for

A proposal MUST record a `Release objective` in its `## Scope and MVP` section: a single statement of
what this release is for. Single is the operative word. An objective composed of three clauses joined
by "and" is three objectives, and a proposal with three objectives has no objective, because when two
of them conflict — as they will, at the first schedule pressure — there is nothing in the document
that says which one gives way.

The objective is written in terms of the change it produces, not the components it ships. "Support
agents can resolve a billing dispute without leaving the case view" is an objective; "build the
billing service, the case-view integration, and the audit log" is a work breakdown, and a work
breakdown cannot be satisfied by a cheaper route because it has already specified the route.

The release objective is also the anchor for everything else in the standard. The MVP is the minimum
that satisfies *it*; the out-of-scope list is what was excluded *from it*; the change record in R4
exists because a change to it is a change to what the proposal is. Without it the other three
requirements have nothing to be measured against, which is why this is the one field in the entire
standard whose check carries `full` assurance.

### R2 — The MVP is the minimum that would satisfy the objective

A proposal MUST record an `MVP`: the smallest thing that would satisfy the release objective, stated
so that a reader can tell what is in it. The definition is adversarial by design — it is the answer to
"what could we remove and still have achieved the objective", asked until the answer is nothing.

Two failures are common and opposite. The first is the MVP that is the full product with the word
minimum in front of it, produced by a team that wrote the feature list first and the objective
afterwards. The second is the MVP so minimal that it cannot satisfy the objective at all, produced by
a team optimising for a ship date; it is not a minimum viable product, because the viability half was
dropped. The objective is the arbiter of both: an MVP that does not satisfy it is too small, and an
MVP containing anything the objective does not require is too large.

The MVP is a claim about sufficiency, and like other claims it carries an evidence level under
[Standard 2](02-evidence-taxonomy-and-integrity.md) when the proposal asserts that the minimum will in
fact satisfy the users it names.

### R3 — Out of scope is an explicit list, not a silence

A proposal MUST record an `Out of scope` list naming what was deliberately excluded. This is the
requirement that most often reads as bureaucratic and is in fact the load-bearing one.

Consider what happens without it. A capability nobody wrote down as excluded was never excluded; it
was merely absent. When it surfaces three weeks into the work — as a request, a discovered dependency,
an "obviously we also need" — there is no prior decision for it to contradict, so including it is not
a reversal of anything. It is just the next task. Repeat that six times and the release has doubled
without a single moment at which anyone decided to double it, and nobody can point to the decision
because there was never one to point at.

**An out-of-scope list is what converts later inclusion into a visible decision rather than a drift.**
When the item is written down as excluded, adding it requires contradicting the document, and
contradicting the document is an event: someone has to say so, someone has to weigh it, and it lands
in the change record R4 requires. The list does not prevent scope from growing. It makes growth
something that happened rather than something that occurred.

The list SHOULD name the exclusions a reader would otherwise assume were included — the adjacent
capability, the second user segment, the obvious next integration. Excluding things nobody expected
costs nothing and establishes nothing.

### R4 — Scope may change, but never silently

Scope MUST NOT be treated as fixed. Proposals are written under uncertainty, and a proposal that could
not change in response to what was learned would be a worse instrument, not a more disciplined one.

**Reproduced verbatim from the source:**

- never allow scope creep to silently change the release objective

The prohibition binds the *silence*, not the change. A change to the release objective
is a change to what the proposal is: the cost estimates in [Standard 5](05-cost-accounting.md) were
made against the old objective, the success criteria in
[Standard 8](08-success-and-kill-criteria.md) measure the old objective, and the approval was given to
the old objective. When the objective moves and none of those move with it, the proposal continues to
carry the authority of a decision that was made about something else.

The required form is a revision entry recording **what changed, the date, and the reason** — the same
discipline [Standard 13](13-innovation-proposal-artifact.md) applies to any alteration of recorded
evidence or a recorded decision. The reason matters most. "Added export because the pilot customer
cannot adopt without it" is a scope change with a basis a reviewer can accept or reject. A silently
edited objective, by contrast, leaves no trace that the proposition ever differed, and a reader six
months later cannot tell an evolved proposal from one that was always this size.

## Additions this standard makes beyond the source

- R1's insistence that the release objective is *one* statement, the argument that a conjunctive
  objective resolves nothing under pressure, and the distinction between an objective and a work
  breakdown.
- R2's two symmetrical MVP failures — the full product relabelled, and the minimum that dropped
  viability — with the release objective as the arbiter of both.
- R3 in full: the argument that an unwritten exclusion is not an exclusion, and that the out-of-scope
  list is what makes later inclusion a visible decision rather than a drift.
- R4's specification of what "not silently" concretely requires — what changed, the date, the reason —
  and the observation that an unchanged approval attaches to a proposition that no longer exists.

## Relationship to other standards

[Standard 5](05-cost-accounting.md) estimates against the scope defined here, which is why a silent
change to the objective invalidates the cost record without appearing to touch it.
[Standard 8](08-success-and-kill-criteria.md) measures the objective defined here; criteria that
survive a scope change unamended measure something the release is no longer for.
[Standard 6](06-security-privacy-and-standards-non-bypass.md) shares the drift mechanism — an
unreviewed prototype acquires production responsibilities the same way an MVP acquires features, one
locally reasonable step at a time. [Standard 9](09-experiment-before-build.md) owns the specific case
where the drift is a prototype becoming the build.
[Standard 13](13-innovation-proposal-artifact.md) defines the revision-entry grammar R4 depends on,
and [Standard 10](10-innovation-decision-model.md) supplies the outcomes at which this standard
principally binds.

## Implementation

`innovation.scope-baseline` (required, `document`, **`full`** assurance) checks that the
`## Scope and MVP` section exists with a non-empty `Release objective` field. It is one of the very few
`full`-assurance rules in the catalog, and the reason is narrow: the requirement it encodes is
*presence of the field*, nothing more. Either a release objective was written or it was not, and the
check observes exactly that with no residue. Full assurance is a claim about the fit between the rule
and the check, never a claim that the content is good.

`innovation.mvp-definition` (required, `document`, `partial`) checks that the `MVP` and `Out of scope`
fields are present and non-empty.

The `partial` rule establishes presence of named, non-empty fields and nothing else. **It cannot
establish that the MVP is actually minimal, that it would actually satisfy the objective, that the
out-of-scope list names the exclusions that matter rather than trivial ones, or that a later edit to
the release objective was accompanied by the revision entry R4 requires.** An `Out of scope` field
reading "anything not listed above" satisfies the check and defeats the standard entirely. That gap is
human review, and it is published in the limitations table in
[`INSTRUCTIONS.md`](../INSTRUCTIONS.md) rather than left for an adopter to discover.

R4's prohibition carries its own rule identity rather than living as prose:
`innovation.no-silent-scope-change` (forbidden, `manual-review`, `none` assurance, attestable).
Prohibitions in this repository are catalogued rules — queryable with
`standards explain innovation.no-silent-scope-change`, bindable by a finding, and present in the same
verdict as everything else — and one that existed only in this document would be the buried
must-never rule the series exists to abolish.

**No automated check evaluates it**, and the reason is the honesty note above at its sharpest.
**Nothing mechanical can detect an objective that was rewritten in place before the proposal was ever
committed**, because the document a detector reads contains only the current text. The residual
control is version history — something this repository observes rather than something it provides,
and a control only insofar as somebody reads the diff. Unattested, the rule reports `not-evaluated`,
which means nobody looked rather than that nothing was wrong.

None of the three rules is invariant-class. A silent scope change is a serious failure of process
rather than a corruption of the evidence base, and a project mid-transition may need a time-bounded,
approved, expiring waiver against it — refusing that would drive the practice out of the record rather
than out of the project.
