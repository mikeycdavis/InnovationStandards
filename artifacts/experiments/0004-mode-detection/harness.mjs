/**
 * Experiment harness for proposal 0004 — which signal separates a repository that has shipped
 * work from one that has not?
 *
 * Run:  node artifacts/experiments/0004-mode-detection/harness.mjs [--subjects=<json>]
 *
 * This file exists so that E9-E14 in the proposal cite something a reader can execute rather than
 * a result they must take on trust. It reimplements each candidate here and imports only the
 * shipping `detectMode` as the baseline, because 0004 is under deliberation and `scripts/init.mjs`
 * must not change while it is.
 *
 * The three real repositories are paths on the machine where this was run. They are not fixtures
 * and this harness cannot recreate them; on any other machine those rows will be skipped and the
 * two synthetic cases plus the bare monorepo still run. That is a limitation of the evidence, not
 * something to paper over — see RESULTS.md.
 */
import { existsSync, readdirSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { detectMode } from "../../../scripts/init.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");

const IMPLEMENTATION_MARKERS = [
  "src", "lib", "app", "source", "cmd", "internal", "pkg",
  "package.json", "go.mod", "Cargo.toml", "pyproject.toml", "pom.xml", "build.gradle",
];
const PLAN_MARKERS = ["artifacts/innovation-proposals", "PLAN.md", "plan.md"];
const PROMPT_MARKERS = ["artifacts/prompts"];

/** Declared before the run, not tuned after it. */
const EXCLUDE = new Set([
  ".git", "node_modules", ".venv", "venv", "vendor", "dist", "build", "out",
  "target", ".next", "__pycache__", ".dart_tool", ".gradle", "coverage",
]);

const G = "greenfield", E = "existing-with-proposals", U = "undocumented-decisions";

const has = (root, p) => existsSync(path.join(root, p));

function hasContent(root, p) {
  const target = path.join(root, p);
  if (!existsSync(target)) return false;
  try { return readdirSync(target).some((f) => f.endsWith(".md")); }
  catch { return true; }
}

/** Implementation markers at directory depth <= maxDepth. Depth 1 is the root itself. */
function implementationMarkersDeep(root, maxDepth) {
  const found = new Set();
  let dirsVisited = 0;
  const walk = (dir, depth) => {
    dirsVisited++;
    for (const m of IMPLEMENTATION_MARKERS) {
      if (existsSync(path.join(dir, m))) found.add(path.relative(root, path.join(dir, m)) || m);
    }
    if (depth >= maxDepth) return;
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || EXCLUDE.has(e.name)) continue;
      walk(path.join(dir, e.name), depth + 1);
    }
  };
  walk(root, 1);
  return { found: [...found], dirsVisited };
}

function gitSignals(root) {
  const run = (args) =>
    execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    return { isRepo: true, commits: Number(run(["rev-list", "--count", "HEAD"])), tracked: run(["ls-files"]).split("\n").filter(Boolean).length };
  } catch {
    try { run(["rev-parse", "--git-dir"]); return { isRepo: true, commits: 0, tracked: 0 }; }
    catch { return { isRepo: false, commits: null, tracked: null }; }
  }
}

function classifyFromImplementation(implFound, root) {
  if (implFound.length === 0) return G;
  if (PLAN_MARKERS.some((m) => hasContent(root, m))) return E;
  if (PROMPT_MARKERS.some((m) => hasContent(root, m))) return E;
  return U;
}

// --- candidates. The first six were fixed before the run; the seventh was not. ------------------

const PRE_REGISTERED = {
  /** What ships today: root-only markers, early return to greenfield. */
  baseline: (root) => detectMode(root).mode,

  /** (a) bounded recursion. Everything else identical to today. */
  "a-depth2": (root) => classifyFromImplementation(implementationMarkersDeep(root, 2).found, root),
  "a-depth3": (root) => classifyFromImplementation(implementationMarkersDeep(root, 3).found, root),

  /**
   * (b) git evidence. The thresholds below are DECLARED, not derived from anything — that is the
   * finding about this candidate, not an accident of the harness.
   */
  "b-git": (root) => {
    const g = gitSignals(root);
    if (!g.isRepo) return "UNAVAILABLE";
    if (!(g.commits > 1 && g.tracked > 4)) return G;
    return PLAN_MARKERS.some((m) => hasContent(root, m)) ? E : U;
  },

  /** (c1) all three signal groups, no early return; a prompt is an input to a decision, not one. */
  "c1-combined": (root) => combined(root, IMPLEMENTATION_MARKERS.filter((m) => has(root, m)), false),
  /** (c2) same, but keeping today's mapping of prompt artifacts to existing-with-proposals. */
  "c2-combined": (root) => combined(root, IMPLEMENTATION_MARKERS.filter((m) => has(root, m)), true),
};

function combined(root, impl, promptsAreProposals) {
  const plans = PLAN_MARKERS.filter((m) => hasContent(root, m));
  const prompts = PROMPT_MARKERS.filter((m) => hasContent(root, m));
  if (impl.length === 0 && plans.length === 0 && prompts.length === 0) return G;
  if (plans.length > 0 || (promptsAreProposals && prompts.length > 0)) return E;
  return U;
}

