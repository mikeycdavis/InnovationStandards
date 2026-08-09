/**
 * The standards integrity invariant, protecting itself.
 *
 * Standard 14 prohibits weakening a standard, a test, an applicability determination, an evidence
 * requirement, or a verification mechanism in order to permit a desired conclusion. This file is the
 * mechanical part of that protection: it fails if the invariant's own machinery is removed, relaxed,
 * or quietly reclassified.
 *
 * It cannot make such an edit impossible — an actor with write access can edit this file too. What
 * it provides is that the edit is VISIBLE: in CI, in the diff, and in the history. Standard 14 R6
 * states that limit rather than implying a guarantee the mechanism cannot deliver, and this comment
 * is the code saying the same thing.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "../scripts/catalog.mjs";
import { evaluate, STATUS, isInvariant } from "../scripts/compliance.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = "2026-08-09";
const catalog = await loadCatalog();
const ALL = [...catalog.rules.keys()];

const read = (p) => readFile(path.join(ROOT, p), "utf8");

/** The rules whose failure must halt work. Named explicitly so silently dropping one fails here. */
const EXPECTED_INVARIANTS = [
  "innovation.no-problem-no-build",
  "innovation.no-silent-upgrade",
  "innovation.no-fabricated-evidence",
  "innovation.no-hidden-costs",
  "innovation.standards-non-bypass",
  "innovation.no-sunk-cost-continuation",
  "innovation.integrity-invariant",
];

test("the invariant class contains exactly the rules it is supposed to", () => {
  // Named rather than counted: a count passes when one invariant is removed and another added, and
  // the whole point is that membership of this set is a deliberate, reviewable decision.
  const actual = [...catalog.rules.values()].filter(isInvariant).map((r) => r.id).sort();
  assert.deepEqual(actual, [...EXPECTED_INVARIANTS].sort());
});

test("innovation.integrity-invariant exists and is itself invariant-class", () => {
  // The rule that protects the system must not be weaker than the rules it protects.
  const rule = catalog.rules.get("innovation.integrity-invariant");
  assert.ok(rule, "the integrity rule has been removed from the catalog");
  assert.equal(rule.level, "forbidden");
  assert.equal(rule.nonExemptible, true);
  assert.equal(rule.severity, "error");
  assert.equal(rule.standard, 14);
});

test("BLOCKED_BY_INVARIANT exists and outranks NON_COMPLIANT", () => {
  const invariantFailure = evaluate({
    catalog,
    policy: { standardVersion: "1.0.0", project: "F", rules: {} },
    findings: [{ rule: "innovation.integrity-invariant", message: "x", evidence: ["p.yml"] }],
    evaluated: ALL,
    today: TODAY,
  });
  assert.equal(invariantFailure.status, STATUS.BLOCKED_BY_INVARIANT);

  const ordinary = evaluate({
    catalog,
    policy: { standardVersion: "1.0.0", project: "F", rules: {} },
    findings: [
      { rule: "innovation.integrity-invariant", message: "x", evidence: ["p.yml"] },
      { rule: "innovation.problem-statement", message: "y", evidence: ["p.md"] },
    ],
    evaluated: ALL,
    today: TODAY,
  });
  assert.equal(ordinary.status, STATUS.BLOCKED_BY_INVARIANT, "blocking must win over ordinary non-compliance");
});

