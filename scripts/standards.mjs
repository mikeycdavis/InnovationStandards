#!/usr/bin/env node
/**
 * standards — evaluate innovation proposals against the innovation standards.
 *
 * Usage:
 *   standards audit    [path] [--json] [--dir=<path>] [--strict]
 *   standards validate [path] [--json] [--dir=<path>]
 *   standards check    <proposal-path> | --all [--json] [--dir=<path>]
 *   standards explain  <rule-id> | <proposal-path> [--json] [--dir=<path>]
 *   standards init     [path] [--dry-run] [--force-overwrite=<path>] [--mode=<mode>]
 *
 * WHAT THIS TOOL EVALUATES. Not a repository's implementation state — a *decision about an idea*,
 * recorded as a proposal artifact. The distinction is the whole reason this repository exists
 * separately from an engineering standards auditor (ADR 0004), and it is why every detector below
 * parses one canonical path rather than scanning for prose.
 *
 * The philosophical centre, which the code must not quietly contradict: this tool evaluates the
 * quality and integrity of the decision process, never whether the idea will succeed. A proposal
 * concluding `reject` is evaluated exactly as one concluding `build`.
 *
 * The three-way separation this file must never violate: the catalog defines rule identity and
 * metadata, project-policy.yml defines what applies to a project, and this file produces evidence.
 * `assertBindings` enforces the last of those mechanically.
 *
 * No third-party dependencies, by the decision recorded in
 * artifacts/adr/0001-vendored-engine-standalone-repo.md.
 */

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadCatalog, assertBindings, coverage, resolve as resolveRule } from "./catalog.mjs";
import { evaluate, envelope, isInvariant } from "./compliance.mjs";
import { plan as planInit, apply as applyInit, render as renderInit } from "./init.mjs";
import { parseYaml } from "./yaml.mjs";
import { validate } from "./jsonschema.mjs";
import {
  parseProposal, isBlank, CONDITIONAL,
  OUTCOMES, EVIDENCE_LEVELS, UNSUPPORTING, BUILD_EVIDENCE, PROPOSAL_TYPES,
  REQUIRED_SECTIONS, NEW_PROJECT_FIELDS,
} from "./proposal.mjs";

/**
 * This file names the section headings, field names, and evidence levels it searches for, so
 * scanning itself would report its own vocabulary as a proposal's content. It is excluded from the
 * content scan for that reason.
 */
const SELF = fileURLToPath(import.meta.url);

const SCHEMA_VERSION = "1.0.0";

/** The one path whose files are parsed as proposals. See ADR 0004 and Standard 13 R1. */
const PROPOSAL_DIR = "artifacts/innovation-proposals";
const PROPOSAL_NAME = /^\d{4}-[a-z0-9]+(-[a-z0-9]+)*\.md$/;

/**
 * The rules this evaluator actually examines.
 *
 * This set is the difference between "no violation was observed" and "nothing looked". Every rule in
 * the catalog NOT here is reported `skipped / not-evaluated` rather than passing. The eight absent
 * ones are all `manual-review`: no automated check can establish them, and claiming otherwise would
 * be the false green this framework exists to prevent.
 *
 * A test asserts this set and the detectors' bound rule ids agree, so the two cannot drift.
 */
const EVALUATED_RULES = [
  "innovation.proposal-artifact",
  "innovation.problem-statement",
  "innovation.no-problem-no-build",
  "innovation.evidence-labels",
  "innovation.evidence-citations",
  "innovation.no-silent-upgrade",
  "innovation.assumptions-declared",
  "innovation.existing-capability-analysis",
  "innovation.alternatives-considered",
  "innovation.value-articulation",
  "innovation.cost-accounting",
  "innovation.security-privacy-review",
  "innovation.scope-baseline",
  "innovation.mvp-definition",
  "innovation.success-criteria",
  "innovation.kill-criteria",
  "innovation.experiment-before-build",
  "innovation.decision-recorded",
  "innovation.revisit-conditions",
  "innovation.portfolio-overlap",
  "innovation.new-project-justification",
  "innovation.integrity-invariant",
];

/**
 * Requirement anchors, matching the `### RN — Title` headings in the standards. A standardRef that
 * does not resolve is worse than none: it sends a reader to a page that does not explain the
 * finding. A test asserts every one of these resolves to a heading that exists.
 */
const R = {
  problem: "standards/01-problem-before-solution.md#r1--the-problem-is-stated-before-the-solution",
  noProblemNoBuild: "standards/01-problem-before-solution.md#r3--no-build-without-an-identified-problem",
  levels: "standards/02-evidence-taxonomy-and-integrity.md#r1--every-claim-carries-a-level-from-the-closed-set",
  upgrade: "standards/02-evidence-taxonomy-and-integrity.md#r2--levels-are-never-silently-upgraded",
  assumptions: "standards/02-evidence-taxonomy-and-integrity.md#r3--assumptions-are-declared-and-uncertainty-is-recorded",
  capability: "standards/03-existing-capability-and-alternatives.md#r1--record-what-was-searched-and-what-was-found",
  alternatives: "standards/03-existing-capability-and-alternatives.md#r3--alternatives-include-doing-nothing",
  value: "standards/04-value-and-strategic-alignment.md#r1--state-user-value-in-the-affected-partys-terms",
  costs: "standards/05-cost-accounting.md#r1--all-five-cost-dimensions-are-recorded",
  security: "standards/06-security-privacy-and-standards-non-bypass.md#r1--state-what-data-is-touched-and-what-exposure-is-created",
  scope: "standards/07-scope-and-mvp-discipline.md#r1--a-release-objective-is-one-statement-of-what-the-release-is-for",
  mvp: "standards/07-scope-and-mvp-discipline.md#r2--the-mvp-is-the-minimum-that-would-satisfy-the-objective",
  success: "standards/08-success-and-kill-criteria.md#r1--success-criteria-are-observable-by-someone-who-did-not-write-the-proposal",
  kill: "standards/08-success-and-kill-criteria.md#r3--a-kill-criterion-has-a-trigger-a-threshold-and-an-observer",
  experiment: "standards/09-experiment-before-build.md#r1--the-experiment-comes-first-where-it-is-the-cheaper-way-to-learn",
  decision: "standards/10-innovation-decision-model.md#r1--a-decided-proposal-records-exactly-one-outcome-from-the-closed-set",
  revisit: "standards/10-innovation-decision-model.md#r3--suspension-requires-a-revisit-condition",
  portfolio: "standards/11-portfolio-coherence-and-prioritization.md#r1--state-overlap-duplication-and-cannibalization",
  newProject: "standards/12-new-project-justification.md#r2--all-eight-considerations-are-answered-individually",
  artifactPath: "standards/13-innovation-proposal-artifact.md#r1--proposals-live-at-a-canonical-path",
  artifactSections: "standards/13-innovation-proposal-artifact.md#r2--required-sections-are-present-and-named",
  integrity: "standards/14-standards-integrity.md#r4--invariant-class-rules-and-the-blocked-verdict",
};

