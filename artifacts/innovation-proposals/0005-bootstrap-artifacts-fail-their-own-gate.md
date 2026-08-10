# Proposal 0005 — `standards init` writes a file that `standards validate` immediately rejects

- **Proposal type:** enhancement
- **Status:** READY
- **Target:** InnovationStandards

## Problem

- **Statement:** `init` creates `artifacts/innovation-proposals/TEMPLATE.md`. The evaluator parses every `.md` file under that directory as a proposal. The template is deliberately built so that it does not pass — a test asserts exactly that, on the sound reasoning that a template which satisfied every presence check would be the fastest route to a clean verdict. The two designs are individually correct and jointly produce a bootstrap that fails on arrival: run `init`, then run the command the guide tells you to gate CI on, and the repository is `NON_COMPLIANT` against a file the tool wrote itself thirty seconds earlier.
- **Who is affected:** Every adopter, on their first run, before they have written anything. The first thing this framework tells a new adopter is that they are non-compliant, and the evidence is a file they did not author. An adopter who trusts the tool concludes their repository is broken; an adopter who trusts their repository concludes the tool is.
- **Why it matters now:** It has happened. The first external adoption hit it immediately, and hit it twice — the second time on a governance document that was not a template at all. Every subsequent adoption hits it identically, because it is deterministic.

## Evidence

