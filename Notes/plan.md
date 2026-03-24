# Timestamp Format Update Plan

## Task
Change all timestamps in test files from the format "YYYY-MM-DD" to "YYYY-MM-DD-AD" (adding the literal "-AD" suffix).

## Scope
Test files with date strings to update:
- `e2e-tests/general/04-new-event.spec.ts` - 8 date strings
- `e2e-tests/time-info/08-initial-search-categorization.spec.ts` - 4 date strings  
- `e2e-tests/admin/03-edit-event-bc.spec.ts` - 2 date strings

## Implementation
1. Update all date strings in test files to append "-AD"
2. Run tests to verify
3. Notify user when complete

## Assumptions
- This is a simple string replacement in test data
- No database schema changes required
- No backend API changes required
- Tests should continue to pass with the new format
