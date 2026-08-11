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