// ---------------------------------------------------------------------------
// Policy loading
// ---------------------------------------------------------------------------

/**
 * Read and validate the target repository's project-policy.yml.
 *
 * A malformed or unreadable policy is an ERROR condition, never a compliance failure: the verdict
 * becomes NOT_EVALUATED and the process exits 2. Reporting a broken configuration as NON_COMPLIANT
 * would be a false red for the project and a false green for this tool.
 */
async function loadProjectPolicy(repoRoot) {
  const file = path.join(repoRoot, "project-policy.yml");
  if (!existsSync(file)) {
    return { document: null, error: null, reason: "no project-policy.yml — nothing declares what applies here" };
  }
  const schemaPath = path.join(path.dirname(SELF), "..", "schemas/project-policy.schema.json");
  try {
    const schema = JSON.parse(await readFile(schemaPath, "utf8"));
    const document = parseYaml(await readFile(file, "utf8"));
    const errors = validate(document, schema);
    if (errors.length > 0) {
      return {
        document: null,
        error: `project-policy.yml does not match the schema (${errors.length} error(s)): ` +
          errors.slice(0, 3).map((e) => `${e.path || "(document)"} ${e.message}`).join("; "),
      };
    }
    return { document, error: null };
  } catch (error) {
    return { document: null, error: `project-policy.yml could not be read: ${error.message}` };
  }
}

// ---------------------------------------------------------------------------
// Argument handling
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const subcommand = argv[0];
const JSON_OUT = argv.includes("--json");
const STRICT = argv.includes("--strict");
const ALL = argv.includes("--all");
const dirFlag = argv.find((a) => a.startsWith("--dir="))?.slice("--dir=".length);
const positional = argv.slice(1).find((a) => !a.startsWith("--"));

const EXIT_OK = 0;
const EXIT_FINDINGS = 1;
const EXIT_INVOCATION = 2;

const COMMANDS = new Set(["audit", "validate", "check", "explain", "init"]);

function usage(stream = process.stderr) {
  stream.write(
    [
      "standards — evaluate innovation proposals against the innovation standards.",
      "",
      "  standards audit    [path] [--json] [--dir=<path>] [--strict]",
      "      Evidence discovery. What proposals exist and where they depart from the standards.",
      "      Needs no policy; never produces a verdict.",
      "",
      "  standards validate [path] [--json] [--dir=<path>]",
      "      Policy-aware compliance evaluation. Loads project-policy.yml, applies applicability,",
      "      exceptions, and attestations, and produces the authoritative status. This is the gate.",
      "",
      "  standards check    <proposal-path> | --all [--json] [--dir=<path>]",
      "      Evaluate one proposal (or every proposal) and report its conclusion. The drafting loop.",
      "",
      "  standards explain  <rule-id> | <proposal-path> [--json] [--dir=<path>]",
      "      Why a rule applies, what satisfies it, and what to do about it. Read-only.",
      "",
      "  standards init     [path] [--dry-run] [--force-overwrite=<path>] [--mode=<mode>]",
      "      Bootstrap a project. Creates missing artifacts; never overwrites without an opt-in.",
      "",
      "Exit codes: 0 clean, 1 findings or non-compliance (including BLOCKED_BY_INVARIANT),",
      "2 invocation or configuration error.",
      "",
      "A conclusion of reject, defer, or insufficient-evidence is a compliant outcome. This tool",
      "evaluates the quality of a decision, not whether the idea will succeed.",
      "",
    ].join("\n"),
  );
}

if (!subcommand || subcommand === "--help" || subcommand === "-h") {
  usage(process.stdout);
  process.exit(EXIT_OK);
}
if (!COMMANDS.has(subcommand)) {
  process.stderr.write(`standards: unknown command '${subcommand}'\n\n`);
  usage();
  process.exit(EXIT_INVOCATION);
}

function findRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, ".git")) || existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

const target = dirFlag ?? (subcommand === "check" || subcommand === "explain" ? "." : positional ?? ".");
if (!existsSync(target)) {
  process.stderr.write(`standards: path not found: ${target}\n`);
  process.exit(EXIT_INVOCATION);
}
const root = dirFlag ? path.resolve(dirFlag) : findRoot(target);
const rel = (p) => path.relative(root, p).split(path.sep).join("/");

// ---------------------------------------------------------------------------
// init — delegated to the plan/apply contract
// ---------------------------------------------------------------------------

if (subcommand === "init") {
  const dryRun = argv.includes("--dry-run");
  const force = argv.filter((a) => a.startsWith("--force-overwrite=")).map((a) => a.slice("--force-overwrite=".length));
  const mode = argv.find((a) => a.startsWith("--mode="))?.slice("--mode=".length) ?? null;
  try {
    // Dry-run and apply derive from the SAME plan. A preview computed separately from the mutation
    // is not a preview; it is a second implementation that agrees until it does not — so `plan()`
    // is called once and the result is either rendered or applied, never recomputed.
    const planned = await planInit(root, { mode, overwrite: force });
    if (!dryRun) await applyInit(root, planned);
    process.stdout.write(
      JSON_OUT
        ? JSON.stringify({ ...planned, applied: !dryRun }, null, 2) + "\n"
        : renderInit(planned, { dryRun }) + "\n",
    );
    process.exit(planned.actions.some((a) => a.action === "conflict") ? EXIT_FINDINGS : EXIT_OK);
  } catch (error) {
    process.stderr.write(`standards init: ${error.message}\n`);
    process.exit(EXIT_INVOCATION);
  }
}

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

