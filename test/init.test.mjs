/**
 * The bootstrap safety contract.
 *
 * `init` is the only command that writes, so it is the only one that can destroy an adopter's work.
 * Two properties matter more than anything it creates: it never overwrites without an explicit
 * per-path opt-in, and the dry run is computed from the same plan the apply uses.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { plan, apply, MODES, detectMode } from "../scripts/init.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function sandbox(setup = async () => {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "innovation-init-"));
  await setup(dir);
  return dir;
}

test("every template init writes actually exists", async () => {
  // init reads its templates at apply() time, so a missing one is a crash in an adopter's
  // repository, half-bootstrapped.
  const source = await readFile(path.join(ROOT, "scripts/init.mjs"), "utf8");
  const templates = [...source.matchAll(/template:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(templates.length >= 5, "init declares fewer templates than expected — has the list moved?");
  for (const t of templates) {
    assert.ok(existsSync(path.join(ROOT, t)), `init writes a missing template: ${t}`);
  }
});

test("a dry run writes nothing", async () => {
  const dir = await sandbox();
  const planned = await plan(dir, {});
  assert.ok(planned.actions.length > 0);
  for (const action of planned.actions) {
    assert.ok(!existsSync(path.join(dir, action.path)), `${action.path} exists after planning alone`);
  }
  await rm(dir, { recursive: true, force: true });
});

test("dry run and apply derive from the same plan", async () => {
  // A preview computed separately from the mutation is not a preview; it is a second implementation
  // that agrees until it does not, and the moment it disagrees is when someone is relying on it.
  const dir = await sandbox();
  const planned = await plan(dir, {});
  const previewed = planned.created.slice().sort();
  await apply(dir, planned);
  for (const p of previewed) {
    assert.ok(existsSync(path.join(dir, p)), `${p} was previewed as created and was not created`);
  }
  await rm(dir, { recursive: true, force: true });
});

test("an existing file is a conflict, and is never overwritten by default", async () => {
  const dir = await sandbox(async (d) => {
    await writeFile(path.join(d, "PROJECT.md"), "MINE — do not clobber\n", "utf8");
  });
  const planned = await plan(dir, {});
  const conflict = planned.conflicts.find((c) => c.path === "PROJECT.md");
  assert.ok(conflict, "an existing, differing file was not reported as a conflict");
  assert.match(conflict.remediation, /--force-overwrite=PROJECT\.md/);

  await apply(dir, planned);
  assert.equal(await readFile(path.join(dir, "PROJECT.md"), "utf8"), "MINE — do not clobber\n");
  await rm(dir, { recursive: true, force: true });
});

test("overwriting requires naming the exact path, and approving one does not approve another", async () => {
  const dir = await sandbox(async (d) => {
    await writeFile(path.join(d, "PROJECT.md"), "mine\n", "utf8");
    await writeFile(path.join(d, "project-policy.yml"), "mine\n", "utf8");
  });
  const planned = await plan(dir, { overwrite: ["PROJECT.md"] });
  await apply(dir, planned);

  assert.notEqual(await readFile(path.join(dir, "PROJECT.md"), "utf8"), "mine\n", "the named path was not replaced");
  assert.equal(
    await readFile(path.join(dir, "project-policy.yml"), "utf8"),
    "mine\n",
    "approving one path silently approved another",
  );
  await rm(dir, { recursive: true, force: true });
});

test("re-running recognises its own output and preserves it", async () => {
  const dir = await sandbox();
  await apply(dir, await plan(dir, {}));
  const second = await plan(dir, {});
  assert.deepEqual(second.conflicts, [], "a second run reported its own output as a conflict");
  assert.ok(second.preserved.length > 0);
  await rm(dir, { recursive: true, force: true });
});

test("a project with implementation and no recorded decisions is not scaffolded with proposals", async () => {
  // Back-filling proposals for work that already shipped produces a decision record nobody actually
  // made that way, and once written it is indistinguishable from a real one.
  const dir = await sandbox(async (d) => {
    await mkdir(path.join(d, "src"), { recursive: true });
    await writeFile(path.join(d, "src", "index.js"), "// shipped\n", "utf8");
  });
  const planned = await plan(dir, {});
  assert.equal(planned.mode, MODES.UNDOCUMENTED_DECISIONS);
  assert.equal(planned.undocumentedDecisions, true);
  assert.match(planned.nextStep, /Do not back-fill/i);

  await apply(dir, planned);
  const { readdir } = await import("node:fs/promises");
  const proposals = await readdir(path.join(dir, "artifacts/innovation-proposals"));
  assert.deepEqual(proposals, ["TEMPLATE.md"], "init authored a proposal for work that already happened");
  await rm(dir, { recursive: true, force: true });
});

test("the detected mode is labelled INFERRED unless the operator declared it", async () => {
  // A wrong guess is recoverable only if the reader can see which guess was made.
  const dir = await sandbox();
  assert.equal((await plan(dir, {})).modeConfidence, "INFERRED");
  assert.equal(detectMode(dir, MODES.GREENFIELD).confidence, "CONFIRMED_BY_OWNER");
  await rm(dir, { recursive: true, force: true });
});

test("init seeds a proposal template an adopter can actually use", async () => {
  const dir = await sandbox();
  await apply(dir, await plan(dir, {}));
  const template = await readFile(path.join(dir, "artifacts/innovation-proposals/TEMPLATE.md"), "utf8");
  for (const section of ["## Problem", "## Evidence", "## Decision", "## Kill criteria"]) {
    assert.ok(template.includes(section), `the seeded template is missing ${section}`);
  }
  await rm(dir, { recursive: true, force: true });
});
