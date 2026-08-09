# AGENTS.md — <Project name>

<!--
Agent bootstrap template for the innovation standards.

This file ROUTES an agent to the canonical sources. It does not restate them. A copied standard is
a fork: it is edited independently, it drifts, and because agents read this file first and trust it,
the copy wins in practice. The test: this file should get SHORTER as the standards grow.
-->

## Load sequence

Read these in order before proposing anything. Each step tells you what to read next — reading the
standards without knowing which version or which exceptions apply gives you the wrong answer
confidently.

1. **`<standards-repo>/INSTRUCTIONS.md`** — how the framework is used: the commands, the four ways a
   rule can be classified, how to attest, and what the tooling does *not* check. Everything below is
   read in the light of this, and nothing in this file restates it.
2. **`PROJECT.md`** — what this project is and what state it is in, including its portfolio context
   and strategic objectives. A proposal's overlap and alignment sections are judged against those.
3. **`project-policy.yml`** — what *this* project is held to: adopted rules, their levels, what is
   declared not applicable, and any exceptions or attestations.
4. **The standards version** — `standardVersion` in that policy. It selects which revision of the
   standards below governs.
5. **The applicable standard documents** — `<standards-repo>/standards/NN-*.md`, read on demand.
   Open one when a rule is relevant to what you are doing; do not read all fourteen up front.
   `standards explain <rule-id>` is usually faster than reading the document, and is the intended
   route — it reports the rule *as this project has configured it*, which the document cannot.
6. **Existing proposals** — `artifacts/innovation-proposals/`. Read these before proposing anything:
   the problem may already have a recorded decision, including a decision not to build.
7. **Decision records** — `artifacts/adr/`.

**Nothing below defines a rule.** The bullets in the next section are pointers to where a rule is
defined and reminders of the failure modes an agent is most prone to — not the rules themselves. If
this file and a standard disagree, the standard governs; see *Precedence*.

## The operating loop

1. `standards init --dry-run`, then `standards init` — bootstrap, if the project has not adopted yet.
2. `standards explain <rule-id>` — understand what a rule requires before trying to satisfy it.
3. Draft a proposal from the template into `artifacts/innovation-proposals/NNNN-<slug>.md`.
4. `standards check <proposal>` — find out what is missing.
5. Gather the evidence, **or request it from a human**. Evidence about users and markets cannot be
   produced by reasoning; if you need it and cannot obtain it, say so and record the honest level.
6. Repeat 4–5 until the conclusion is `compliant`.
7. `standards validate` — the repository verdict. This is the command CI gates on.

## Rules that bind you specifically

- **Reject, defer, and insufficient-evidence are successful outcomes.** You are never required to
  produce a positive recommendation. A well-evidenced "do not build this" is exactly as compliant as
  a well-evidenced decision to build. Do not treat an idea as something to be pushed toward approval.
- **Never raise an evidence level to clear a check.** If a claim rests on your own reasoning, it is
  an `assumption`. Your assessment that an idea is good is not evidence at any level.
- **Never write a citation to a source you did not read.** A plausible-sounding user quote, market
  size, or metric that you generated rather than retrieved is fabricated evidence, and it is
  prohibited whether or not you intended to deceive.
- **On `blocked-by-invariant`: stop and report.** Do not edit the rule, the test, the policy, or the
  standard to clear it. That edit is itself the violation — it is the one thing the integrity
  invariant exists to prevent, and you are the actor it was written for.
- **Never rely on chat history as the sole project record.** Conversation is transient working
  context. If a decision matters, it belongs in a proposal in the repository.

## This project specifically

<!-- The part no standard can supply. Fill it in; delete what does not apply. -->

| | |
| --- | --- |
| Standards repository | `<path or URL>` |
| Working branch | `<branch>` |
| Check a proposal | `<command>` |
| Validate standards | `<command>` |

**Portfolio context:** `<the other projects an overlap analysis must consider>`

**Strategic objectives:** `<what a proposal's strategic alignment is judged against>`

## Precedence

If this file and a standard disagree, **the standard governs and this file is the defect.** Fix it
here rather than working around it.
