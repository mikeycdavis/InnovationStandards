# CLI design

The command surface was designed around the workflows this domain actually has, not copied from the
reference implementation. Two of its commands were kept because their job survives the change of
domain, two are new because innovation work has a drafting loop that engineering auditing does not,
and two candidate commands were rejected with reasons.

## The workflows

**A human or AI adopting the standards in a target project.** Needs the proposal directory, a policy
to edit, and instruction files that route an agent to the right sources. One command, mutating,
therefore needing a dry run.

**An AI agent drafting a proposal.** Writes a draft, asks what is missing, gathers or requests
evidence, rewrites, asks again. This loop runs many times against **one artifact** and must be fast
and specific. The reference framework had no analogue: auditing a repository is a whole-repo
operation run occasionally, not a per-artifact operation run continuously.

**Anyone asking why a rule applies.** The user directive requires an agent to be able to *explain why
standards apply*. Applicability here is partly conditional on proposal content, so "does this apply to
me" has a real answer that is not obvious from reading the standard.

**Discovering what a repository contains.** Evidence gathering with no verdict attached.

**Gating CI.** One authoritative verdict with a defined exit-code contract.

## The commands

| Command | Job |
|---|---|
| `standards init [--dry-run] [--force-overwrite=<path>] [--mode=<mode>]` | Bootstrap a target project: create `artifacts/innovation-proposals/`, seed the proposal template, write `project-policy.yml`, `PROJECT.md`, and the agent instruction files. Creates missing files; never overwrites without an explicit per-path opt-in. |
| `standards check <proposal-path>` / `standards check --all` | Evaluate one proposal (or every proposal) against the innovation rules. Prints the per-proposal conclusion in the AI vocabulary, the rules that failed, why, and the remediation for each. |
| `standards explain <rule-id>` / `standards explain <proposal-path>` | Read-only. For a rule: what it requires, its level and severity in this project's policy, whether it is invariant-class, what triggers it conditionally, what evidence satisfies it, its remediation, and the standard requirement that defines it. For a proposal: every rule, whether it applies, and why. |
| `standards audit [path] [--strict]` | Evidence discovery across a repository. Reports what exists and where it departs from the standards. Produces no verdict without a policy. |
| `standards validate [path]` | The authoritative, policy-aware verdict, including `BLOCKED_BY_INVARIANT`. **This is the command CI gates on.** |

All five accept `--json`. `audit`, `validate`, and `check` accept `--dir=<path>`.

### Exit codes

Unchanged from the reference contract, because two commands with different exit-code meanings is a
trap and the value of the contract is that it is the same everywhere:

| Code | Meaning |
|---|---|
| 0 | Ran to completion; nothing to report (or, for `validate`, compliant) |
| 1 | Ran to completion; findings or non-compliance — **including `BLOCKED_BY_INVARIANT`** |
| 2 | The tool could not run: bad invocation, unreadable or schema-invalid policy, unloadable catalog |

A blocked verdict exits 1 rather than a distinct third code, because CI consumers already treat 1 as
"fail the build" and inventing a code they do not handle would make the strongest failure the easiest
to miss. The distinction is carried in the status field and in the human output, where it is stated as
a stop instruction rather than a defect list.

### Dry run and apply derive from the same plan

`init` computes a plan — a list of `{path, action, template}` entries where action is `create`,
`skip`, or `conflict` — and then either renders it (`--dry-run`) or applies it. There is one plan
function and two consumers. This matters because a dry run that is *computed differently* from the
apply is not a preview; it is a second implementation that agrees until it does not, and the moment it
disagrees is exactly when someone is relying on it.

`check`, `explain`, `audit`, and `validate` mutate nothing, so they need no dry run.

### Determinism

`check` and `explain` are pure functions of the catalog, the policy, and the files on disk. Two runs
over unchanged input produce byte-identical output. There is no model call, no network, no clock
dependence beyond the explicitly-passed audit date. A standards tool whose output varies between
identical runs cannot be audited, and its verdicts cannot be reproduced by a reviewer.

## Rejected commands

**`standards plan`** — rejected. `init --dry-run` is already the mutation plan, and it carries the
same-plan guarantee described above. A separate `plan` command would either duplicate that logic (two
sources of truth about what a mutation does) or wrap it (a second name for one thing). Neither is
worth the surface area.

**`standards status`** — rejected. `validate --json` already emits the full machine-readable status:
verdict, score, summary counts, assurance breakdown, denominator, framework coverage, and every
per-rule result. A shorter `status` command would be a friendlier view of the same data, and the
predictable consequence is a CI pipeline gating on `status` — which either duplicates `validate`'s
exit-code contract or, worse, does not. The gate should have one name.

## What an AI agent does with this

The operating loop, as written into `templates/AGENTS.md`:

1. `standards init --dry-run`, then `standards init` — bootstrap the target project.
2. `standards explain <rule-id>` — understand what a rule requires before trying to satisfy it.
3. Draft a proposal from `templates/innovation-proposal.md`.
4. `standards check <proposal>` — find out what is missing.
5. Gather evidence, or **request it from a human** where the evidence must come from users or the
   market. Record it at its true level; never upgrade a level to clear a check.
6. Repeat 4–5 until the conclusion is `compliant`, or until the honest conclusion is that the proposal
   should be `reject`, `defer`, or `insufficient-evidence` — all of which are compliant outcomes.
7. `standards validate` — the repository-level verdict.

On `blocked-by-invariant`: **stop and report.** Do not edit the rule, the test, the policy, or the
standard to clear it. That edit is itself the violation
([Standard 14](../standards/14-standards-integrity.md)).
