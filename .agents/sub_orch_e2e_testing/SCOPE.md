# Scope: E2E Testing Track

## Architecture
Opaque-box, requirement-driven E2E tests for Phase 4. Independent of implementation details.
Uses the Next.js server actions and database APIs to run assertions.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Infra Setup | Design and setup test harness and runner | None | IN_PROGRESS |
| 2 | Tier 1 Tests | Feature coverage: Case creation, document upload, list, delete | M1 | PLANNED |
| 3 | Tier 2 Tests | Boundary and corner cases: Empty files, large files, invalid types | M2 | PLANNED |
| 4 | Tier 3 Tests | Cross-feature combination tests: Upload -> List -> Delete | M3 | PLANNED |
| 5 | Tier 4 Tests | Real-world application scenarios: Uploading multiple documents for a case | M4 | PLANNED |
| 6 | Publish TEST_READY | Produce final TEST_READY.md and report to parent | M5 | PLANNED |

## Interface Contracts
- Tests must invoke the final deployed codebase and APIs.
- Output: `TEST_READY.md` containing test summary, invocation details, and results.
