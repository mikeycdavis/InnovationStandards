# Proposal 0006 — `init` reads prompt artifacts as recorded innovation decisions

- **Proposal type:** enhancement
- **Status:** READY
- **Target:** InnovationStandards

## Problem

- **Statement:** `detectMode` maps the presence of `artifacts/prompts/` to `EXISTING_WITH_PROPOSALS`, a mode whose name and downstream behaviour both assert that the project's innovation decisions are already recorded. A prompt is an input to a decision, not a decision — it is the instruction that produced work, and it carries no outcome, no evidence, and no rationale. A repository holding prompt artifacts and zero proposals is told that its decisions are on record when none of them are, and the `undocumented-decisions` guidance it should have received is suppressed.
- **Who is affected:** An adopter whose repository keeps prompt or specification artifacts under `artifacts/prompts/` — which this framework's own conventions encourage — and who therefore receives the mode reserved for repositories that have already adopted the proposal discipline.
- **Why it matters now:** It is observed, not hypothetical, and it is observed on a repository in this portfolio. It also blocks a decision already taken: proposal 0004 is authorized to correct the false-greenfield defect, and the candidate that motivated that authorization gets its accuracy partly from treating prompts as prior work rather than as decisions. Whoever implements 0004 must take a position on this question, so leaving it unowned means it will be answered silently inside another proposal's implementation.

## Evidence

- **E1 [observation]** `PROMPT_MARKERS` contains exactly `artifacts/prompts`, and a non-empty match returns `MODES.EXISTING_WITH_PROPOSALS` with the evidence line "prompt artifacts" (source: scripts/init.mjs)
- **E2 [observation]** The two markers are treated as interchangeable routes to one mode: `PLAN_MARKERS` and `PROMPT_MARKERS` return the same value from adjacent branches, so a directory of prompts and a directory of recorded proposals are indistinguishable in the output (source: scripts/init.mjs)
- **E3 [technical-evidence]** `EngineeringStandards` — 102 commits of shipped work and zero innovation proposals — is classified `existing-with-proposals` today. Its root holds `package.json`, so the greenfield return never fires and depth is not implicated; `artifacts/prompts/` alone produces the wrong mode (source: artifacts/experiments/0004-mode-detection/RESULTS.md)
- **E4 [technical-evidence]** The same misclassification is reachable by a second route. Under bounded recursion, HouseDoc moves from `greenfield` to `existing-with-proposals` rather than to the correct mode, because recursion only changes which branch is reached and this branch is the one waiting (source: artifacts/experiments/0004-mode-detection/RESULTS.md)
- **E5 [observation]** This framework already draws the distinction elsewhere and enforces it. Only `artifacts/innovation-proposals/NNNN-slug.md` is parsed as a proposal; nothing under `artifacts/prompts/` is, and prose there cannot trigger a single detector. The mode inference is the one place the two are conflated (source: scripts/standards.mjs)
- **E6 [observation]** `hasContent` exists because a directory's presence was once wrongly taken as evidence — `init` read its own empty scaffolding as proof that decisions had been recorded. The lesson was applied to emptiness and not to meaning: a populated prompts directory now supplies the same false proof that an empty proposals directory once did (source: scripts/init.mjs)
- **E7 [assumption]** Adopters keep prompt artifacts at this path often enough for the defect to be common. Two of the three repositories examined do, and both were written by the same author, so the sample says more about one portfolio's conventions than about adopters generally.
- **E8 [validated-conclusion]** Prompt artifacts are routed to a mode that asserts recorded decisions, on a repository that has none, by a mechanism independent of the depth defect (from: E1, E2, E3, E5)

## Assumptions and uncertainty

- **Assumption:** `undocumented-decisions` is the right destination for a prompt-bearing repository with no proposals. It follows from what the modes mean, and it has not been tested against an adopter who received it.
- **Assumption:** The mode changes what an adopter does. Inherited from 0004 and no better established here: nobody has been observed acting differently because of the mode they were assigned.
- **Unknown:** Whether prompt artifacts should inform the mode at all. They may be evidence of prior work, which is a different claim from evidence of recorded decisions, and a signal that supports neither mode cleanly may be better dropped from inference than remapped.
- **Unknown:** Whether this is a breaking change. Any adopter whose automation reads the mode will see a different answer for the same repository, and the versioning policy treats a changed contract as more than a patch.
- **Unknown:** Whether `PLAN_MARKERS` has the same defect in a milder form. `PLAN.md` is a plan, not a recorded innovation decision either, and this proposal has not examined it.

