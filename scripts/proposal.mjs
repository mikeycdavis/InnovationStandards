/**
 * The innovation proposal: the domain's unit of evaluation, and the vocabulary that describes it.
 *
 * This module is pure — no filesystem, no process, no policy. It exists separately from the CLI for
 * two reasons. It is importable by tests without running a command line, and it keeps the domain's
 * closed sets in one place: a second definition of what an outcome or an evidence level is would
 * eventually disagree with this one, and the disagreement would surface as a rule that cannot be
 * satisfied.
 *
 * The parser is deliberately strict about position and grammar. A level named in a sentence is not
 * an evidence entry; a field inside template commentary is not an answer. That strictness plus the
 * canonical-path restriction in the CLI is the whole mentions-versus-uses guard (ADR 0004).
 */

/** Standard 10 R1. Closed. Six of the eight are not "build it". */
export const OUTCOMES = new Set([
  "explore", "validate", "prototype", "build",
  "defer", "reject", "merge-with-existing", "insufficient-evidence",
]);

/** Standard 2 R1. Closed. A claim with no level is unclassifiable, not merely weak. */
export const EVIDENCE_LEVELS = new Set([
  "observation", "assumption", "hypothesis", "user-evidence",
  "market-evidence", "technical-evidence", "experiment-result", "validated-conclusion",
]);

/** Levels that do not, on their own, support a validated conclusion (Standard 2 R2). */
export const UNSUPPORTING = new Set(["assumption", "hypothesis"]);

/** Levels a build decision can rest on (Standard 9 R1). */
export const BUILD_EVIDENCE = new Set(["experiment-result", "user-evidence", "technical-evidence"]);

export const PROPOSAL_TYPES = new Set([
  "feature", "enhancement", "architectural-change", "product-change", "new-project",
]);

/** Standard 13 R2. Sections every proposal carries, in the order the template presents them. */
export const REQUIRED_SECTIONS = [
  "Problem", "Evidence", "Assumptions and uncertainty", "Existing capability",
  "Alternatives", "Value and alignment", "Costs", "Security and privacy",
  "Scope and MVP", "Success criteria", "Kill criteria", "Portfolio", "Decision",
];

/** Standard 12 R2. The eight separation considerations, as eight named fields. */
export const NEW_PROJECT_FIELDS = [
  "Existing project ownership", "Duplicated infrastructure", "Duplicated domain logic",
  "Maintenance cost", "Deployment cost", "Support burden",
  "Fragmented user experience", "Portfolio complexity",
];

const EVIDENCE_RE = /^\s*-\s+\*\*(E\d+)\s*\[([a-z-]+)\]\*\*\s*(.*)$/;
const FIELD_RE = /^\s*-\s+\*\*([^:*]+):\*\*\s*(.*)$/;
const SECTION_RE = /^##\s+(.+?)\s*$/;
const SOURCE_RE = /\(source:\s*([^)]+)\)/i;
const FROM_RE = /\(from:\s*([^)]+)\)/i;

/**
 * A value that is only template boilerplate is an absent value. Without this, a proposal created by
 * copying the template and changing nothing would satisfy every presence check — making the template
 * the fastest route to a clean verdict, which is the opposite of what it is for.
 */
const PLACEHOLDER = /^(<.*>|todo|tbd|n\/a|\.\.\.|—|-)$/i;

export const isBlank = (v) => !v || v.trim() === "" || PLACEHOLDER.test(v.trim());

/**
 * Parse one proposal. One pass produces everything every detector needs — two parsers would be two
 * definitions of what a proposal is, and they would disagree eventually.
 */
export function parseProposal(text, file) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections = new Map();
  const evidence = [];
  const meta = new Map();
  let current = null;
  let inComment = false;

  for (const raw of lines) {
    // HTML comments carry the template's guidance. Reading them as content would let commentary
    // satisfy a field.
    if (inComment) {
      if (raw.includes("-->")) inComment = false;
      continue;
    }
    if (raw.trimStart().startsWith("<!--")) {
      if (!raw.includes("-->")) inComment = true;
      continue;
    }

    const section = raw.match(SECTION_RE);
    if (section) {
      current = section[1].trim();
      if (!sections.has(current)) sections.set(current, new Map());
      continue;
    }

    const ev = raw.match(EVIDENCE_RE);
    if (ev && current === "Evidence") {
      const body = ev[3];
      evidence.push({
        id: ev[1],
        level: ev[2],
        text: body.replace(SOURCE_RE, "").replace(FROM_RE, "").trim(),
        source: body.match(SOURCE_RE)?.[1]?.trim() ?? null,
        from: (body.match(FROM_RE)?.[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      });
      continue;
    }

    const field = raw.match(FIELD_RE);
    if (field) {
      const name = field[1].trim();
      const value = field[2].trim();
      // First occurrence wins: a field repeated later in a section is a duplicate, not an override.
      if (current === null) meta.set(name, value);
      else if (!sections.get(current).has(name)) sections.get(current).set(name, value);
    }
  }

  const field = (section, name) => sections.get(section)?.get(name) ?? null;

  return {
    file,
    sections,
    evidence,
    type: (meta.get("Proposal type") ?? "").trim().toLowerCase() || null,
    status: meta.get("Status") ?? null,
    target: meta.get("Target") ?? null,
    has: (section) => sections.has(section),
    field,
    decision: {
      outcome: (field("Decision", "Outcome") ?? "").trim().toLowerCase() || null,
      rationale: field("Decision", "Rationale"),
      revisitWhen: field("Decision", "RevisitWhen"),
      decided: field("Decision", "Decided"),
    },
  };
}

/**
 * Which conditional rules a proposal triggers, and why.
 *
 * This is applicability that cannot live in a policy: it is a property of the individual proposal
 * rather than of the project, and one repository holds many proposals with different answers.
 * `standards explain` prints the `when` text so an author can see why a rule does or does not apply
 * to what they wrote (design/concept-map.md).
 */
export const CONDITIONAL = {
  "innovation.new-project-justification": {
    when: "the proposal type is new-project",
    applies: (p) => p.type === "new-project",
  },
  "innovation.revisit-conditions": {
    when: "the outcome is defer or insufficient-evidence",
    applies: (p) => p.decision.outcome === "defer" || p.decision.outcome === "insufficient-evidence",
  },
  "innovation.experiment-before-build": {
    when: "the outcome is build",
    applies: (p) => p.decision.outcome === "build",
  },
  "innovation.no-problem-no-build": {
    when: "the outcome is build or prototype",
    applies: (p) => p.decision.outcome === "build" || p.decision.outcome === "prototype",
  },
};