/**
 * Directories never worth walking.
 *
 * `fixtures` is here for a different reason than the rest. Test fixtures are deliberately malformed —
 * that is their job — so scanning them would report the test data's planted defects as this
 * repository's own. A repository can still audit a fixture directly with `--dir=`.
 */
const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "out", "bin", "obj", ".next", ".nuxt",
  ".venv", "venv", "__pycache__", "target", "vendor", "coverage", ".turbo",
  ".gradle", ".idea", ".vs", ".vscode", ".pytest_cache", "fixtures",
]);

const MAX_FILES = 20000;
const MAX_READ_BYTES = 400_000;

async function collectFiles(dir, acc) {
  if (acc.length >= MAX_FILES) return acc;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await collectFiles(full, acc);
    } else if (entry.isFile()) {
      acc.push(full);
    }
  }
  return acc;
}

async function readText(file) {
  try {
    const text = await readFile(file, "utf8");
    return text.length > MAX_READ_BYTES ? text.slice(0, MAX_READ_BYTES) : text;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

const findings = [];

/**
 * Record a finding.
 *
 * `label` is the auditor's own epistemic position and is one of the four values below — a DIFFERENT
 * axis from a proposal's evidence level and from a rule's assurance (ADR 0003). A finding resting on
 * a field being literally present is OBSERVED. A finding resting on interpretation is INFERRED, and
 * reporting an interpretation as OBSERVED is the fabrication this framework prohibits one level up.
 */
function addFinding({ id, category, severity = "info", label, evidence = [], message, standardRef, rule }) {
  findings.push({
    id,
    category,
    severity,
    label,
    evidence: evidence.slice(0, 12),
    message,
    standardRef,
    ...(rule ? { rule } : {}),
  });
}

// ---------------------------------------------------------------------------
// Detectors
//
// Every guard below exists because a fixture demonstrates the failure it catches. No speculative
// checks: a check nobody can provoke is a check nobody maintains, and it goes stale silently.
// ---------------------------------------------------------------------------

/** Descriptive: what proposals exist. Always info, never a rule failure. */
function detectProposals(proposals, proposalFiles) {
  if (proposals.length === 0) {
    addFinding({
      id: "detected-proposals",
      category: "detected-proposals",
      severity: "info",
      label: "OBSERVED",
      message:
        `No innovation proposals found at ${PROPOSAL_DIR}/. This tool evaluates recorded decisions; ` +
        "it cannot see decisions that were never written down.",
      standardRef: R.artifactPath,
    });
    return;
  }
  addFinding({
    id: "detected-proposals",
    category: "detected-proposals",
    severity: "info",
    label: "OBSERVED",
    evidence: proposals.map((p) => `${p.file} — ${p.decision.outcome ?? "undecided"}`),
    message: `${proposals.length} innovation proposal(s) recorded.`,
    standardRef: R.artifactPath,
  });

  for (const file of proposalFiles) {
    const base = path.basename(file);
    if (!PROPOSAL_NAME.test(base)) {
      addFinding({
        id: "proposal-naming",
        category: "proposal-artifact",
        severity: "warning",
        label: "OBSERVED",
        evidence: [rel(file)],
        message: `${base} does not match the NNNN-kebab-slug.md naming the canonical path defines.`,
        standardRef: R.artifactPath,
      });
    }
  }
}

/** Standard 13 R2 — the required sections are present. */
function detectProposalStructure(p) {
  const missing = REQUIRED_SECTIONS.filter((s) => !p.has(s));
  if (missing.length > 0) {
    addFinding({
      id: "proposal-structure",
      category: "proposal-artifact",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.proposal-artifact",
      evidence: [p.file, ...missing.map((m) => `missing section: ## ${m}`)],
      message: `${p.file} is missing ${missing.length} required section(s): ${missing.join(", ")}.`,
      standardRef: R.artifactSections,
    });
  }
  if (p.type && !PROPOSAL_TYPES.has(p.type)) {
    addFinding({
      id: "proposal-type",
      category: "proposal-artifact",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.proposal-artifact",
      evidence: [p.file],
      message: `${p.file} declares proposal type '${p.type}', which is not one of ${[...PROPOSAL_TYPES].join(", ")}.`,
      standardRef: R.artifactSections,
    });
  }
}

/** Generic section-and-field presence. One table rather than nine near-identical detectors. */
const SECTION_FIELDS = [
  { section: "Problem", fields: ["Statement", "Who is affected", "Why it matters now"], rule: "innovation.problem-statement", ref: () => R.problem },
  { section: "Assumptions and uncertainty", fields: ["Assumption"], rule: "innovation.assumptions-declared", ref: () => R.assumptions },
  { section: "Existing capability", fields: ["Searched", "Finding"], rule: "innovation.existing-capability-analysis", ref: () => R.capability },
  { section: "Alternatives", fields: ["Do nothing", "Build", "Buy", "Integrate"], rule: "innovation.alternatives-considered", ref: () => R.alternatives },
  { section: "Value and alignment", fields: ["User value", "Expected impact", "Differentiation", "Strategic alignment"], rule: "innovation.value-articulation", ref: () => R.value },
  { section: "Costs", fields: ["Implementation", "Maintenance", "Operational", "Opportunity cost", "Technical debt"], rule: "innovation.cost-accounting", ref: () => R.costs },
  { section: "Security and privacy", fields: ["Implications", "Applicable standards"], rule: "innovation.security-privacy-review", ref: () => R.security },
  { section: "Scope and MVP", fields: ["Release objective"], rule: "innovation.scope-baseline", ref: () => R.scope },
  { section: "Scope and MVP", fields: ["MVP", "Out of scope"], rule: "innovation.mvp-definition", ref: () => R.mvp },
  { section: "Portfolio", fields: ["Overlap", "Cannibalization", "Priority"], rule: "innovation.portfolio-overlap", ref: () => R.portfolio },
];

function detectSections(p) {
  for (const spec of SECTION_FIELDS) {
    const missing = spec.fields.filter((f) => isBlank(p.field(spec.section, f)));
    if (missing.length === 0) continue;
    addFinding({
      id: `section-${spec.rule}`,
      category: "proposal-content",
      severity: "error",
      label: "OBSERVED",
      rule: spec.rule,
      evidence: [p.file, ...missing.map((m) => `## ${spec.section} → ${m}`)],
      message:
        `${p.file}: ## ${spec.section} is missing or has empty field(s): ${missing.join(", ")}.`,
      standardRef: spec.ref(),
    });
  }
}

/** Standard 1 R3 — invariant-class. Conditional on the recorded outcome. */
function detectNoProblemNoBuild(p) {
  if (!CONDITIONAL["innovation.no-problem-no-build"].applies(p)) return;
  if (!isBlank(p.field("Problem", "Statement"))) return;
  addFinding({
    id: "no-problem-no-build",
    category: "prohibition",
    severity: "error",
    label: "OBSERVED",
    rule: "innovation.no-problem-no-build",
    evidence: [p.file],
    message:
      `${p.file} records an outcome of '${p.decision.outcome}' with no problem statement. ` +
      "Building without an identified problem is prohibited; use the explore outcome to search for one.",
    standardRef: R.noProblemNoBuild,
  });
}

/** Standard 2 R1 — every entry carries a level from the closed set. */
function detectEvidenceLabels(p) {
  const bad = p.evidence.filter((e) => !EVIDENCE_LEVELS.has(e.level));
  if (bad.length > 0) {
    addFinding({
      id: "evidence-labels",
      category: "evidence",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.evidence-labels",
      evidence: [p.file, ...bad.map((e) => `${e.id} [${e.level}]`)],
      message: `${p.file}: ${bad.length} evidence entry/entries carry a level outside the taxonomy.`,
      standardRef: R.levels,
    });
  }
  if (p.has("Evidence") && p.evidence.length === 0) {
    addFinding({
      id: "evidence-empty",
      category: "evidence",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.evidence-labels",
      evidence: [p.file],
      message:
        `${p.file}: the Evidence section contains no entry in the form - **E1 [level]** claim. ` +
        "An unlabelled claim is unclassifiable, not merely weak.",
      standardRef: R.levels,
    });
  }
}

/** Standard 2 R2 — citations resolve. The cheapest form of fabrication, and the only catchable one. */
function detectCitations(p) {
  const ids = new Set(p.evidence.map((e) => e.id));
  const problems = [];
  for (const entry of p.evidence) {
    for (const ref of entry.from) {
      if (!ids.has(ref)) problems.push(`${entry.id} cites ${ref}, which is not an entry in this proposal`);
    }
    const src = entry.source;
    // URLs, absolute paths, and prose attributions are skipped rather than guessed at. Reporting
    // "stated by owner" as a broken path would be a false finding, and false findings are how a
    // check earns its way onto an ignore list.
    if (!src || /^(https?:|\/|~|[A-Za-z]:)/.test(src) || /\s/.test(src) || !src.includes("/")) continue;
    if (!existsSync(path.join(root, src))) {
      problems.push(`${entry.id} cites ${src}, which does not exist`);
    }
  }
  if (problems.length > 0) {
    addFinding({
      id: "evidence-citations",
      category: "evidence",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.evidence-citations",
      evidence: [p.file, ...problems],
      message: `${p.file}: ${problems.length} evidence citation(s) do not resolve.`,
      standardRef: R.upgrade,
    });
  }
}

/** Standard 2 R2 — invariant-class. A conclusion resting on nothing observed is not validation. */
function detectSilentUpgrade(p) {
  const byId = new Map(p.evidence.map((e) => [e.id, e]));
  const problems = [];
  for (const entry of p.evidence.filter((e) => e.level === "validated-conclusion")) {
    if (entry.from.length === 0) {
      problems.push(`${entry.id} is a validated-conclusion citing nothing`);
      continue;
    }
    const cited = entry.from.map((id) => byId.get(id)).filter(Boolean);
    if (cited.length > 0 && cited.every((c) => UNSUPPORTING.has(c.level))) {
      problems.push(
        `${entry.id} is a validated-conclusion whose citations are all ${cited.map((c) => c.level).join(", ")}`,
      );
    }
  }
  if (problems.length > 0) {
    addFinding({
      id: "silent-upgrade",
      category: "prohibition",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.no-silent-upgrade",
      evidence: [p.file, ...problems],
      message:
        `${p.file}: an evidence level was raised without the citations that would justify it. ` +
        "A chain terminating in assumptions is not validation.",
      standardRef: R.upgrade,
    });
  }
}

/** Standard 8 — criteria exist and the two sections are distinct. */
function detectCriteria(p) {
  for (const [section, rule, ref] of [
    ["Success criteria", "innovation.success-criteria", R.success],
    ["Kill criteria", "innovation.kill-criteria", R.kill],
  ]) {
    if (!isBlank(p.field(section, "Criterion"))) continue;
    addFinding({
      id: `criteria-${rule}`,
      category: "proposal-content",
      severity: "error",
      label: "OBSERVED",
      rule,
      evidence: [p.file, `## ${section}`],
      message:
        `${p.file}: ## ${section} records no Criterion. ` +
        (section === "Kill criteria"
          ? "A decision to start with no defined condition for stopping is a decision to continue indefinitely."
          : "Criteria written after the result is known measure nothing."),
      standardRef: ref,
    });
  }
}

/** Standard 10 R1 and R3 — the outcome, and the conditional revisit condition. */
function detectDecision(p) {
  const outcome = p.decision.outcome;
  if (!outcome) {
    addFinding({
      id: "decision-missing",
      category: "decision",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.decision-recorded",
      evidence: [p.file],
      message: `${p.file}: the Decision section records no Outcome.`,
      standardRef: R.decision,
    });
  } else if (!OUTCOMES.has(outcome)) {
    addFinding({
      id: "decision-invalid",
      category: "decision",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.decision-recorded",
      evidence: [p.file, `Outcome: ${outcome}`],
      message:
        `${p.file}: '${outcome}' is not one of the eight outcomes. ` +
        `Expected one of: ${[...OUTCOMES].join(", ")}.`,
      standardRef: R.decision,
    });
  }

  const needsRevisit = CONDITIONAL["innovation.revisit-conditions"].applies(p);
  if (needsRevisit && isBlank(p.decision.revisitWhen)) {
    addFinding({
      id: "revisit-missing",
      category: "decision",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.revisit-conditions",
      evidence: [p.file],
      message:
        `${p.file}: an outcome of '${outcome}' records no RevisitWhen. ` +
        "A suspension with no revisit condition is indistinguishable from something forgotten.",
      standardRef: R.revisit,
    });
  }
}

/** Standard 9 — recommended, so a warning. Conditional on a build outcome. */
function detectExperimentGap(p) {
  if (!CONDITIONAL["innovation.experiment-before-build"].applies(p)) return;
  if (p.evidence.some((e) => BUILD_EVIDENCE.has(e.level))) return;
  addFinding({
    id: "experiment-gap",
    category: "evidence",
    severity: "warning",
    label: "INFERRED",
    rule: "innovation.experiment-before-build",
    evidence: [p.file],
    message:
      `${p.file}: a build decision rests on no experiment-result, user-evidence, or technical-evidence. ` +
      "Where an experiment would resolve the decisive uncertainty more cheaply, it should come first.",
    standardRef: R.experiment,
  });
}

/** Standard 12 — the high bar. Conditional on the proposal type. */
function detectNewProjectBar(p) {
  if (!CONDITIONAL["innovation.new-project-justification"].applies(p)) return;
  const missing = NEW_PROJECT_FIELDS.filter((f) => isBlank(p.field("New project justification", f)));
  if (missing.length === 0) return;
  addFinding({
    id: "new-project-bar",
    category: "proposal-content",
    severity: "error",
    label: "OBSERVED",
    rule: "innovation.new-project-justification",
    evidence: [p.file, ...missing.map((m) => `missing: ${m}`)],
    message:
      `${p.file}: a new-project proposal leaves ${missing.length} of the eight separation ` +
      `considerations unanswered: ${missing.join(", ")}.`,
    standardRef: R.newProject,
  });
}

/**
 * Standard 14 — invariant-class. Two mechanically visible forms of weakening the system.
 *
 * Belt and braces with the evaluator: `compliance.mjs` independently declines to honour a policy
 * downgrade of an invariant rule, so removing this detector does not make the downgrade work. This
 * makes the attempt *visible* rather than merely ineffective.
 */
function detectIntegrity(catalog, policyDocument) {
  if (!policyDocument) return;
  const problems = [];

  for (const [ruleId, declared] of Object.entries(policyDocument.rules ?? {})) {
    const rule = resolveRule(catalog, ruleId);
    if (!rule || !declared?.level) continue;
    if (isInvariant(rule) && declared.level !== "forbidden") {
      problems.push(
        `${ruleId} is forbidden and non-exemptible in the catalog but declared '${declared.level}' in the policy`,
      );
    }
  }

  for (const entry of policyDocument.exceptions ?? []) {
    const rule = resolveRule(catalog, entry?.rule);
    if (rule && isInvariant(rule)) {
      problems.push(`an exception is filed against ${rule.id}, which is invariant-class and admits none`);
    }
  }

  if (problems.length > 0) {
    addFinding({
      id: "integrity-invariant",
      category: "prohibition",
      severity: "error",
      label: "OBSERVED",
      rule: "innovation.integrity-invariant",
      evidence: ["project-policy.yml", ...problems],
      message:
        "The policy weakens the standards system itself: " + problems.join("; ") +
        ". A prohibition a project can switch off is not a prohibition.",
      standardRef: R.integrity,
    });
  }
}

// ---------------------------------------------------------------------------
// Run the scan
// ---------------------------------------------------------------------------

const files = await collectFiles(root, []);
const proposalFiles = files
  .filter((f) => rel(f).startsWith(`${PROPOSAL_DIR}/`) && f.endsWith(".md") && path.resolve(f) !== SELF)
  .sort();

const proposals = [];
for (const file of proposalFiles) {
  proposals.push(parseProposal(await readText(file), rel(file)));
}

const catalog = await loadCatalog();
const policy = await loadProjectPolicy(root);

detectProposals(proposals, proposalFiles);
for (const p of proposals) {
  detectProposalStructure(p);
  detectSections(p);
  detectNoProblemNoBuild(p);
  detectEvidenceLabels(p);
  detectCitations(p);
  detectSilentUpgrade(p);
  detectCriteria(p);
  detectDecision(p);
  detectExperimentGap(p);
  detectNewProjectBar(p);
}
detectIntegrity(catalog, policy.document);

// The mechanical guard on the architectural rule: an evaluator may not speak a vocabulary the
// catalog does not define.
assertBindings(catalog, findings.map((f) => f.rule).filter(Boolean));

// ---------------------------------------------------------------------------
// explain — why a rule applies, and what satisfies it
// ---------------------------------------------------------------------------

function explainRule(ruleId) {
  const rule = resolveRule(catalog, ruleId);
  if (!rule) return null;
  const declared = policy.document?.rules?.[rule.id];
  const applicability = policy.document?.applicability?.[rule.id];
  const conditional = CONDITIONAL[rule.id];
  return {
    id: rule.id,
    title: rule.title,
    standard: rule.standard,
    catalogLevel: rule.level,
    policyLevel: declared?.level ?? null,
    effectiveLevel: isInvariant(rule) ? "forbidden" : declared?.level ?? rule.level,
    severity: rule.severity,
    validationType: rule.validationType,
    assurance: rule.assurance,
    invariantClass: isInvariant(rule),
    attestable: rule.attestable,
    evaluatedAutomatically: EVALUATED_RULES.includes(rule.id),
    conditionalOn: conditional?.when ?? null,
    applicability: applicability
      ? { status: applicability.status, reason: applicability.reason, revisitWhen: applicability.revisitWhen ?? null }
      : { status: "applicable", reason: "no declaration; the catalog level applies", revisitWhen: null },
    description: rule.description,
    rationale: rule.rationale,
    remediation: rule.remediation,
    assuranceNote: rule.$assuranceNote ?? null,
    definedBy: `standards/${String(rule.standard).padStart(2, "0")}-`,
  };
}

function renderExplainRule(x) {
  const out = [];
  out.push(`${x.id} — ${x.title}`);
  out.push(`  Standard ${x.standard}`);
  out.push("");
  out.push(`  Level:      ${x.catalogLevel}${x.policyLevel && x.policyLevel !== x.catalogLevel ? ` (policy declares ${x.policyLevel})` : ""}`);
  out.push(`  Severity:   ${x.severity}`);
  out.push(`  Checked by: ${x.validationType}, assurance ${x.assurance}`);
  out.push(`  Automated:  ${x.evaluatedAutomatically ? "yes" : "no — this rule is evaluated by a human"}`);
  if (x.attestable) out.push("  Attestable: yes — a recorded human review can establish it");
  if (x.invariantClass) {
    out.push("");
    out.push("  INVARIANT-CLASS. Forbidden and non-exemptible. A failure produces");
    out.push("  BLOCKED_BY_INVARIANT, which means stop and report — not remediate around.");
    out.push("  No exception can waive it, and no policy level can downgrade it.");
  }
  out.push("");
  out.push(`  Applies here: ${x.applicability.status} — ${x.applicability.reason}`);
  if (x.applicability.revisitWhen) out.push(`  Revisit when: ${x.applicability.revisitWhen}`);
  if (x.conditionalOn) out.push(`  Per proposal:  applies only when ${x.conditionalOn}`);
  out.push("");
  out.push(`  What it requires: ${x.description}`);
  out.push(`  Why:              ${x.rationale}`);
  out.push(`  To satisfy it:    ${x.remediation}`);
  if (x.assuranceNote) {
    out.push("");
    out.push("  What the check does NOT establish:");
    out.push(`    ${x.assuranceNote}`);
  }
  return out.join("\n");
}

function explainProposal(p) {
  const rules = [...catalog.rules.values()].map((rule) => {
    const conditional = CONDITIONAL[rule.id];
    const applies = conditional ? conditional.applies(p) : true;
    return {
      id: rule.id,
      standard: rule.standard,
      applies,
      why: conditional
        ? applies
          ? `applies because ${conditional.when}`
          : `does not apply: it applies only when ${conditional.when}`
        : "applies to every proposal",
      automated: EVALUATED_RULES.includes(rule.id),
      invariantClass: isInvariant(rule),
    };
  });
  return { proposal: p.file, type: p.type, outcome: p.decision.outcome, rules };
}

if (subcommand === "explain") {
  const arg = positional;
  if (!arg) {
    process.stderr.write("standards explain: name a rule id or a proposal path\n");
    process.exit(EXIT_INVOCATION);
  }

  const asRule = explainRule(arg);
  if (asRule) {
    process.stdout.write((JSON_OUT ? JSON.stringify(asRule, null, 2) : renderExplainRule(asRule)) + "\n");
    process.exit(EXIT_OK);
  }

  const match = proposals.find((p) => p.file === arg || p.file.endsWith(arg.replace(/\\/g, "/")));
  if (!match) {
    process.stderr.write(
      `standards explain: '${arg}' is neither a rule id nor a proposal under ${PROPOSAL_DIR}/\n`,
    );
    process.exit(EXIT_INVOCATION);
  }
  const x = explainProposal(match);
  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(x, null, 2) + "\n");
  } else {
    const out = [`${x.proposal} — type ${x.type ?? "unset"}, outcome ${x.outcome ?? "undecided"}`, ""];
    out.push("  Applies:");
    for (const r of x.rules.filter((r) => r.applies)) {
      out.push(`    ${r.id}${r.invariantClass ? " [invariant]" : ""}${r.automated ? "" : " (human review)"}`);
      out.push(`      ${r.why}`);
    }
    const off = x.rules.filter((r) => !r.applies);
    if (off.length) {
      out.push("");
      out.push("  Does not apply:");
      for (const r of off) out.push(`    ${r.id} — ${r.why}`);
    }
    out.push("");
    out.push("  Run `standards explain <rule-id>` for what any of these requires.");
    process.stdout.write(out.join("\n") + "\n");
  }
  process.exit(EXIT_OK);
}

