# Standard 13 — Innovation Proposal Artifact

The machine-auditable surface the rest of the series is checked against: a structured Markdown document
at a canonical path, with named sections, a field grammar, and an evidence grammar in which a level is
a parsed token rather than a word in a sentence.

Source: item 13 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every artifact that is to be evaluated as an innovation decision, and — by exclusion — to
everything that is not. This standard is the reason the other thirteen are checkable at all: they state
what a decision must contain, and this one states where that decision lives and in what shape. The
design rationale is
[ADR 0004](../artifacts/adr/0004-proposal-artifact-is-the-audit-surface.md).

## Requirements

### R1 — Proposals live at a canonical path

An innovation proposal MUST be a Markdown file at:

```text
artifacts/innovation-proposals/NNNN-<kebab-slug>.md
```

`NNNN` is a zero-padded four-digit sequence number, unique within the repository and never reused. The
slug is lowercase kebab-case naming the proposal's subject. Both parts do work: the number gives the
proposal a stable identity that survives retitling, so a later document can cite proposal 0007 and mean
one thing; the slug makes a directory listing readable without opening files.

**Only artifacts at this path are evaluated as proposals.** Prose elsewhere that describes the system —
a README, an architecture note, a standard document in this very series, an adopter's design notes — is
documentation, not a decision record, and it is invisible to the proposal detectors.

This is **a path check, not a heuristic, which is why it cannot be fooled by phrasing.** The
alternative — searching a repository for proposal-shaped content — fails in a specific and unrecoverable
way: the documents that explain the system best contain the most vocabulary the scanner is looking for,
so the clearest documentation becomes the loudest source of false findings. This repository's own
standards discuss the eight evidence levels and the eight outcomes at length, and produce no proposal
findings, and `test/fixtures/mentions-only/` holds a document that does the same and asserts it.

The converse limitation is real and is stated rather than implied: a team keeping decision records
elsewhere gets no findings at all. The tooling reports that no proposals exist; it does not report that
the team has undocumented decisions, because it cannot tell the difference.

### R2 — Required sections are present and named

A proposal MUST contain the following `##` sections, named exactly:

| Section | Governed by |
|---|---|
| Problem | [Standard 1](01-problem-before-solution.md) |
| Evidence | [Standard 2](02-evidence-taxonomy-and-integrity.md) |
| Assumptions and uncertainty | [Standard 2](02-evidence-taxonomy-and-integrity.md) |
| Existing capability | [Standard 3](03-existing-capability-and-alternatives.md) |
| Alternatives | [Standard 3](03-existing-capability-and-alternatives.md) |
| Value and alignment | [Standard 4](04-value-and-strategic-alignment.md) |
| Costs | [Standard 5](05-cost-accounting.md) |
| Security and privacy | [Standard 6](06-security-privacy-and-standards-non-bypass.md) |
| Scope and MVP | [Standard 7](07-scope-and-mvp-discipline.md) |
| Success criteria | [Standard 8](08-success-and-kill-criteria.md) |
| Kill criteria | [Standard 8](08-success-and-kill-criteria.md) |
| Portfolio | [Standard 11](11-portfolio-coherence-and-prioritization.md) |
| Decision | [Standard 10](10-innovation-decision-model.md) |

Two further sections are **conditional**, required only when their trigger is present:

| Conditional section | Required when |
|---|---|
| Experiment plan | the proposal's outcome is `build`, per [Standard 9](09-experiment-before-build.md) |
| New project justification | the proposal's `Proposal type` is `new-project`, per [Standard 12](12-new-project-justification.md) |

Fixed names rather than fuzzy matching is what makes an omission a finding rather than an
interpretation. A proposal with no Costs section is missing something specific and nameable; a proposal
whose costs are "discussed somewhere in the narrative" is a judgement call, and judgement calls do not
belong in the layer that decides whether a check ran.

The section names, the field names, and the evidence grammar are part of the frozen public surface.
Changing any of them breaks every existing proposal, so it is a `MAJOR` release.

### R3 — Fields use a parseable grammar

A field is a list item of the form:

```text
- **Field name:** value
```

The bold label, the colon, and a non-empty value are all required. A field whose value is absent is not
a shorter field; it is an unparseable one, and the detectors report it as missing rather than guessing
at what the author meant.

Markdown with a field grammar was chosen over YAML or JSON deliberately. Proposals are argued, not
merely recorded — the reasoning, the alternatives, and the honest statement of what is unknown are
prose, and prose in YAML is prose in a worse container. This grammar keeps the document readable by the
humans who must be persuaded by it while remaining checkable by a parser that needs no heuristics.

### R4 — Evidence uses an entry grammar in which the level is a token

An evidence entry MUST be a list item whose level appears as a bracketed token:

```text
- **E1 [observation]** claim (source: path)
- **E4 [validated-conclusion]** claim (from: E1, E3)
```

