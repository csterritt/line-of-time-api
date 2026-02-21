# Plan: Refactor get-wikipedia-event.ts

## Goal
Change the script to accept two args: a directory path and a name. Write the result to a file in that directory, named with hyphens instead of spaces.

## Steps
1. Update `scripts/get-wikipedia-event.ts`:
   - Validate that exactly 2+ args are provided (arg[0] = dir, arg[1..] = name words)
   - Build filename from name words joined with hyphens (e.g. "George Washington" → "George-Washington")
   - Write JSON output to `<dir>/<hyphenated-name>.json`
   - Print confirmation to console

## No schema changes needed.
