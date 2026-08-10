# Proposal 0004 — `standards init` infers greenfield in the direction it calls dangerous

- **Proposal type:** enhancement
- **Status:** READY
- **Target:** InnovationStandards

## Problem

- **Statement:** `detectMode` decides whether a repository is greenfield by testing thirteen implementation markers at the repository root only. A repository whose code lives one directory down — any monorepo, any multi-service layout, any repository with a `backend/` and a `frontend/` — matches none of them and is classified `greenfield`. That classification suppresses the `undocumented-decisions` warning, which is the one output telling an adopter with shipped work not to back-fill proposals for it. The code names this exact failure as the hazard to avoid: *"a false 'greenfield' is the dangerous direction, because it lets a clean-room plan be scaffolded over real code, and that is a fabricated history."* The safety mechanism fails toward the state its own design identifies as dangerous.
- **Who is affected:** An adopter whose repository does not put its code at the root, and who receives no warning precisely because their repository is large enough to have outgrown a flat layout. The suppressed warning is load-bearing: an adopter who never sees it, and who is trying to be diligent, is left with an empty proposal directory and an obvious-looking way to fill it.
- **Why it matters now:** It is no longer hypothetical. The first repository ever to adopt these standards was misclassified on the first run, and the misclassification was in the dangerous direction. Every further adoption in this portfolio compounds it, because the portfolio's repositories are not flat.

## Evidence

- **E1 [observation]** `IMPLEMENTATION_MARKERS` is tested with `existsSync(path.join(root, p))` and no recursion: detection reaches exactly one directory level (source: scripts/init.mjs)
- **E2 [observation]** `detectMode` returns `GREENFIELD` from an early return as soon as `implementation.length === 0`, before `PLAN_MARKERS` or `PROMPT_MARKERS` are consulted at all (source: scripts/init.mjs)
- **E3 [observation]** The module's own comment names a false greenfield as the dangerous direction and a false existing as merely a routing cost the operator can override (source: scripts/init.mjs)
- **E4 [technical-evidence]** HouseDoc — 80 commits, 372 tracked files, a Python backend, a Flutter app and a database — was classified `greenfield` on its first `standards init --dry-run`. Its markers exist at `backend-api/pyproject.toml` and `mobile-app/`, one level below the root (source: observed during the HouseDoc adoption, commit 44f3bab on branch develop)
- **E5 [technical-evidence]** HouseDoc does carry a signal detection already knows how to read — `artifacts/prompts/`, a `PROMPT_MARKERS` entry with two files in it — and that signal was never reached, because the greenfield early return in E2 fires first. The information needed for a correct answer was present and discarded (source: observed during the HouseDoc adoption; markers listed in scripts/init.mjs)
- **E6 [observation]** The correct mode was reachable only by the operator passing `--mode=undocumented-decisions`, which requires already knowing the answer the tool exists to supply (source: scripts/init.mjs)
- **E7 [assumption]** Other repositories in this portfolio would be misclassified the same way. Consistent with their layouts and untested; one adopter is one data point.
- **E8 [validated-conclusion]** Root-only detection produces false greenfield on a real repository, and the false greenfield suppresses the warning it exists to deliver (from: E1, E2, E4, E5)

## Assumptions and uncertainty

- **Assumption:** Detection should continue to guess at all. That is the premise every alternative below except the last one shares, and it is not self-evident — a tool that refuses to guess is not obviously worse than one that guesses conservatively.
- **Assumption:** The warning changes behaviour. Nobody has been observed acting on it or failing to; the adopter who missed it here was the standards author, who knew the answer independently. The harm is inferred from the design's own reasoning rather than measured.
- **Unknown:** Which signal actually separates the three modes. Directory depth, git history, tracked-file count, and the presence of prompt artifacts are all candidates and no two of them have been compared on the same set of repositories.
- **Unknown:** How much detection can cost. Recursion has a depth, a breadth, and an exclusion list — `node_modules`, `.venv`, `vendor`, build output — and none of those is currently decided. An unbounded walk of a large monorepo is a different tool from a two-level `existsSync`.
- **Unknown:** Whether a wrong answer that is loudly labelled is acceptable. Detection already reports `INFERRED` and prints its evidence. Whether that visibility is sufficient, and the defect is that nobody reads it, is a different problem with a different remedy.

## Existing capability

