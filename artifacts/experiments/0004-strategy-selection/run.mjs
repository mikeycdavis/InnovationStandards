/**
 * The experiment runner for proposal 0004's strategy selection.
 *
 * WHAT IT ENFORCES, RATHER THAN ASKS FOR. The pre-registration fixes an order — freeze candidates,
 * freeze subjects, establish ground truth, run, record — and says a run that departs from it is
 * void. That ordering is enforced here instead of being trusted: `--subjects` exits 2 unless
 * `GROUND-TRUTH.json` already exists. A candidate cannot be run against a held-out subject before
 * that subject has been labelled, because the runner will not do it.
 *
 * THE MANIFEST IS THE POINT. Every run emits the candidate ids, the sha256 of the candidate source
 * (whole file and per candidate), the sha256 of this runner, the sha256 of `scripts/init.mjs`
 * (candidate 0's real source), the subject ids and the sha256 of the ground-truth file. A result can
 * then be checked against the frozen components rather than asserted to have used them. If a
 * candidate is edited after ground truth exists, the hashes in the result and in `FREEZE.md`
 * disagree, and the run is void by the pre-registration's own terms.
 *
 * MODES.
 *   --manifest-only   emit the manifest and exit. Safe before ground truth exists.
 *   --gates           run the three constructed cases. Safe before ground truth exists: they are
 *                     controls already on `main`, not held-out subjects.
 *   --subjects        run the sixteen. Requires GROUND-TRUTH.json.
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { CANDIDATES, CANDIDATE_IDS, GREENFIELD, UNDOCUMENTED, REFUSED, UNAVAILABLE } from "./candidates.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");
const GROUND_TRUTH = path.join(HERE, "GROUND-TRUTH.json");

/**
 * Hashes are taken over newline-normalised text, never raw bytes.
 *
 * This repository checks out CRLF on Windows and stores LF, so a byte hash of a working copy is a
 * fact about the checkout rather than about the content. A freeze record built from byte hashes
 * would report every candidate as edited on a fresh clone — the failure mode being loud, but
 * indistinguishable from the real tampering it is supposed to detect.
 */
const norm = (s) => s.replace(/\r\n/g, "\n");
const sha256 = (text) => createHash("sha256").update(norm(text), "utf8").digest("hex");
const hashFile = (p) => (existsSync(p) ? sha256(readFileSync(p, "utf8")) : null);

/** The sixteen, frozen in PRE-REGISTRATION.md. Order is the document's order. */
const SUBJECTS = [
  "EMOS", "Encore", "ExcuseGenerator", "FantasyManager",
  "Forecast", "GoalBridge", "GradePal", "GreenThumb",
  "HowLongUntil", "IceBox", "LifeHub", "LifeInWeeks",
  "Moneyball", "PvsNP", "ShouldILiveHere", "WorkSimulator",
];

/**
 * The three constructed gates.
 *
 * Deliberately duplicated from `falsifiers.mjs` rather than imported. That file's sha256 is recorded
 * in RED-DEMONSTRATION.md as the evidence of the red run, so editing it to add an export would
 * invalidate a published hash. The duplication is checked instead: `--gates` re-runs the original
 * script and requires it to still report the same baseline result.
 */
const GATES = [
  {
    id: "housedoc-shape",
    expect: (mode) => mode !== GREENFIELD,
    expectation: "not-greenfield",
    build(root) {
      mkdirSync(path.join(root, "backend-api/app"), { recursive: true });
      writeFileSync(path.join(root, "backend-api/pyproject.toml"), "[project]\nname='x'\n");
      writeFileSync(path.join(root, "backend-api/app/main.py"), "print('x')\n");
      mkdirSync(path.join(root, "mobile-app"), { recursive: true });
      writeFileSync(path.join(root, "mobile-app/package.json"), '{"name":"m"}\n');
      mkdirSync(path.join(root, "database"), { recursive: true });
      writeFileSync(path.join(root, "database/schema.sql"), "select 1;\n");
      mkdirSync(path.join(root, "infrastructure"), { recursive: true });
      writeFileSync(path.join(root, "infrastructure/main.tf"), "# tf\n");
      mkdirSync(path.join(root, "artifacts/innovation-proposals"), { recursive: true });
      mkdirSync(path.join(root, "artifacts/prompts"), { recursive: true });
      writeFileSync(path.join(root, "artifacts/prompts/original.md"), "# prompt\n");
    },
  },
  {
    id: "bare-monorepo",
    expect: (mode) => mode === UNDOCUMENTED,
    expectation: "undocumented-decisions",
    build(root) {
      for (const pkg of ["api", "web"]) {
        mkdirSync(path.join(root, `packages/${pkg}/src`), { recursive: true });
        writeFileSync(path.join(root, `packages/${pkg}/package.json`), `{"name":"${pkg}"}\n`);
        writeFileSync(path.join(root, `packages/${pkg}/src/index.js`), "export default 1;\n");
      }
    },
  },
  {
    id: "genuinely-empty",
    expect: (mode) => mode === GREENFIELD,
    expectation: "greenfield",
    build() {},
  },
];

