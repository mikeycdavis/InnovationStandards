/**
 * The compliance engine: catalog + policy + observed findings → a verdict.
 *
 *   observed finding + applicability + exceptions + assurance
 *       → COMPLIANT | COMPLIANT_WITH_EXCEPTIONS | NON_COMPLIANT | NOT_EVALUATED
 *         | BLOCKED_BY_INVARIANT
 *
 * Four properties of it are load-bearing:
 *
 *   1. Status is computed from rules, never from the score. There is no threshold at which a
 *      percentage grants or withdraws compliance. No standard requires this — it is an engine
 *      contract, and test/compliance.test.mjs is where it is actually enforced.
 *   2. A rule nothing evaluated is `skipped`, never `passed`. Unknown is not a pass
 *      (Standard 14 R3, which calls this the deepest property in the system: deleting a check
 *      produces NOT_EVALUATED, not compliance).
 *   3. The score's denominator is the rules that were actually evaluated, and the assurance
 *      breakdown ships beside it so the number cannot imply coverage it does not have. Also an
 *      engine contract rather than a requirement.
 *   4. An invariant-class failure produces BLOCKED_BY_INVARIANT, a verdict distinguishable from
 *      ordinary non-compliance. NON_COMPLIANT means there is work to do; BLOCKED means stop, and do
 *      not route around this. An agent optimising for a green verdict needs that difference in the
 *      data, because the cheapest path to green otherwise runs through defeating the check
 *      (Standard 14 R4, ADR 0005).
 */

import { resolve } from "./catalog.mjs";

export const STATUS = {
  COMPLIANT: "COMPLIANT",
  COMPLIANT_WITH_EXCEPTIONS: "COMPLIANT_WITH_EXCEPTIONS",
  NON_COMPLIANT: "NON_COMPLIANT",
  NOT_EVALUATED: "NOT_EVALUATED",
  BLOCKED_BY_INVARIANT: "BLOCKED_BY_INVARIANT",
};

/**
 * A rule is invariant-class when it is both `forbidden` and `nonExemptible` — the behaviour must
 * never occur, and no waiver may permit it. The class is DERIVED rather than declared: a third
 * catalog field could disagree with the two that already carry the whole meaning, and whichever way
 * the loader arbitrated that disagreement would surprise someone (ADR 0005).
 */
export const isInvariant = (rule) => rule.level === "forbidden" && rule.nonExemptible === true;

const RESULT = { passed: "passed", failed: "failed", warning: "warning", skipped: "skipped" };

/**
 * @param catalog   from loadCatalog()
 * @param policy    a validated project-policy document, or null when the project declares none
 * @param findings  evaluator findings, each optionally carrying `rule` (a canonical id)
 * @param evaluated the set of rule ids the evaluator actually examined — the crucial input.
 *                  A rule absent from this set was not checked, and reporting it as passing
 *                  because nothing failed is the false green this whole framework exists to stop.
 * @param today     ISO date, for exception expiry
 */
