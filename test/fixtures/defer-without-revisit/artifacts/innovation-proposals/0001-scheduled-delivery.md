# Proposal 0001 — Scheduled report delivery

- **Proposal type:** feature
- **Status:** IN_REVIEW
- **Target:** ReportingService

## Problem

- **Statement:** Analysts cannot get report results out of the reporting tool, so they retype figures into spreadsheets by hand before they can combine them with anything else.
- **Who is affected:** The twelve analysts in the finance team who produce the monthly close pack.
- **Why it matters now:** The close pack grew from four reports to eleven this quarter, so the retyping that used to take an afternoon now takes two days and has produced two transcription errors that reached a board paper.

## Evidence

- **E1 [observation]** Eleven reports in the close pack, none with an export control (source: stated by owner)
- **E2 [user-evidence]** Nine of twelve analysts named manual retyping as their largest time cost in the quarterly tooling survey (source: stated by owner)
- **E3 [technical-evidence]** The reporting layer already materialises each result as a tabular structure before rendering, so serialising it adds no new query path (source: stated by owner)
- **E4 [assumption]** CSV is sufficient and no analyst needs a richer format such as XLSX
- **E5 [validated-conclusion]** Export is both needed and cheap to add (from: E2, E3)

## Assumptions and uncertainty

- **Assumption:** Analysts will accept CSV rather than requesting formatted spreadsheets once they have it.
- **Unknown:** Whether the largest report exceeds a size where synchronous generation becomes a problem.

## Existing capability

- **Searched:** ReportingService, the shared ExportLibrary used by the billing product, and the admin console's download feature.
- **Finding:** ExportLibrary produces CSV from a tabular structure and is already a dependency of ReportingService, but nothing wires it to the report results. The admin console's download feature is hard-coded to audit logs and is not general.

## Alternatives

- **Do nothing:** Retyping continues and grows with the pack. The two transcription errors already reaching a board paper is the cost of this option, and it is not falling.
- **Build:** Wire the existing ExportLibrary to report results and add a download control. Chosen.
- **Buy:** Not viable — no vendor sells an export button for one internal service, and the capability is a few days of work against a library already present.
- **Integrate:** Considered and folded into Build: the integration is with ExportLibrary, which is already a dependency rather than something new to adopt.

## Value and alignment

- **User value:** An analyst clicks download and opens the figures in a spreadsheet, instead of retyping them.
- **Expected impact:** The two days of retyping per close disappears; the transcription error class disappears with it.
- **Differentiation:** None claimed. This is table stakes the product currently lacks, not a distinguishing capability.
- **Strategic alignment:** Serves the stated objective of reducing manual handling in the close process.

## Costs

- **Implementation:** Small — the serialisation path exists and the work is wiring plus a download control.
- **Maintenance:** Low, but not zero: a second consumer of the result structure means changes to it now break two things.
- **Operational:** Generation is synchronous and will hold a request open for large reports; this needs a size limit before release.
- **Opportunity cost:** Delays the scheduled-delivery work by roughly a week.
- **Technical debt:** Synchronous generation is the wrong shape if report sizes grow, and would need moving to a job.

## Security and privacy

- **Implications:** Export moves report data — which includes customer revenue figures — out of the access-controlled tool and onto analysts' machines, where it is no longer governed.
- **Applicable standards:** The data classification policy applies to exported files, and the existing authorisation check must gate export exactly as it gates viewing.

## Scope and MVP

- **Release objective:** An analyst can export any report they can already view, as CSV.
- **MVP:** A download control on the report view producing CSV of the visible result, gated by the existing authorisation check.
- **Out of scope:** Scheduled delivery, XLSX, PDF, emailing exports, and exporting anything the user cannot already view.

## Success criteria

- **Criterion:** Retyping time for the close pack falls from two days to under one hour, measured by the finance team in the first close after release.

## Kill criteria

- **Criterion:** If export cannot be gated by the existing authorisation check without changes to the authorisation model, the work stops and returns to design. Observed by the reviewing engineer at implementation; triggered by any need to modify authorisation.

## Portfolio

- **Overlap:** The billing product has its own export, built on the same ExportLibrary. No duplication of the library; the download control is duplicated and could later be shared.
- **Cannibalization:** None. Nothing today serves this need.
- **Priority:** Above scheduled delivery, because export is a prerequisite for it and delivers value alone.

## Decision

- **Outcome:** defer
- **Rationale:** The problem is evidenced by a survey and by two errors that reached a board paper, the capability already exists in a library the service depends on, and the cost is small and bounded.
- **Decided:** 2026-08-09
