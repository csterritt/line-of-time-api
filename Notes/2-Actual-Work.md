In the last refactoring, src/lib/db-access.ts had several functions added that are purely for testing.
As these should not be used in production, please move them the e2e-tests/support/db-access.ts file.