- **E1 [observation]** `ARTIFACTS` includes `{ path: "artifacts/innovation-proposals/TEMPLATE.md", template: "templates/innovation-proposal.md" }`, so the bootstrap writes the template into the parsed directory by design (source: scripts/init.mjs)
- **E2 [observation]** Proposal discovery is `rel(f).startsWith(PROPOSAL_DIR + "/") && f.endsWith(".md")`. The filter is the directory and the extension; nothing else is consulted (source: scripts/standards.mjs)
- **E3 [observation]** `PROPOSAL_NAME` — `/^\d{4}-[a-z0-9]+(-[a-z0-9]+)*\.md$/` — already exists and is applied only to raise an advisory warning after the file has been parsed and evaluated. The convention is expressed and not enforced (source: scripts/standards.mjs)
- **E4 [observation]** A test asserts the template must not pass the checks: *"A template that satisfies every presence check would be the fastest route to a clean verdict, and adopters would ship it unchanged."* Failing is the template's specified behaviour, not an accident (source: test/instructions.test.mjs)
- **E5 [technical-evidence]** HouseDoc's first `standards validate` after a clean bootstrap returned `NON_COMPLIANT` with three errors, all raised against `TEMPLATE.md`: its `feature | enhancement | ...` placeholder read as an invalid proposal type, and its outcome placeholder as an invalid outcome (source: observed during the HouseDoc adoption, commit 44f3bab on branch develop)
- **E6 [technical-evidence]** The same failure recurred with a document that is not a template. A governance record written to explain the problem was placed in the proposal directory and was evaluated as a proposal and failed. The trigger is location, not templateness (source: observed during the HouseDoc adoption; recorded in that repository's artifacts/innovation/governance.md)
- **E7 [validated-conclusion]** The bootstrap produces a repository that fails the gate the bootstrap exists to prepare it for, and the cause is that proposal discovery is scoped by directory alone (from: E1, E2, E4, E5)
- **E8 [assumption]** Adopters will work around it rather than abandon the tool. The one adopter observed did work around it — and was the standards author, who knew what the errors meant. Nothing supports generalising from that.

## Assumptions and uncertainty

- **Assumption:** A template shipped into the target repository is worth having at all. It exists so an adopter does not invent a shape the detectors cannot read, which is a real risk — but `standards explain` and the documented section list also answer that, and no comparison has been made.
- **Assumption:** The directory should hold only proposals. That is the current contract, and E6 is the first evidence that adopters will naturally want to put something else there. A directory that cannot hold its own README is unusual enough to deserve examination rather than defence.
- **Unknown:** Whether an adopter reads three errors against `TEMPLATE.md` as "delete this file" or as "this tool does not work". The one observation available is contaminated: the observer wrote the tool.
- **Unknown:** What a reserved-name or ignore mechanism would cost in confusion. Any rule of the form "files matching X are not proposals" creates a way for a real proposal to be silently skipped, and a proposal that is never evaluated is a worse failure than one that fails loudly. That trade is the central design question and is not yet answered.

## Existing capability

- **Searched:** `ARTIFACTS` and the whole of `plan`/`apply` in `scripts/init.mjs`; the discovery filter, `PROPOSAL_NAME`, `detectProposals` and the naming warning in `scripts/standards.mjs`; `SKIP_DIRS`; `templates/innovation-proposal.md`; the template assertions in `test/instructions.test.mjs`; and `INSTRUCTIONS.md`.
- **Finding:** Two mechanisms exist and neither is applied here. `PROPOSAL_NAME` already encodes the naming convention and is used only for an advisory warning issued after evaluation — the information needed to distinguish a proposal from a template is computed and then discarded. `SKIP_DIRS` already excludes whole directories from the walk and is the precedent for "this path is not what it looks like", but it operates on directories rather than files. Nothing in the catalog has `init`'s output as its subject, and nothing tests the bootstrap end to end: no test runs `init` into a temporary directory and then runs `validate` against the result, which is the reason this shipped.

## Alternatives

- **Do nothing:** Every adopter starts non-compliant against a file the tool wrote and works it out from three error messages. It is loud rather than silent, which makes it far less dangerous than proposal 0004's defect — but it is the framework's first impression, and it teaches that the verdict is noise before it teaches anything else.
- **Build:** Five designs, deliberately not chosen. (a) **Move the template out** — write it to `artifacts/` or `templates/` and leave the proposal directory empty; smallest change, and it leaves E6 entirely unaddressed, because the directory still cannot hold a README. (b) **Gate discovery on `PROPOSAL_NAME`** — only `NNNN-slug.md` is parsed; uses information already computed, and converts today's advisory warning into a silent skip, so a proposal named wrongly is no longer evaluated at all. (c) **Reserved filenames** — `TEMPLATE.md`, `README.md` and dot-files are never proposals; narrow, explicit, and a list that will grow by one every time somebody is surprised. (d) **Admit non-proposal documents deliberately** — a stated convention, such as a leading underscore or a `not-a-proposal` marker, so the directory can hold its own documentation on purpose rather than by exception. (e) **Don't ship a template into the target at all** — `standards init` could print the skeleton, or `standards explain` could emit it on demand, removing the artifact rather than relocating it. (a) and (e) change what `init` writes; (b), (c) and (d) change what `validate` reads. Those are different contracts with different blast radii, and E6 is the evidence that fixing only the first leaves the problem standing.
- **Buy:** Not viable. The contract is this framework's own.
- **Integrate:** Partly viable and worth a look. Ignore-file conventions — `.gitignore` syntax, `.eslintignore`, `codeowners`-style path matching — are a solved problem with well-understood semantics, and adopting an existing convention would avoid inventing a fifth one. It also adds a parser and a file whose absence must mean something sensible, which may exceed the size of the problem.

## Value and alignment

- **User value:** An adopter's first `validate` after `init` reports the truth about their repository rather than about the tool's own scaffolding.
- **Expected impact:** Removes the framework's worst first impression. Unquantified: one adoption has occurred and the adopter was not a neutral party.
- **Differentiation:** None claimed against anything external.
- **Strategic alignment:** Serves the principle that a verdict must mean what it says. `NON_COMPLIANT` raised against the tool's own scaffolding is a false negative in the same family as the false greens this framework was built to prevent, and it is worth noticing that the framework's own honesty argument cuts against it here.

## Costs

- **Implementation:** (a) is a one-line change to `ARTIFACTS`. (b) is a one-line change to the filter and a rewrite of the naming warning it makes unreachable. (c) and (d) are small and add a convention that must be documented in three places. (e) is the largest, and touches the CLI surface.
- **Maintenance:** (c) is the only one with an open-ended tail — a reserved-name list grows on contact with users. (b) has the worst failure mode to maintain: once discovery is name-gated, every future question about a proposal that "isn't being seen" resolves to a filename, and that is a support burden rather than a code one.
- **Operational:** None. No new traversal, no new I/O.
- **Opportunity cost:** Competes with proposal 0004 for the same attention, on the same file, from the same adoption.
- **Technical debt:** (b) makes filenames load-bearing, which is a small permanent constraint on how proposals may be named forever. (d) is the only alternative that treats the directory as a place documents live rather than a place proposals live, and that is a genuine change to what the canonical path means — cheap now, and it would need Standard 13 to be revised rather than merely the code.

## Security and privacy

- **Implications:** None. No alternative reads new data, writes outside the target, or changes what is emitted.
- **Applicable standards:** This repository's own fourteen. Standard 13 defines the canonical path and would need revising under alternative (d). Changing what `init` writes is a change to a documented bootstrap contract and is a versioning event.

## Scope and MVP

- **Release objective:** A repository that has just been bootstrapped and not otherwise touched must pass `standards validate`.
- **MVP:** Not specified here. Every candidate MVP is one of the five alternatives, so naming one would decide the question.
- **Out of scope:** Anything about the content of the template; the `NNNN-` numbering scheme itself; proposal-directory layout beyond the single question of what is parsed; and proposal 0004's mode-detection defect, which touches the same file and is a different problem.

## Success criteria

- **Criterion:** `init` into an empty temporary directory, followed immediately by `validate` against it, exits 0. Observable as a test, and it must be shown to fail against the current implementation before any fix lands — this end-to-end path has never been tested, which is why the defect exists.
- **Criterion:** A correctly named, genuinely failing proposal still fails. Observable in the same run. Whatever narrows discovery must not narrow it onto nothing; a change that makes the bootstrap pass by evaluating less would be the false green this framework exists to prevent.
- **Criterion:** A document that is not a proposal can be placed in or beside the proposal directory without being reported as a broken proposal, and the adopter can tell from the documentation where it goes. Observable by placing a README as E6's author did. This is the criterion alternative (a) alone does not meet.

## Kill criteria

- **Criterion:** If the chosen design would cause a real proposal to be skipped without any output saying so, it stops. Observer: the second success criterion plus a fixture holding a misnamed real proposal; trigger: that fixture evaluating to zero findings. A silently unevaluated proposal is worse than the defect being fixed.
- **Criterion:** If fixing this requires Standard 13's definition of the canonical path to be reopened, the code change stops and the standard is revised first. Observer: the diff; trigger: any change to what the canonical path means. Editing the mechanism to make the standard's wording work out backwards is the substitution Standard 14 prohibits.

## Experiment plan

- **Question:** Does an adopter who is not the standards author read `NON_COMPLIANT` against `TEMPLATE.md` as an instruction, or as a broken tool?
- **Method:** Bootstrap a repository for one person who has not seen this framework, give them the adopter guide and nothing else, and record what they do after the first `validate`. One participant is not a study; it is the difference between two observations and one contaminated one.
- **Supports proceeding:** They delete or move the file and continue, but report the first impression as a defect — the problem is real and cosmetic-severity, and the cheapest alternative is enough.
- **Does not support proceeding:** They conclude the tooling is broken, or they edit the template until it passes — which would produce exactly the always-passing template E4 exists to prevent, and would argue for alternative (e), removing the artifact rather than relocating it.

## Portfolio

- **Overlap:** Shares a file and an origin with proposal 0004 and nothing else. That one is about what `init` concludes; this is about what `init` writes and what `validate` reads.
- **Cannibalization:** None.
- **Priority:** Below 0004. This defect is loud, deterministic, and worked around in a minute by anyone who reads the error. 0004's is silent and fails toward fabricated history.

## Decision

- **Outcome:** explore
- **Rationale:** E7 establishes the defect and its cause from the implementation and from an observed failure, so nothing more is needed to believe the problem. The remedy is open, and E6 is what keeps it open: the obvious fix — move the template — addresses the file that was noticed and not the contract that produced it, and a directory that still cannot hold its own README would send the next adopter back here. The five alternatives split across two different contracts, and the one design question that matters, whether narrowing discovery can be done without ever silently skipping a real proposal, is recorded as an Unknown rather than assumed away. `explore` rather than `build` because the cheapest fix is also the one most likely to be wrong, and choosing it now would look like a decision while being a reflex.
- **Decided:** 2026-08-09
