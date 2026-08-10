/**
 * `standards init` — bootstrap a project into the framework.
 *
 * NOTHING IN standards/ GOVERNS THIS FILE'S SAFETY CONTRACT. The plan/apply split, the dry-run
 * guarantee, and the overwrite refusal below are all engineering judgement, not requirements: none
 * of the fourteen standards mentions bootstrapping, dry runs, or destructive operations. Earlier
 * revisions of this comment carried standard numbers inherited from the framework this engine was
 * vendored from; one of them was in range here and resolved to Evidence Taxonomy and Integrity,
 * which is not what it meant. The citations are removed rather than remapped, because there is
 * nothing to remap them to, and a reference that resolves to the wrong document is worse than none:
 * it reads as governed when it is not. See git history for the prior text.
 *
 * The safety contract IS the design, so the module is split in two:
 *
 *   plan()   pure. Inspects the target, decides the mode, and returns the actions it WOULD take.
 *            Touches nothing.
 *   apply()  executes a plan. The only function in this file that writes.
 *
 * `--dry-run` is therefore not a separate code path that has to be kept in step with the real one —
 * it is `plan()` without `apply()`. A dry-run whose output does not predict the real run is worse
 * than none, because it is trusted, and the only way to guarantee that is to make them the same
 * computation.
 *
 * Mutating is not the same as destructive:
 *
 *   create a missing artifact   → ordinary execute. No approval; this is what init is for.
 *   replace an existing one     → destructive. Refused by default, and reported as a conflict.
 *                                 Overwriting requires --force-overwrite AND naming each path.
 *
 * That distinction is why init can be useful without prompting for approval on every harmless
 * scaffold creation, while an overwrite stays guarded.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readdirSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRAMEWORK = path.resolve(HERE, "..");

/**
 * How a project arrives at these standards.
 *
 * `undocumented-decisions` is the innovation-domain analogue of reconstruction: the project has real
 * implementation and no recorded decisions behind it. The distinction matters because the correct
 * response is NOT to author proposals for work that already shipped — a proposal written after the
 * fact, describing a decision nobody actually made that way, is a fabricated record, and it is
 * indistinguishable later from a real one.
 *
 * That is Standard 2 R4 (`innovation.no-fabricated-evidence`, invariant-class) applied to a whole
 * artifact rather than to one citation, and Standard 13 R5 is its companion: a record that cannot
 * say what was known and when has lost the property that made it worth keeping.
 */
export const MODES = {
  GREENFIELD: "greenfield",
  EXISTING_WITH_PROPOSALS: "existing-with-proposals",
  UNDOCUMENTED_DECISIONS: "undocumented-decisions",
};

/** Files init can create, and where their content comes from. */
const ARTIFACTS = [
  { path: "project-policy.yml", template: "templates/project-policy.yml" },
  { path: "PROJECT.md", template: "templates/PROJECT.md" },
  { path: "AGENTS.md", template: "templates/AGENTS.md" },
  { path: "CLAUDE.md", template: "templates/CLAUDE.md" },
  { path: ".github/copilot-instructions.md", template: "templates/copilot-instructions.md" },
  // The proposal directory and its template are the domain-specific part of the bootstrap: an
  // adopter with nowhere to put a proposal, or no template to start from, will invent a shape the
  // detectors cannot read, and will conclude the tooling is broken rather than that their format is.
  { path: "artifacts/innovation-proposals/", directory: true },
  { path: "artifacts/innovation-proposals/TEMPLATE.md", template: "templates/innovation-proposal.md" },
  { path: "artifacts/adr/", directory: true },
];

/**
 * Signals that a repository already contains meaningful implementation.
 *
 * Deliberately conservative: a false "greenfield" is the dangerous direction, because it lets a
 * clean-room plan be scaffolded over real code, and that is a fabricated history
 * (Standard 2 R4). A false "existing" only costs a routing decision the operator
 * can override with --mode.
 *
 * It does not currently succeed at being conservative. Markers are tested at the repository root
 * only, so a project whose code sits one directory down reads as greenfield — the direction this
 * comment calls dangerous. Recorded, with the evidence, in proposal 0004; the decision there is
 * `explore`, so nothing below has been changed to address it.
 */
const IMPLEMENTATION_MARKERS = [
  "src", "lib", "app", "source", "cmd", "internal", "pkg",
  "package.json", "go.mod", "Cargo.toml", "pyproject.toml", "pom.xml", "build.gradle",
];

