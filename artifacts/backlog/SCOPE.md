# What this backlog records, and what it does not

This backlog records **implementation work**. Innovation proposals are not backlog items.
Proposal liveness, evidence triggers, reconsideration, and decisions are governed by
[`artifacts/innovation-proposals/`](../innovation-proposals/). A proposal enters the backlog
only after its decision authorizes implementation.

```
evidence
   ↓
proposal
   ↓
decision
   │
   ├── reject / defer / explore → stays out of backlog
   │
   └── build
          ↓
       backlog
          ↓
    implementation
```

## Why the boundary is drawn here

The two systems answer different questions:

- **Proposals govern whether implementation should happen.**
- **The backlog governs implementation once authorized.**

Copying an undecided proposal into the backlog would create two records of the same liveness
state, and they would drift. Proposals 0003, 0004 and 0005 each carry a specific evidentiary
reopening condition, and 0003 carries a revision entry showing that a fired trigger produced a
reconsideration rather than a promotion. That mechanism is the authority on whether those items
are live. A `DEFERRED` backlog item beside it would be a second, weaker copy.

So their absence from this backlog is not an omission. It is the boundary working.

Nothing links the two systems mechanically — no `trackedBy` field, no synchronization. That is
deliberate: synchronization semantics should not be introduced before there is evidence they are
needed. The decision boundary above is enough, and a single transition (`build` → backlog item)
is the only crossing point.

## The first crossing — designed from a real case, not in advance

On 2026-08-12 proposal [0004](../innovation-proposals/0004-init-mode-inference-safety.md) moved from
`explore` to `build`. That is the first decision authorizing implementation since this backlog
existed, and it is the event this document was waiting for: the transfer is designed here from one
concrete case, with the deliberate consequence that it covers that case and is not claimed to cover
cases nobody has seen. **No backlog item has been created for 0004 yet.** The design comes first.

**Cardinality — one proposal authorizes one or many items, and 0004 shows why the answer cannot be
fixed at one.** 0004 authorizes a correction to one defect, but its own evidence puts at least three
separable pieces of work under that authorization: the detection change, the fixture pair its success
criteria demand, and the pre-registration and re-run that E14 says the derived candidate still owes.
Those can land separately and one can fail without the others. So the relation is **one proposal to
one or more items**, and the shape that carries it is an item whose children are the work — for 0004,
one feature with the leaves beneath it, not three unrelated leaves and not one item pretending the
work is atomic.

**Provenance — the authorizing decision is named on the item that owns the authorization, and not on
every leaf.** For 0004 that is the feature. Repeating the proposal id on each leaf would state the
same fact three times and let the copies disagree, which is the drift this boundary exists to
prevent; recording it only on a distant ancestor would leave a reader of the leaf unable to find out
why the work exists. The rule is: **the highest item whose entire subtree is authorized by that
proposal names it, and nothing below repeats it.** Provenance is carried as ordinary evidence — the
proposal's repository path, in the item's `evidence` list — because that is a path `backlog-reconcile`
already resolves, and it needs no new field, no new schema, and no `trackedBy`.

**Revision — a later revision of the proposal does not touch implementation status, in either
direction.** 0004 already has a revision entry, so this is not speculative: the document was revised
after work was authorized and may be revised again. Ownership transfers **one way at authorization**.
The proposal remains the authoritative record of the decision; the backlog becomes authoritative for
implementation liveness. Changing a backlog item's status never rewrites the proposal's decision, and
revising a proposal's prose never mutates an item's status. If a revision withdraws the
authorization — an outcome moving off `build` — that is a **new decision**, and the correct response
is to mark the affected items `CANCELLED` with the revision cited as evidence, deliberately, in an
edit a reader can see. Nothing propagates automatically, because an automatic propagation would be
one system silently overwriting the other's state, which is the failure both of them exist to avoid.

**What is still not built.** No mechanical check enforces any of the above. Nothing verifies that an
item citing a proposal cites one that reached `build`, and nothing detects a backlog item that
duplicates proposal liveness. That remains reviewer-detectable only, exactly as it was before — this
section changes what the convention *is*, not how it is enforced. A check becomes worth writing when
there is more than one crossing to check, and there is currently one.

## The asymmetry between these two histories is truthful

The milestones recorded here (M0–M6) describe how the framework was implemented. They were **not**
retrofitted into innovation proposals, and they should not be. The governance mechanism did not
exist while that implementation was occurring — it was what the implementation produced. Writing
proposals for it after the fact would manufacture a decision record that never governed anything,
which is precisely the fabricated-history failure Standard 2 exists to prevent.

The proposals that do exist from that period (0001 and 0002) were authored as part of the work,
dogfooding the artifact as it was built. They are genuine, and they are not milestones.

## Current coverage

| | |
| --- | --- |
| Recorded | The v1.0.0 baseline implementation, M0–M6 |
| Evidence form | Commit SHAs and produced paths |
| Not recorded | Post-v1.0.0 commits (see below); anything governed by a proposal |

**Evidence is recorded as commit SHAs, not pull request URLs.** This repository developed by direct
commits to `main` and has no merge commits at all. `backlog-reconcile`'s two PR-dependent checks
will never run here, and that is a property of the workflow rather than a gap to be fixed. The
checks that *can* run — parent/child closure, and whether cited evidence resolves — work against
SHAs, which is why they are used.

**Post-v1.0.0 work is not yet represented here.** The commits after `a75d532` include a release
correction, provenance cleanup, citation fixes, an adoption record, and two commits authored by a
concurrent session on another repository's behalf. Whether each of those is implementation work
this backlog should own is a judgement that has not been made, and seeding them without making it
would be the inertia this document exists to resist.
