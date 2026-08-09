# Standard 6 — Security, Privacy, and Standards Non-Bypass

What a proposal must say about the data it touches and the exposure it creates, and the rule that
being innovative exempts an idea from nothing.

Source: item 6 of [`artifacts/prompts/innovation-standards-spec.md`](../artifacts/prompts/innovation-standards-spec.md).

## Scope

Applies to every innovation proposal, at every outcome, including those whose outcome is `explore`,
`validate`, or `prototype`. The scope note is the standard's whole point: the exemption this standard
forbids is almost always claimed at exactly those outcomes, on the grounds that nothing real has been
built yet. Something real has usually been touched.

## Requirements

### R1 — State what data is touched and what exposure is created

A proposal MUST record its security and privacy implications in the `## Security and privacy` section,
and the `Implications` field MUST answer three questions concretely.

**What data would it touch.** Named categories, not a reassurance. "Customer records including email
address, billing address, and order history" is an answer; "some user data" is a placeholder that
survives review because it is too vague to argue with. Where the answer is genuinely none, that is
recorded as none, because "no data" and "not considered" are written identically when the field is
left to prose.

**What new exposure would it create.** Exposure is created by movement and by surface: data leaving a
system that held it, a new endpoint, a new credential, a new third party, a new copy that now has to
be deleted when the original is. The question is not whether the design is careful — most are — but
what becomes reachable that was not reachable before.

**Who else is affected.** Security and privacy costs, like the maintenance and operational costs in
[Standard 5](05-cost-accounting.md), are largely paid by parties who are not in the room: the subjects
of the data, the team that will carry the incident, the reviewer who inherits the surface. The
proposal is where they get represented or they do not get represented at all.

### R2 — Name the standards and obligations that apply

A proposal MUST record, in the `Applicable standards` field, which existing standards, policies, and
legal or contractual obligations bear on the work. Naming them is the requirement; satisfying them is
the job of those standards, not this one.

The naming is what makes the later conversation possible. An obligation that is never written down is
not thereby absent — it is merely undiscovered until the point at which discovering it is expensive.
The set to consider includes at minimum the security and privacy standards of the organisation, its
engineering standards, any financial and procurement rules the work would engage, and any regulatory
or contractual regime covering the data involved. Where the honest answer for a category is that none
applies, that is recorded with the reason, on the same principle
[Standard 3](03-existing-capability-and-alternatives.md) applies to a non-viable alternative: an
absence with a reason is information, and an empty field is not.

### R3 — Novelty confers no exemption

**Reproduced verbatim from the source:**

- never allow an idea to bypass security, privacy, engineering, financial, legal, or other applicable standards merely because it is innovative

`innovation.standards-non-bypass` is invariant-class — `level: forbidden`, `nonExemptible: true` —
and its failure produces `BLOCKED_BY_INVARIANT`
([ADR 0005](../artifacts/adr/0005-invariant-class-and-blocked-verdict.md)). An idea does not become
exempt from security, privacy, engineering, financial, legal, or any other applicable standard by
virtue of being innovative, experimental, a prototype, or a pilot. Those four words describe the
maturity of an idea. Applicability is determined by what the work touches, and the two have no
relationship whatever.

The claim this prohibition refuses is a real and recurring one, and it is usually made in good faith.
It runs: this is not the real thing yet, the real thing will go through review, so applying review now
would slow down learning for no benefit. Every clause is plausible. What it omits is that the data is
real now, the credential is real now, and the exposure exists from the moment the connection is opened
rather than from the moment someone decides the project has become serious.

The prohibition also has a second, quieter surface. Bypass is more often achieved by reclassification
than by defiance — the work is described as a spike so that it falls outside the review path, or the
review is scoped to the eventual production system so that the current system is nobody's subject.
That is the same failure wearing better clothes, and it is the case
[Standard 14](14-standards-integrity.md) generalises: a determination of applicability must never be
adjusted because it obstructs the desired conclusion.