const PLAN_MARKERS = ["artifacts/innovation-proposals", "PLAN.md", "plan.md"];
const PROMPT_MARKERS = ["artifacts/prompts"];

const has = (root, p) => existsSync(path.join(root, p));

/**
 * A directory counts as evidence only when it has content.
 *
 * This exists because of a bug the tests caught: init creates an EMPTY
 * artifacts/innovation-proposals/ in undocumented-decisions mode, and a second run then read its own
 * output as proof that decisions had been recorded — flipping the mode to EXISTING_WITH_PROPOSALS
 * and erasing the `undocumentedDecisions` signal. An empty proposal directory is not a record of a
 * decision, and a tool must not treat its own scaffolding as evidence about the project.
 */
function hasContent(root, p) {
  const target = path.join(root, p);
  if (!existsSync(target)) return false;
  try {
    return readdirSync(target).some((f) => f.endsWith(".md"));
  } catch {
    return true; // Not a directory — a plain PLAN.md counts on its own.
  }
}

/**
 * Decide which of the three outcomes applies. Returns { mode, evidence, confidence }.
 *
 * `confidence` is INFERRED for everything except an explicit override, because this is a judgement
 * made from file presence. A wrong guess is recoverable only if the reader can see which guess was
 * made — which is why the mode ships with its evidence and never alone.
 */
export function detectMode(root, override = null) {
  const evidence = [];
  if (override) {
    return { mode: override, evidence: ["--mode was given explicitly"], confidence: "CONFIRMED_BY_OWNER" };
  }

  const implementation = IMPLEMENTATION_MARKERS.filter((m) => has(root, m));
  const plans = PLAN_MARKERS.filter((m) => hasContent(root, m));
  const prompts = PROMPT_MARKERS.filter((m) => hasContent(root, m));

  if (implementation.length === 0) {
    evidence.push("no implementation markers found");
    return { mode: MODES.GREENFIELD, evidence, confidence: "INFERRED" };
  }
  evidence.push(`implementation markers: ${implementation.join(", ")}`);

  if (plans.length > 0) {
    evidence.push(`recorded decisions: ${plans.join(", ")}`);
    return { mode: MODES.EXISTING_WITH_PROPOSALS, evidence, confidence: "INFERRED" };
  }
  if (prompts.length > 0) {
    evidence.push(`prompt artifacts: ${prompts.join(", ")}`);
    return { mode: MODES.EXISTING_WITH_PROPOSALS, evidence, confidence: "INFERRED" };
  }

  evidence.push("no recorded innovation decisions found");
  return { mode: MODES.UNDOCUMENTED_DECISIONS, evidence, confidence: "INFERRED" };
}

/**
 * Compute what init would do. Pure — reads the target and the templates, writes nothing.
 *
 * @param root      target repository
 * @param options   { mode, overwrite: string[] } — `overwrite` names paths the operator has
 *                  explicitly approved replacing. An empty list means no overwrite is authorised,
 *                  which is the default.
 */
