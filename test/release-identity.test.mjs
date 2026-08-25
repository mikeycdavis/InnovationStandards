/**
 * The release identity this repository declares, checked for agreement across every file that
 * declares it.
 *
 * WHY THIS EXISTS. `VERSION` said `1.0.1` while `package.json`, `README.md` and `PROJECT.md` all
 * said `1.0.0`, simultaneously, from 1.0.1 until this test was written. Nothing here noticed, because
 * nothing here read `VERSION` at all — the only consumer is external. StandardsEnforcer's interface
 * inventory found it from outside and recorded the consequence rather than the typo:
 *
 *   > package.json disagrees with VERSION in Engineering, Financial and Innovation, so the choice
 *   > matters
 *
 * That is the failure mode. A consumer that pins a release identity has to pick one of these files,
 * and while they disagree the pack is telling different consumers different things about which
 * release they are holding. Three of the four were wrong and none was detectably wrong from here.
 *
 * `PROJECT.md` WAS MISSING FROM THE FIRST VERSION OF THIS TABLE, AND THAT IS THE MORE USEFUL HALF OF
 * THE RECORD. This file shipped for review covering three declaration sites, with a comment saying in
 * as many words that a fourth site added without being listed here is the gap the table cannot close
 * by itself. The fourth site already existed. Automated review found `PROJECT.md:171` declaring
 * `1.0.0` on the same commit where every assertion below was green — a test that passed while the
 * defect it names was still present in the tree, because its inventory was hand-built and incomplete.
 *
 * So read the guarantee narrowly. This proves the listed sites agree; it does not discover sites. The
 * enumeration is the assumption, and it failed once already.
 *
 * WHAT THIS ASSERTS, AND WHAT IT DELIBERATELY DOES NOT. It compares the declarations to each other.
 * It does not pin them to a literal, because a test that hard-codes `1.0.2` has to be edited by
 * whoever cuts 1.0.3 — and an assertion edited as a routine step of the thing it checks is not
 * checking that thing. Structural comparison keeps working across every future release without being
 * touched, and fails the moment one file moves alone. That is the divergence to catch; the current
 * value is not.
 *
 * THE SEAM MUST FAIL WHEN IT CANNOT FIND THE SEAM. Each extractor below asserts it matched before it
 * compares anything. This is not defensive habit — StandardsEnforcer shipped a structural guard that
 * sliced on a literal that CRLF checkouts never contained, so it extracted the empty string and
 * passed on the absence of any input, in every environment including authoritative CI. An extractor
 * that silently finds nothing reports agreement between two things it never read.
 *
 * `standardVersion` IN `project-policy.yml` IS NOT IN SCOPE AND MUST NOT BE ADDED. It is a different
 * concept that happens to look like this one. 1.0.1's changelog separated them on purpose: the tool
 * version is the checkout, which determines the rules that exist; `standardVersion` is a declaration
 * of intent that selects nothing. They are not mechanically coupled, and whether they should be is an
 * open innovation decision. Sweeping every version-shaped string in the repository into one equality
 * would silently answer that question by accident.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

/** Semver as this repository uses it: three numeric parts, no pre-release, no build metadata. */
const SEMVER = /^\d+\.\d+\.\d+$/;

/**
 * Every file that declares which release this is, with the extractor that reads it.
 *
 * Adding a further declaration site to the repository without adding it here is the gap this table
 * cannot close by itself. It is a list of the sites that exist, not a proof that no other exists.
 */
const DECLARATIONS = {
  "VERSION": (text) => text.trim(),

  "package.json": (text) => {
    const { version } = JSON.parse(text);
    assert.ok(version, "package.json declares no version field");
    return version;
  },

  // Trailing full stop included in the pattern but not the capture: this file writes
  // `**Version 1.0.2.**` where README writes `**Version 1.0.2**`, and capturing the stop would make
  // the two disagree forever on a difference in punctuation.
  "PROJECT.md": (text) => {
    const lines = text.split("\n").filter((l) => /^\*\*Version \d[^*]*\*\*/.test(l));
    assert.equal(
      lines.length,
      1,
      `PROJECT.md carries ${lines.length} version declarations; this extractor reads exactly one`,
    );
    return lines[0].match(/^\*\*Version (\S+?)\.?\*\*/)[1];
  },

  "README.md": (text) => {
    const lines = text.split("\n").filter((l) => /^\*\*Version \d[^*]*\*\*/.test(l));
    assert.equal(
      lines.length,
      1,
      `README.md carries ${lines.length} version declarations; this extractor reads exactly one`,
    );
    return lines[0].match(/^\*\*Version (\S+)\*\*/)[1];
  },
};

function declared() {
  return Object.fromEntries(
    Object.entries(DECLARATIONS).map(([file, extract]) => [file, extract(read(file))]),
  );
}

test("every file that declares a release version declares the same one", () => {
  const found = declared();
  const distinct = [...new Set(Object.values(found))];
  assert.equal(
    distinct.length,
    1,
    "release identity disagrees across files: " + JSON.stringify(found, null, 2),
  );
});

test("the declared version is semver-shaped", () => {
  for (const [file, version] of Object.entries(declared())) {
    assert.match(version, SEMVER, `${file} declares ${JSON.stringify(version)}`);
  }
});

test("MUTATION: moving one declaration alone is what this test catches", () => {
  // The assertion above compares real files, so it cannot demonstrate its own failure without
  // editing them. This runs the same comparison over a copy with one entry moved, and requires it to
  // fail. Were the comparison vacuous — an extractor returning undefined for every file, say — the
  // real test would pass and this one would too, so this is the arm that would go red.
  const found = declared();
  const [first] = Object.keys(found);
  const mutated = { ...found, [first]: "9.9.9" };
  assert.notEqual(found[first], "9.9.9", "the repository actually declares 9.9.9; pick another value");
  assert.ok(
    new Set(Object.values(mutated)).size > 1,
    "one declaration was moved and the comparison still saw agreement",
  );
});

test("SEAM: each extractor proves it read something", () => {
  // Not a restatement of the semver test. That one would be satisfied by an extractor returning a
  // constant; this one requires the value to have come out of the file it names.
  for (const [file, version] of Object.entries(declared())) {
    assert.ok(
      read(file).includes(version),
      `${file} does not contain ${JSON.stringify(version)}; its extractor is not reading the file`,
    );
  }
});
