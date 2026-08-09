Implement an **Innovation Standards** pack in the existing standards framework.

Do not redesign the standards system. First inspect the repository and understand its existing architecture, schemas, applicability model, evidence model, lifecycle/revisitWhen behavior, CLI behavior, tests, documentation conventions, and existing standards. Extend those mechanisms rather than creating a parallel system.

The purpose of this pack is to establish rigorous standards for proposing:

* new features for existing projects
* major enhancements
* architectural/product changes
* new products
* entirely new projects

The standards should make AI-assisted innovation disciplined rather than encouraging endless feature generation.

## Core principle

Innovation is not automatically valuable.

A new idea must justify why it should exist, what problem it solves, why the problem matters, why the proposed solution is appropriate, what it costs, and how success would be measured.

The system must explicitly support the conclusion:

> Do not build this.

## Required areas

Create standards covering at least:

* problem-before-solution
* user/customer value
* evidence that the problem exists
* existing capability analysis
* alternative solutions
* build-vs-buy-vs-integrate analysis
* differentiation
* strategic alignment
* expected impact
* implementation complexity
* maintenance burden
* operational burden
* security/privacy implications
* opportunity cost
* technical debt
* scope control
* MVP definition
* measurable success criteria
* assumptions
* uncertainty
* kill criteria
* experiment-before-build where appropriate
* portfolio overlap
* cannibalization/duplication
* new-project justification
* feature prioritization
* revisit conditions

## Must-never rules

Innovation standards must explicitly prohibit practices such as:

* never invent features solely because they are technically interesting
* never treat novelty as evidence of value
* never create a new project when the capability belongs naturally inside an existing project without documenting why separation is justified
* never recommend building something without identifying the problem it solves
* never claim user demand without evidence
* never fabricate market validation
* never fabricate customer feedback
* never fabricate metrics
* never hide major implementation or maintenance costs
* never ignore an existing capability that already solves the problem
* never treat brainstorming as a committed roadmap
* never allow scope creep to silently change the release objective
* never continue investing solely because substantial effort has already been spent
* never present assumptions as facts
* never call an idea validated merely because an AI considers it good
* never prioritize everything
* never allow an idea to bypass security, privacy, engineering, financial, legal, or other applicable standards merely because it is innovative

Add additional prohibitions discovered during implementation.

## Decision model

Where appropriate, ideas should be classifiable as:

* explore
* validate
* prototype
* build
* defer
* reject
* merge with existing capability
* insufficient evidence

The system must not force every idea toward implementation.

## New-project bar

Create a particularly strong standard around creating entirely new projects.

New projects should face a higher justification threshold than adding functionality to an existing project.

Require consideration of:

* whether an existing project can own the capability
* duplicated infrastructure
* duplicated domain logic
* maintenance cost
* deployment cost
* support burden
* fragmented user experience
* portfolio complexity

## Evidence

Standards should identify what evidence is required and distinguish:

* observation
* assumption
* hypothesis
* user evidence
* market evidence
* technical evidence
* experiment result
* validated conclusion

Do not allow evidence levels to be silently upgraded.

## Deliverables

Implement:

1. innovation standards
2. must-never innovation rules
3. applicability logic
4. evidence requirements
5. verification mechanisms where feasible
6. tests
7. documentation
8. examples of compliant and non-compliant innovation decisions

Run the repository's complete validation/test suite.

Do not weaken existing standards or tests to make the implementation pass.

At completion, report:

* standards added
* prohibitions added
* what is automatically enforceable
* what requires human/AI review
* applicability behavior
* tests added
* validation results
* unresolved limitations