// ---------------------------------------------------------------------------
// check — one proposal at a time, the drafting loop
// ---------------------------------------------------------------------------

/** The five conclusions an AI agent must be able to reach. Three of them are refusals. */
function conclude(hits, p) {
  const blocking = hits.filter((f) => {
    const rule = resolveRule(catalog, f.rule);
    return rule && isInvariant(rule);
  });
  if (blocking.length > 0) return { conclusion: "blocked-by-invariant", blocking: blocking.map((f) => f.rule) };
  if (hits.some((f) => f.severity === "error")) return { conclusion: "non-compliant", blocking: [] };
  if (!p.decision.outcome) return { conclusion: "insufficient-evidence", blocking: [] };
  return { conclusion: "compliant", blocking: [] };
}

if (subcommand === "check") {
  let selected = proposals;
  if (!ALL) {
    if (!positional) {
      process.stderr.write("standards check: name a proposal path, or pass --all\n");
      process.exit(EXIT_INVOCATION);
    }
    const wanted = positional.replace(/\\/g, "/");
    selected = proposals.filter((p) => p.file === wanted || p.file.endsWith(wanted));
    if (selected.length === 0) {
      process.stderr.write(`standards check: no proposal matching '${positional}' under ${PROPOSAL_DIR}/\n`);
      process.exit(EXIT_INVOCATION);
    }
  }

  const reports = selected.map((p) => {
    const hits = findings.filter((f) => f.rule && f.evidence.includes(p.file));
    return { proposal: p.file, outcome: p.decision.outcome, ...conclude(hits, p), findings: hits };
  });

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({ schemaVersion: SCHEMA_VERSION, proposals: reports }, null, 2) + "\n");
  } else {
    const out = [];
    for (const r of reports) {
      out.push(`${r.proposal}`);
      out.push(`  Outcome:    ${r.outcome ?? "undecided"}`);
      out.push(`  Conclusion: ${r.conclusion}`);
      if (r.conclusion === "blocked-by-invariant") {
        out.push("");
        out.push("  STOP. An invariant-class rule failed. Do not edit the rule, the test, the policy,");
        out.push("  or the standard to clear this — that edit is itself the violation (Standard 14).");
        out.push(`  Blocking: ${r.blocking.join(", ")}`);
      }
      if (r.findings.length === 0) {
        out.push("  Nothing the automated checks examine reported a problem.");
      } else {
        out.push("");
        for (const f of r.findings) {
          out.push(`  [${f.severity}] ${f.rule}`);
          out.push(`    ${f.message}`);
        }
      }
      out.push("");
    }
    out.push("A conclusion of reject, defer, or insufficient-evidence is a compliant outcome. This");
    out.push("checks the quality of the decision, never whether the idea will succeed. Content");
    out.push("adequacy is not machine-checkable — a clean run means the structure holds, not that");
    out.push("the reasoning is sound.");
    process.stdout.write(out.join("\n") + "\n");
  }
  process.exit(reports.some((r) => r.conclusion === "non-compliant" || r.conclusion === "blocked-by-invariant") ? EXIT_FINDINGS : EXIT_OK);
}

