/**
 * The local CI pipeline and the verified-submission invariant.
 *
 * Two halves. The first asserts that the pipeline definition and the GitHub workflow have not
 * drifted apart, and that no check the previous workflow ran has been quietly dropped. The second
 * exercises scripts/submit-pr.sh against a throwaway repository with a throwaway remote, because the
 * invariant it enforces — the commit pushed is the commit that passed — is a claim about behaviour
 * under adverse conditions, and a claim like that is worth exactly as much as its test.
 *
 * The adverse conditions are simulated by injecting a fake pipeline through LOCAL_CI_COMMAND. That
 * hook exists for this test and nothing else; the real script defaults to scripts/ci.sh.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHECKS, SERVICES } from "../ci/pipeline.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
const pkg = JSON.parse(read("package.json"));

/**
 * Every check the workflow ran before local CI existed, as it stood at commit fdcc809.
 *
 * Hardcoded on purpose. The instruction this repository was built under was not to lose CI coverage,
 * and the only way to hold a refactor to that is to write down what coverage there was and compare.
 * If a check is ever deliberately retired, this list is the place the decision has to be made
 * visible.
 */
const PRE_EXISTING_CHECKS = ["inventory", "fidelity", "policy", "diagrams", "test", "audit", "validate"];

test("every pipeline check names a real npm script", () => {
  for (const check of CHECKS) {
    assert.ok(pkg.scripts[check.script], `pipeline check '${check.id}' names \`npm run ${check.script}\`, which package.json does not define`);
  }
});

test("pipeline check ids are unique and each states why it exists", () => {
  const ids = CHECKS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "two checks share an id");
  for (const check of CHECKS) {
    assert.ok(check.why && check.why.length > 40, `check '${check.id}' does not say why it exists`);
    assert.ok(check.stage, `check '${check.id}' declares no stage`);
  }
});

test("no check from the pre-local-CI workflow was dropped", () => {
  const scripts = CHECKS.map((c) => c.script);
  for (const previous of PRE_EXISTING_CHECKS) {
    assert.ok(scripts.includes(previous), `\`npm run ${previous}\` ran in CI before and no longer does`);
  }
});

test("the GitHub workflow invokes the same script rather than restating the pipeline", () => {
  const workflow = read(".github/workflows/ci.yml");
  assert.match(workflow, /\.\/scripts\/ci\.sh/, "the workflow does not call scripts/ci.sh");
  for (const check of CHECKS) {
    assert.doesNotMatch(
      workflow,
      new RegExp(`run:\\s*npm run ${check.script}\\b`),
      `the workflow runs \`npm run ${check.script}\` directly — the pipeline is defined twice again`,
    );
  }
});

