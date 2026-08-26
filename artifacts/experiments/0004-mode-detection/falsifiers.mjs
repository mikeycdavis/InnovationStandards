/**
 * Falsifiers for proposal 0004's release objective — two repository shapes that `detectMode` must
 * stop calling `greenfield`, and one it must go on calling `greenfield`.
 *
 * Run:  node artifacts/experiments/0004-mode-detection/falsifiers.mjs
 *
 * WHY THIS IS NOT IN test/. It is expected to FAIL. `scripts/init.mjs` is unchanged and under
 * deliberation, so these cases are red today by construction — and this repository's pipeline
 * requires all seven gates green before anything can be pushed. A deliberately-red case in
 * `test/*.test.mjs` could not land, so the demonstration lives here and its result is recorded in
 * RED-DEMONSTRATION.md. ST-01 set that precedent: run the thing, commit what came back.
 *
 * The intended lifecycle is that this file goes green on its own, without being edited, once
 * ST-02's correction exists. Until then a non-zero exit is the correct outcome and is the evidence.
 *
 * WHAT THESE CASES MAY AND MAY NOT ASSERT. The HouseDoc shape asserts only that the mode is **not**
 * `greenfield`. It does not assert which mode is right, and that restraint is load-bearing rather
 * than caution: that repository holds `artifacts/prompts/` and no proposals, so naming its correct
 * mode would decide whether a prompt artifact is a recorded innovation decision — which is proposal
 * 0006's open question. A falsifier that answered it would settle an undecided proposal by test.
 *
 * The bare monorepo carries no prompt artifacts at all, so its correct mode is unambiguous and is
 * named.
 *
 * ONE IMPROVEMENT OVER harness.mjs, AND IT IS WORTH STATING. That harness's strongest rows were
 * three real repositories on one machine, which it says plainly it cannot recreate. Every case here
 * is constructed from nothing in a temporary directory, so this runs identically anywhere. The
 * cost is that a constructed shape is a model of the observation rather than the observation, and a
 * model can be wrong in the direction that makes it pass. The HouseDoc case below is therefore
 * built from that repository's actual layout, recorded in its comment, not from memory of it.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { detectMode } from "../../../scripts/init.mjs";

const GREENFIELD = "greenfield";

/** Create a file, making its parent directories. */
function file(root, rel, body = "") {
  const target = path.join(root, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, body);
}

const CASES = [
  {
    id: "housedoc-shape",
    provenance: "OBSERVED — reduced from F:/Repos/HouseDoc as it stood at adoption",
    what:
      "Implementation one level below the root, an empty artifacts/innovation-proposals/, and " +
      "artifacts/prompts/ with content. HouseDoc's top level carries backend-api/, mobile-app/, " +
      "database/ and infrastructure/ — not one of which appears in IMPLEMENTATION_MARKERS — while " +
      "backend-api/ holds pyproject.toml and app/.",
    expectation: "not-greenfield",
    reason:
      "80 commits of shipped work. Calling it greenfield tells an adopter to start recording " +
      "decisions from scratch on a repository that has been shipping for months.",
    build(root) {
      file(root, "backend-api/pyproject.toml", "[project]\nname = \"housedoc-api\"\n");
      file(root, "backend-api/app/main.py", "");
      file(root, "mobile-app/package.json", "{}\n");
      file(root, "database/schema.sql", "");
      file(root, "infrastructure/main.tf", "");
      file(root, "README.md", "# A shipped project\n");
      // Present but empty — exactly HouseDoc's state, and the reason hasContent() exists.
      mkdirSync(path.join(root, "artifacts/innovation-proposals"), { recursive: true });
      file(root, "artifacts/prompts/original-prompt.md", "# The prompt this project began from\n");
    },
  },
  {
    id: "bare-monorepo",
    provenance:
      "POST-HOC FALSIFIER — constructed after the experiment, to break the candidate that had " +
      "just won. It is not pre-registered evidence and must never be described as part of the " +
      "original experiment.",
    what: "Implementation one level down, and no artifacts/ directory at all.",
    expectation: "undocumented-decisions",
    reason:
      "Nothing here is ambiguous: work exists and no decision is recorded anywhere. This is the " +
      "case that showed root-only signal combination still reads greenfield even once the " +
      "early-return is removed, because the markers are never seen in the first place.",
    build(root) {
      file(root, "packages/api/package.json", "{}\n");
      file(root, "packages/api/src/index.js", "");
      file(root, "packages/web/package.json", "{}\n");
      file(root, "packages/web/src/main.js", "");
      file(root, "README.md", "# A monorepo\n");
    },
  },
  {
    id: "genuinely-empty",
    provenance: "CONTROL — currently passing, and must stay passing",
    what: "An empty directory. Nothing at any depth.",
    expectation: GREENFIELD,
    reason:
      "The direction a one-sided fix breaks. Widening detection until nothing is greenfield trades " +
      "one wrong answer for another and makes the mode unreachable, so this case failing later is " +
      "as much a defect as the two above failing now.",
    build() {},
  },
];

function evaluate(c) {
  const root = mkdtempSync(path.join(os.tmpdir(), `falsifier-${c.id}-`));
  try {
    c.build(root);
    const { mode, evidence, confidence } = detectMode(root);
    const satisfied = c.expectation === "not-greenfield" ? mode !== GREENFIELD : mode === c.expectation;
    return { ...c, actual: mode, evidence, confidence, satisfied };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const results = CASES.map(evaluate);

console.log("Falsifiers for proposal 0004 — run against scripts/init.mjs unchanged\n");
for (const r of results) {
  console.log(`${r.satisfied ? "PASS" : "FAIL"}  ${r.id}`);
  console.log(`      provenance: ${r.provenance}`);
  console.log(`      expected:   ${r.expectation}`);
  console.log(`      actual:     ${r.actual}  (${r.confidence})`);
  console.log(`      evidence:   ${r.evidence.join(" | ")}`);
  console.log("");
}

const failed = results.filter((r) => !r.satisfied);
console.log(`${results.length - failed.length} of ${results.length} satisfied.`);
if (failed.length) {
  console.log(`Not satisfied: ${failed.map((r) => r.id).join(", ")}.`);
  console.log("Expected while ST-02 is open. This exit code is the evidence, not a defect in this file.");
}
process.exit(failed.length ? 1 : 0);