export function evaluate({ catalog, policy, findings, evaluated, today, digests }) {
  const declaredRules = policy?.rules ?? {};
  const applicability = policy?.applicability ?? {};
  const exceptions = Array.isArray(policy?.exceptions) ? policy.exceptions : [];
  const attestations = policy?.attestations ?? {};
  const examined = new Set(evaluated ?? []);
  const currentDigests = digests ?? new Map();

  const byRule = new Map();
  for (const finding of findings) {
    if (!finding.rule) continue;
    const rule = resolve(catalog, finding.rule);
    if (!rule) continue;
    if (!byRule.has(rule.id)) byRule.set(rule.id, []);
    byRule.get(rule.id).push(finding);
  }

  const activeExceptions = new Map();
  const expiredExceptions = [];
  const rejectedExceptions = [];
  for (const entry of exceptions) {
    const rule = resolve(catalog, entry.rule);
    if (!rule) continue;
    // A non-exemptible rule admits no exception. The waiver is REJECTED, not honoured and not
    // quietly ignored: an exception engine that can waive a rule its standard declared
    // non-exemptible has made the prohibition optional, which is not a prohibition
    // (Standard 14 R3, first protection). Order matters — this is checked before expiry, because a non-exemptible
    // waiver is invalid whether or not it has lapsed.
    if (rule.nonExemptible) {
      rejectedExceptions.push({ ...entry, rule: rule.id, invariant: isInvariant(rule) });
      continue;
    }
    if (entry.expires && entry.expires < today) expiredExceptions.push({ ...entry, rule: rule.id });
    else activeExceptions.set(rule.id, entry);
  }

  const results = [];
  for (const rule of catalog.rules.values()) {
    const declared = declaredRules[rule.id];
    const level = declared?.level ?? rule.level;
    const applies = applicability[rule.id];

    // Not applicable: the rule's subject does not exist here. Visible, never a silent exclusion.
    if (applies?.status === "not-applicable") {
      results.push(base(rule, level, RESULT.skipped, "not-applicable", applies.reason));
      continue;
    }

    // A recorded human judgement (ADR 0005). Checked BEFORE not-evaluated, because an attestation
    // is precisely what turns "nobody looked" into "somebody looked" — but AFTER the automated
    // findings are collected, because it may never override one.
    const attestation = attestations[rule.id];
    if (attestation) {
      const hits = byRule.get(rule.id) ?? [];
      const verdict = judgeAttestation(rule, attestation, hits, today, currentDigests);
      if (verdict) {
        results.push(verdict);
        continue;
      }
      // Falls through: the attestation did not establish the requirement, so the rule is evaluated
      // normally and typically lands on not-evaluated. Silently ignoring it would be worse.
    }

    // An automated finding is never discarded, whatever the rule's validation type.
    //
    // The asymmetry is the point, and it is not the same claim in both directions: a machine cannot
    // ESTABLISH a rule a human evaluates, but a machine that OBSERVES a violation of one has still
    // observed it. Dropping that finding — which the ordering below did until this branch was
    // added — makes a detected violation invisible, and invisibility is the false green everything
    // else here exists to prevent. Evidence outranks the absence of an evaluator.
    const observed = byRule.get(rule.id) ?? [];
    if (observed.length > 0 && (rule.validationType === "manual-review" || !examined.has(rule.id))) {
      const result = base(rule, level, RESULT.failed, "evaluated", observed[0].message);
      result.evidence = observed.flatMap((h) => h.evidence ?? []);
      result.files = result.evidence;
      results.push(result);
      continue;
    }

    // A manual-review rule is never established by an automated run. Without a valid attestation it
    // is not-evaluated, even if the evaluator claims to have examined it and found nothing —
    // "no automated finding" is not evidence for a requirement whose evaluator is a human. Reaching
    // `passed` that way was possible before attestations existed, and it is a false green.
    if (rule.validationType === "manual-review" || !examined.has(rule.id)) {
      results.push(
        base(rule, level, RESULT.skipped, "not-evaluated", `No implemented check evaluates ${rule.id}.`),
      );
      continue;
    }

    const hits = byRule.get(rule.id) ?? [];
    if (hits.length === 0) {
      results.push(base(rule, level, RESULT.passed, "evaluated", `No violation of ${rule.id} was observed.`));
      continue;
    }

    const exception = activeExceptions.get(rule.id);
    // An invariant-class rule fails regardless of the level a policy selected for it. A policy may
    // choose a rule's level, but selecting `optional` for a forbidden, non-exemptible rule is not a
    // selection — it is the policy redefining the rule, which the architecture forbids, and it would
    // otherwise convert a blocking violation into a warning. The downgrade is separately reported by
    // innovation.integrity-invariant; this is the engine declining to honour it (Standard 14 R3,
    // fourth protection: a policy may select which rules apply, never redefine how strongly one binds).
    const outcome =
      isInvariant(rule) || level === "required" || level === "forbidden"
        ? RESULT.failed
        : RESULT.warning;
    const result = base(rule, level, outcome, exception ? "excepted" : "evaluated", hits[0].message);
    result.evidence = hits.flatMap((h) => h.evidence ?? []);
    result.files = result.evidence;
    if (exception) {
      result.exception = {
        reason: exception.reason,
        approvedBy: exception.approvedBy,
        approvedAt: exception.approvedAt,
        expires: exception.expires ?? null,
        reference: exception.reference ?? null,
      };
    }
    results.push(result);
  }

  for (const entry of rejectedExceptions) {
    results.push({
      ruleId: entry.rule,
      status: RESULT.failed,
      severity: "error",
      level: "required",
      validationType: "configuration",
      assurance: "full",
      disposition: "rejected-exception",
      // Filing a waiver against an invariant-class rule is itself an attempt to make a prohibition
      // optional, so the rejection inherits the blocking property rather than reporting as ordinary
      // non-compliance.
      invariant: entry.invariant === true,
      message: `${entry.rule} is non-exemptible; the exception against it is rejected, not applied.`,
      evidence: ["project-policy.yml"],
      files: ["project-policy.yml"],
      remediation:
        "Remove the exception and satisfy the rule. If the rule genuinely has no subject in this project, declare it not-applicable instead.",
    });
  }

  for (const entry of expiredExceptions) {
    results.push({
      ruleId: entry.rule,
      status: RESULT.failed,
      severity: "error",
      level: "required",
      validationType: "configuration",
      assurance: "full",
      disposition: "expired-exception",
      message: `The exception for ${entry.rule} expired on ${entry.expires}.`,
      evidence: ["project-policy.yml"],
      files: ["project-policy.yml"],
      remediation: "Renew the exception with a new approval, or satisfy the rule.",
    });
  }

  return summarise(results, policy);
}