// ---------------------------------------------------------------------------
// Reporting — audit
// ---------------------------------------------------------------------------

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

function renderHuman(fileCount) {
  const lines = [];
  lines.push(`standards audit — ${path.basename(root)} (${root.split(path.sep).join("/")})`);
  lines.push(`${fileCount} file(s) scanned, ${proposals.length} proposal(s) parsed, ${findings.length} finding(s).`);

  lines.push("");
  lines.push("What the repository has");
  const descriptive = findings.filter((f) => f.id === "detected-proposals");
  for (const f of descriptive) {
    lines.push(`  Innovation proposals [${f.label}]`);
    lines.push(`    ${f.message}`);
    for (const e of f.evidence) lines.push(`      ${e}`);
  }

  const attention = findings
    .filter((f) => f.id !== "detected-proposals")
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  lines.push("");
  if (attention.length === 0) {
    lines.push("Nothing needing attention was detected.");
  } else {
    lines.push("What needs attention");
    for (const f of attention) {
      lines.push(`  [${f.severity}] ${f.category} [${f.label}]`);
      lines.push(`    ${f.message}`);
      for (const e of f.evidence) lines.push(`      ${e}`);
      lines.push(`    see ${f.standardRef}`);
    }
  }

  const failing = findings.filter((f) => f.severity !== "info").length;
  lines.push("");
  lines.push(
    `${findings.filter((f) => f.severity === "error").length} error(s), ` +
      `${findings.filter((f) => f.severity === "warning").length} warning(s), ` +
      `${findings.filter((f) => f.severity === "info").length} informational.`,
  );
  lines.push("");
  lines.push("Coverage is partial by design. Every check above establishes that a section or field is");
  lines.push("present and non-empty; none establishes that its content is adequate, honest, or right.");
  lines.push("Eight rules have no automated check at all and are evaluated only by recorded human");
  lines.push("review. A clean run means the structure holds — not that the reasoning is sound.");
  if (STRICT && failing > 0) lines.push(`--strict: exiting 1 because ${failing} finding(s) need attention.`);
  return lines.join("\n");
}

