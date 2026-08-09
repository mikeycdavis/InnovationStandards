/**
 * The CLI's contract: finding shape, standardRef resolution, exit codes, and the invariants that
 * keep the evaluator and the catalog speaking one vocabulary.
 *
 * The self-audit assertion near the bottom is the gate that catches the published standards and the
 * tool that checks them drifting apart.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "../scripts/catalog.mjs";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts/standards.mjs");
const read = (p) => readFile(path.join(ROOT, p), "utf8");

const cli = async (args) => {
  try {
    const { stdout } = await run("node", [CLI, ...args], { cwd: ROOT });
    return { stdout, code: 0 };
  } catch (error) {
    return { stdout: error.stdout ?? "", stderr: error.stderr ?? "", code: error.code };
  }
};

const self = JSON.parse((await cli(["audit", ".", "--json"])).stdout);
const catalog = await loadCatalog();

/**
 * GitHub's heading slug: lowercase, punctuation dropped, then EACH remaining space replaced by a
 * hyphen — not each run of spaces. That distinction is what produces the doubled hyphen in
 * `#r1--title`: the em dash is dropped and the two spaces that surrounded it each become one.
 */
const slug = (heading) =>
  heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s/g, "-");

// --- Finding shape ---------------------------------------------------------------------------------

test("every finding carries the full schema", () => {
  assert.ok(self.findings.length > 0, "the audit produced nothing to check");
  for (const f of self.findings) {
    assert.equal(typeof f.id, "string");
    assert.equal(typeof f.category, "string");
    assert.ok(["error", "warning", "info"].includes(f.severity), `bad severity: ${f.severity}`);
    assert.ok(
      ["OBSERVED", "INFERRED", "CONFIRMED_BY_OWNER", "UNKNOWN"].includes(f.label),
      `bad evidence label: ${f.label}`,
    );
    assert.equal(typeof f.message, "string");
    assert.equal(typeof f.standardRef, "string");
    assert.ok(Array.isArray(f.evidence));
  }
});

test("every standardRef resolves to a heading that exists", async () => {
  // A standardRef that does not resolve is worse than none: it sends a reader to a page that does
  // not explain the finding. Checked across every ref the CLI can emit, not only those fired here.
  const source = await read("scripts/standards.mjs");
  const refs = [...source.matchAll(/"(standards\/[\w.-]+\.md#[\w-]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 15, `expected the anchor table to be populated; found ${refs.length}`);

  for (const ref of new Set(refs)) {
    const [file, anchor] = ref.split("#");
    const text = await read(file);
    const headings = [...text.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].map((m) => slug(m[1]));
    assert.ok(headings.includes(anchor), `${ref} points at a heading that does not exist`);
  }
});

test("heuristic findings are never labelled OBSERVED", () => {
  // Reporting an interpretation as an observation is the fabrication this framework prohibits one
  // level up. The experiment-gap detector reasons about what evidence a decision rests on, which is
  // interpretation.
  for (const f of self.findings) {
    if (f.id === "experiment-gap") assert.equal(f.label, "INFERRED");
  }
});

// --- Vocabulary ---------------------------------------------------------------------------------------

test("the evaluated-rules set and the bound detectors agree", async () => {
  // The mechanical guard against the evaluator growing a private vocabulary one detector at a time.
  const source = await read("scripts/standards.mjs");
  const declared = new Set(
    [...source.matchAll(/EVALUATED_RULES = \[([\s\S]*?)\]/g)]
      .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])),
  );
  const bound = new Set([...source.matchAll(/rule:\s*"(innovation\.[\w-]+)"/g)].map((m) => m[1]));

  assert.ok(declared.size > 0 && bound.size > 0);
  for (const id of bound) {
    assert.ok(declared.has(id), `${id} has a detector but is not in EVALUATED_RULES — it would report as unevaluated`);
  }
  for (const id of declared) {
    assert.ok(catalog.rules.has(id), `EVALUATED_RULES names ${id}, which the catalog does not define`);
  }
});

test("no manual-review rule is claimed as automatically evaluated", async () => {
  const source = await read("scripts/standards.mjs");
  const declared = [...source.matchAll(/EVALUATED_RULES = \[([\s\S]*?)\]/g)]
    .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  for (const id of declared) {
    assert.notEqual(
      catalog.rules.get(id).validationType,
      "manual-review",
      `${id} is manual-review and is listed as automatically evaluated`,
    );
  }
});

// --- Exit codes ------------------------------------------------------------------------------------

test("audit exits 0 on a clean repository and 2 on an unknown command", async () => {
  assert.equal((await cli(["audit", ".", "--json"])).code, 0);
  assert.equal((await cli(["frobnicate"])).code, 2);
});