/**
 * Decide what an attestation establishes. Returns a result, or null to fall through to normal
 * evaluation — never a silent success.
 *
 * The rules are ADR 0005's, and the ordering is the interesting part: contradiction is checked
 * first, because a human saying a rule is satisfied does not change what a check observed. Evidence
 * outranks assertion (Standard 14 R3: an attestation never overrides an automated finding), and that is also why an attestation cannot bypass a
 * nonExemptible rule — not as a separate prohibition, but because the automated failure survives.
 */
function judgeAttestation(rule, attestation, hits, today, digests) {
  const fail = (disposition, message, remediation) => ({
    ruleId: rule.id,
    status: RESULT.failed,
    severity: "error",
    level: "required",
    // An attestation asserting an invariant-class rule is satisfied, while a check observed
    // otherwise, is an attempt to overrule the strongest mechanism in the system by assertion. It
    // blocks for the same reason the underlying finding would have.
    invariant: isInvariant(rule),
    validationType: "configuration",
    assurance: "full",
    disposition,
    message,
    evidence: ["project-policy.yml"],
    files: ["project-policy.yml"],
    remediation,
  });

  if (!rule.attestable) {
    return fail(
      "invalid-attestation",
      `${rule.id} is not attestable; the catalog says it is evaluated by ${rule.validationType}, not by human review.`,
      "Remove the attestation. A rule the catalog does not mark attestable cannot be satisfied by assertion.",
    );
  }

  if (hits.length > 0) {
    return fail(
      "contradicted-attestation",
      `${rule.id} is attested as approved, but an automated check found: ${hits[0].message}`,
      "Fix the finding. An attestation records human evidence; it never overrides what a check observed.",
    );
  }

  if (attestation.status === "rejected") {
    return fail(
      "attested-rejected",
      `${rule.id} was reviewed by ${attestation.reviewedBy} and found unmet.`,
      "Satisfy the rule, then re-attest. A recorded rejection is a failure, not silence.",
    );
  }

  if (attestation.expires && attestation.expires < today) {
    return null; // Expired: back to not-evaluated. It is not a failure, it is unreviewed again.
  }

  const against = attestation.reviewedAgainst;
  if (against?.digest) {
    const current = digests.get(rule.id);
    if (current && current !== against.digest) {
      return null; // Stale: what was reviewed is not what is there now.
    }
  }

  return {
    ruleId: rule.id,
    status: RESULT.passed,
    severity: rule.severity,
    level: "required",
    validationType: "manual-review",
    // Human judgement establishes the requirement, and does so without a machine. `manualReview` in
    // the assurance breakdown is the honest home for it — never `automated`.
    assurance: "full",
    disposition: "attested",
    message: `Attested by ${attestation.reviewedBy} on ${attestation.reviewedAt}: ${attestation.evidence}`,
    evidence: against?.paths ?? [],
    files: against?.paths ?? [],
    remediation: rule.remediation,
    attestation: {
      reviewedBy: attestation.reviewedBy,
      reviewedAt: attestation.reviewedAt,
      evidence: attestation.evidence,
      reference: attestation.reference ?? null,
      expires: attestation.expires ?? null,
    },
  };
}

