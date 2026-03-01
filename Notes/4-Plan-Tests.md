Plan tests, and modifications to existing tests as needed. Use Red/Green TDD for coding.
Note that the tests in the e2e-tests/ directory are end-to-end tests that test the entire application,
and are run with playwright. The tests in the tests/ directory are unit tests, and are run
with "bun test". Similarly, the tests in the line-of-time-fe/src/tests/ directory are unit tests,
and are run with "bun test", and the tests in the line-of-time-fe/e2e/ directory are end-to-end tests,
and are run with playwright.