- **Searched:** `scripts/init.mjs` in full — `detectMode`, `IMPLEMENTATION_MARKERS`, `PLAN_MARKERS`, `PROMPT_MARKERS`, `has`, `hasContent`, and the `--mode` override; the `plan`/`apply` split and its `modeConfidence`/`modeEvidence` reporting; `test/init.test.mjs`; and the thirty rules in the catalog.
- **Finding:** Three mechanisms already exist and none of them closes this. `--mode` is a correct override but requires the operator to know the answer. `modeConfidence: "INFERRED"` and `modeEvidence` correctly disclose that a guess was made and on what basis — the guess is visible, and it is still wrong. `hasContent` already encodes the lesson that a marker's presence is not automatically evidence, but it is applied only to plan and prompt markers, never to implementation markers. Nothing recurses, and no rule in the catalog has `init`'s output as its subject.

## Alternatives

- **Do nothing:** Every non-flat repository is classified greenfield and the back-fill warning is suppressed for the adopters most likely to need it. The cost is invisible by construction: a missing warning leaves no trace, and the failure it enables — a fabricated retrospective proposal — is indistinguishable from a real one once written. Not viable as a resting state, which is why this proposal exists at all.
- **Build:** Five distinct designs, deliberately not chosen here. (a) **Bounded recursion** — scan markers to a fixed depth with an exclusion list; cheap, and it inherits every question about depth, breadth and cost that the Unknowns above record. (b) **Git evidence** — commit count and tracked-file count answer "has this repository shipped work" directly rather than by proxy, and are unavailable when the target is not a git repository. (c) **Multiple signals with no early return** — evaluate implementation, plan and prompt markers together and combine them; E5 shows the current early return is discarding information the tool already has, so this is the smallest change that uses what is present. (d) **Require an explicit mode when signals are weak or conflicting** — refuse to guess, exit non-zero, and tell the operator what to pass; converts a silent wrong answer into a loud absent one. (e) **Remove automatic greenfield inference entirely** — greenfield becomes a mode you declare, never one you are assigned, on the grounds that the only mode whose misapplication is dangerous should not be reachable by inference. These are not variants of one design; (d) and (e) reject the premise that (a), (b) and (c) share.
- **Buy:** Not viable. No product classifies a repository against this framework's three modes, and the modes are this framework's own vocabulary.
- **Integrate:** Partly viable and worth evaluating rather than assuming. Linguist, tokei, cloc and similar tools already answer "what is in this repository and how much of it" far better than thirteen filename tests. Each is a third-party dependency, and this repository having none is a structural property of its CI, not a preference — so integration would have to be optional and degrade cleanly, which may cost more than it saves. Named because the alternative must be evaluated, not because it looks likely.

## Value and alignment

- **User value:** An adopter with shipped work is told not to back-fill proposals for it, which is the moment that advice can still be acted on. Today the adopters most likely to have shipped work are exactly the ones who do not receive it.
- **Expected impact:** Removes one route by which this framework's own bootstrap can produce fabricated history. How often that route is actually taken is unmeasured — one adopter was misclassified, and no fabricated proposal resulted, because the operator knew better independently.
- **Differentiation:** None claimed against anything external.
- **Strategic alignment:** Directly serves `innovation.no-fabricated-evidence`, an invariant-class rule. A bootstrap that scaffolds a clean-room start over real code is the tooling creating the exact condition an invariant prohibits, which makes this a defect in the framework's integrity rather than a usability complaint.

## Costs

- **Implementation:** Unknown until the design is chosen, and the spread is the point. (c) is an hour. (a) is a day once depth, breadth and exclusions are decided. (b) adds a git dependency and a not-a-repository path. (d) and (e) are small in code and large in contract — they change what `init` does when it does not know, which is a behavioural change every existing adopter's automation would see.
- **Maintenance:** A marker list is a permanent tail: every ecosystem that appears wants an entry, and each entry is a claim about the world that ages. (b) and (d) reduce that tail; (a) lengthens it.
- **Operational:** Recursion is the only alternative with a runtime cost, and on a large monorepo without exclusions it is not negligible. `init` is run once per adoption, so the ceiling is low — but "run once" is also why nobody will notice it being slow enough to be wrong.
- **Opportunity cost:** This competes directly with proposal 0005, which is the other defect the same adoption surfaced. Both are `init` defects found the same day; neither is the framework's normative content, and time here is time not spent on the standards themselves.
- **Technical debt:** Choosing (a) settles this framework on filename heuristics as the way it understands a repository, and every future question of the same kind will be answered by adding to the list. (d) and (e) settle it the other way — the tool declines to know things it cannot establish. That is a durable architectural commitment either way, and it is the reason this proposal does not pick one.

