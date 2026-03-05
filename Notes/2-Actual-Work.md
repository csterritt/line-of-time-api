The analysis looks good, but the problem with the end-to-end tests is that they are flaky.
Sometimes they run fine, and sometimes they fail. The ones named in Notes/Failed-Tests.md
are some that have been found to fail.

Also, the tests under line-of-time-fe/e2e-tests are out of date; they were written for an
older version of the app and need to be rewritten most likely, as they don't match the
current state of the app. The application behavior is correct, the tests should mirror this
behavior. Don't rewrite the code to match the tests.
