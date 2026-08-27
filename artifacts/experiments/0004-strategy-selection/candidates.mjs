/**
 * The six candidates for proposal 0004's strategy-selection experiment, frozen.
 *
 * WHAT THIS FILE IS. An executable translation of the candidate table in `PRE-REGISTRATION.md`,
 * with every implementation degree of freedom resolved in `AMENDMENT-01.md`. It was written before
 * any of the sixteen held-out subjects was opened. Nothing here was chosen with knowledge of any
 * subject's contents, and `FREEZE.md` records the hash that makes a later edit detectable.
 *
 * WHY IT CONTAINS NO SUBJECT NAMES. A candidate that mentions a subject has been tuned to it. The
 * freeze check greps this file for all sixteen names and requires zero matches; that check is weak
 * evidence on its own, but it is mechanical and it fails loudly.
 *
 * WHY CANDIDATE 0 IS AN IMPORT. Restating today's detector would produce a reconstruction of the
 * baseline rather than the baseline. Importing it means candidate 0 cannot drift unless `scripts/`
 * changes, which the repository's seven gates would notice.
 *
 * WHY CANDIDATES 1 AND 2 REUSE OLD NUMBERS. Depth 2, the fourteen-name EXCLUDE list and the
 * `commits > 1 && tracked > 4` thresholds were declared by the first experiment before its own run.
 * They are inherited rather than re-chosen: a threshold picked today would be picked with more
 * knowledge than the one it replaces, and that is the contamination this whole apparatus exists to
 * prevent.
 *
 * EVERY CANDIDATE RETURNS EVIDENCE, NOT JUST A MODE. E20 recorded that today's detector describes an
 * empty directory and a two-package monorepo in identical words, so nothing distinguishes "looked
 * everywhere and found nothing" from "looked only at the root". The Class I bar requires that
 * distinction, so the return shape has to carry it — a candidate that cannot explain itself must be
 * observably unable to, not silently indistinguishable from one that can.
 */

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { detectMode } from "../../../scripts/init.mjs";

export const GREENFIELD = "greenfield";
export const EXISTING = "existing-with-proposals";
export const UNDOCUMENTED = "undocumented-decisions";
export const REFUSED = "refused";
export const UNAVAILABLE = "UNAVAILABLE";

/** Inherited from the first experiment's frozen harness. Not re-chosen. */
const IMPLEMENTATION_MARKERS = [
  "src", "lib", "app", "source", "cmd", "internal", "pkg",
  "package.json", "go.mod", "Cargo.toml", "pyproject.toml", "pom.xml", "build.gradle",
];
const PLAN_MARKERS = ["artifacts/innovation-proposals", "PLAN.md", "plan.md"];
const PROMPT_MARKERS = ["artifacts/prompts"];
const EXCLUDE = new Set([
  ".git", "node_modules", ".venv", "venv", "vendor", "dist", "build", "out",
  "target", ".next", "__pycache__", ".dart_tool", ".gradle", "coverage",
]);

/** Inherited declared thresholds for candidate 2. See AMENDMENT-01. */
const MIN_COMMITS = 1;
const MIN_TRACKED = 4;

const has = (root, p) => existsSync(path.join(root, p));

/** A directory is evidence only when it holds a `.md`; a plain file counts on its own. */
function hasContent(root, p) {
  const target = path.join(root, p);
  if (!existsSync(target)) return false;
  try {
    return readdirSync(target).some((f) => f.endsWith(".md"));
  } catch {
    return true;
  }
}

/**
 * The definitional half of the mode, identical for every candidate.
 *
 * Whether proposals exist is not inferred — the mode `existing-with-proposals` *names* their
 * presence. This experiment varies implementation detection and nothing else, so that a difference
 * in results is attributable to the thing under test.
 */
const hasPlans = (root) => PLAN_MARKERS.some((m) => hasContent(root, m));

const splitByPlans = (root) => (hasPlans(root) ? EXISTING : UNDOCUMENTED);

// --- signals ------------------------------------------------------------------------------------

/** S1 — root-only markers. Today's signal. */
function rootMarkers(root) {
  return IMPLEMENTATION_MARKERS.filter((m) => has(root, m));
}

/** S2 — markers at directory depth <= maxDepth. Depth 1 is the root itself. */
function deepMarkers(root, maxDepth) {
  const found = [];
  let dirsVisited = 0;
  const walk = (dir, depth) => {
    dirsVisited += 1;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const m of IMPLEMENTATION_MARKERS) {
      const hit = entries.find((e) => e.name === m);
      if (hit) found.push(path.relative(root, path.join(dir, m)).split(path.sep).join("/"));
    }
    if (depth >= maxDepth) return;
    for (const e of entries) {
      if (!e.isDirectory() || EXCLUDE.has(e.name)) continue;
      walk(path.join(dir, e.name), depth + 1);
    }
  };
  walk(root, 1);
  return { found: [...new Set(found)], dirsVisited };
}

