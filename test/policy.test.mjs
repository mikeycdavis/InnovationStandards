/**
 * Policy validation, proved against known-negative fixtures.
 *
 * Every fixture here is deliberately wrong in one specific way. A schema check that accepts them all
 * is not a check, so each is asserted to be REJECTED for its own reason rather than merely to
 * produce some error.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPolicy } from "../scripts/policy.mjs";
import { parseYaml, YamlError } from "../scripts/yaml.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = path.join(ROOT, "schemas/project-policy.schema.json");
const TODAY = "2026-08-09";
const fixture = (name) => path.join(ROOT, "test/fixtures/policies", name);
const check = (name) => checkPolicy(fixture(name), SCHEMA, TODAY);

test("a well-formed policy validates", async () => {
  const result = await check("valid.yml");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.findings, []);
  assert.equal(result.status, "ok");
});

test("a policy with the wrong shape is rejected", async () => {
  // standardVersion as a number and a rule declared as a bare string rather than an object.
  const result = await check("invalid-shape.yml");
  assert.equal(result.status, "invalid");
  assert.ok(result.errors.length > 0);
});

test("a rule the catalog does not define is reported", async () => {
  // A policy may select and configure rules; it may never invent one. Without this a typo is
  // accepted silently and then never evaluated, which reads as compliance rather than as a mistake.
  const result = await check("unknown-rule.yml");
  assert.equal(result.status, "findings", "an uncatalogued rule id was accepted");
  assert.ok(result.findings.some((f) => f.id === "policy.unknown-rule"));
});

test("a camelCase rule id is rejected", async () => {
  // Identity was canonical from the first commit, so there is no legacy to accept. The schema's
  // propertyNames pattern rejects the other spelling mechanically rather than by convention.
  const result = await check("legacy-camelcase.yml");
  assert.equal(result.status, "invalid");
});

test("an expired exception is reported as a compliance condition, not silently honoured", async () => {
  const result = await check("expired-exception.yml");
  assert.equal(result.status, "findings");
  assert.ok(
    result.findings.some((f) => JSON.stringify(f).includes("innovation.mvp-definition")),
    "the lapsed waiver was accepted",
  );
});

test("an exception against a non-exemptible rule is reported", async () => {
  const result = await check("non-exemptible-exception.yml");
  assert.equal(result.status, "findings");
  assert.ok(
    result.findings.some((f) => JSON.stringify(f).includes("innovation.no-fabricated-evidence")),
    "a waiver against a prohibition that admits none was accepted",
  );
});

test("this repository's own policy validates", async () => {
  const result = await checkPolicy(path.join(ROOT, "project-policy.yml"), SCHEMA, TODAY);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.findings, []);
});

test("the policy template validates and uses only canonical rule ids", async () => {
  // An adopter's first command is validating the policy they copied. A template that fails it
  // teaches them the framework is broken before they have used any of it.
  const result = await checkPolicy(path.join(ROOT, "templates/project-policy.yml"), SCHEMA, TODAY);
  assert.deepEqual(result.errors, [], "templates/project-policy.yml does not validate");
  assert.deepEqual(result.aliases, [], "the template contains non-canonical rule ids");
});

// --- The YAML subset -------------------------------------------------------------------------------

test("the parser refuses constructs it does not implement rather than guessing", async () => {
  // Failing loudly is the design. A parser that silently mishandles an anchor or a block scalar
  // produces a policy that means something other than what its author wrote.
  for (const source of [
    "rules: {}\n",
    "a: &anchor 1\nb: *anchor\n",
    "evidence: |\n  a block scalar\n",
    "a: 1\na: 2\n",
    "a:\n\t- tabbed\n",
  ]) {
    assert.throws(() => parseYaml(source), YamlError, `parsed without complaint: ${JSON.stringify(source)}`);
  }
});

test("the parser does not coerce scalars", () => {
  // Deliberate: an unquoted `3` stays the string "3". A parser that guesses at types is a parser
  // that turns a version string into a number, and `1.10` into `1.1`, without anyone asking it to.
  const document = parseYaml('version: "1.0.0"\ncount: 3\nflag: true\n');
  assert.equal(document.version, "1.0.0");
  assert.equal(document.count, "3");
  assert.equal(document.flag, "true");
});
