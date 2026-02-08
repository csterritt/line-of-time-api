# Plan: Create show-dates.ts script

## Assumptions

- Script runs with bun runtime
- Arguments are passed as command-line parameters
- Invalid arguments should show helpful error messages

## Files to Create / Modify

| File                    | Action                                        |
| ----------------------- | --------------------------------------------- |
| `scripts/show-dates.ts` | **Create** — date/timestamp conversion script |

## Implementation Steps

### Step 1: Create `show-dates.ts`

- Import `dateComponentsToTimestamp` and `timestampToDateComponents` from `../src/lib/timestamp.ts`
- Parse command-line arguments to determine mode:
  - First argument: `date` or `ts`
  - For `date` mode: expect 3 additional arguments (month, day, year)
  - For `ts` mode: expect 1 additional argument (timestamp)
- For `date` mode:
  - Parse month, day, year as numbers
  - Call `dateComponentsToTimestamp({ year, month, day })`
  - Call `timestampToDateComponents(timestamp)`
  - Print: timestamp, month, day, year
- For `ts` mode:
  - Parse timestamp as number
  - Call `timestampToDateComponents(timestamp)`
  - Print: month, day, year
- Add error handling for invalid arguments

### Step 2: Test the script

- Run with `bun run scripts/show-dates.ts date 12 22 1984`
- Run with `bun run scripts/show-dates.ts ts 123456789`
- Verify output is correct

## Pitfalls

1. **Argument parsing** - Need to validate that the correct number of arguments are provided for each mode
2. **Type conversion** - Command-line arguments are strings, must parse to numbers
3. **Error messages** - Provide clear usage instructions when arguments are invalid