/** Git facts. `isRepo: false` is a real answer, not an error. */
function gitSignals(root) {
  const run = (args) => execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
  });
  try {
    run(["rev-parse", "--is-inside-work-tree"]);
  } catch {
    return { isRepo: false, commits: 0, tracked: 0, files: [] };
  }
  let commits = 0;
  try {
    commits = Number(run(["rev-list", "--count", "HEAD"]).trim()) || 0;
  } catch {
    commits = 0; // A repository with no commits yet.
  }
  let files = [];
  try {
    files = run(["ls-files"]).split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    files = [];
  }
  return { isRepo: true, commits, tracked: files.length, files };
}

// --- candidate 3's file categorisation, fixed in AMENDMENT-01 ------------------------------------

const DOC_EXT = new Set([".md", ".markdown", ".rst", ".txt", ".adoc"]);
const CONFIG_EXT = new Set([
  ".json", ".yml", ".yaml", ".toml", ".ini", ".cfg", ".conf", ".properties", ".lock", ".xml",
]);
const DOC_BASENAMES = new Set(["LICENSE", "COPYING", "NOTICE", "CHANGELOG", "AUTHORS", "README"]);

/** True when a tracked path is documentation, configuration, or framework scaffolding. */
function isNonSubstantive(file) {
  const parts = file.split("/");
  if (EXCLUDE.has(parts[0])) return true;
  if (parts.some((p) => p.startsWith("."))) return true;
  if (parts.includes("docs")) return true;
  const base = parts[parts.length - 1];
  const ext = path.extname(base).toLowerCase();
  if (DOC_EXT.has(ext) || CONFIG_EXT.has(ext)) return true;
  const stem = ext ? base.slice(0, -ext.length) : base;
  if (DOC_BASENAMES.has(stem.toUpperCase())) return true;
  return false;
}

/** S3 — at least one tracked file that is not documentation, configuration or scaffolding. */
function substantiveFiles(root) {
  const g = gitSignals(root);
  if (!g.isRepo) return { available: false, files: [] };
  return { available: true, files: g.files.filter((f) => !isNonSubstantive(f)) };
}

/** True when the directory holds nothing at all besides `.git`. Evidence of absence. */
function verifiablyEmpty(root) {
  try {
    return readdirSync(root).filter((e) => e !== ".git").length === 0;
  } catch {
    return false;
  }
}

// --- the six candidates -------------------------------------------------------------------------

/**
 * Each returns { mode, evidence, scope }.
 *
 * `scope` states how far the candidate looked. It exists because of E20: without it, "found nothing"
 * from a root-only check and "found nothing" from an exhaustive one are the same sentence.
 */