## Security and privacy

- **Implications:** Recursive scanning reads directory names the current implementation never touches, and any evidence line printed from a deep walk can surface a path an operator did not expect to see in output. Neither reads file contents. No new data is stored or transmitted.
- **Applicable standards:** This repository's own fourteen. A change to `init`'s behaviour when signals are absent is a change to a documented contract, and `--mode` refusing to proceed would be a breaking change under the versioning policy in [CHANGELOG.md](../../CHANGELOG.md).

## Scope and MVP

- **Release objective:** `standards init` must not classify a repository containing shipped work as greenfield.
- **MVP:** Whatever the smallest change is that satisfies the objective under the chosen design. It is deliberately not specified here — naming an MVP before choosing among (a)–(e) would be choosing among them.
- **Out of scope:** Detecting *which* work is undocumented; recording a governance-effective date; any change to what the three modes mean; any change to `apply`; and any rule that takes `init`'s output as its subject.

## Success criteria

- **Criterion:** A fixture repository whose only implementation markers are below the root is not classified greenfield. Observable by running the suite, and it must fail before the change lands — the current implementation must be shown to produce the wrong answer on that fixture first.
- **Criterion:** A genuinely empty directory is still classified greenfield. Observable in the same run. Without this the fix is a fix in one direction only, and the mode becomes unreachable.
- **Criterion:** Whatever the tool concludes, it reports the evidence it concluded it from, and a reader can tell a guess from a certainty. Observable in `render` output; already true today and must survive the change.

## Kill criteria

- **Criterion:** If no design can be found that fixes the monorepo case without misclassifying a genuinely empty repository, the work stops and alternative (e) — no automatic greenfield — is taken instead of a detection improvement. Observer: the fixture pair in the success criteria; trigger: a design that passes the first criterion and fails the second.
- **Criterion:** If the chosen design requires a third-party dependency, it stops. Observer: the diff; trigger: any addition to `package.json`. This repository's zero-dependency CI is structural, and trading it for better repository detection is not a trade this proposal is authorised to make.
- **Criterion:** If detection cost on a large repository exceeds the whole runtime of `standards validate`, the recursive designs are abandoned. Observer: a timed run against HouseDoc; trigger: `init --dry-run` slower than a full validate.

## Experiment plan

- **Question:** Which signal actually separates a repository that has shipped work from one that has not — and does any of them get all three modes right at once?
- **Method:** Run each candidate detector — bounded recursion at depths 2 and 3, git commit and tracked-file counts, and combined-signals-without-early-return — against a fixed set: HouseDoc, InnovationStandards, EngineeringStandards, an empty directory, and a fresh `git init` with one README. Record every classification. The set deliberately includes two cases that must come out greenfield and three that must not.
- **Supports proceeding:** One candidate classifies all five correctly, and its cost and dependency profile are acceptable.
- **Does not support proceeding:** No candidate gets all five right, or the ones that do require a dependency or a walk this repository will not pay for. That result argues for alternative (d) or (e) — refusing to infer — and this proposal would return with that as its recommendation rather than a detection improvement.

## Portfolio

- **Overlap:** Overlaps proposal 0005 in surface only. Both are `init` defects surfaced by the same adoption, and both would touch `scripts/init.mjs` — but 0005 is about what `init` writes and this is about what `init` concludes. Merging them would produce one proposal with two problems and two solution spaces, which is the shape that makes a decision unreviewable.
- **Cannibalization:** None. Nothing in the framework currently answers this question.
- **Priority:** Above 0005. Both are real; this one fails toward fabricated history, which an invariant-class rule prohibits, while 0005 fails loudly and is trivially worked around by an adopter who sees the error.

## Decision

- **Outcome:** explore
- **Rationale:** The problem is established rather than suspected — E8 rests on the implementation and on an observed misclassification of a real repository, not on inference about what might happen. What is undecided is the remedy, and the five alternatives are not variants of one design: (a) through (c) improve the guess, while (d) and (e) reject the premise that the tool should guess. Choosing between improving detection and abolishing it is an architectural commitment about what this framework claims to know, and nothing available today settles it. `explore` rather than `build` because naming an MVP now would be selecting the design silently; `explore` rather than `defer` because the defect is confirmed and the experiment that discriminates between the alternatives is cheap, specified above, and can run immediately.
- **Decided:** 2026-08-09
