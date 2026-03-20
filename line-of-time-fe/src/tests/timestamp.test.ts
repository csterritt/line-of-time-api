// ====================================
// Tests for timestamp.ts BC/AD support
// To run: cd line-of-time-fe && bun test src/tests/timestamp.test.ts
// ====================================

import { describe, it, expect } from 'bun:test'
import {
  isTimestampBC,
  timestampToYear,
  timestampToYearMonth,
  timestampToYmd,
  timestampToDateInput,
  dateInputToTimestamp,
} from '../utils/timestamp'

// Well-known JDNs:
// JDN 1721426 = Jan 1, 1 AD (astronomical year 1)
// JDN 1721425 = Dec 31, 1 BC (astronomical year 0)
// JDN 2451545 = Jan 1, 2000 AD

describe('isTimestampBC', () => {
  it('returns false for Jan 1, 1 AD (JDN 1721426)', () => {
    expect(isTimestampBC(1721426)).toBe(false)
  })

  it('returns true for Dec 31, 1 BC (JDN 1721425)', () => {
    expect(isTimestampBC(1721425)).toBe(true)
  })

  it('returns true for a deep BC date (JDN 38 = Jan 1, 4713 BC)', () => {
    expect(isTimestampBC(38)).toBe(true)
  })

  it('returns false for Jan 1, 2000 AD (JDN 2451545)', () => {
    expect(isTimestampBC(2451545)).toBe(false)
  })
})

describe('timestampToYear with BC dates', () => {
  it('returns "1" for 1 AD (JDN 1721426)', () => {
    expect(timestampToYear(1721426)).toBe('1')
  })

  it('returns "1" for 1 BC (JDN 1721425 = Dec 31, astronomical year 0)', () => {
    // astronomical year 0 = 1 BC → display year = 1
    expect(timestampToYear(1721425)).toBe('1')
  })

  it('returns "2000" for 2000 AD', () => {
    expect(timestampToYear(2451545)).toBe('2000')
  })
})

describe('timestampToYearMonth with BC dates', () => {
  it('returns correct format for 1 BC date', () => {
    // JDN 1721425 = Dec 31, 1 BC (astronomical year 0)
    expect(timestampToYearMonth(1721425)).toBe('1-12')
  })

  it('returns correct format for AD date', () => {
    expect(timestampToYearMonth(1721426)).toBe('1-01')
  })
})

describe('timestampToYmd with BC dates', () => {
  it('returns correct format for 1 BC date', () => {
    // JDN 1721425 = Dec 31, 1 BC (astronomical year 0)
    expect(timestampToYmd(1721425)).toBe('1-12-31')
  })

  it('returns correct format for AD date', () => {
    expect(timestampToYmd(1721426)).toBe('1-01-01')
  })
})

describe('dateInputToTimestamp with negative years', () => {
  it('converts astronomical year 0 (1 BC) Jan 1 correctly', () => {
    const jdn = dateInputToTimestamp('0-01-01')
    expect(jdn).toBe(1721060)
  })

  it('converts negative year correctly', () => {
    // astronomical year -1 = 2 BC
    const jdn = dateInputToTimestamp('-1-01-01')
    expect(jdn).toBeGreaterThan(0)
  })

  it('round-trips an AD date', () => {
    const jdn = dateInputToTimestamp('2000-01-01')
    expect(jdn).toBe(2451545)
  })
})
