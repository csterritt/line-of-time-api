# Julian Day Timestamp Migration Plan

## Overview
Change timestamp format from proprietary integer (days since Jan 1, 1 AD) to Julian Day Numbers (JDN). The `julian` package is installed; implementation uses the proleptic Gregorian calendar JDN algorithm directly to avoid TypeScript import issues.

## JDN Algorithm
- `ymdToJDN(year, month, day)` → JDN (Gregorian formula)
- `jdnToYMD(jdn)` → { year, month, day }
- Astronomical year numbering: 0 = 1 BC, -1 = 2 BC, etc.
- Min allowed JDN = 38 (Jan 1, 4713 BC, proleptic Gregorian)

## Known JDN Values (seeded test events)
| Date | Old timestamp | JDN |
|------|--------------|-----|
| Feb 22, 1732 (Washington birth) | 632234 | 2353712 |
| Dec 14, 1799 (Washington death) | 657053 | 2378479 |
| Jul 4, 1776 (Declaration) | 648490 | 2369916 |
| Sep 1, 1939 (WWII start) | 708082 | 2429508 |
| Sep 2, 1945 (WWII end) | 710275 | 2431701 |
| Jul 20, 1969 (Moon Landing) | 718997 | 2440423 |
| Jan 1, 2000 AD | — | 2451545 |

## Files to Change
1. `src/lib/timestamp.ts` — rewrite with JDN; add `validateEventDates()`
2. `tests/timestamp.test.ts` — rewrite for JDN values (Red/Green TDD)
3. `tests/event-validator.test.ts` — update hardcoded timestamp 738534 → 2451545
4. `line-of-time-fe/src/utils/timestamp.ts` — rewrite with JDN
5. `src/routes/test/database.ts` — update seeded event timestamps
6. `e2e-tests/time-info/01-get-events.spec.ts` — update URL ranges + expected value
7. `e2e-tests/time-info/03-create-event.spec.ts` — update validEvent timestamps
8. `e2e-tests/time-info/04-update-event.spec.ts` — update updatedEvent timestamps

## No DB Schema Changes
`startTimestamp` and `endTimestamp` remain `integer` columns — JDNs are integers. ✓

## Validation Rules (validateEventDates)
- Only startYear required; startMonth/startDay optional
- If no startMonth → startDay forbidden; defaults: month=1, day=1
- If no endYear → endMonth/endDay forbidden
- If endYear given but no endMonth → endDay forbidden; defaults: month=12, day=31
- If endYear+endMonth given but no endDay → default: last day of month
- end >= start (year, then month, then day)
- Min date: Jan 1, 4713 BC (JDN ≥ 38)
