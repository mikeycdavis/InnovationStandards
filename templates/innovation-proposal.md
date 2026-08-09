# Proposal NNNN — Title

<!--
  Copy this file to artifacts/innovation-proposals/NNNN-<kebab-slug>.md and complete it.

  The structure is parsed, not merely read. Keep the `## Section` headings and the
  `- **Field:** value` lines exactly as written — a renamed section is an absent section as far as
  `standards check` is concerned. Prose inside a field is yours to write.

  Run `standards check artifacts/innovation-proposals/NNNN-<slug>.md` as you go. Run
  `standards explain <rule-id>` to find out what any rule actually requires.

  Reaching a conclusion of `reject`, `defer`, or `insufficient-evidence` is a SUCCESSFUL use of this
  document. This repository evaluates the quality of the decision, not whether the idea gets built.
-->

- **Proposal type:** feature | enhancement | architectural-change | product-change | new-project
- **Status:** NOT_STARTED | READY | IN_PROGRESS | BLOCKED | IN_REVIEW | COMPLETE | DEFERRED | CANCELLED
- **Target:** the project or product this proposal is about

## Problem

- **Statement:** What is wrong. Describe a condition in the world, not the absence of your solution. If the problem disappears when the idea does, the problem was the idea.
- **Who is affected:** Someone other than the author. If the only beneficiary is this team, say so plainly.
- **Why it matters now:** What changed — in scale, cost, obligation, or circumstance. Without a change, this is a permanent condition rather than a problem.

## Evidence

<!--
  Grammar, parsed literally:
    - **E1 [level]** the claim (source: repo/relative/path.md)
    - **E4 [validated-conclusion]** the claim (from: E1, E3)

  Levels: observation, assumption, hypothesis, user-evidence, market-evidence,
          technical-evidence, experiment-result, validated-conclusion

  A validated-conclusion MUST cite the entries supporting it, and those must not be only
  assumptions or hypotheses. Recording an honest `assumption` is always better than an
  unsupported `user-evidence`. Never raise a level to clear a check.
-->

- **E1 [observation]** What you directly saw, and where a reader can see it too (source: path/or/url)
- **E2 [assumption]** What you are taking as true without support
- **E3 [hypothesis]** What you would test, and have not yet

## Assumptions and uncertainty

- **Assumption:** What this proposal rests on that could turn out to be false.
- **Unknown:** What you do not know that materially affects the decision. Omitting it does not resolve it.

## Existing capability

- **Searched:** Which projects, products, and capabilities you examined. Name them — this is the boundary of the search, and a reader needs it to judge whether the search was wide enough.
- **Finding:** What exists, and specifically why it does or does not already solve the problem.

## Alternatives

- **Do nothing:** What happens if nothing is built. This is the baseline every other option is measured against.
- **Build:** Write it ourselves — what that involves.
- **Buy:** Purchase something that does this. Name what you evaluated. "Not viable — <reason>" is an answer; blank is not.
- **Integrate:** Connect something that already exists. Same rule as above.

## Value and alignment

- **User value:** What changes for the affected party, expressed as something they would notice. Read it back to them in your head; if they would not recognise it, rewrite it.
- **Expected impact:** What happens if this succeeds. This is an evidence claim — most honest answers here are hypothesis or assumption.
- **Differentiation:** What distinguishes this from what already exists. A competitor shipping something is a reason to investigate, not a reason to build.
- **Strategic alignment:** Which stated objective this serves, and how. If there is no alignment, say so — that is a legitimate finding.

## Costs

- **Implementation:** Effort and complexity to build.
- **Maintenance:** What it costs to keep working, indefinitely, after the people who built it move on.
- **Operational:** What it costs to run — infrastructure, monitoring, on-call, support.
- **Opportunity cost:** What does not get done because this does. The hardest cost to see and the most often omitted.
- **Technical debt:** What this approach will make harder later.

## Security and privacy

- **Implications:** What data this touches and what new exposure it creates.
- **Applicable standards:** Which security, privacy, engineering, financial, legal, or regulatory obligations apply. Being experimental exempts nothing.

## Scope and MVP

- **Release objective:** One statement of what this release is for. Any later change to this line is a change to what the proposal is, and is recorded with its date and reason.
- **MVP:** The least that would satisfy the release objective.
- **Out of scope:** What is deliberately excluded. This list is what makes a later inclusion a visible decision rather than a drift.

## Success criteria

- **Criterion:** Observable by someone who did not write this proposal, and written now — before the result is known.

## Kill criteria

- **Criterion:** The observable condition under which this work stops. It needs a trigger, a threshold, and someone who would see it. A criterion that cannot fire is not a criterion.

## Experiment plan

<!-- Required when the outcome is explore, validate, or prototype. Expected when a build rests on
     hypothesis-level evidence. Delete the section only if genuinely not applicable. -->

- **Question:** The decisive uncertainty this would resolve.
- **Method:** What you would actually do.
- **Supports proceeding:** The result that would support going ahead.
- **Does not support proceeding:** The result that would not. If you cannot write this line, the experiment cannot fail and is not a test.

## Portfolio

- **Overlap:** What else in the portfolio addresses this problem or overlaps this capability.
- **Cannibalization:** What this would take business, users, or attention away from. Cannibalizing your own weaker product can be right — it must be a decision rather than a surprise.
- **Priority:** Where this sits relative to other work. If everything is a priority, nothing has been prioritised.

## New project justification

<!-- Required if and only if Proposal type is new-project. Delete this section otherwise.
     The burden of proof is on separation, not on inclusion. -->

- **Existing project ownership:** Which existing project could own this capability, and why it should not.
- **Duplicated infrastructure:** What build, deploy, auth, logging, and monitoring would be stood up again.
- **Duplicated domain logic:** What concepts and rules would exist in two places, and how they stay consistent.
- **Maintenance cost:** The ongoing cost of a second thing to keep alive.
- **Deployment cost:** A second pipeline, second environments, second release process.
- **Support burden:** Who answers questions about it, and how users know where to ask.
- **Fragmented user experience:** What users now have to learn, navigate, or reconcile across two places.
- **Portfolio complexity:** What this adds to the cost of understanding the portfolio as a whole.

## Decision

- **Outcome:** explore | validate | prototype | build | defer | reject | merge-with-existing | insufficient-evidence
- **Rationale:** Why this outcome follows from the evidence above.
- **RevisitWhen:** Required if and only if the outcome is defer or insufficient-evidence. Name the observable event that should reopen this decision.
- **Decided:** YYYY-MM-DD