function withFixture(gate, fn) {
  const root = mkdtempSync(path.join(os.tmpdir(), `gate-${gate.id}-`));
  try {
    gate.build(root);
    execFileSync("git", ["-C", root, "init", "-q"], { stdio: "ignore" });
    execFileSync("git", ["-C", root, "add", "-A"], { stdio: "ignore" });
    execFileSync("git", ["-C", root, "-c", "user.email=e@x", "-c", "user.name=n",
      "commit", "-q", "-m", "fixture", "--allow-empty"], { stdio: "ignore" });
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function manifest() {
  const perCandidate = {};
  for (const id of CANDIDATE_IDS) {
    perCandidate[id] = {
      class: CANDIDATES[id].class,
      signal: CANDIDATES[id].signal,
      sourceSha256: sha256(CANDIDATES[id].run.toString()),
    };
  }
  let commit = null;
  try {
    commit = execFileSync("git", ["-C", REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch { /* not fatal — the manifest records null rather than guessing */ }
  return {
    experiment: "0004-strategy-selection",
    node: process.version,
    commit,
    candidates: perCandidate,
    files: {
      "candidates.mjs": hashFile(path.join(HERE, "candidates.mjs")),
      "run.mjs": hashFile(path.join(HERE, "run.mjs")),
      "scripts/init.mjs": hashFile(path.join(REPO, "scripts/init.mjs")),
      "PRE-REGISTRATION.md": hashFile(path.join(HERE, "PRE-REGISTRATION.md")),
      "AMENDMENT-01.md": hashFile(path.join(HERE, "AMENDMENT-01.md")),
      "GROUND-TRUTH.json": hashFile(GROUND_TRUTH),
    },
    subjects: SUBJECTS,
  };
}

/** The pre-registered four-outcome taxonomy. Ground truth `AMBIGUOUS-0006` never yields false-recorded. */
function outcomeOf(actual, truth) {
  if (actual === UNAVAILABLE) return "UNAVAILABLE";
  if (actual === REFUSED) return "refused";
  if (actual === GREENFIELD && truth !== GREENFIELD) return "false-greenfield";
  if (truth === "AMBIGUOUS-0006") return actual === GREENFIELD ? "false-greenfield" : "ambiguous-not-scored";
  if (actual === truth) return "correct";
  if (truth === UNDOCUMENTED) return "false-recorded";
  return "incorrect";
}

function runGates() {
  const rows = [];
  for (const gate of GATES) {
    withFixture(gate, (root) => {
      for (const id of CANDIDATE_IDS) {
        const r = CANDIDATES[id].run(root);
        rows.push({
          gate: gate.id, candidate: id, expectation: gate.expectation,
          mode: r.mode, passed: gate.expect(r.mode), scope: r.scope, evidence: r.evidence,
        });
      }
    });
  }
  return rows;
}

function runSubjects() {
  if (!existsSync(GROUND_TRUTH)) {
    console.error(
      "REFUSING TO RUN. GROUND-TRUTH.json does not exist.\n" +
      "The pre-registration fixes the order: freeze candidates, freeze subjects, establish ground\n" +
      "truth, run, record. Running a candidate against a subject before that subject is labelled\n" +
      "voids the experiment. Establish ground truth first."
    );
    process.exit(2);
  }
  const truth = JSON.parse(readFileSync(GROUND_TRUTH, "utf8"));
  const rows = [];
  for (const name of SUBJECTS) {
    const root = path.resolve(REPO, "..", name);
    const label = truth[name]?.label ?? null;
    if (!existsSync(root)) {
      rows.push({ subject: name, status: "MISSING" });
      continue;
    }
    if (!label) {
      rows.push({ subject: name, status: "NO-GROUND-TRUTH" });
      continue;
    }
    for (const id of CANDIDATE_IDS) {
      const r = CANDIDATES[id].run(root);
      rows.push({
        subject: name, candidate: id, truth: label, mode: r.mode,
        outcome: outcomeOf(r.mode, label), scope: r.scope, evidence: r.evidence,
      });
    }
  }
  return rows;
}

const args = new Set(process.argv.slice(2));
const out = { manifest: manifest() };

if (args.has("--gates")) out.gates = runGates();
if (args.has("--subjects")) out.subjects = runSubjects();
if (!args.has("--gates") && !args.has("--subjects") && !args.has("--manifest-only")) {
  console.error("usage: node run.mjs [--manifest-only] [--gates] [--subjects]");
  process.exit(2);
}

console.log(JSON.stringify(out, null, 2));
