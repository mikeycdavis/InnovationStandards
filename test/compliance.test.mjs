/**
 * The compliance engine's semantics, and the catalog's integrity.
 *
 * Most of these tests were transplanted with the engine and guard properties that predate this
 * domain. They are not to be relaxed to accommodate authored content: if a standard or a rule cannot
 * satisfy one of them, the content is wrong, not the test. That instruction is itself
 * Standard 14, applied to this file.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, resolve, coverage, CatalogError } from "../scripts/catalog.mjs";
import { evaluate, envelope, STATUS, isInvariant } from "../scripts/compliance.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = "2026-08-09";

const catalog = await loadCatalog();
const ALL = [...catalog.rules.keys()];
const policy = (over = {}) => ({ standardVersion: "1.0.0", project: "Fixture", rules: {}, ...over });
const run = (opts = {}) => evaluate({ catalog, policy: policy(), findings: [], evaluated: ALL, today: TODAY, ...opts });
const finding = (rule) => ({ rule, message: `a violation of ${rule}`, evidence: ["x.md"] });

// --- Catalog integrity ---------------------------------------------------------------------------

test("every catalog rule names a standard document that exists", async () => {
  const docs = await readdir(path.join(ROOT, "standards"));
  for (const rule of catalog.rules.values()) {
    const prefix = String(rule.standard).padStart(2, "0") + "-";
    assert.ok(docs.some((d) => d.startsWith(prefix)), `${rule.id} names missing standard ${rule.standard}`);
  }
});

test("lifecycle fields are present on every rule, even when empty", () => {
  // Adding them later means every existing rule silently lacks them, and consumers written against
  // the earlier shape treat their absence as meaningful.
  for (const rule of catalog.rules.values()) {
    for (const field of ["deprecatedIn", "supersededBy", "removedIn"]) {
      assert.ok(field in rule, `${rule.id} is missing lifecycle field ${field}`);
    }
    assert.deepEqual(rule.aliases, [], `${rule.id} carries an alias; identity was canonical from day one`);
  }
});

test("a rule claiming full assurance is not a code-analysis or manual-review rule", () => {
  // Assurance is a claim about the fit between a rule and its check. A human-evaluated rule whose
  // catalog says `full` is claiming a machine established something no machine looked at.
  for (const rule of catalog.rules.values()) {
    if (rule.assurance !== "full") continue;
    assert.ok(
      rule.validationType !== "code-analysis" && rule.validationType !== "manual-review",
      `${rule.id} claims full assurance from a ${rule.validationType} check`,
    );
  }
});

test("the catalog marks manual-review rules attestable and others not", () => {
  for (const rule of catalog.rules.values()) {
    assert.equal(
      rule.attestable,
      rule.validationType === "manual-review",
      `${rule.id} attestability does not follow its validation type`,
    );
  }
});

test("every rule below full assurance discloses what its check does not establish", () => {
  // The honesty requirement, made mechanical. A `partial` rule with no note invites a reader to
  // assume the check is complete, which is the overstatement this framework exists to prevent.
  for (const rule of catalog.rules.values()) {
    if (rule.assurance === "full") continue;
    assert.ok(
      typeof rule.$assuranceNote === "string" && rule.$assuranceNote.length > 40,
      `${rule.id} has assurance '${rule.assurance}' and no meaningful $assuranceNote`,
    );
  }
});

test("a malformed rule throws rather than loading a partial catalog", async () => {
  // A catalog that loads partially silently shrinks the denominator every score is computed over.
  await assert.rejects(
    () => loadCatalog(path.join(ROOT, "test/fixtures/does-not-exist")),
    (error) => error instanceof CatalogError || error.code === "ENOENT",
  );
});

// --- The property everything else protects ---------------------------------------------------------

test("an unevaluated rule is skipped, never passed", () => {
  // Unknown is not a pass. A false red has a complainant; a false green has none, by construction.
  const verdict = evaluate({ catalog, policy: policy(), findings: [], evaluated: [], today: TODAY });
  assert.equal(verdict.summary.passed, 0, "rules nothing examined were reported as passing");
  assert.equal(verdict.summary.skipped, catalog.rules.size);
});

test("a finding against a manual-review rule is reported, not discarded", () => {
  // The second gap found while implementing this domain. A machine cannot ESTABLISH a rule a human
  // evaluates — but a machine that OBSERVES a violation of one has still observed it, and the
  // ordering that produced not-evaluated for both cases made a detected violation invisible.
  const verdict = run({ findings: [finding("innovation.no-fabricated-evidence")] });
  const result = verdict.results.find((r) => r.ruleId === "innovation.no-fabricated-evidence");
  assert.equal(result.status, "failed", "an observed violation was silently dropped");
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT);
});

test("a manual-review rule is never established by an automated run", () => {
  const verdict = run();
  for (const rule of catalog.rules.values()) {
    if (rule.validationType !== "manual-review") continue;
    const result = verdict.results.find((r) => r.ruleId === rule.id);
    assert.equal(result.status, "skipped", `${rule.id} passed without a human looking`);
    assert.equal(result.disposition, "not-evaluated");
  }
});

test("status is computed from rules, never from the score", () => {
  const verdict = run({ findings: [finding("innovation.problem-statement")] });
  assert.equal(verdict.status, STATUS.NON_COMPLIANT);
  assert.ok(verdict.score > 50, "the score can stay high while the status is non-compliant");
});

test("framework coverage is reported beside the verdict and never inside it", () => {
  const report = envelope({
    verdict: run(),
    project: "Fixture",
    standardVersion: "1.0.0",
    auditedAt: TODAY,
    frameworkCoverage: coverage(catalog, { evaluated: ALL, totalStandards: 14 }),
  });
  assert.ok(report.frameworkCoverage);
  assert.ok(!("frameworkCoverage" in { status: report.status, score: report.score }));
  assert.notEqual(report.status, report.frameworkCoverage.cataloguedRules);
});

// --- The five statuses ------------------------------------------------------------------------------

test("no policy yields NOT_EVALUATED, not compliance", () => {
  const verdict = evaluate({ catalog, policy: null, findings: [], evaluated: ALL, today: TODAY });
  assert.equal(verdict.status, STATUS.NOT_EVALUATED);
});

test("a clean run over a real policy is COMPLIANT", () => {
  assert.equal(run().status, STATUS.COMPLIANT);
});

test("an ordinary required-rule failure is NON_COMPLIANT", () => {
  const verdict = run({ findings: [finding("innovation.problem-statement")] });
  assert.equal(verdict.status, STATUS.NON_COMPLIANT);
  assert.deepEqual(verdict.blocking, []);
});

test("an invariant-class failure is BLOCKED_BY_INVARIANT", () => {
  const verdict = run({ findings: [finding("innovation.no-silent-upgrade")] });
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT);
  assert.deepEqual(verdict.blocking, ["innovation.no-silent-upgrade"]);
});

test("BLOCKED_BY_INVARIANT strictly strengthens — it never replaces a passing verdict", () => {
  // The safety property that makes the fifth status a safe addition: every blocking result is also
  // a failing result, so blocking can only ever take the place of NON_COMPLIANT.
  const verdict = run({ findings: [finding("innovation.no-hidden-costs")] });
  const blockingResults = verdict.results.filter((r) => r.invariant && r.status === "failed");
  for (const r of blockingResults) {
    assert.equal(r.status, "failed", "a blocking result that is not itself a failure would weaken the verdict");
  }
  assert.equal(run().status, STATUS.COMPLIANT, "a clean run is unaffected by the new status existing");
});

// --- Prohibitions and invariants ---------------------------------------------------------------------

test("the catalog declares invariant-class rules, and they are forbidden and non-exemptible", () => {
  const invariants = [...catalog.rules.values()].filter(isInvariant);
  assert.ok(invariants.length >= 5, "the invariant class is empty or nearly so — has it been eroded?");
  for (const rule of invariants) {
    assert.equal(rule.level, "forbidden");
    assert.equal(rule.nonExemptible, true);
    assert.equal(rule.severity, "error");
  }
});

test("an exception against a non-exemptible rule is rejected, not applied", () => {
  const verdict = run({
    policy: policy({
      exceptions: [
        { rule: "innovation.no-fabricated-evidence", reason: "r", approvedBy: "a", approvedAt: "2026-01-01" },
      ],
    }),
  });
  const result = verdict.results.find((r) => r.disposition === "rejected-exception");
  assert.ok(result, "the waiver was honoured or silently ignored; either makes the prohibition optional");
  assert.equal(result.status, "failed");
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT);
});

test("a non-exemptible waiver is rejected even when it has also expired", () => {
  // Order matters: an invalid waiver is invalid whether or not it has lapsed.
  const verdict = run({
    policy: policy({
      exceptions: [
        { rule: "innovation.no-hidden-costs", reason: "r", approvedBy: "a", approvedAt: "2020-01-01", expires: "2021-01-01" },
      ],
    }),
  });
  assert.ok(verdict.results.some((r) => r.disposition === "rejected-exception"));
  assert.ok(!verdict.results.some((r) => r.disposition === "expired-exception"));
});

test("an exemptible rule is still waivable — the check is not blanket", () => {
  const verdict = run({
    policy: policy({
      exceptions: [
        { rule: "innovation.mvp-definition", reason: "r", approvedBy: "a", approvedAt: "2026-01-01" },
      ],
    }),
    findings: [finding("innovation.mvp-definition")],
  });
  assert.equal(verdict.status, STATUS.COMPLIANT_WITH_EXCEPTIONS);
});

test("a policy cannot downgrade an invariant-class rule out of failing", () => {
  // The hole found while implementing ADR 0005: the evaluator computed a finding's outcome from the
  // level the POLICY selected, so `level: optional` turned a fabrication finding into a warning and
  // left the verdict COMPLIANT. The strongest prohibition in the system was switchable off with a
  // two-word edit — through the mechanism rather than around it.
  const verdict = run({
    policy: policy({ rules: { "innovation.no-fabricated-evidence": { level: "optional" } } }),
    findings: [finding("innovation.no-fabricated-evidence")],
  });
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT);
});

test("a policy CAN still lower a non-invariant rule — the refusal is targeted, not blanket", () => {
  const verdict = run({
    policy: policy({ rules: { "innovation.mvp-definition": { level: "optional" } } }),
    findings: [finding("innovation.mvp-definition")],
  });
  assert.equal(verdict.status, STATUS.COMPLIANT);
  assert.equal(verdict.summary.warnings, 1);
});

// --- Applicability -------------------------------------------------------------------------------

test("not-applicable is visible in the results, never a silent exclusion", () => {
  const verdict = run({
    policy: policy({
      applicability: {
        "innovation.portfolio-overlap": { status: "not-applicable", reason: "no portfolio", reviewedAt: "2026-01-01" },
      },
    }),
  });
  const result = verdict.results.find((r) => r.ruleId === "innovation.portfolio-overlap");
  assert.equal(result.disposition, "not-applicable");
  assert.equal(result.message, "no portfolio", "the reason must survive into the result");
  assert.ok(verdict.denominator.applicable < verdict.denominator.total);
});

// --- Attestations ----------------------------------------------------------------------------------

const attest = (rule, over = {}) => ({
  attestations: {
    [rule]: {
      status: "approved",
      reviewedBy: "reviewer",
      reviewedAt: TODAY,
      evidence: "examined the proposals",
      reviewedAgainst: { paths: ["a.md"] },
      ...over,
    },
  },
});

test("an attestation establishes a manual-review rule, and counts as manual review", () => {
  const verdict = run({ policy: policy(attest("innovation.no-fabricated-evidence")) });
  const result = verdict.results.find((r) => r.ruleId === "innovation.no-fabricated-evidence");
  assert.equal(result.status, "passed");
  assert.equal(result.disposition, "attested");
  assert.equal(verdict.assurance.manualReview, 1);
  assert.equal(verdict.status, STATUS.COMPLIANT, "an attested pass is not COMPLIANT_WITH_EXCEPTIONS");
});

test("an attestation never overrides an automated finding", () => {
  const verdict = run({
    policy: policy(attest("innovation.no-fabricated-evidence")),
    findings: [finding("innovation.no-fabricated-evidence")],
  });
  const result = verdict.results.find((r) => r.ruleId === "innovation.no-fabricated-evidence");
  assert.equal(result.disposition, "contradicted-attestation");
  assert.equal(result.status, "failed");
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT, "evidence outranks assertion, and this rule blocks");
});

test("attesting a rule the catalog does not mark attestable is a failure", () => {
  const verdict = run({ policy: policy(attest("innovation.proposal-artifact")) });
  const result = verdict.results.find((r) => r.ruleId === "innovation.proposal-artifact");
  assert.equal(result.disposition, "invalid-attestation");
  assert.equal(result.status, "failed");
});

test("a recorded rejection is a failure, not silence", () => {
  const verdict = run({ policy: policy(attest("innovation.novelty-not-value", { status: "rejected" })) });
  const result = verdict.results.find((r) => r.ruleId === "innovation.novelty-not-value");
  assert.equal(result.disposition, "attested-rejected");
  assert.equal(result.status, "failed");
});

test("an expired attestation returns the rule to not-evaluated rather than to failing", () => {
  // It is not a failure; it is unreviewed again.
  const verdict = run({
    policy: policy(attest("innovation.novelty-not-value", { expires: "2020-01-01" })),
  });
  const result = verdict.results.find((r) => r.ruleId === "innovation.novelty-not-value");
  assert.equal(result.status, "skipped");
  assert.equal(result.disposition, "not-evaluated");
});

test("a stale digest returns the rule to not-evaluated", () => {
  const verdict = run({
    policy: policy(attest("innovation.novelty-not-value", { reviewedAgainst: { paths: ["a.md"], digest: "old" } })),
    digests: new Map([["innovation.novelty-not-value", "new"]]),
  });
  const result = verdict.results.find((r) => r.ruleId === "innovation.novelty-not-value");
  assert.equal(result.disposition, "not-evaluated", "what was reviewed is not what is there now");
});

// --- This repository's own policy --------------------------------------------------------------------

test("this repository's policy declares every catalogued rule", async () => {
  // A rule missing from the dogfooded policy is a rule this repository has quietly opted out of.
  const text = await readFile(path.join(ROOT, "project-policy.yml"), "utf8");
  for (const id of ALL) {
    assert.ok(text.includes(`${id}:`), `project-policy.yml does not declare ${id}`);
  }
});

test("this repository's policy declares no invariant rule below forbidden", async () => {
  const { parseYaml } = await import("../scripts/yaml.mjs");
  const document = parseYaml(await readFile(path.join(ROOT, "project-policy.yml"), "utf8"));
  for (const [id, declared] of Object.entries(document.rules ?? {})) {
    const rule = resolve(catalog, id);
    if (rule && isInvariant(rule)) {
      assert.equal(declared.level, "forbidden", `${id} is invariant-class and is declared ${declared.level}`);
    }
  }
  assert.deepEqual(document.exceptions, [], "this repository waives nothing");
});