## Existing capability

- **Searched:** `detectMode`, `PLAN_MARKERS`, `PROMPT_MARKERS`, `hasContent` and the `--mode` override in `scripts/init.mjs`; the proposal path anchoring in `scripts/standards.mjs`; the three mode definitions and their downstream effects; and proposal 0004 in full.
- **Finding:** Nothing addresses it. `--mode` overrides the answer but requires the operator to already know it, which is the same limitation 0004 records. The path anchoring in the evaluator draws exactly the distinction this defect erases, so the framework holds both positions at once — strict about what a proposal is when evaluating, loose about it when inferring. No rule takes `init`'s output as its subject, so nothing detects the disagreement.

## Alternatives

- **Do nothing:** Every repository following this framework's own prompt conventions is told its decisions are recorded. The cost is the same shape as 0004's — a suppressed warning leaves no trace — and it additionally makes the mode actively misleading rather than merely unhelpful. It also does not stay contained: whoever implements 0004 must decide this question anyway, so "do nothing" means deciding it without a record.
- **Build:** Three designs. (a) **Remap** — prompt artifacts route to `undocumented-decisions` rather than `existing-with-proposals`, on the grounds that they evidence prior work and not recorded decisions. Smallest change; keeps the signal and corrects its meaning. (b) **Drop** — remove `PROMPT_MARKERS` from mode inference entirely, on the grounds that a signal which supports neither mode should not be consulted; a prompt-bearing repository is then classified on its implementation markers alone. (c) **Report separately** — keep the mode independent of prompts and print prompt artifacts as evidence without letting them route, which preserves the information for a reader without letting it decide. (a) and (b) differ only for a repository whose *only* signal is prompts; (c) changes what the output is for rather than what it concludes.
- **Buy:** Not viable. The three modes and the meaning of a recorded proposal are this framework's own vocabulary.
- **Integrate:** Not viable, and for a different reason than in 0004. No external tool has an opinion about whether a prompt constitutes a recorded decision, because that judgement is the framework's definition rather than a fact about the repository.

## Value and alignment

- **User value:** An adopter with unrecorded decisions is told so, instead of being told the opposite. That is the one output which can still change what they do on the day they adopt.
- **Expected impact:** Corrects the second of the two mechanisms by which `init` misreports a repository. Unmeasured in behavioural terms, exactly as 0004's is.
- **Differentiation:** None claimed against anything external.
- **Strategic alignment:** Serves the same invariant as 0004 from the other side. `innovation.no-fabricated-evidence` prohibits fabricated evidence of governance; a bootstrap that reports recorded decisions for a repository holding none is the tooling asserting governance that does not exist.

## Costs

- **Implementation:** Small under any of the three designs — a branch, a deletion, or a moved output line. The cost is not in the code.
- **Maintenance:** (b) shortens the marker surface permanently. (a) and (c) keep it and inherit every future question about which paths count.
- **Operational:** None. No new traversal, no new file read, no runtime change of any consequence.
- **Opportunity cost:** Competes with 0004's implementation for the same file and the same reviewer, and with 0005, which is still `explore` on the same script.
- **Technical debt:** Deciding this settles what the framework claims to infer from an artifact it does not parse. Leaving it undecided while 0004 is implemented is the more expensive path, because the position gets taken in code without a decision record — which is the failure this repository exists to prevent.

## Security and privacy

- **Implications:** None. No new path is read, no file content is inspected, and no data is stored or transmitted.
- **Applicable standards:** This repository's own fourteen. A change to which mode `init` reports for an unchanged repository is a change to a documented contract, and its classification under the versioning policy in [CHANGELOG.md](../../CHANGELOG.md) is one of the Unknowns above rather than a settled question.