test("validate exits 1 on a blocked verdict and 0 when compliant", async () => {
  assert.equal((await cli(["validate", "--dir=test/fixtures/fabricated-evidence", "--json"])).code, 1);
  assert.equal((await cli(["validate", ".", "--json"])).code, 0);
});

test("a repository with no policy is exit 2 and NOT_EVALUATED, never a compliance failure", async () => {
  // A verdict was requested and there is nothing to evaluate against. That is a configuration
  // problem; reporting it as non-compliance would be a false red for the project.
  const result = await cli(["validate", "--dir=test/fixtures/mentions-only", "--json"]);
  assert.equal(result.code, 2);
  assert.equal(JSON.parse(result.stdout).status, "NOT_EVALUATED");
});

test("--strict promotes findings to a failing exit", async () => {
  const normal = await cli(["audit", "--dir=test/fixtures/forced-build"]);
  assert.equal(normal.code, 0, "audit without --strict completes even with findings");
  const strict = await cli(["audit", "--dir=test/fixtures/forced-build", "--strict"]);
  assert.equal(strict.code, 1);
});

// --- The self-audit gate -----------------------------------------------------------------------------

test("this repository has no error-severity findings", () => {
  const errors = self.findings.filter((f) => f.severity === "error");
  assert.deepEqual(errors, [], "the standards repository violates its own standards");
});

test("this repository's own proposals demonstrate build, reject, and defer", () => {
  // Dogfooding, and the demonstration that the framework does not privilege one outcome. Two of
  // this repository's three real decisions are decisions NOT to build now, and both are compliant.
  // If a future change made `reject` or `defer` harder to reach cleanly than `build`, this is where
  // it would show — on real proposals rather than on fixtures written to pass.
  const outcomes = new Set(self.proposals.map((p) => p.outcome));
  for (const outcome of ["build", "reject", "defer"]) {
    assert.ok(outcomes.has(outcome), `no real proposal in this repository records ${outcome}`);
  }
});

test("every proposal in this repository is covered by the manual-review attestations", async () => {
  // An attestation names the paths it reviewed. Adding a proposal without extending those lists
  // leaves the attestation quietly asserting less than a reader takes it to mean — and because the
  // digest still matches, nothing reports it. This is that missing report.
  const { parseYaml } = await import("../scripts/yaml.mjs");
  const policy = parseYaml(await read("project-policy.yml"));
  const proposals = self.proposals.map((p) => p.file);
  for (const [ruleId, attestation] of Object.entries(policy.attestations ?? {})) {
    const reviewed = attestation.reviewedAgainst?.paths ?? [];
    for (const proposal of proposals) {
      assert.ok(
        reviewed.includes(proposal),
        `the attestation for ${ruleId} does not name ${proposal}; it asserts less than it appears to`,
      );
    }
  }
});

// --- Documentation coupled to reality -----------------------------------------------------------------

test("the inventory and fidelity gates pass", async () => {
  // Run in-process rather than trusted: these are the gates that prove the standards series has not
  // silently changed shape, and a test suite that assumes they ran is not a check.
  for (const script of ["inventory.mjs", "fidelity.mjs", "diagrams.mjs"]) {
    const result = await run("node", [path.join(ROOT, "scripts", script)], { cwd: ROOT });
    assert.match(result.stdout, /agrees with the reviewed inventory|appears in the source|matches its Mermaid source/);
  }
});

test("every standard document carries the required structure", async () => {
  const files = (await readdir(path.join(ROOT, "standards"))).filter((f) => /^\d\d-.*\.md$/.test(f));
  assert.equal(files.length, 14);
  for (const file of files) {
    const text = await read(`standards/${file}`);
    for (const section of ["## Scope", "## Requirements", "## Implementation"]) {
      assert.ok(text.includes(section), `standards/${file} is missing ${section}`);
    }
    assert.match(text, /^### R1 — /m, `standards/${file} has no numbered requirement`);
    assert.match(
      text,
      /Source: item \d+ of/,
      `standards/${file} does not name its source item`,
    );
  }
});

test("every rule's standard document discusses that rule by id", async () => {
  // A catalogued rule whose standard never mentions it is a rule with no normative definition —
  // the machine half without the meaning half.
  for (const rule of catalog.rules.values()) {
    const prefix = String(rule.standard).padStart(2, "0") + "-";
    const files = (await readdir(path.join(ROOT, "standards"))).filter((f) => f.startsWith(prefix));
    const text = await read(`standards/${files[0]}`);
    assert.ok(text.includes(rule.id), `standards/${files[0]} never mentions ${rule.id}`);
  }
});