if (subcommand === "audit") {
  if (JSON_OUT) {
    process.stdout.write(
      JSON.stringify(
        {
          schemaVersion: SCHEMA_VERSION,
          repo: root.split(path.sep).join("/"),
          auditedAt: new Date().toISOString(),
          proposals: proposals.map((p) => ({ file: p.file, type: p.type, outcome: p.decision.outcome })),
          findings,
        },
        null,
        2,
      ) + "\n",
    );
  } else {
    process.stdout.write(renderHuman(files.length) + "\n");
    process.stdout.write(
      "\nThis is evidence, not a verdict. Run `standards validate` for a compliance status.\n",
    );
  }
  process.exit(STRICT && findings.some((f) => f.severity !== "info") ? EXIT_FINDINGS : EXIT_OK);
}

// ---------------------------------------------------------------------------
// validate — the verdict
// ---------------------------------------------------------------------------

function renderVerdict(report, pol) {
  const out = [];
  out.push("Compliance");
  if (pol.error) {
    out.push(`  ${pol.error}`);
    out.push("  Status: NOT_EVALUATED — a policy that cannot be read is a configuration error,");
    out.push("  not a compliance failure.");
    return out.join("\n");
  }
  if (!pol.document) {
    out.push(`  ${pol.reason}.`);
    out.push("  Status: NOT_EVALUATED — findings above are observations, not a verdict.");
    out.push("  Add project-policy.yml to get one; see INSTRUCTIONS.md.");
    return out.join("\n");
  }

  const s = report.summary;
  const a = report.assurance;
  out.push(`  Status: ${report.status}`);
  if (report.status === "BLOCKED_BY_INVARIANT") {
    out.push("");
    out.push("  STOP. An invariant-class rule failed. This is not a defect list to work through —");
    out.push("  it is a halt condition. Do not weaken, reclassify, waive, or remove the rule, the");
    out.push("  test, or the standard to clear it: that edit is itself the violation (Standard 14).");
    out.push(`  Blocking: ${report.blocking.join(", ")}`);
    out.push("");
  }
  out.push(`  Score:  ${report.score === null ? "n/a" : report.score + "%"}  (${report.denominator.basis}: ${report.denominator.scored})`);
  out.push(`  Rules:  ${s.passed} passed, ${s.failed} failed, ${s.warnings} warning(s), ${s.skipped} skipped`);
  out.push(`  Cover:  ${a.automated} automated, ${a.manualReview} manual-review, ${a.notEvaluated} not-evaluated`);
  out.push("");

  const failed = report.results.filter((r) => r.status === "failed");
  if (failed.length) {
    out.push("  Failing:");
    for (const r of failed) {
      out.push(`    ${r.ruleId} [${r.level}]${r.invariant ? " [invariant]" : ""} ${r.message}`);
      out.push(`      -> ${r.remediation}`);
    }
    out.push("");
  }
  const excepted = report.results.filter((r) => r.disposition === "excepted");
  if (excepted.length) {
    out.push("  Excepted:");
    for (const r of excepted) out.push(`    ${r.ruleId} — ${r.exception.reason} (expires ${r.exception.expires ?? "never"})`);
    out.push("");
  }
  const attested = report.results.filter((r) => r.disposition === "attested");
  if (attested.length) {
    out.push("  Attested (human review):");
    for (const r of attested) out.push(`    ${r.ruleId} — ${r.attestation.reviewedBy}, ${r.attestation.reviewedAt}`);
    out.push("");
  }
  const notEvaluated = report.results.filter((r) => r.disposition === "not-evaluated");
  if (notEvaluated.length) {
    out.push(`  Not evaluated (${notEvaluated.length}): ${notEvaluated.map((r) => r.ruleId).join(", ")}`);
    out.push("    Nothing examined these. That is not a pass — it is the absence of a result.");
    out.push("");
  }
  const na = report.results.filter((r) => r.disposition === "not-applicable");
  if (na.length) {
    out.push(`  Not applicable (${na.length}): ${na.map((r) => r.ruleId).join(", ")}`);
    out.push("");
  }

  const c = report.frameworkCoverage;
  if (c) {
    out.push(
      `  Framework: ${c.cataloguedRules} rule(s) catalogued across ${c.standardsWithRules} of ` +
        `${c.standards ?? "?"} standards; ${c.fullyMachineRepresentedStandards} fully machine-represented.`,
    );
    out.push("");
  }

  out.push("  COMPLIANT means everything that was actually evaluated passed. It never means this is");
  out.push("  a good idea, and it never means everything was checked. Status is the verdict; a");
  out.push("  skipped rule is neither a pass nor a failure. Framework coverage is maturity of the");
  out.push("  tooling, not compliance of this project — the two never combine into one number.");
  return out.join("\n");
}

