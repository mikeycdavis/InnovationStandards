# 0001 — This repository is standalone, and the compliance engine is vendored by copy

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Project owner

## Context

The innovation standards need a machine-checkable substrate: a rule catalog with stable identity, a
policy format that separates applicability from exceptions, an evaluator that refuses to let unknown
count as a pass, and gates that prove the standards series has not silently changed shape.

That substrate already exists and is proven, in a sibling repository implementing engineering
standards. Roughly seventy percent of its script code is content-agnostic — a strict YAML subset
parser, a JSON Schema evaluator, the catalog loader, the compliance engine, the policy checker, the
diagram freshness check, the source-inventory check. None of it knows anything about engineering.

The governing constraint is a directive: **this repository must be independently maintained and must
not depend on any other standards repository.** Innovation standards will be adopted by projects that
have no engineering-standards relationship, and a domain repository that cannot be adopted without
dragging in an unrelated domain's rules is not standalone in any useful sense.

## Decision

**Copy the content-agnostic machinery into this repository. Depend on nothing.**

There is no npm dependency, no git submodule, no path reference, no shared package, and no build step
that reaches outside this repository. `F:\Repos\EngineeringStandards` is read-only source material
that was read once during construction and is never modified, never fetched, and never required at
runtime, test time, or CI time.

Copied unchanged: `scripts/yaml.mjs`, `scripts/jsonschema.mjs`, `scripts/catalog.mjs`,
`scripts/policy.mjs`, `scripts/diagrams.mjs`, `scripts/inventory.mjs`,
`schemas/project-policy.schema.json`.

Copied and adapted: `scripts/fidelity.mjs` (its source path), `scripts/init.mjs` (its template list),
`scripts/compliance.mjs` (the new `BLOCKED_BY_INVARIANT` status — see
[ADR 0005](0005-invariant-class-and-blocked-verdict.md)), `scripts/standards.mjs` (every detector, and
two new subcommands — see [design/cli-design.md](../../design/cli-design.md)).

Authored fresh: all fourteen standards, the rule catalog, the proposal artifact format, the policy,
the templates, the tests for anything new, and all documentation.

**Concepts were not copied along with the code.** Each was investigated and given an adopt / adapt /
reject verdict with reasoning, recorded in [design/concept-map.md](../../design/concept-map.md). Four
domain additions and seven rejections came out of that investigation.

## Alternatives considered

**Publish the engine as an npm package and depend on it.** Evaluated as a real proposal, which
concluded `reject`: [proposal 0002](../innovation-proposals/0002-share-scripts-via-npm-package.md).
The short form is that CI here deliberately has no install step, that a shared package makes every
domain repository's release cadence hostage to the package's, and that the coupling it introduces is
exactly the independence the directive prohibits giving up. The proposal records the cost of the
decision honestly rather than pretending duplication is free.

**Git submodule.** Rejected. A submodule is a dependency with worse ergonomics than a package: it
pins a commit, requires a second clone step, and silently gives an adopter a repository they did not
ask for.

**Write the engine from scratch.** Rejected. The machinery encodes hard-won properties — skipped is
never passed, status is never computed from the score, an attestation never overrides a finding, a
non-exemptible waiver is rejected rather than ignored. Reimplementing it would mean rediscovering
those properties, and the failure mode of rediscovering them badly is a system that reports green.

**Copy everything including the engineering rules, then delete what does not fit.** Rejected. Deleting
is a weak filter: what survives does so by inattention rather than by decision, and the concept map
would have been a description of what was left rather than an investigation.

## Consequences

**Makes easier.** This repository can be adopted, versioned, and released with no reference to any
other. Its CI runs with no install step. Its engine semantics start out proven rather than new.

**Makes harder.** A defect fixed in the sibling repository's engine is not fixed here. There is no
mechanism that will tell us; discovering it requires someone to look. This is a real, permanent
maintenance cost and it is stated in [proposal 0001](../innovation-proposals/0001-innovation-standards-standalone-repo.md)'s
cost section rather than discovered later.

**Commits the project to.** Maintaining the vendored engine as this repository's own code — including
its tests, which were transplanted alongside it and must not be weakened to accommodate authored
content.