Each entry carries an identifier (`E1`, `E2`, …) unique within the proposal, a level drawn from the
closed set in [Standard 2](02-evidence-taxonomy-and-integrity.md), the claim itself, and its support —
`(source: ...)` for a path or URL the claim rests on, `(from: E1, E3)` for a conclusion citing the
lower-level entries that now support it.

The identifier is what makes citation possible, and citation is what makes an evidence upgrade a
visible edit rather than a change of adjective. Without stable identifiers, the `(from: ...)` mechanism
that [Standard 2](02-evidence-taxonomy-and-integrity.md)'s invariant-class `innovation.no-silent-upgrade`
depends on has nothing to point at.

The bracketed token is the secondary mentions-versus-uses guard, complementing R1's path check. A level
named in a sentence — "this is really more of an assumption" — is not an evidence entry, because an
entry must be a list item beginning `- **En [level]**`. The grammar makes the distinction between
classifying a claim and merely discussing classification a syntactic one.

### R5 — Recorded evidence and recorded decisions are not silently altered

A6 — **an additional prohibition this standard introduces**: recorded evidence and recorded decisions
MUST NOT be silently altered. A change to either MUST carry a visible revision entry stating what
changed and why, with a date.

The scope is specific. Fixing a typo, improving the prose of a rationale, or reformatting a table needs
no revision entry. Changing an evidence entry's level, its claim, its source, or its citations does.
Changing the recorded outcome does. Removing an entry does — removal is the alteration most likely to
matter and the least likely to be noticed, because what is gone leaves no trace in the document that
remains.

The reason is that these artifacts are read backwards. A proposal's value in a year is not its
conclusion but the ability to ask *what did we believe, and on what basis, at the moment we decided*.
An artifact edited to match what turned out to be true cannot answer that question, and worse, it
answers it wrongly with full confidence: it shows a decision that looks better evidenced than it was.
Version control preserves the diff, but a diff is only consulted by someone who already suspects
something; the revision entry puts the change where an ordinary reader will see it.

This requirement is the document-level companion to
[Standard 14](14-standards-integrity.md)'s integrity invariant. Editing evidence so that a proposal
reaches a preferred conclusion is that invariant's central case, and it is prohibited there with
blocking force. R5 covers the wider and more ordinary class: alterations that are not attempts to
defeat a standard but still destroy the record's ability to say what was known and when.

## Additions this standard makes beyond the source

- R1's canonical path format, the four-digit sequence and slug convention, and the argument that a path
  check is unfoolable where a content heuristic is not — together with the honest statement of the
  converse limitation.
- R2's specific list of thirteen required sections mapped to the standards that govern them, and the
  two conditional sections with their triggers.
- R3's field grammar and the argument for Markdown over a structured data format.
- R4's evidence entry grammar, the role of stable entry identifiers in making citation possible, and
  the identification of the bracketed token as the secondary mentions-versus-uses guard.
- R5 in full, including additional prohibition A6, the boundary between edits that need a revision
  entry and edits that do not, and the argument that these artifacts are read backwards.

## Relationship to other standards

Every other standard in the series is checked against this one: they say what a decision must contain,
and this says where it lives and in what shape.
[Standard 2](02-evidence-taxonomy-and-integrity.md) supplies the levels R4's grammar carries, and
depends on R4's identifiers for its citation mechanism.
[Standard 10](10-innovation-decision-model.md) defines the Decision section's `Outcome` field, which is
also the trigger for the conditional applicability of several rules.
[Standard 12](12-new-project-justification.md) defines the conditional New project justification
section and the `Proposal type` field that triggers it.
[Standard 14](14-standards-integrity.md) generalises R5 from the artifact to the standards system
itself.

## Implementation

`innovation.proposal-artifact` (required, **`structural`**, **`full`** assurance) — the file is at the
canonical path and every required `##` section is present, with the two conditional sections required
when their trigger fires. Assurance is `full` on a narrow basis, and the narrowness is the point: the
rule claims that a file is where it should be and that named sections exist. Both are entirely
mechanical, and the rule claims nothing else.

`standards check <proposal-path>` reports missing sections by name, which is what makes the drafting
loop tractable: an agent asks what is missing, receives a list of section names, writes them, and asks
again.

**What this establishes is location and shape, and nothing about content.** A proposal with all
thirteen sections present, each containing a single full stop, satisfies `innovation.proposal-artifact`
completely. Every judgement about whether a section says anything is carried by the other standards'
rules, and most of those are `partial` assurance for exactly the same reason — presence is checkable,
adequacy is not.

R5 has **no automated check at all**. Nothing in the tooling compares an artifact against its own
history or detects that an evidence entry was rewritten between commits. The protection is version
control plus review: the diff exists and a reviewer can read it. Claiming the mechanism detects silent
alteration would be the overstated assurance this framework exists to prevent, so the limitation is
recorded here and in the limitations table in [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) rather than left
for an adopter to discover.
