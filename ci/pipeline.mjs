#!/usr/bin/env node
/**
 * The authoritative definition of this repository's CI pipeline.
 *
 * There is exactly one list of checks, and it is below. `scripts/ci.sh` runs it inside a container,
 * `.github/workflows/ci.yml` runs the same script, and a future self-hosted runner would run the
 * same script again. Nothing re-states the pipeline in YAML. That is deliberate: the defect this
 * file exists to prevent is a repository whose GitHub workflow and whose local script have quietly
 * drifted apart, so that "CI passed" means two different things depending on who ran it.
 *
 * Each entry names an `npm run` script rather than an inline command, so `package.json` stays the
 * single place a command line is written down. `test/local-ci.test.mjs` asserts every id here
 * resolves to a real script, which is what stops this list from naming a command that no longer
 * exists.
 *
 * The rationale strings are the ones that used to live as comments in the workflow YAML. They moved
 * here with the pipeline; a reason for a gate is worth as much as the gate, and leaving it behind in
 * a file that no longer defines the gate is how gates come to look arbitrary and get deleted.
 *
 * Exit 0 when every check passes, 1 when any check fails, 2 on invocation error.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_INVOCATION = 2;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The ordered pipeline. Order is not arbitrary: the cheap structural gates run first so that a
 * misshapen repository fails in seconds rather than after the test suite, and `validate` runs last
 * because it is the verdict the whole pipeline exists to make trustworthy.
 *
 * `stage` groups checks for the summary line. `script` is the key in package.json's `scripts`.
 */
const CHECKS = [
  {
    id: "inventory",
    script: "inventory",
    stage: "static-checks",
    why: "Proves the standards series has not silently changed shape. The inventory is reviewed and committed; this compares source extraction against it rather than re-deriving the count.",
  },
  {
    id: "fidelity",
    script: "fidelity",
    stage: "static-checks",
    why: "Holds each standard to its own word: any block claiming to be verbatim source must be.",
  },
  {
    id: "policy",
    script: "policy",
    stage: "static-checks",
    why: "Validates this repository's own project-policy.yml against schemas/project-policy.schema.json. Exit 2 (malformed policy) and exit 1 (a compliance condition such as an expired exception) are both failures here, and both are meant to be.",
  },
  {
    id: "diagrams",
    script: "diagrams",
    stage: "static-checks",
    why: "Detects when Mermaid source and its derived copies fall out of sync. This compares text rather than rendering anything, which is what lets a zero-dependency repository enforce it at all.",
  },
  {
    id: "unit-tests",
    script: "test",
    stage: "tests",
    why: "The suite. Includes the meta-tests that guard the engine's own semantics, and the assertion that this repository has no error-severity audit findings.",
  },
  {
    id: "audit",
    script: "audit",
    stage: "repo-gates",
    why: "This repository is audited by its own audit. Deliberately not --strict: that flag fails on warnings too, and the predictable result of a build broken by advisory findings is that someone disables the step. The gate on errors is the assertion in test/audit.test.mjs, which runs above.",
  },
  {
    id: "validate",
    script: "validate",
    stage: "repo-gates",
    why: "The gate. `validate` applies this repository's own policy and exits 1 on a required-rule failure or a BLOCKED_BY_INVARIANT verdict regardless of --strict, and 2 if the policy cannot be read. This is the command consuming projects are told to gate on, so it is the one this repository gates on.",
  },
];

/**
 * Services this pipeline needs running before checks execute, each with a real readiness probe.
 *
 * Empty, and honestly so: this repository has no database, no message broker, and no service to
 * start. It is a zero-dependency Node program that reads files. The list exists because the
 * orchestrator's wait step is written against it rather than against a hardcoded assumption of
 * "none" — a repository reusing this pattern adds its service to `compose.ci.yml` and to this list,
 * and gets the health-gated wait without touching the scripts.
 *
 * @type {Array<{service: string, description: string}>}
 */
const SERVICES = [];

const npmCommand = () => (process.platform === "win32" ? "npm.cmd" : "npm");

