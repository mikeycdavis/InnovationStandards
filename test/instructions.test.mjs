/**
 * Documentation held to the code.
 *
 * A documented command that does not exist is a defect, not stale prose — and the direction usually
 * missed is the other one: text that was true when written and now understates the tooling is as
 * wrong as text that overstates it. Both are asserted here.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "../scripts/catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFile(path.join(ROOT, p), "utf8");

const GUIDE = await read("INSTRUCTIONS.md");
const README = await read("README.md");
const CLI = await read("scripts/standards.mjs");
const catalog = await loadCatalog();

// --- The guide describes things that exist -----------------------------------------------------

test("every path the guide and README reference exists", async () => {
  for (const [name, text] of [["INSTRUCTIONS.md", GUIDE], ["README.md", README]]) {
    const targets = [...text.matchAll(/\]\((?!https?:|#)([^)#\s]+)/g)].map((m) => m[1]);
    assert.ok(targets.length > 0, `${name} links to nothing`);
    for (const target of targets) {
      assert.ok(existsSync(path.join(ROOT, target)), `${name} references a missing path: ${target}`);
    }
  }
});

test("every script the guide tells an adopter to run exists", async () => {
  const scripts = [...GUIDE.matchAll(/scripts\/([\w.-]+\.mjs)/g)].map((m) => m[1]);
  assert.ok(scripts.length >= 2, "the guide names no scripts — has the recipe changed?");
  for (const script of new Set(scripts)) {
    assert.ok(existsSync(path.join(ROOT, "scripts", script)), `the guide names a missing script: ${script}`);
  }
});

test("every npm script the documentation names is defined", async () => {
  const pkg = JSON.parse(await read("package.json"));
  for (const [name, text] of [["INSTRUCTIONS.md", GUIDE], ["README.md", README]]) {
    for (const [, script] of text.matchAll(/npm run ([\w:-]+)/g)) {
      assert.ok(pkg.scripts[script], `${name} names \`npm run ${script}\`, which package.json does not define`);
    }
  }
});

test("the guide names every subcommand the CLI implements", () => {
  const commands = [...CLI.matchAll(/COMMANDS = new Set\(\[([^\]]+)\]\)/g)]
    .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  assert.equal(commands.length, 5, "expected the CLI to declare its five commands in one place");
  for (const command of commands) {
    assert.match(
      GUIDE,
      new RegExp(`standards\\.mjs ${command}`),
      `the CLI implements \`${command}\` but the guide never shows it`,
    );
  }
});

test("the guide tells an adopter which command to gate CI on", () => {
  // Two commands with different exit-code contracts is a trap unless the guide is explicit about
  // which one is the gate.
  assert.match(GUIDE, /gate .{0,40}`?validate`?/i);
});

test("the guide covers every section an adopter needs", () => {
  for (const heading of [
    "What this repository is",
    "Declaring the standards version",
    "Obtaining and pinning the tooling",
    "Adding `project-policy.yml`",
    "Validating the policy",
    "Writing an innovation proposal",
    "Checking a proposal",
    "Explaining why a rule applies",
    "Running the audit",
    "Classifying required / not-applicable / exception",
    "Attesting a manual-review rule",
    "The decision model",
    "The standards integrity invariant",
    "How AI agents should use this repository",
    "Bootstrapping — `standards init`",
    "Upgrading to a newer standards version",
    "What not to do",
    "Current limitations",
  ]) {
    assert.ok(GUIDE.includes(heading), `INSTRUCTIONS.md is missing the section: ${heading}`);
  }
});

test("the guide prohibits copying the standards into a consuming repository", () => {
  // A copied standard is a fork with no merge path.
  assert.match(GUIDE, /Do not copy the standards/i);
});

// --- Honesty ------------------------------------------------------------------------------------

test("the guide states the tooling's current limitations, concretely", () => {
  assert.match(GUIDE, /Current limitations/i);
  const section = GUIDE.slice(GUIDE.indexOf("Current limitations"));
  const rows = [...section.matchAll(/^\| [^|-].*\|.*\|$/gm)];
  assert.ok(rows.length >= 5, "the limitations section lists almost nothing — is it still honest?");
});

test("the limitations do not claim a gap that has since been closed", () => {
  // The direction a documentation check usually misses. `init` was genuinely inoperable mid-build;
  // prose still saying so after it was fixed understates the tooling, which is as wrong as
  // overstating it.
  const section = GUIDE.slice(GUIDE.indexOf("Current limitations"));
  if (/planInit\(root,/.test(CLI)) {
    assert.doesNotMatch(
      section,
      /`standards init` does not run/i,
      "init works now; the limitations table is stale",
    );
  }
});

test("the documentation does not claim version gating the code does not implement", async () => {
  // The v1.0.1 defect, made un-repeatable. INSTRUCTIONS.md told every adopter that declaring
  // `standardVersion` "pins which rules apply to you" — but nothing compares a rule's `introducedIn`
  // against it, so the declaration gated nothing and the real pin (the checked-out ref) was never
  // documented at all. An overstatement in the adopter-facing guide is the same class of failure as
  // a rule claiming assurance its check cannot deliver.
  //
  // Coupled to the source rather than asserted flatly: if gating is ever implemented, this test
  // stops demanding the disclaimer instead of becoming a stale assertion someone has to delete.
  const sources = await Promise.all(
    ["compliance.mjs", "catalog.mjs", "standards.mjs"].map((f) => read(`scripts/${f}`)),
  );
  const gates = sources.some((s) => /introducedIn/.test(s) && /standardVersion/.test(s));

  if (!gates) {
    // Prose assertions run against a copy with markdown emphasis stripped. The disclaimer is written
    // `**not** used to select or filter rules`, and a naive /not\s+used/ misses it — a false failure
    // that would push the next person to weaken the assertion rather than fix the formatting.
    const prose = GUIDE.replace(/\*+/g, "");

    assert.doesNotMatch(
      prose,
      /pins which rules apply/i,
      "the guide claims standardVersion selects rules, and no code does that",
    );
    assert.match(
      prose,
      /not used to select or filter rules/i,
      "the guide must state plainly that standardVersion does not gate rules",
    );
    assert.match(
      prose,
      /introducedIn/,
      "the guide should name the field that would do the gating, so the claim is checkable",
    );
  }
});

test("the mutation test for the gating disclaimer — the check can actually fail", () => {
  // The assertion above is only worth having if it fails when the defect returns. Reintroducing
  // 1.0.0's exact sentence into a copy of the guide must trip it.
  const reintroduced = "This pins which rules apply to you.";
  assert.throws(
    () => assert.doesNotMatch(reintroduced, /pins which rules apply/i),
    "the guard does not detect the sentence it exists to prevent",
  );
});

test("the guide documents how an adopter obtains and pins the tooling", () => {
  // Every command in the guide reads `<standards-repo>/scripts/...`. Without an acquisition
  // mechanism that placeholder is unresolvable, and the first adopter has to invent one — most
  // likely by copying, which the guide separately prohibits.
  assert.match(GUIDE, /actions\/checkout/i, "no CI acquisition mechanism is documented");
  assert.match(GUIDE, /ref:\s*v\d+\.\d+\.\d+/, "the documented checkout is not pinned to a release");
  assert.match(GUIDE, /submodule/i, "the guide does not address the submodule alternative");
});

test("the documentation states the coverage split honestly and does not fold it into the verdict", () => {
  // The counts may be written as words or digits — prose is allowed to read like prose — but they
  // must be present and correct, because a reader who cannot see how much is unchecked will read
  // COMPLIANT as "everything was checked".
  const WORDS = {
    8: "eight", 11: "eleven", 14: "fourteen", 22: "twenty-two", 30: "thirty",
  };
  const states = (n) => README.includes(String(n)) || new RegExp(WORDS[n], "i").test(README);

  const manual = [...catalog.rules.values()].filter((r) => r.validationType === "manual-review").length;
  const total = catalog.rules.size;
  assert.ok(states(total), `README does not state the rule count (${total})`);
  assert.ok(states(total - manual), `README does not state the machine-evaluated count (${total - manual})`);
  assert.ok(states(manual), `README does not state the manual-review count (${manual})`);

  // The claim that matters most: COMPLIANT is not a statement about the idea.
  assert.match(README, /never mean|does not mean|never means/i);
});

test("the README index covers every standard", async () => {
  const files = (await readdir(path.join(ROOT, "standards"))).filter((f) => /^\d\d-.*\.md$/.test(f));
  for (const file of files) {
    assert.ok(README.includes(file), `README's index omits standards/${file}`);
  }
});

// --- Templates an adopter copies ------------------------------------------------------------------

test("the agent template routes to every canonical source in the load sequence", async () => {
  const text = await read("templates/AGENTS.md");
  for (const source of [
    "INSTRUCTIONS.md",
    "PROJECT.md",
    "project-policy.yml",
    "standardVersion",
    "standards/",
    "artifacts/innovation-proposals/",
    "artifacts/adr/",
  ]) {
    assert.ok(text.includes(source), `templates/AGENTS.md never routes to ${source}`);
  }
  // It ROUTES; it does not restate. A copied standard is a fork — edited independently, drifting,
  // and winning in practice because agents read this file first and trust it.
  assert.match(text, /Nothing below defines a rule/i);
  assert.match(text, /never rely on chat history/i);
  // When the two disagree the standard wins. Without this an adopter's edits quietly become a
  // competing definition.
  assert.match(text, /the standard governs/i);
});

test("the secondary instruction files defer to AGENTS.md instead of copying it", async () => {
  const agents = await read("templates/AGENTS.md");
  for (const name of ["CLAUDE.md", "copilot-instructions.md"]) {
    const text = await read(`templates/${name}`);
    assert.match(text, /AGENTS\.md/, `${name} never points at AGENTS.md`);
    assert.ok(
      text.length < agents.length,
      `${name} is not smaller than AGENTS.md — it is carrying content rather than deferring`,
    );
  }
});

test("the proposal template carries every section a proposal must have", async () => {
  const { REQUIRED_SECTIONS } = await import("../scripts/proposal.mjs");
  const template = await read("templates/innovation-proposal.md");
  for (const section of REQUIRED_SECTIONS) {
    assert.ok(template.includes(`## ${section}`), `the proposal template omits ## ${section}`);
  }
});

test("the proposal template does not itself pass the checks", async () => {
  // A template that satisfies every presence check would be the fastest route to a clean verdict,
  // and adopters would ship it unchanged. Its placeholder values must read as absent.
  const { parseProposal, isBlank } = await import("../scripts/proposal.mjs");
  const p = parseProposal(await read("templates/innovation-proposal.md"), "templates/innovation-proposal.md");
  assert.ok(isBlank(p.decision.outcome) || !p.decision.outcome || p.decision.outcome.includes("|"),
    "the template records a real decision outcome");
});
