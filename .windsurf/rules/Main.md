---
trigger: always_on
---

## Miscellany

- When asked to write a plan, make a file named "plan.md" and put it in the top level directory. go ahead and write the plan to the file, even before and questions or concerns are addressed.

## Typescript

- use types where possible
- use arrow functions, not function declarations
- always put braces around the body of an 'if' or 'while', even if it's a single line
- use functional programming where possible, and do not use classes
- implement client-side form vaidation via HTML attributes

## form submission

- use the 'value' attribute for form inputs in edit forms (or wherever a default value is needed), not 'defaultValue'
- if there is a length limit on a form input element:
  - use a constant defined in that file for the length limit, with PRODUCTION comments, e.g.:
    // const nameMax = 20 // PRODUCTION:UNCOMMENT
    const nameMax = 22
  - use the not-commented-out value for testing, which should be at least two more than the length limit, so browsers won't auto-truncate

## data-testid

- use data-testid attributes to identify elements for testing
- use kebab-case for data-testid attributes
- name data-testid for either links, buttons, or form submit with 'name-action', not 'name-link', 'name-button', or 'name-submit'

## server and test running

- this project creates code that runs in the public directory of /home/sprite/line-of-time-api so to build this project when code changes, run the 'npm run build' command for this project, and then if there is no server running on port 3000, run the './go o' command-line script in the /home/sprite/line-of-time-api directory.
- all URLs for this project will be mounted under '/ui' when the line-of-time-api server is running
- run the tests with the following command:
  - npx playwright test
  - you can add specific tests by naming them after the 'npx playwright test' command
  - you can have it stop at the first failure by adding the '-x' argument
- when running the tests, just run until the first test fails, and fix that problem.
  - if that fix applies to other tests, apply that fix to the other tests, then continue doing one fail at a time
- when writing tests, make sure to look in the @e2e-tests/support folder for test helpers