test("the CI image is pinned by digest, and history and credentials are kept out of it", () => {
  const dockerfile = read("ci/Dockerfile");
  assert.match(dockerfile, /FROM \$\{NODE_IMAGE\}/, "the base image is not parameterised");
  assert.match(dockerfile, /ARG NODE_IMAGE=[^\n]*@sha256:[0-9a-f]{64}/, "the default base image is not pinned by digest");
  assert.doesNotMatch(dockerfile, /^\s*RUN\s+npm\s+(ci|install)/m, "an install step appeared in the CI image");
  assert.match(dockerfile, /^USER node$/m, "CI runs as root");

  const ignore = read(".dockerignore");
  for (const excluded of [".git", "node_modules", "artifacts/local-ci"]) {
    assert.match(ignore, new RegExp(`^${excluded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"), `.dockerignore does not exclude ${excluded}`);
  }
});

test("the compose environment is isolated and mounts nothing from the host", () => {
  const compose = read("compose.ci.yml");
  assert.match(compose, /network_mode: none/, "the CI service is not network-isolated");
  assert.match(compose, /volumes: \[\]/, "the CI service declares volumes — the host tree may be mounted in");
  assert.doesNotMatch(compose, /docker\.sock/, "the Docker socket is exposed to the CI container");
});

test("declared dependency services are the ones the orchestrator waits on", () => {
  // Empty here, and the test asserts the honest thing rather than asserting emptiness: whatever is
  // declared must be a service compose actually defines, so the two cannot drift.
  const compose = read("compose.ci.yml");
  for (const service of SERVICES) {
    assert.match(compose, new RegExp(`^\\s{2}${service.service}:`, "m"), `ci/pipeline.mjs declares service '${service.service}', which compose.ci.yml does not define`);
  }
});

test("CI verification records are not committed", () => {
  assert.match(read(".gitignore"), /^artifacts\/local-ci\/$/m, "local CI records are not ignored");
});

// -------------------------------------------------------------------------------------------
// The invariant.
// -------------------------------------------------------------------------------------------

const bash = (() => {
  const probe = spawnSync("bash", ["-c", "echo ok"], { encoding: "utf8" });
  return probe.status === 0 ? "bash" : null;
})();

test("inside the CI pipeline, the invariant tests must not skip", () => {
  // Outside CI, a developer without bash gets skips and a note. Inside CI that would be a silent
  // hole in exactly the guarantee this file exists to prove, so there it is a failure. LOCAL_CI_COMMIT
  // is set only by scripts/ci.sh.
  if (!process.env.LOCAL_CI_COMMIT) return;
  assert.ok(bash, "bash is unavailable in the CI image, so the exact-commit invariant went untested");
  assert.equal(spawnSync("git", ["--version"]).status, 0, "git is unavailable in the CI image, so the exact-commit invariant went untested");
});

/**
 * A throwaway repository with a throwaway bare remote and a fake pipeline.
 *
 * Nothing here touches the real repository or the real origin. `submit-pr.sh` resolves its root
 * from its own location, so it is copied in rather than run in place.
 */
function scaffold(fakeCi) {
  const dir = mkdtempSync(path.join(tmpdir(), "innovation-submit-"));
  const repo = path.join(dir, "repo");
  const remote = path.join(dir, "remote.git");
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" });

  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["init", "--quiet", "--initial-branch=main", repo]);
  execFileSync("git", ["init", "--quiet", "--bare", remote]);
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
  git("config", "core.autocrlf", "false");
  git("remote", "add", "origin", remote);

  mkdirSync(path.join(repo, "scripts"), { recursive: true });
  copyFileSync(path.join(ROOT, "scripts", "submit-pr.sh"), path.join(repo, "scripts", "submit-pr.sh"));
  chmodSync(path.join(repo, "scripts", "submit-pr.sh"), 0o755);

  writeFileSync(path.join(repo, "README.md"), "seed\n", "utf8");
  git("add", "README.md", "scripts/submit-pr.sh");
  git("commit", "--quiet", "-m", "seed");

  // Outside the repository: a fake pipeline sitting untracked in the working tree would trip the
  // dirty-tree guard before any of the behaviour under test could run.
  const ci = path.join(dir, "fake-ci.sh");
  writeFileSync(ci, fakeCi, "utf8");
  chmodSync(ci, 0o755);

  return { dir, repo, remote, git, ci };
}

/** Runs the real submit-pr.sh in the scaffolded repository. Never reaches GitHub: `--no-pr`. */
function submit({ repo, ci }, extraArgs = []) {
  return spawnSync(bash, ["scripts/submit-pr.sh", "--no-pr", ...extraArgs], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, LOCAL_CI_COMMAND: ci, GIT_TERMINAL_PROMPT: "0" },
  });
}

const remoteHead = (remote, branch) => {
  const out = execFileSync("git", ["ls-remote", remote, `refs/heads/${branch}`], { encoding: "utf8" }).trim();
  return out ? out.split(/\s+/)[0] : null;
};

const PASSING_CI = "#!/usr/bin/env bash\necho 'fake CI: pass'\nexit 0\n";
const FAILING_CI = "#!/usr/bin/env bash\necho 'fake CI: fail'\nexit 1\n";
/** Passes, but advances HEAD while it runs — an amend, a hook, or a commit in another terminal. */
const MUTATING_CI = [
  "#!/usr/bin/env bash",
  "echo 'fake CI: pass, but the tree moved'",
  "echo drift >> drifted.txt",
  "git add drifted.txt",
  "git -c user.email=t@example.invalid -c user.name=T commit --quiet -m 'commit made during CI'",
  "exit 0",
].join("\n");

test("submit-pr refuses to submit from the default branch", { skip: bash ? false : "bash is unavailable" }, () => {
  const s = scaffold(PASSING_CI);
  try {
    const r = submit(s);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /default branch/i);
    assert.equal(remoteHead(s.remote, "main"), null, "something was pushed");
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});

test("submit-pr refuses a dirty working tree, and does not run CI", { skip: bash ? false : "bash is unavailable" }, () => {
  const s = scaffold(PASSING_CI);
  try {
    s.git("checkout", "--quiet", "-b", "feature/x");
    writeFileSync(path.join(s.repo, "README.md"), "edited but not committed\n", "utf8");
    const r = submit(s);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /dirty/i);
    assert.doesNotMatch(r.stdout, /fake CI/, "CI ran against a tree that could not be submitted anyway");
    assert.equal(remoteHead(s.remote, "feature/x"), null, "something was pushed");
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});

test("submit-pr pushes nothing when CI fails", { skip: bash ? false : "bash is unavailable" }, () => {
  const s = scaffold(FAILING_CI);
  try {
    s.git("checkout", "--quiet", "-b", "feature/x");
    const r = submit(s);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /CI failed\. No branch was pushed and no PR was created\./);
    assert.equal(remoteHead(s.remote, "feature/x"), null, "a branch was pushed after CI failed");
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});

test("submit-pr refuses to push when HEAD moved during verification", { skip: bash ? false : "bash is unavailable" }, () => {
  // The invariant, stated as a failure: a pipeline that passed certifies one commit, and if HEAD
  // advanced while it ran, the commit about to be pushed is not that commit.
  const s = scaffold(MUTATING_CI);
  try {
    s.git("checkout", "--quiet", "-b", "feature/x");
    const before = s.git("rev-parse", "HEAD").trim();

    const r = submit(s);

    assert.equal(r.status, 1, "submission proceeded despite an unverified HEAD");
    assert.match(
      r.stderr,
      /HEAD changed after CI verification\. The current commit has not been verified\. Re-run CI before submitting\./,
    );
    assert.match(r.stderr, /No branch was pushed and no PR was created\./);

    const after = s.git("rev-parse", "HEAD").trim();
    assert.notEqual(after, before, "the fake pipeline did not actually move HEAD — the test proves nothing");
    assert.equal(remoteHead(s.remote, "feature/x"), null, "an unverified commit was pushed");
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});

test("submit-pr pushes exactly the verified commit when CI passes", { skip: bash ? false : "bash is unavailable" }, () => {
  const s = scaffold(PASSING_CI);
  try {
    s.git("checkout", "--quiet", "-b", "feature/x");
    writeFileSync(path.join(s.repo, "feature.txt"), "work\n", "utf8");
    s.git("add", "feature.txt");
    s.git("commit", "--quiet", "-m", "add feature");
    const verified = s.git("rev-parse", "HEAD").trim();

    const r = submit(s);

    assert.equal(r.status, 0, `submission failed: ${r.stderr}`);
    assert.equal(remoteHead(s.remote, "feature/x"), verified, "the remote branch is not at the verified commit");
    assert.match(r.stdout, new RegExp(verified));
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});

test("submit-pr never commits, amends, rebases, or force-pushes", () => {
  const source = read("scripts/submit-pr.sh");
  const body = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");
  for (const forbidden of [/git\s+(-C \S+ )?commit\b/, /--amend\b/, /git\s+(-C \S+ )?rebase\b/, /--force\b/, /-f\b\s+origin/, /git\s+(-C \S+ )?reset\b/]) {
    assert.doesNotMatch(body, forbidden, `submit-pr.sh contains ${forbidden} — it is supposed to change nothing`);
  }
});

test("the PowerShell entry points delegate rather than reimplement", () => {
  for (const name of ["ci.ps1", "submit-pr.ps1"]) {
    assert.ok(existsSync(path.join(ROOT, "scripts", name)), `scripts/${name} is missing`);
    const text = read(`scripts/${name}`);
    assert.match(text, /_find-bash\.ps1/, `scripts/${name} does not resolve bash through the shared helper`);
    assert.match(text, new RegExp(name.replace(".ps1", "\\.sh")), `scripts/${name} does not delegate to its .sh counterpart`);
    assert.doesNotMatch(text, /docker\s+compose/i, `scripts/${name} drives Docker itself — the pipeline is implemented twice`);
  }
});