/**
 * Digest the paths each attestation says it reviewed, so a material change to them makes the
 * attestation stale.
 *
 * Content-based rather than revision-based on purpose: invalidating every attestation on every
 * commit would make the mechanism unusable, and it would be abandoned.
 */
async function attestationDigests(document, repoRoot) {
  const { createHash } = await import("node:crypto");
  const out = new Map();
  for (const [ruleId, attestation] of Object.entries(document?.attestations ?? {})) {
    const paths = attestation?.reviewedAgainst?.paths;
    if (!Array.isArray(paths) || paths.length === 0) continue;
    const hash = createHash("sha256");
    for (const p of [...paths].sort()) {
      hash.update(p);
      try {
        hash.update(await readFile(path.join(repoRoot, p), "utf8"));
      } catch {
        hash.update("<missing>"); // A reviewed path that has since gone is itself a material change.
      }
    }
    out.set(ruleId, hash.digest("hex").slice(0, 32));
  }
  return out;
}

const digests = await attestationDigests(policy.document, root);
const verdict = evaluate({
  catalog,
  policy: policy.document,
  findings,
  evaluated: EVALUATED_RULES,
  today: new Date().toISOString().slice(0, 10),
  digests,
});

// Framework maturity, read from this framework's own inventory rather than the target repository. It
// travels beside the verdict and never inside it: a coverage improvement must never be able to look
// like a compliance improvement.
const totalStandards = await (async () => {
  try {
    const inventoryPath = path.join(path.dirname(SELF), "..", "artifacts/standards-source-inventory.json");
    const inv = JSON.parse(await readFile(inventoryPath, "utf8"));
    return inv.expectedCount ?? inv.standards?.length ?? null;
  } catch {
    return null;
  }
})();