export const CANDIDATES = {
  /** 0 — the shipping detector, imported rather than restated. */
  "0-baseline": {
    class: "baseline",
    signal: "root-only markers",
    run(root) {
      const { mode, evidence } = detectMode(root);
      return { mode, evidence, scope: "root only" };
    },
  },

  /** 1 — (a)+(c1): bounded recursion, no early return. Inherited verbatim. */
  "1-recursion-no-early-return": {
    class: "I",
    signal: "markers at depth <= 2",
    run(root) {
      // The frozen `a+c1` composition: all three groups empty -> greenfield; else plans -> existing;
      // else undocumented. Prompt markers participate in the greenfield test and never map to
      // `existing-with-proposals` — that is the `c1` half, and 0006 owns whether it is right.
      const { found, dirsVisited } = deepMarkers(root, 2);
      const scope = `depth <= 2, ${dirsVisited} directories visited, ${EXCLUDE.size} names excluded`;
      const plans = PLAN_MARKERS.filter((m) => hasContent(root, m));
      const prompts = PROMPT_MARKERS.filter((m) => hasContent(root, m));
      if (found.length === 0 && plans.length === 0 && prompts.length === 0) {
        return { mode: GREENFIELD, evidence: ["no markers at depth <= 2, no plans, no prompts"], scope };
      }
      if (plans.length > 0) {
        return { mode: EXISTING, evidence: [`recorded decisions: ${plans.join(", ")}`], scope };
      }
      const seen = found.length > 0 ? `markers: ${found.join(", ")}` : `prompt artifacts: ${prompts.join(", ")}`;
      return { mode: UNDOCUMENTED, evidence: [seen], scope };
    },
  },

  /** 2 — git evidence. Declared thresholds, inherited. */
  "2-git-evidence": {
    class: "I",
    signal: "commit and tracked-file counts",
    run(root) {
      const g = gitSignals(root);
      if (!g.isRepo) {
        return { mode: UNAVAILABLE, evidence: ["not a git repository"], scope: "git metadata" };
      }
      const scope = `git metadata: ${g.commits} commits, ${g.tracked} tracked files`;
      if (!(g.commits > MIN_COMMITS && g.tracked > MIN_TRACKED)) {
        return {
          mode: GREENFIELD,
          evidence: [`below declared thresholds (> ${MIN_COMMITS} commits, > ${MIN_TRACKED} files)`],
          scope,
        };
      }
      return { mode: splitByPlans(root), evidence: ["above declared thresholds"], scope };
    },
  },

  /** 3 — content-shaped: any substantive tracked file. */
  "3-content-shaped": {
    class: "I",
    signal: "substantive tracked files",
    run(root) {
      const s = substantiveFiles(root);
      if (!s.available) {
        return { mode: UNAVAILABLE, evidence: ["not a git repository"], scope: "tracked files" };
      }
      const scope = `all tracked files examined, ${s.files.length} substantive`;
      if (s.files.length === 0) {
        return { mode: GREENFIELD, evidence: ["no substantive tracked file"], scope };
      }
      return {
        mode: splitByPlans(root),
        evidence: [`substantive files include: ${s.files.slice(0, 3).join(", ")}`],
        scope,
      };
    },
  },

  /** 4 — refuse when the three signals disagree. */
  "4-refuse-when-weak": {
    class: "II",
    signal: "agreement of S1, S2, S3",
    run(root) {
      const s1 = rootMarkers(root).length > 0;
      const deep = deepMarkers(root, 2);
      const s2 = deep.found.length > 0;
      const s3 = substantiveFiles(root);
      const signals = [
        { name: "S1 root markers", value: s1 },
        { name: "S2 depth<=2 markers", value: s2 },
      ];
      if (s3.available) signals.push({ name: "S3 substantive files", value: s3.files.length > 0 });

      const scope = `S1 root, S2 depth <= 2 (${deep.dirsVisited} dirs), ` +
        (s3.available ? "S3 all tracked files" : "S3 unavailable");

      if (signals.length < 2) {
        return { mode: REFUSED, evidence: ["fewer than two signals available; pass --mode"], scope };
      }
      const values = new Set(signals.map((s) => s.value));
      if (values.size > 1) {
        const agree = signals.filter((s) => s.value).map((s) => s.name);
        const differ = signals.filter((s) => !s.value).map((s) => s.name);
        return {
          mode: REFUSED,
          evidence: [
            `signals disagree — implementation seen by [${agree.join(", ")}], ` +
            `not by [${differ.join(", ")}]; pass --mode`,
          ],
          scope,
        };
      }
      const implementation = [...values][0];
      if (!implementation) {
        return { mode: GREENFIELD, evidence: ["all signals agree: no implementation"], scope };
      }
      return { mode: splitByPlans(root), evidence: ["all signals agree: implementation present"], scope };
    },
  },

  /** 5 — never infer greenfield from absence of evidence; only from evidence of absence. */
  "5-never-infer-greenfield": {
    class: "II",
    signal: "any positive signal, else verifiable emptiness",
    run(root) {
      const s1 = rootMarkers(root);
      const deep = deepMarkers(root, 2);
      const s3 = substantiveFiles(root);
      const positive = s1.length > 0 || deep.found.length > 0 ||
        (s3.available && s3.files.length > 0);
      const scope = `S1 root, S2 depth <= 2 (${deep.dirsVisited} dirs), ` +
        (s3.available ? "S3 all tracked files" : "S3 unavailable");

      if (positive) {
        return { mode: splitByPlans(root), evidence: ["at least one signal saw implementation"], scope };
      }
      if (verifiablyEmpty(root)) {
        return {
          mode: GREENFIELD,
          evidence: ["directory is verifiably empty — evidence of absence, not absence of evidence"],
          scope: `${scope}; directory listing empty`,
        };
      }
      return {
        mode: REFUSED,
        evidence: [
          "files present but no signal recognised them; refusing to infer greenfield. " +
          "Pass --mode=greenfield to declare it",
        ],
        scope,
      };
    },
  },
};

export const CANDIDATE_IDS = Object.keys(CANDIDATES);