export async function plan(root, options = {}) {
  const { mode, evidence, confidence } = detectMode(root, options.mode ?? null);
  const approvedOverwrites = new Set(options.overwrite ?? []);

  const actions = [];
  for (const artifact of ARTIFACTS) {
    const target = path.join(root, artifact.path);
    const exists = existsSync(target);

    if (artifact.directory) {
      // Creating a directory alongside existing contents is safe and expected; only writing a FILE
      // over one of that name is destructive.
      actions.push(
        exists
          ? { action: "preserve", path: artifact.path, reason: "directory already exists" }
          : { action: "create", path: artifact.path, kind: "directory" },
      );
      continue;
    }

    const content = await readFile(path.join(FRAMEWORK, artifact.template), "utf8");

    if (!exists) {
      actions.push({ action: "create", path: artifact.path, kind: "file", bytes: content.length });
      continue;
    }

    const current = await readFile(target, "utf8");
    if (current === content) {
      // Idempotence: a second run finds what the first wrote and leaves it alone.
      actions.push({ action: "preserve", path: artifact.path, reason: "already matches the template" });
      continue;
    }

    if (approvedOverwrites.has(artifact.path)) {
      actions.push({
        action: "overwrite",
        path: artifact.path,
        kind: "file",
        reason: "explicitly approved for replacement",
        destructive: true,
      });
      continue;
    }

    actions.push({
      action: "conflict",
      path: artifact.path,
      reason: "exists and differs from the template; nothing was changed",
      remediation: `Review it. To replace it, re-run with --force-overwrite=${artifact.path}.`,
    });
  }

  // The project has shipped work whose decisions were never recorded. init detects the condition and
  // says so; it must NOT scaffold proposals for that work. A proposal written after the fact,
  // describing a decision nobody actually made that way, is a fabricated record — and once written
  // it is indistinguishable from a real one, which is the failure innovation.no-fabricated-evidence
  // exists to prevent.
  const undocumented = mode === MODES.UNDOCUMENTED_DECISIONS;

  return {
    schemaVersion: "1.0.0",
    mode,
    modeConfidence: confidence,
    modeEvidence: evidence,
    created: actions.filter((a) => a.action === "create").map((a) => a.path),
    preserved: actions.filter((a) => a.action === "preserve").map((a) => a.path),
    conflicts: actions.filter((a) => a.action === "conflict"),
    overwrites: actions.filter((a) => a.action === "overwrite").map((a) => a.path),
    undocumentedDecisions: undocumented,
    nextStep: undocumented
      ? "Apply these standards to the NEXT decision. Do not back-fill proposals for work that already shipped — a decision reconstructed after the outcome is known is a fabricated record."
      : mode === MODES.EXISTING_WITH_PROPOSALS
        ? "Run `standards check --all` against the existing proposals, then close the gaps it reports."
        : "Copy artifacts/innovation-proposals/TEMPLATE.md for your first proposal, then run `standards check`.",
    actions,
  };
}

/**
 * Execute a plan. The only writing function here.
 *
 * A partially-completed run must leave no partial files: content is written in one call per file,
 * and a failure stops the run rather than continuing to the next artifact. A truncated
 * project-policy.yml fails validation in a way that looks like the project's fault.
 */
export async function apply(root, planned) {
  const done = [];
  for (const action of planned.actions) {
    if (action.action === "create" && action.kind === "directory") {
      await mkdir(path.join(root, action.path), { recursive: true });
      done.push(action.path);
      continue;
    }
    if (action.action === "create" || action.action === "overwrite") {
      const artifact = ARTIFACTS.find((a) => a.path === action.path);
      const content = await readFile(path.join(FRAMEWORK, artifact.template), "utf8");
      await mkdir(path.dirname(path.join(root, action.path)), { recursive: true });
      await writeFile(path.join(root, action.path), content, "utf8");
      done.push(action.path);
    }
    // `preserve` and `conflict` write nothing, by construction.
  }
  return done;
}

/** Human-readable rendering of a plan or a completed run. */
export function render(report, { dryRun }) {
  const out = [];
  out.push(dryRun ? "standards init — dry run, nothing was written" : "standards init");
  out.push("");
  out.push(`  Mode: ${report.mode} [${report.modeConfidence}]`);
  for (const line of report.modeEvidence) out.push(`        ${line}`);
  out.push("");

  const label = dryRun ? "would create" : "created";
  if (report.created.length) {
    out.push(`  ${label}:`);
    for (const p of report.created) out.push(`    + ${p}`);
  }
  if (report.overwrites.length) {
    out.push(`  ${dryRun ? "would overwrite" : "overwrote"} (approved):`);
    for (const p of report.overwrites) out.push(`    ! ${p}`);
  }
  if (report.preserved.length) {
    out.push("  preserved:");
    for (const p of report.preserved) out.push(`    = ${p}`);
  }
  if (report.conflicts.length) {
    out.push("  conflicts — nothing was changed:");
    for (const c of report.conflicts) {
      out.push(`    ? ${c.path}`);
      out.push(`        ${c.reason}`);
      out.push(`        ${c.remediation}`);
    }
  }
  out.push("");

  if (report.undocumentedDecisions) {
    out.push("  This project has shipped work whose decisions were never recorded.");
    out.push("  The proposal directory was created EMPTY on purpose. Do not back-fill it: a proposal");
    out.push("  written after the outcome is known describes a decision nobody actually made that");
    out.push("  way, and once written it is indistinguishable from a real one.");
    out.push("");
  }
  out.push(`  Next: ${report.nextStep}`);

  if (!dryRun && report.conflicts.length === 0 && report.created.length === 0) {
    out.push("");
    out.push("  Nothing to do — this project is already bootstrapped.");
  }
  return out.join("\n");
}
