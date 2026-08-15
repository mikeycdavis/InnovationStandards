# The CI environment. Everything the pipeline needs is in here; nothing it needs is on the host.
#
# Pinned by digest, not by tag. `node:20-alpine` is a moving target, and a CI image that changes
# underneath you turns "this commit passed" into a claim about a moment rather than about a commit.
# Override with --build-arg NODE_IMAGE=... to test a newer base deliberately.
ARG NODE_IMAGE=node@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
FROM ${NODE_IMAGE}

# There is no install step, and there must not be one. This repository has no third-party
# dependencies, by the decision recorded in artifacts/adr/0001-vendored-engine-standalone-repo.md.
# If an `npm ci` ever appears here, that decision changed — a supply-chain compromise in a tool that
# certifies compliance is a compromise of every certification it has issued.

# Base-image tooling, not project dependencies — nothing here is imported by anything the repository
# ships, and package.json is untouched.
#
# Both are required by the suite rather than convenient for it. scripts/ci.sh and scripts/submit-pr.sh
# are bash, and Alpine ships only ash; git is needed because test/local-ci.test.mjs builds throwaway
# repositories with throwaway remotes to prove the exact-commit invariant. Without these, those five
# tests skip — and a CI run that silently skips the tests guarding its own central guarantee is worse
# than one that fails, because it reports green.
RUN apk add --no-cache bash git

WORKDIR /app

# The whole repository is copied in rather than bind-mounted. Two reasons, both load-bearing:
# the run cannot be perturbed by concurrent edits on the host, and the test suite genuinely writes
# to the source tree (test/diagrams.test.mjs rewrites docs/architecture.mmd and restores it), which
# a read-only mount would break and a read-write mount would leak back to the developer.
#
# .dockerignore excludes .git, so no credential in .git/config and no repository history reaches
# the image. The commit under test is passed in as an environment variable instead.
COPY --chown=node:node . .

# CI is untrusted code execution. It does not need root, so it does not get root.
USER node

ENV LOCAL_CI_OUT=/app/artifacts/local-ci

CMD ["node", "ci/pipeline.mjs"]