test("no invariant rule can be waived, downgraded, or attested away", () => {
  // Three routes to switching off a prohibition, all closed. Iterated over every invariant rather
  // than sampled, so weakening any single one fails here.
  for (const id of EXPECTED_INVARIANTS) {
    const rule = catalog.rules.get(id);

    const waived = evaluate({
      catalog,
      policy: {
        standardVersion: "1.0.0", project: "F", rules: {},
        exceptions: [{ rule: id, reason: "r", approvedBy: "a", approvedAt: "2026-01-01" }],
      },
      findings: [],
      evaluated: ALL,
      today: TODAY,
    });
    assert.equal(waived.status, STATUS.BLOCKED_BY_INVARIANT, `${id} accepted a waiver`);

    const downgraded = evaluate({
      catalog,
      policy: { standardVersion: "1.0.0", project: "F", rules: { [id]: { level: "optional" } } },
      findings: [{ rule: id, message: "x", evidence: ["f.md"] }],
      evaluated: ALL,
      today: TODAY,
    });
    assert.equal(downgraded.status, STATUS.BLOCKED_BY_INVARIANT, `${id} was downgraded out of failing`);

    if (rule.attestable) {
      const attested = evaluate({
        catalog,
        policy: {
          standardVersion: "1.0.0", project: "F", rules: {},
          attestations: {
            [id]: {
              status: "approved", reviewedBy: "r", reviewedAt: TODAY,
              evidence: "looked", reviewedAgainst: { paths: ["a.md"] },
            },
          },
        },
        findings: [{ rule: id, message: "x", evidence: ["f.md"] }],
        evaluated: ALL,
        today: TODAY,
      });
      assert.equal(attested.status, STATUS.BLOCKED_BY_INVARIANT, `${id} was attested away over a finding`);
    }
  }
});

test("removing a check produces not-evaluated, never compliance", () => {
  // The fourth route: delete the detector rather than argue with it. Deleting a check cannot make a
  // rule pass, because a rule nothing examined is skipped.
  const verdict = evaluate({
    catalog,
    policy: { standardVersion: "1.0.0", project: "F", rules: {} },
    findings: [],
    evaluated: [],
    today: TODAY,
  });
  assert.equal(verdict.summary.passed, 0);
  assert.equal(verdict.summary.skipped, catalog.rules.size);
});

test("the policy-downgrade fixture is blocked end to end", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  let stdout;
  try {
    ({ stdout } = await run(
      "node",
      [path.join(ROOT, "scripts/standards.mjs"), "validate", "--dir=test/fixtures/integrity-downgrade", "--json"],
      { cwd: ROOT },
    ));
  } catch (error) {
    stdout = error.stdout;
  }
  const report = JSON.parse(stdout);
  assert.equal(report.status, STATUS.BLOCKED_BY_INVARIANT);
  assert.ok(
    report.blocking.includes("innovation.integrity-invariant"),
    "the detector did not report the downgrade attempt",
  );
  assert.ok(
    report.blocking.includes("innovation.no-hidden-costs"),
    "the waiver against a non-exemptible rule was not rejected",
  );
});

test("Standard 14 quotes the invariant and states the limits of its own protection", async () => {
  const text = await read("standards/14-standards-integrity.md");
  // The wording is verified verbatim against the source spec by scripts/fidelity.mjs; this asserts
  // the substance has not been quietly softened into an aspiration.
  assert.match(text, /never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or manipulate/);
  assert.match(text, /solely because it prevents the desired implementation or conclusion/);
  // R6: the honesty requirement. A standard claiming protection it cannot deliver would itself be
  // the overstated assurance this framework prohibits.
  assert.match(text, /visible/i);
  assert.match(text, /BLOCKED_BY_INVARIANT/);
});

test("the agent template tells an agent to stop rather than route around a block", async () => {
  const text = await read("templates/AGENTS.md");
  assert.match(text, /blocked-by-invariant/i);
  assert.match(text, /stop and report/i);
  assert.match(text, /that edit is itself the violation/i);
  // The other half: an agent must never be cornered into approving something. Matched across a
  // line break, because the template is wrapped prose and the phrase legitimately spans lines.
  assert.match(text, /never required to\s+produce a positive recommendation/i);
  assert.match(text, /reject, defer, and insufficient-evidence are successful outcomes/i);
});

test("the CLI tells a blocked operator not to weaken the rule", async () => {
  const cli = await read("scripts/standards.mjs");
  assert.match(cli, /STOP\./);
  assert.match(cli, /that edit is itself the violation/i);
});