function base(rule, level, status, disposition, message) {
  return {
    ruleId: rule.id,
    status,
    severity: rule.severity,
    level,
    // Invariant-class is read from the CATALOG's level, never from the policy's. A project that
    // declares an invariant rule `optional` has not made it optional — it has recorded a policy
    // downgrade, which innovation.integrity-invariant reports as a finding in its own right.
    invariant: isInvariant(rule),
    validationType: rule.validationType,
    assurance: status === RESULT.skipped ? "none" : rule.assurance,
    disposition,
    message,
    evidence: [],
    files: [],
    remediation: rule.remediation,
  };
}

function summarise(results, policy) {
  const counts = { passed: 0, failed: 0, warnings: 0, skipped: 0 };
  for (const r of results) {
    if (r.status === RESULT.passed) counts.passed++;
    else if (r.status === RESULT.failed) counts.failed++;
    else if (r.status === RESULT.warning) counts.warnings++;
    else counts.skipped++;
  }

  // Assurance accounts for every applicable rule, and the three MUST sum. An engine contract, not a
  // requirement: a breakdown that does not add up lets coverage go missing without anything saying so.
  const assurance = { automated: 0, manualReview: 0, notEvaluated: 0 };
  for (const r of results) {
    if (r.disposition === "not-applicable") continue;
    if (r.status === RESULT.skipped) assurance.notEvaluated++;
    else if (r.validationType === "manual-review") assurance.manualReview++;
    else assurance.automated++;
  }

  const applicable = results.filter((r) => r.disposition !== "not-applicable");
  const scored = applicable.filter((r) => r.status !== RESULT.skipped && r.level === "required");
  const scoredPassed = scored.filter((r) => r.status === RESULT.passed).length;
  const score = scored.length === 0 ? null : Math.round((scoredPassed / scored.length) * 100);

  const requiredFailures = results.filter(
    (r) => r.status === RESULT.failed && !(r.disposition === "excepted"),
  );
  const excepted = results.filter((r) => r.disposition === "excepted");

  // Invariant-class failures. This set is a SUBSET of requiredFailures by construction — an
  // invariant rule that failed is a failed rule — so the status below strictly strengthens: it can
  // only replace what would otherwise have been NON_COMPLIANT, never a passing verdict. That
  // property is what makes the addition safe, and it is asserted directly in the tests.
  const invariantFailures = requiredFailures.filter((r) => r.invariant === true);

  let status;
  if (!policy) status = STATUS.NOT_EVALUATED;
  else if (invariantFailures.length > 0) status = STATUS.BLOCKED_BY_INVARIANT;
  else if (requiredFailures.length > 0) status = STATUS.NON_COMPLIANT;
  else if (excepted.length > 0) status = STATUS.COMPLIANT_WITH_EXCEPTIONS;
  else status = STATUS.COMPLIANT;

  return {
    status,
    score,
    summary: counts,
    assurance,
    denominator: {
      total: results.length,
      applicable: applicable.length,
      scored: scored.length,
      basis: "required-level rules that were evaluated",
    },
    // Named separately from `results` so a consumer can act on the stop condition without
    // re-deriving it, and so the human renderer can lead with it rather than burying it in a list.
    blocking: invariantFailures.map((r) => r.ruleId),
    results,
  };
}

/** The machine-readable output envelope. `schemaVersion` versions this format, independent of the others. */
export function envelope({ verdict, project, standardVersion, auditedAt, repo, frameworkCoverage }) {
  return {
    schemaVersion: "1.0",
    standardVersion: standardVersion ?? null,
    project: project ?? repo ?? null,
    status: verdict.status,
    score: verdict.score,
    summary: verdict.summary,
    assurance: verdict.assurance,
    denominator: verdict.denominator,
    // The rule ids that produced BLOCKED_BY_INVARIANT, empty otherwise. An agent reads this to know
    // it must stop rather than remediate.
    blocking: verdict.blocking ?? [],
    // Framework maturity, sitting outside the verdict on purpose. It says how much of the framework
    // has been turned into rules — never how compliant this project is.
    frameworkCoverage: frameworkCoverage ?? null,
    auditedAt,
    results: verdict.results,
  };
}