### R4 — "It's just a prototype" is the specific failure this standard names

The phrase deserves naming because it is the mechanism, not merely an example of one. "It's just a
prototype" is the sentence that carries production data into an unreviewed system, and it works
because it is *true* about the code and *false* about everything the code touches.

The failure has a predictable shape. A prototype needs realistic data to be informative, so it is
given a copy of the production dataset. It needs to reach a real service, so it is given a real
credential, usually one broader than it needs because scoping a narrow one takes a day. It runs
somewhere convenient rather than somewhere governed, because provisioning governed infrastructure is
the slow part the prototype exists to skip. None of this is a decision anyone announced; each step is
locally reasonable. At the end there is a system holding real customer data, authenticating with a
live credential, running outside the estate, with no owner, no logging, and no entry on any register —
and its defence is that it does not count yet.

A proposal SHOULD therefore state, for any outcome at `prototype` or below, what data the prototype
will use and what it will be permitted to reach. Synthetic or anonymised data, a scoped credential,
and a defined teardown are the ordinary answers, and they are cheap when decided in advance and
extremely expensive when reconstructed afterwards. Where a prototype genuinely requires production
data, that is a legitimate position and it is recorded as one, with the controls that apply to
production data applying to it — which is precisely what R3 says.

The related trap, that the prototype then quietly becomes the production build, is owned by
[Standard 9](09-experiment-before-build.md).

## Additions this standard makes beyond the source

- R1's decomposition of "security and privacy implications" into data touched, exposure created, and
  affected parties, and the argument that "no data" and "not considered" are indistinguishable in
  free prose.
- R2's requirement that a category with no applicable obligation is recorded with its reason rather
  than left blank, carried over from Standard 3's treatment of non-viable alternatives.
- R3's identification of reclassification — rescoping the work so it falls outside a review path — as
  the more common form of bypass than open refusal.
- R4 in full: the mechanism by which "it's just a prototype" produces an ungoverned system holding
  real data, and the recommendation to state a prototype's data and reach in advance.

## Relationship to other standards

[Standard 5](05-cost-accounting.md) shares this standard's structural observation, that the costs
which go unrecorded are the ones borne by absent parties.
[Standard 9](09-experiment-before-build.md) owns the adjacent prohibition that a prototype must not
silently become the production build; this standard owns the prohibition that it must not escape
review while it is still a prototype. [Standard 7](07-scope-and-mvp-discipline.md) is the mechanism by
which an unreviewed prototype acquires production responsibilities without anyone deciding that it
should. [Standard 14](14-standards-integrity.md) generalises R3 beyond the innovation domain: the
integrity invariant forbids weakening, reclassifying, or reinterpreting any standard, test, or
applicability determination because it obstructs a desired conclusion, and R3 is that invariant's
innovation-facing case.

## Implementation

`innovation.security-privacy-review` (required, `document`, `partial` assurance) checks that the
`## Security and privacy` section exists and that its `Implications` and `Applicable standards` fields
are present and non-empty.

`innovation.standards-non-bypass` (forbidden, non-exemptible, `manual-review`, assurance `none`) is
invariant-class. **No automated check evaluates it.** It reports `not-evaluated` unless a human
attestation records that someone examined the proposal against the standards it named, what they
examined, and what they found. An unattested clean run means nobody looked. Where an attestation
records a violation the verdict is `BLOCKED_BY_INVARIANT`, and a waiver filed against it is rejected
rather than honoured — which is the only consistent behaviour available, since a prohibition a project
can switch off is not a prohibition.

The mechanical check establishes presence of a section and non-empty named fields, and nothing
further. **It cannot establish that the stated implications are complete, that the data inventory is
accurate, that the obligations named are the ones that actually apply, or that a standard omitted from
the list was omitted honestly.** A proposal writing "Implications: minimal. Applicable standards: the
usual ones." satisfies every mechanical rule here. That gap is human review, and it is published in
the limitations table in [`INSTRUCTIONS.md`](../INSTRUCTIONS.md).
