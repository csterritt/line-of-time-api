# Timestamp Conversion Functions Plan

## Assumptions

- `fromTimestamp` returns the full date string; it has a "precision" parameter to control the output level (year only, month+year, full date)
- Timestamps are integers representing days since the birth of Christ (day 0 = Jan 1, 1 AD)
- Negative timestamps = BC, positive = AD
- Proleptic Gregorian calendar used for simplicity (no Julian calendar switch)
- BC/AD vs BCE/CE formatting is a separate concern (user preference applied at display time)

---

## What is a Timestamp?

A **timestamp** is an integer representing the number of days since January 1, 1 AD:

- `0` = January 1, 1 AD
- `1` = January 2, 1 AD
- `-1` = December 31, 1 BC
- `-365` = approximately January 1, 1 BC

---

## Step 1: Define the Core Interface

Create `src/lib/timestamp.ts`:

```ts
type DatePrecision = 'year' | 'month' | 'day'

interface DateComponents {
  year: number      // Negative for BC, positive for AD
  month: number     // 1-12
  day: number       // 1-31
}

interface FromTimestampOptions {
  precision: DatePrecision
  style: 'BC/AD' | 'BCE/CE'
}

const fromTimestamp = (timestamp: number, options: FromTimestampOptions): string => { ... }
const toTimestamp = (dateString: string): number => { ... }
```

---

## Step 2: Implement `toTimestamp`

Convert a date to days since epoch (Jan 1, 1 AD = day 0).

**Algorithm:**

1. Calculate total days from year 1 AD to the target year
2. Account for leap years (Gregorian: divisible by 4, except centuries unless divisible by 400)
3. Add days for months elapsed in the target year
4. Add the day of month
5. For BC years: negate and adjust (no year 0 in historical calendar)

---

## Step 3: Implement `fromTimestamp`

Convert days since epoch to a formatted date string.

**Parameters:**

- `timestamp: number` — days since Jan 1, 1 AD
- `options.precision: 'year' | 'month' | 'day'` — output detail level
- `options.style: 'BC/AD' | 'BCE/CE'` — era suffix style

**Output by precision:**

- `'year'` → "40,000 BC", "2025 AD"
- `'month'` → "January 306 BC", "June 2025 AD"
- `'day'` → "January 1, 306 BC", "June 19, 2025 AD"

**Algorithm:**

1. Handle sign (negative = BC)
2. Estimate year from days (days / 365.2425)
3. Refine by calculating exact days to that year
4. Subtract year days to get remaining days
5. Walk through months to find month and day
6. Format output based on precision parameter

---

## Step 4: Implement `toTimestamp`

Parse a date string back to a timestamp.

**Accepted formats:**

- "40,000 BC" or "40,000 BCE" → year only
- "January 306 BC" → month + year (assumes day 1)
- "January 1, 306 BC" → full date
- "June 19, 2025 AD" or "June 19, 2025 CE"

**Algorithm:**

1. Parse era suffix (BC/AD/BCE/CE) to determine sign
2. Extract year (handle comma-formatted numbers like "40,000")
3. Extract month name if present, convert to number
4. Extract day if present, default to 1
5. Calculate timestamp using year/month/day conversion

---

## Step 5: Write Tests

Create `tests/timestamp.spec.ts`:

- Known dates: Jan 1, 1 AD = 0, Dec 31, 1 BC = -1
- Round-trip: `toTimestamp(fromTimestamp(ts, {precision: 'day', style: 'BC/AD'}))` === ts
- Edge cases: leap years, century boundaries, BC/AD transition
- Large values: 40,000 BC, 14 billion years ago (if needed)

---

## Pitfalls

- **No year zero** — Historical calendars skip from 1 BC to 1 AD; must handle this offset
- **Leap year edge cases** — Feb 29 only valid in leap years; validation needed in `toTimestamp`
- **Proleptic Gregorian assumption** — Real history used Julian calendar before 1582; may cause slight inaccuracies for ancient dates
- **Large number precision** — 14 billion years = ~5 trillion days; fits in JS number but test for precision loss
- **Month/day validation** — `toTimestamp` should reject invalid dates like Feb 30
