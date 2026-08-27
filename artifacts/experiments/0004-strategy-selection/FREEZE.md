# Freeze record — candidate implementations, before any subject is inspected

**Written:** 2026-08-27 · **Repository:** `26b6c4c` · **Node:** v24.15.0

This records the state of the experimental apparatus at the moment it was frozen, so that a later
edit is detectable rather than deniable. It is written **before** ground truth exists and before any
of the sixteen held-out subjects has been opened.

## Why hashes rather than an assurance

The pre-registration says a candidate edited after ground truth voids the run. That is unenforceable
against a document that merely asserts the candidates were fixed first — the assertion and the edit
live in the same file. Hashes make the claim checkable: every run emits a manifest carrying these
values, so a result either matches the frozen apparatus or visibly does not.

## Hashes are taken over newline-normalised text

Not over raw bytes. This repository stores LF and checks out CRLF on Windows, so a byte hash of a
working copy describes the checkout rather than the content — and a freeze record built that way
would report every candidate as edited on a fresh clone, loudly and indistinguishably from the real
tampering it exists to detect. Found while staging this record, when git warned that the files it
was about to hash would have their line endings rewritten. `run.mjs` normalises CRLF to LF before
hashing, so these values hold in any checkout.

## Frozen files

| File | sha256 |
| --- | --- |
| `candidates.mjs` | `931d3da6e0efa6a3e20f4ff18005bee033bd2d0ba4d266e649fafcc890f01bd6` |
| `run.mjs` | `ef6f3be716e67f4641991a95ce0857a19c18c813654c4fbf886e2af77961c754` |
| `PRE-REGISTRATION.md` | `9e1054f5be9bf42a7bdaea0841db71767c7a28b3e796109d6934cd4ff3dd19aa` |
| `AMENDMENT-01.md` | `92525990331b62e132f17498596f365bfd4c75f6d27069175150844b2f3a8484` |
| `scripts/init.mjs` | `2586fe8e0edee85dc48d8defd144fcc5dbd328cb92914b774ad8fdf5c1bf58f0` |

`scripts/init.mjs` is listed because candidate 0 imports it rather than restating it. Its hash is
**identical to the value recorded in
[RED-DEMONSTRATION.md](../0004-mode-detection/RED-DEMONSTRATION.md)** on 2026-08-26, which
establishes that the subject under test has not moved between the red demonstration and this freeze.

## Frozen candidates

| # | Class | Signal | sha256 of implementation |
| --- | --- | --- | --- |
| `0-baseline` | baseline | root-only markers | `a67351bb4638b719e12ee98c222bfd2cf1089131a3fcb2c1f7d24325b73e2a6b` |
| `1-recursion-no-early-return` | I | markers at depth ≤ 2 | `0b71c8a8d62f6a0f79d36ecaf22b1c995172a3dcd0ee57c84594e12d2cb766f2` |
| `2-git-evidence` | I | commit and tracked-file counts | `55ec6c4d9bb18c5fa7704e147b4acba1cc9f109df6838a853bf393edfffd2f4c` |
| `3-content-shaped` | I | substantive tracked files | `3c13e3fdf36a4d0797459195cda07447f280fa30620b1ba4af9ba1338bfac22d` |
| `4-refuse-when-weak` | II | agreement of S1, S2, S3 | `c07ac2b34cafd56233769eac1f710ba6b78f630eb61bfc8a588e0fc6b0920790` |
| `5-never-infer-greenfield` | II | any positive signal, else verifiable emptiness | `1b601a16aa15aba4b92e62f35c23a000cc246c0ae9e85c0ada806cbbd9e6fc39` |

Per-candidate hashes are taken over each implementation's own source, so an edit to one candidate is
attributable to that candidate rather than only to the file.

## Verification performed at freeze time

**1 — the code corresponds to the frozen descriptions.** Each candidate was read against its row in
the pre-registration and its resolution in `AMENDMENT-01.md`. One fidelity defect was found and
fixed before freezing: candidate 1 initially omitted prompt markers from the greenfield test, which
would have made it a different composition from the `a+c1` the first experiment froze. It now
matches that composition exactly — all three groups empty yields `greenfield`, plans yield
`existing-with-proposals`, otherwise `undocumented-decisions`.

**2 — no candidate reads subject-specific content.** `candidates.mjs` was searched for all sixteen
subject names: **zero matches**. Every candidate reads only the signals it is defined to use —
marker names inherited from the first experiment, git metadata, and tracked-file paths. None reads
file *contents* at all, except `hasContent`, which tests only whether a directory holds a `.md`.

**3 — the ordering is enforced, not promised.** `run.mjs --subjects` exits 2 while
`GROUND-TRUTH.json` is absent, with a message naming the ordering it is protecting. Verified:

```
REFUSING TO RUN. GROUND-TRUTH.json does not exist.
exit=2
```

**4 — the gates run, and the duplicated fixtures are faithful.** `run.mjs` rebuilds the three
constructed cases rather than importing them from `falsifiers.mjs`, whose sha256 is published
evidence of the red run and must not be edited to add an export. The duplication was checked by
re-running the original script: it still reports **1 of 3 satisfied**, failing `housedoc-shape` and
`bare-monorepo`, which is exactly what the duplicate produces for candidate 0.

## Gate results at freeze time

These are controls already on `main`, not held-out subjects, so running them contaminates nothing.

| Candidate | housedoc-shape | bare-monorepo | genuinely-empty |
| --- | --- | --- | --- |
| `0-baseline` | `greenfield` ✗ | `greenfield` ✗ | `greenfield` ✓ |
| `1-recursion-no-early-return` | `undocumented-decisions` ✓ | **`greenfield` ✗** | `greenfield` ✓ |
| `2-git-evidence` | `greenfield` ✗ | `greenfield` ✗ | `greenfield` ✓ |
| `3-content-shaped` | `undocumented-decisions` ✓ | `undocumented-decisions` ✓ | `greenfield` ✓ |
| `4-refuse-when-weak` | `refused` — recorded | `refused` — recorded | `greenfield` ✓ |
| `5-never-infer-greenfield` | `undocumented-decisions` ✓ | `undocumented-decisions` ✓ | `greenfield` ✓ |

**These are gate results, not experiment results.** Passing them earns a candidate nothing; the
pre-registration is explicit that they disqualify and never score. In particular, candidate 3 and
candidate 5 clearing all three gates is **not** evidence that either works — the gates were the data
these designs were available to be shaped by, which is the whole reason they are a gate.

**Candidate 1 fails `bare-monorepo`, and that falsified a published claim.** E21, merged on
2026-08-26, said both falsifiers are satisfied by bounded recursion. At depth ≤ 2 — the depth `a+c1`
declares — they are not: the manifests are at depth 3. Corrected in proposal 0004 as **E22**;
reasoning in `AMENDMENT-01.md`.

**Candidate 2 fails two gates**, which under the pre-registration's terms disqualifies it before the
sixteen subjects are touched. It is **still run**, because a disqualified candidate's behaviour on
the held-out set is evidence about the *signal*, and dropping it now would silently narrow the
comparison.

## What has not happened

- **No subject has been opened.** Only directory names have ever been read.
- **No ground truth exists.** `GROUND-TRUTH.json` is absent, which is why the runner refuses.
- **No candidate has been run against a held-out subject.**
- **Nothing in `scripts/`, `test/`, the backlog, or ST-02 has been touched.**
