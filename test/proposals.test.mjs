/**
 * The proposal parser and the detectors built on it, proved against fixtures.
 *
 * Every detector here is mutation-tested: a fixture carrying the defect must FAIL before the
 * compliant fixture's pass is worth anything. A check that cannot be provoked is a check that
 * reports green forever, and the repository this engine came from has shipped exactly that bug —
 * a freshness check that matched on first lines and so reported clean on the one edit it existed
 * to catch. Both directions are asserted below for every rule.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseProposal } from "../scripts/proposal.mjs";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts/standards.mjs");

/** Run the CLI against a fixture and return its parsed JSON, whatever the exit code. */
async function audit(fixture) {
  try {
    const { stdout } = await run("node", [CLI, "audit", `--dir=test/fixtures/${fixture}`, "--json"], { cwd: ROOT });
    return JSON.parse(stdout);
  } catch (error) {
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

async function validate(fixture) {
  try {
    const { stdout } = await run("node", [CLI, "validate", `--dir=test/fixtures/${fixture}`, "--json"], { cwd: ROOT });
    return { report: JSON.parse(stdout), code: 0 };
  } catch (error) {
    if (error.stdout) return { report: JSON.parse(error.stdout), code: error.code };
    throw error;
  }
}

const rulesFired = (report) => new Set(report.findings.filter((f) => f.rule).map((f) => f.rule));

// --- The parser -------------------------------------------------------------------------------

test("the parser reads sections, fields, evidence entries, and the decision", () => {
  const p = parseProposal(
    [
      "# Proposal 0001 — Title",
      "",
      "- **Proposal type:** feature",
      "",
      "## Problem",
      "- **Statement:** something is wrong",
      "",
      "## Evidence",
      "- **E1 [observation]** a thing (source: some/path.md)",
      "- **E2 [validated-conclusion]** a conclusion (from: E1)",
      "",
      "## Decision",
      "- **Outcome:** build",
      "- **RevisitWhen:** never",
    ].join("\n"),
    "f.md",
  );
  assert.equal(p.type, "feature");
  assert.equal(p.field("Problem", "Statement"), "something is wrong");
  assert.equal(p.evidence.length, 2);
  assert.deepEqual(p.evidence[0], {
    id: "E1", level: "observation", text: "a thing", source: "some/path.md", from: [],
  });
  assert.deepEqual(p.evidence[1].from, ["E1"]);
  assert.equal(p.decision.outcome, "build");
  assert.equal(p.decision.revisitWhen, "never");
});

test("template commentary never satisfies a field", () => {
  // The template ships with HTML-comment guidance beside every field. If a comment counted as
  // content, copying the template and changing nothing would be the fastest route to a clean
  // verdict — which would make the tool worse than useless.
  const p = parseProposal(
    ["## Problem", "<!--", "- **Statement:** this is guidance, not an answer", "-->"].join("\n"),
    "f.md",
  );
  assert.equal(p.field("Problem", "Statement"), null);
});

test("an evidence level outside the Evidence section is not an evidence entry", () => {
  // The grammar is positional. A level named in another section is prose about the taxonomy.
  const p = parseProposal(
    ["## Costs", "- **E1 [observation]** this is not an evidence entry"].join("\n"),
    "f.md",
  );
  assert.equal(p.evidence.length, 0);
});

// --- Compliant fixtures: all three demonstrate a clean run ---------------------------------------

for (const fixture of ["compliant-proposal", "compliant-rejection", "compliant-deferral"]) {
  test(`${fixture} produces no rule findings`, async () => {
    const report = await audit(fixture);
    assert.deepEqual([...rulesFired(report)], [], `${fixture} should be clean`);
  });
}

test("a decision to REJECT is compliant — the framework does not force ideas toward implementation", async () => {
  // The most important test in this repository. The whole system is designed so that concluding
  // "do not build this" is a successful use of it, and a regression that started penalising
  // `reject` — a scoring tweak, a detector that treats an undecided-looking outcome as a gap —
  // would silently convert this framework into an idea-generation machine. This is the assertion
  // that would break first.
  const { report, code } = await validate("compliant-rejection");
  assert.equal(report.status, "COMPLIANT");
  assert.equal(code, 0);

  const parsed = parseProposal(
    await readFile(
      path.join(ROOT, "test/fixtures/compliant-rejection/artifacts/innovation-proposals/0001-rewrite-reporting-in-house.md"),
      "utf8",
    ),
    "x",
  );
  assert.equal(parsed.decision.outcome, "reject", "the fixture must actually record a rejection");
});

test("a build and a reject are evaluated identically", async () => {
  // Stated as its own assertion because the property is symmetry, not merely that reject passes.
  const build = await validate("compliant-proposal");
  const reject = await validate("compliant-rejection");
  assert.equal(build.report.status, reject.report.status);
  assert.equal(build.code, reject.code);
});

// --- Defect fixtures: each provokes exactly its rule ---------------------------------------------

const DEFECTS = [
  {
    fixture: "fabricated-evidence",
    expect: ["innovation.no-silent-upgrade", "innovation.evidence-citations"],
    why: "a validated-conclusion citing nothing, and a citation to a file that does not exist",
  },
  {
    fixture: "skipped-capability-analysis",
    expect: ["innovation.existing-capability-analysis", "innovation.alternatives-considered"],
    why: "no record of what was searched, and no do-nothing alternative",
  },
  {
    fixture: "forced-build",
    expect: ["innovation.no-problem-no-build", "innovation.problem-statement", "innovation.kill-criteria"],
    why: "a build decision with no problem statement and no kill criterion",
  },
  {
    fixture: "defer-without-revisit",
    expect: ["innovation.revisit-conditions"],
    why: "a deferral with no condition that would reopen it",
  },
  {
    fixture: "new-project-thin",
    expect: ["innovation.new-project-justification"],
    why: "a new-project proposal answering two of the eight separation considerations",
  },
];

for (const { fixture, expect, why } of DEFECTS) {
  test(`${fixture} fires exactly ${expect.join(", ")} — ${why}`, async () => {
    const report = await audit(fixture);
    const fired = rulesFired(report);
    for (const rule of expect) {
      assert.ok(fired.has(rule), `${fixture} did not fire ${rule}; the detector cannot be provoked`);
    }
    assert.deepEqual(
      [...fired].sort(),
      [...expect].sort(),
      `${fixture} fired rules beyond the planted defect — a detector is over-reaching`,
    );
  });
}

// --- Blocking ------------------------------------------------------------------------------------

test("an invariant-class failure blocks; an ordinary failure does not", async () => {
  const blocked = await validate("fabricated-evidence");
  assert.equal(blocked.report.status, "BLOCKED_BY_INVARIANT");
  assert.ok(blocked.report.blocking.includes("innovation.no-silent-upgrade"));
  assert.equal(blocked.code, 1, "a blocked verdict exits 1 so CI fails the build");

  const ordinary = await validate("defer-without-revisit");
  assert.equal(
    ordinary.report.status,
    "NON_COMPLIANT",
    "a non-invariant failure must stay ordinary non-compliance — blocking has to remain rare to mean anything",
  );
  assert.deepEqual(ordinary.report.blocking, []);
});

test("a build with no problem statement blocks", async () => {
  const { report } = await validate("forced-build");
  assert.equal(report.status, "BLOCKED_BY_INVARIANT");
  assert.ok(report.blocking.includes("innovation.no-problem-no-build"));
});

// --- Mentions versus uses ------------------------------------------------------------------------

test("a document describing the taxonomy produces no proposal findings", async () => {
  // The fixture is written to look as much like a proposal as prose can — every section name, every
  // field name, and an evidence entry that WOULD violate no-silent-upgrade if it were in a proposal.
  // It sits outside the canonical path, so nothing sees it. The guard is a path check rather than a
  // heuristic, which is why phrasing cannot defeat it.
  const report = await audit("mentions-only");
  assert.deepEqual([...rulesFired(report)], []);
});

// --- The two new subcommands ---------------------------------------------------------------------

test("check reports a per-proposal conclusion from the AI vocabulary", async () => {
  const { stdout } = await run("node", [CLI, "check", "--all", "--json"], { cwd: ROOT });
  const out = JSON.parse(stdout);
  assert.ok(out.proposals.length >= 3, "this repository's own proposals");
  const allowed = new Set(["compliant", "non-compliant", "not-applicable", "insufficient-evidence", "blocked-by-invariant"]);
  for (const p of out.proposals) {
    assert.ok(allowed.has(p.conclusion), `${p.conclusion} is not one of the five conclusions`);
  }
  assert.deepEqual([...new Set(out.proposals.map((p) => p.conclusion))], ["compliant"]);
});

test("check on a blocked proposal instructs the agent to stop rather than remediate", async () => {
  let stdout;
  try {
    ({ stdout } = await run("node", [CLI, "check", "--all", "--dir=test/fixtures/fabricated-evidence"], { cwd: ROOT }));
  } catch (error) {
    stdout = error.stdout;
  }
  assert.match(stdout, /STOP\./);
  assert.match(stdout, /that edit is itself the violation/i);
});

test("explain resolves a rule id and reports its conditional trigger", async () => {
  const { stdout } = await run("node", [CLI, "explain", "innovation.new-project-justification", "--json"], { cwd: ROOT });
  const x = JSON.parse(stdout);
  assert.equal(x.id, "innovation.new-project-justification");
  assert.equal(x.conditionalOn, "the proposal type is new-project");
  assert.equal(x.standard, 12);
  assert.ok(x.remediation.length > 0);
});

test("explain marks an invariant-class rule as one, and says a policy cannot lower it", async () => {
  const { stdout } = await run("node", [CLI, "explain", "innovation.no-fabricated-evidence"], { cwd: ROOT });
  assert.match(stdout, /INVARIANT-CLASS/);
  assert.match(stdout, /no policy level can downgrade it/i);
});

test("explain on a proposal separates the rules that apply from those that do not", async () => {
  const { stdout } = await run(
    "node",
    [CLI, "explain", "artifacts/innovation-proposals/0002-share-scripts-via-npm-package.md", "--json"],
    { cwd: ROOT },
  );
  const x = JSON.parse(stdout);
  const byId = new Map(x.rules.map((r) => [r.id, r]));
  // 0002 is an architectural-change with a reject outcome, so three conditional rules are off.
  assert.equal(byId.get("innovation.new-project-justification").applies, false);
  assert.equal(byId.get("innovation.experiment-before-build").applies, false);
  assert.equal(byId.get("innovation.revisit-conditions").applies, false);
  assert.equal(byId.get("innovation.problem-statement").applies, true);
  assert.match(byId.get("innovation.new-project-justification").why, /only when the proposal type is new-project/);
});

test("check and explain are deterministic", async () => {
  // A standards tool whose output varies between identical runs cannot be audited, and its verdicts
  // cannot be reproduced by a reviewer.
  const a = await run("node", [CLI, "check", "--all", "--json"], { cwd: ROOT });
  const b = await run("node", [CLI, "check", "--all", "--json"], { cwd: ROOT });
  assert.equal(a.stdout, b.stdout);
  const c = await run("node", [CLI, "explain", "innovation.kill-criteria", "--json"], { cwd: ROOT });
  const d = await run("node", [CLI, "explain", "innovation.kill-criteria", "--json"], { cwd: ROOT });
  assert.equal(c.stdout, d.stdout);
});

test("explain rejects an unknown argument rather than guessing", async () => {
  await assert.rejects(
    () => run("node", [CLI, "explain", "innovation.not-a-real-rule"], { cwd: ROOT }),
    (error) => error.code === 2,
  );
});