## Scope and MVP

- **Release objective:** `standards init` must not report that a repository's innovation decisions are recorded when the repository holds no recorded innovation decisions.
- **MVP:** Not specified. Naming one would choose among (a), (b) and (c), and the choice is what this proposal is for.
- **Out of scope:** The false-greenfield defect and anything about implementation-marker depth, both owned by [0004](0004-init-mode-inference-safety.md); what `init` writes, owned by [0005](0005-bootstrap-artifacts-fail-their-own-gate.md); the meaning of the three modes themselves; and whether `PLAN_MARKERS` has a milder form of the same defect, which is recorded above as an Unknown and not claimed here.

## Success criteria

- **Criterion:** A fixture repository holding populated `artifacts/prompts/` and no proposals is not classified `existing-with-proposals`. Observable in the suite, and it must fail against the current implementation first.
- **Criterion:** A repository holding populated `artifacts/innovation-proposals/` is still classified `existing-with-proposals`. Observable in the same run; without it the change is a correction in one direction only and the mode becomes unreachable.
- **Criterion:** Whatever is concluded, prompt artifacts still appear in the reported evidence, so a reader can see what the tool saw. Observable in `render` output.

## Kill criteria

- **Criterion:** If no design distinguishes the two directories without making `existing-with-proposals` unreachable, the work stops and the mode itself is reconsidered instead. Observer: the fixture pair above; trigger: a design passing the first criterion and failing the second.
- **Criterion:** If 0004's implementation lands a position on this question first, this proposal stops and is rewritten to describe what was decided rather than to decide it. Observer: the diff to `scripts/init.mjs`; trigger: any change to the prompt-marker branch made under 0004's authority.

## Experiment plan

- **Question:** Does removing prompts from mode inference change any classification that remapping them would not, on repositories that actually exist?
- **Method:** Extend the harness at `artifacts/experiments/0004-mode-detection/harness.mjs` with designs (a), (b) and (c) and run it against the same six subjects plus two new ones: a repository whose only signal is a populated `artifacts/prompts/`, and one holding both prompts and proposals. Record every classification.
- **Supports proceeding:** The designs differ on at least one real subject, which means the choice among them is a decision with consequences and can be made on evidence.
- **Does not support proceeding:** All three agree on every subject, in which case the distinction is unobservable at this sample size and the cheapest design should be taken without claiming the experiment chose it.

## Portfolio

- **Overlap:** Shares a function with [0004](0004-init-mode-inference-safety.md) and a file with [0005](0005-bootstrap-artifacts-fail-their-own-gate.md). The overlap with 0004 is real and directional rather than cosmetic: 0004 is authorized to build, and the candidate that justified that authorization derives part of its accuracy from treating prompts as prior work rather than as decisions. This proposal owns that question. If it is still undecided when 0004 is implemented, the correct move is for 0004 to correct only the greenfield direction and leave the prompt branch exactly as it is — a repository that ends up wrongly in `existing-with-proposals` is then this proposal's defect, unchanged and still visible, rather than a position taken silently.
- **Cannibalization:** None. Nothing else in the framework answers what a prompt artifact implies.
- **Priority:** Below 0004 in sequence and above 0005 in urgency. 0004 fails toward fabricated history and is already authorized; this one fails toward asserted governance, which is the same invariant from the other direction; 0005 fails loudly and an adopter who sees it can work around it.

## Decision

- **Outcome:** explore
- **Rationale:** The defect is established rather than suspected — E3 is an observed misclassification of a real repository by a mechanism the experiment isolated, and E8 rests on the implementation rather than on inference. What is open is the remedy, and the three designs are not variants: (a) keeps the signal and corrects its meaning, (b) says the signal should not inform the mode at all, and (c) says the mode is the wrong place to express it. Choosing among them is a claim about what `init` is entitled to infer from an artifact this framework deliberately does not parse. `explore` rather than `build` because naming an MVP now would select a design silently, which is the objection 0004 recorded against itself and had to run an experiment to answer; `explore` rather than `defer` because the discriminating experiment is cheap, is specified above, and reuses a harness that already exists.
- **Decided:** 2026-08-12