const report = envelope({
  verdict,
  project: policy.document?.project,
  standardVersion: policy.document?.standardVersion,
  auditedAt: new Date().toISOString(),
  repo: root.split(path.sep).join("/"),
  frameworkCoverage: coverage(catalog, { evaluated: EVALUATED_RULES, totalStandards }),
});

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({ ...report, findings }, null, 2) + "\n");
} else {
  process.stdout.write(renderVerdict(report, policy) + "\n");
  for (const [ruleId, digest] of digests) {
    const recorded = policy.document?.attestations?.[ruleId]?.reviewedAgainst?.digest;
    if (!recorded) {
      process.stdout.write(`\n  attestation ${ruleId}: current digest is ${digest}\n`);
      process.stdout.write("  Record it as reviewedAgainst.digest to make staleness detectable.\n");
    }
  }
}

// A policy that could not be read, or none at all, is exit 2: a verdict was requested and there is
// nothing to evaluate against. That is a configuration problem, not a compliance failure. A
// required-level failure — or a blocked verdict — is exit 1 regardless of score.
if (policy.error || !policy.document) process.exit(EXIT_INVOCATION);
if (report.status === "NON_COMPLIANT" || report.status === "BLOCKED_BY_INVARIANT") process.exit(EXIT_FINDINGS);
process.exit(EXIT_OK);