/** DERIVED AFTER THE RUN. Not pre-registered; reported separately for exactly that reason. */
const DERIVED = {
  "a+c1": (root) => combined(root, implementationMarkersDeep(root, 2).found, false),
};

// --- subjects -----------------------------------------------------------------------------------

function buildSynthetic() {
  const base = path.join(os.tmpdir(), "is-0004-experiment");
  rmSync(base, { recursive: true, force: true });
  const git = (dir, args) =>
    execFileSync("git", ["-C", dir, "-c", "user.email=e@x", "-c", "user.name=n", ...args], { stdio: "ignore" });

  const empty = path.join(base, "empty-dir");
  mkdirSync(empty, { recursive: true });

  const fresh = path.join(base, "fresh-git");
  mkdirSync(fresh, { recursive: true });
  writeFileSync(path.join(fresh, "README.md"), "# Fresh\n");
  git(fresh, ["init", "-q", "."]); git(fresh, ["add", "README.md"]); git(fresh, ["commit", "-qm", "initial"]);

  // Added after the pre-registered run, to falsify c1 specifically. See RESULTS.md.
  const mono = path.join(base, "monorepo-bare");
  mkdirSync(path.join(mono, "backend", "src"), { recursive: true });
  mkdirSync(path.join(mono, "frontend"), { recursive: true });
  writeFileSync(path.join(mono, "README.md"), "# svc\n");
  writeFileSync(path.join(mono, "backend", "pyproject.toml"), "[project]\n");
  writeFileSync(path.join(mono, "frontend", "package.json"), "{}\n");
  git(mono, ["init", "-q", "."]); git(mono, ["add", "-A"]); git(mono, ["commit", "-qm", "a"]);
  git(mono, ["commit", "-q", "--allow-empty", "-m", "b"]);

  return { empty, fresh, mono };
}

const synthetic = buildSynthetic();
const sibling = (name) => path.resolve(REPO, "..", name);

const DEFAULT_SUBJECTS = [
  { name: "HouseDoc", root: sibling("HouseDoc"), truth: U, note: "shipped work, zero proposals" },
  { name: "InnovationStandards", root: REPO, truth: E, note: "shipped work, five proposals" },
  { name: "EngineeringStandards", root: sibling("EngineeringStandards"), truth: U, note: "shipped work, zero proposals" },
  { name: "empty-dir", root: synthetic.empty, truth: G, note: "synthetic" },
  { name: "fresh-git", root: synthetic.fresh, truth: G, note: "synthetic" },
  { name: "monorepo-bare", root: synthetic.mono, truth: U, note: "synthetic, POST-HOC" },
];

const arg = process.argv.find((a) => a.startsWith("--subjects="));
const subjects = (arg ? JSON.parse(arg.slice("--subjects=".length)) : DEFAULT_SUBJECTS)
  .filter((s) => {
    if (existsSync(s.root)) return true;
    console.log(`  (skipped ${s.name} — not present at ${s.root})`);
    return false;
  });

// --- run ------------------------------------------------------------------------------------------

const rows = subjects.map((s) => {
  const results = {}, timings = {};
  for (const [name, fn] of Object.entries({ ...PRE_REGISTERED, ...DERIVED })) {
    const t0 = performance.now();
    results[name] = fn(s.root);
    timings[name] = performance.now() - t0;
  }
  return { ...s, git: gitSignals(s.root), d2: implementationMarkersDeep(s.root, 2), d3: implementationMarkersDeep(s.root, 3), results, timings };
});

const pad = (s, n) => String(s).padEnd(n);

console.log("\nSIGNALS");
console.log(pad("subject", 22) + pad("truth", 25) + pad("git c/t", 12) + pad("root", 6) + pad("d2", 5) + pad("d3", 5) + "dirs@3");
for (const r of rows) {
  console.log(
    pad(r.name, 22) + pad(r.truth, 25) +
    pad(r.git.isRepo ? `${r.git.commits}/${r.git.tracked}` : "not a repo", 12) +
    pad(IMPLEMENTATION_MARKERS.filter((m) => has(r.root, m)).length, 6) +
    pad(r.d2.found.length, 5) + pad(r.d3.found.length, 5) + r.d3.dirsVisited,
  );
}

for (const [heading, group] of [["PRE-REGISTERED CANDIDATES", PRE_REGISTERED], ["DERIVED AFTER THE RUN", DERIVED]]) {
  console.log(`\n${heading}   (v = matches truth)`);
  for (const n of Object.keys(group)) {
    let score = 0;
    const cells = rows.map((r) => {
      const ok = r.results[n] === r.truth;
      if (ok) score++;
      return pad(`${ok ? "v" : "X"} ${r.results[n]}`, 25);
    });
    console.log(pad(n, 14) + cells.join("") + `${score}/${rows.length}`);
  }
  console.log(pad("subject order", 14) + rows.map((r) => pad(r.name, 25)).join(""));
}

console.log("\nCOST (ms per call)");
for (const n of Object.keys({ ...PRE_REGISTERED, ...DERIVED })) {
  console.log(pad(n, 14) + rows.map((r) => pad(r.timings[n].toFixed(1), 12)).join(""));
}

console.log("\nMARKERS FOUND AT DEPTH 3");
for (const r of rows) console.log(`  ${r.name}: ${r.d3.found.join(", ") || "(none)"}`);
