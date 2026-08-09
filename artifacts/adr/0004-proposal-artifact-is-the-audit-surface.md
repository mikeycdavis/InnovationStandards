# 0004 — The proposal artifact is the audit surface, and only files at its canonical path are parsed

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Project owner

## Context

Engineering standards audit a repository: files exist or they do not, a workflow runs or it does not.
Innovation standards audit a *decision made before code exists*. There is nothing in a repository's
structure that reveals whether a problem was identified before a solution was chosen, or whether the
cost of maintaining a feature was ever written down.

So the decision has to be written down somewhere with enough structure to be checked. The alternative
— inferring innovation discipline from commits, issues, or prose documents — was considered and is not
possible without guessing, and a standards tool that guesses produces findings nobody can act on.

A second problem arrives with the first. This repository's own documentation discusses the evidence
taxonomy and the outcome vocabulary at length. If detectors search for those words anywhere, the
standards documents themselves become the loudest source of false findings, and every adopter's design
notes become the second.

## Decision

**The unit of evaluation is a proposal artifact**, a structured Markdown document at a canonical path:

```text
artifacts/innovation-proposals/NNNN-<kebab-slug>.md
```

Its shape is defined by [Standard 13](../../standards/13-innovation-proposal-artifact.md) and
`templates/innovation-proposal.md`: named `##` sections, and fields written as `- **Field:** value`.
Evidence entries use a specific grammar so that a level is a parsed token rather than a word found in
prose:

```text
- **E1 [observation]** the claim (source: path-or-url)
- **E4 [validated-conclusion]** the claim (from: E1, E3)
```

**Detectors parse only files under that path.** This is the primary mentions-versus-uses guard, and it
is a path check rather than a heuristic, which is why it cannot be fooled by phrasing. Prose anywhere
else — a standard document, a README, an ADR, an adopter's design notes — is invisible to the proposal
detectors. `test/fixtures/mentions-only/` holds a document that discusses the taxonomy and the outcome
enum in full and asserts that it produces no proposal findings.

The grammar is the secondary guard: a level named in a sentence is not an evidence entry, because an
entry must be a list item beginning `- **En [level]**`.

## Alternatives considered

**Infer from issues, commits, or pull request descriptions.** Rejected. It requires guessing at intent
from unstructured text, produces `INFERRED` findings for everything, and ties the standards to a
particular issue tracker.

**A YAML or JSON proposal format.** Rejected. Proposals are argued, not merely recorded — the
reasoning, the alternatives, and the honest statement of what is unknown are prose, and prose in YAML
is prose in a worse container. Markdown with a parseable field grammar keeps the document readable by
the humans who must be persuaded by it while remaining checkable.

**Search the whole repository for proposal-shaped content.** Rejected. It makes every document that
*describes* the system a source of findings, and the failure is worst for the documents that explain
the system best.

**A database or issue-tracker integration.** Rejected. It puts the decision record outside version
control, so a proposal's history stops being reviewable in a diff and its evidence stops being
citable by repository-relative path.

## Consequences

**Makes easier.** Every check is a document check with a specific location and a specific grammar, so
findings name a file and a field. A proposal is reviewed like code, in a diff, with its evidence
citations resolving to files in the same repository. The false-positive class that plagues text
scanners is closed by construction.

**Makes harder.** A team that keeps its proposals elsewhere gets no findings at all — the tooling will
report that no proposals exist rather than that the team has undocumented decisions, and the
limitations table says so. Reformatting an existing body of proposals into this shape is real work.
The template must stay in step with the detectors, which is why `standards init` seeds the template
from this repository rather than letting an adopter invent one.

**Commits the project to.** Treating the section names, the field names, and the evidence grammar as
part of the frozen public surface: changing them breaks every existing proposal, so it is a `MAJOR`
release.
