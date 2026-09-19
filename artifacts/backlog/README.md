# This backlog now lives in GitHub Issues

The item files that were here were migrated into GitHub Issues on 2026-09-18 and removed. Issues are
now the only home for this repository's work items; nothing here is maintained.

- **The work:** https://github.com/mikeycdavis/InnovationStandards/issues
- **The mapping:** [`github-mapping.json`](./github-mapping.json) records every legacy item id
  against the issue number and id it became, so `ST-01` and friends still resolve.
- **What this backlog records, and what it does not:** [`SCOPE.md`](./SCOPE.md), unchanged. It is
  policy rather than item data, and proposal 0004 cites it.

## Reading it

| The old way | Now |
| --- | --- |
| `status:` frontmatter | The issue's open/closed state, plus a `status:` label |
| `parent:` frontmatter | A GitHub sub-issue link |
| `type:` frontmatter | A `level:` label |
| `evidence:` frontmatter | Links in the issue body, and `Closes #N` from a pull request |
| The generated tracker | GitHub's own issue views |

**An open issue does not mean actionable.** `BLOCKED`, `DEFERRED` and `IN_REVIEW` are all open, so
the `status:` label is what separates open work from executable work.

The full contract is in the ClaudeSkills repository, as `GITHUB-SCHEMA.md`.