function runCheck(check, { verbose }) {
  const startedAt = new Date().toISOString();
  const started = process.hrtime.bigint();
  const result = spawnSync(npmCommand(), ["run", "--silent", check.script], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: verbose ? "inherit" : "pipe",
    shell: process.platform === "win32",
  });
  const durationMs = Number((process.hrtime.bigint() - started) / 1000000n);

  if (result.error) {
    return {
      ...check,
      status: "errored",
      exitCode: null,
      durationMs,
      startedAt,
      output: String(result.error.message),
    };
  }
  return {
    ...check,
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    durationMs,
    startedAt,
    output: verbose ? null : `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const outDir = process.env.LOCAL_CI_OUT
    ? path.resolve(process.env.LOCAL_CI_OUT)
    : path.join(ROOT, "artifacts", "local-ci");

  // Supplied by the orchestrator. The container has no .git — see .dockerignore — precisely so that
  // no check can read repository history and no credential in .git/config can reach the image.
  const commit = process.env.LOCAL_CI_COMMIT ?? "unknown";
  const branch = process.env.LOCAL_CI_BRANCH ?? "unknown";
  const repository = process.env.LOCAL_CI_REPOSITORY ?? "unknown";
  // "clean" means the tree that was built into this image was exactly the tree of `commit`. Anything
  // else means the SHA below labels the run without describing it.
  const tree = process.env.LOCAL_CI_TREE_STATE ?? "unknown";

  const startedAt = new Date().toISOString();
  process.stdout.write(`Local CI pipeline — ${CHECKS.length} checks\n`);
  process.stdout.write(`Repository:  ${repository}\n`);
  process.stdout.write(`Branch:      ${branch}\n`);
  process.stdout.write(`Commit:      ${commit}${tree === "clean" ? "" : ` (working tree: ${tree})`}\n`);
  process.stdout.write(`Node:        ${process.version}\n`);
  process.stdout.write(`Services:    ${SERVICES.length === 0 ? "none declared" : SERVICES.map((s) => s.service).join(", ")}\n\n`);

  const results = [];
  let failed = null;
  for (const check of CHECKS) {
    process.stdout.write(`>> ${check.id}\n`);
    const outcome = runCheck(check, { verbose });
    results.push(outcome);
    if (outcome.status === "passed") {
      process.stdout.write(`   passed (${outcome.durationMs} ms)\n\n`);
      continue;
    }
    // Fail fast. Later checks are not run, and the pipeline does not report them as skipped-passed:
    // they are absent from `checks`, and `result` is "failed". A skip is never a pass here for the
    // same reason it is never a pass in the compliance engine.
    process.stdout.write(`   FAILED (exit ${outcome.exitCode}, ${outcome.durationMs} ms)\n\n`);
    if (outcome.output) process.stdout.write(`${outcome.output}\n`);
    failed = outcome;
    break;
  }

  const completedAt = new Date().toISOString();
  const record = {
    commit,
    branch,
    repository,
    tree,
    result: failed ? "failed" : "passed",
    environment: "docker",
    node: process.version,
    startedAt,
    completedAt,
    checks: results.filter((r) => r.status === "passed").map((r) => r.id),
    failedCheck: failed ? failed.id : null,
    stages: [...new Set(results.map((r) => r.stage))],
    detail: results.map(({ id, stage, status, exitCode, durationMs }) => ({
      id,
      stage,
      status,
      exitCode,
      durationMs,
    })),
  };

  try {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, "latest.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  } catch (error) {
    process.stderr.write(`local ci: could not write the result record: ${error.message}\n`);
    return EXIT_INVOCATION;
  }

  process.stdout.write(`Stages:      ${record.stages.join(", ")}\n`);
  process.stdout.write(`Checks:      ${record.checks.length > 0 ? record.checks.join(", ") : "(none passed)"}\n`);

  if (failed) {
    process.stdout.write(`Pipeline FAILED at ${failed.id}. ${results.length - 1} of ${CHECKS.length} checks passed.\n`);
    return EXIT_FAILED;
  }
  process.stdout.write(`Pipeline PASSED. ${CHECKS.length} of ${CHECKS.length} checks passed.\n`);
  return EXIT_OK;
}

export { CHECKS, SERVICES };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(await main());
}
