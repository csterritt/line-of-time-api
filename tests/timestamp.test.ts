// ====================================
// Tests for timestamp.ts
// To run this, cd to this directory and type 'bun test'
// ====================================

import { describe, it, expect } from 'bun:test'
import {
  fromTimestamp,
  toTimestamp,
  timestampToDateComponents,
  dateComponentsToTimestamp,
  validateEventDates,
} from '../src/lib/timestamp'

// Well-known Julian Day Numbers (proleptic Gregorian calendar):
// JDN 1721426 = Jan 1, 1 AD
// JDN 1721425 = Dec 31, 1 BC (astronomical year 0)
// JDN 1721427 = Jan 2, 1 AD
// JDN 2451545 = Jan 1, 2000 AD
// JDN 2440423 = Jul 20, 1969 (Moon Landing)

describe('timestampToDateComponents', () => {
  it('should return Jan 1, 1 AD for JDN 1721426', () => {
    const result = timestampToDateComponents(1721426)
    expect(result).toEqual({ year: 1, month: 1, day: 1 })
  })

  it('should return Jan 2, 1 AD for JDN 1721427', () => {
    const result = timestampToDateComponents(1721427)
    expect(result).toEqual({ year: 1, month: 1, day: 2 })
  })

  it('should return Dec 31, 1 BC for JDN 1721425', () => {
    const result = timestampToDateComponents(1721425)
    expect(result).toEqual({ year: 0, month: 12, day: 31 })
  })

  it('should return Feb 1, 1 AD for JDN 1721457 (31 days after Jan 1)', () => {
    const result = timestampToDateComponents(1721457)
    expect(result).toEqual({ year: 1, month: 2, day: 1 })
  })

  it('should return Jul 20, 1969 for JDN 2440423 (Moon Landing)', () => {
    const result = timestampToDateComponents(2440423)
    expect(result).toEqual({ year: 1969, month: 7, day: 20 })
  })

  it('should return Jan 1, 2000 for JDN 2451545', () => {
    const result = timestampToDateComponents(2451545)
    expect(result).toEqual({ year: 2000, month: 1, day: 1 })
  })

  it('should handle leap year correctly for 4 AD', () => {
    const jan1Year4 = dateComponentsToTimestamp({ year: 4, month: 1, day: 1 })
    const mar1Year4 = dateComponentsToTimestamp({ year: 4, month: 3, day: 1 })
    expect(mar1Year4 - jan1Year4).toBe(31 + 29)
  })

  it('should handle non-leap century year 100 AD', () => {
    const jan1Year100 = dateComponentsToTimestamp({
      year: 100,
      month: 1,
      day: 1,
    })
    const mar1Year100 = dateComponentsToTimestamp({
      year: 100,
      month: 3,
      day: 1,
    })
    expect(mar1Year100 - jan1Year100).toBe(31 + 28)
  })

  it('should handle leap century year 400 AD', () => {
    const jan1Year400 = dateComponentsToTimestamp({
      year: 400,
      month: 1,
      day: 1,
    })
    const mar1Year400 = dateComponentsToTimestamp({
      year: 400,
      month: 3,
      day: 1,
    })
    expect(mar1Year400 - jan1Year400).toBe(31 + 29)
  })
})

describe('dateComponentsToTimestamp', () => {
  it('should return JDN 1721426 for Jan 1, 1 AD', () => {
    const result = dateComponentsToTimestamp({ year: 1, month: 1, day: 1 })
    expect(result).toBe(1721426)
  })

  it('should return JDN 1721427 for Jan 2, 1 AD', () => {
    const result = dateComponentsToTimestamp({ year: 1, month: 1, day: 2 })
    expect(result).toBe(1721427)
  })

  it('should return JDN 1721425 for Dec 31, 1 BC (astronomical year 0)', () => {
    const result = dateComponentsToTimestamp({ year: 0, month: 12, day: 31 })
    expect(result).toBe(1721425)
  })

  it('should return JDN 1721791 for Jan 1, 2 AD (365 days after Jan 1, 1 AD)', () => {
    const result = dateComponentsToTimestamp({ year: 2, month: 1, day: 1 })
    expect(result).toBe(1721791)
  })

  it('should return JDN 2451545 for Jan 1, 2000 AD', () => {
    const result = dateComponentsToTimestamp({ year: 2000, month: 1, day: 1 })
    expect(result).toBe(2451545)
  })

  it('should return JDN 2440423 for Jul 20, 1969', () => {
    const result = dateComponentsToTimestamp({ year: 1969, month: 7, day: 20 })
    expect(result).toBe(2440423)
  })

  it('Jan 1 and Jan 2 should differ by exactly 1', () => {
    const jan1 = dateComponentsToTimestamp({ year: 2000, month: 1, day: 1 })
    const jan2 = dateComponentsToTimestamp({ year: 2000, month: 1, day: 2 })
    expect(jan2 - jan1).toBe(1)
  })

  it('Dec 31, 1 BC and Jan 1, 1 AD should differ by exactly 1', () => {
    const dec31bc = dateComponentsToTimestamp({ year: 0, month: 12, day: 31 })
    const jan1ad = dateComponentsToTimestamp({ year: 1, month: 1, day: 1 })
    expect(jan1ad - dec31bc).toBe(1)
  })
})

describe('round-trip conversions', () => {
  const testJDNs = [
    1721426, 1721427, 1721425, 1721791, 2451545, 2440423,
    2353712, 2369916, 2429508, 2431701, 2378479,
    38, 1000000, 3000000, -12888274,
  ]

  for (const jdn of testJDNs) {
    it(`should round-trip JDN ${jdn}`, () => {
      const components = timestampToDateComponents(jdn)
      const result = dateComponentsToTimestamp(components)
      expect(result).toBe(jdn)
    })
  }
})

describe('fromTimestamp', () => {
  it('should format Jan 1, 1 AD with day precision', () => {
    const result = fromTimestamp(1721426, { precision: 'day', style: 'BC/AD' })
    expect(result).toBe('January 1, 1 AD')
  })

  it('should format Jan 1, 1 AD with month precision', () => {
    const result = fromTimestamp(1721426, { precision: 'month', style: 'BC/AD' })
    expect(result).toBe('January 1 AD')
  })

  it('should format Jan 1, 1 AD with year precision', () => {
    const result = fromTimestamp(1721426, { precision: 'year', style: 'BC/AD' })
    expect(result).toBe('1 AD')
  })

  it('should format Dec 31, 1 BC correctly', () => {
    const result = fromTimestamp(1721425, { precision: 'day', style: 'BC/AD' })
    expect(result).toBe('December 31, 1 BC')
  })

  it('should format with BCE/CE style', () => {
    const result = fromTimestamp(1721425, { precision: 'day', style: 'BCE/CE' })
    expect(result).toBe('December 31, 1 BCE')
  })

  it('should format large BC year with commas', () => {
    const ts = toTimestamp('40000 BC')
    const result = fromTimestamp(ts, { precision: 'year', style: 'BC/AD' })
    expect(result).toBe('40,000 BC')
  })

  it('should format modern date correctly', () => {
    const ts = toTimestamp('June 19, 2025 AD')
    const result = fromTimestamp(ts, { precision: 'day', style: 'BC/AD' })
    expect(result).toBe('June 19, 2025 AD')
  })

  it('should format Jul 20, 1969 (Moon Landing)', () => {
    const result = fromTimestamp(2440423, { precision: 'day', style: 'BC/AD' })
    expect(result).toBe('July 20, 1969 AD')
  })

  it('should format Jan 1, 2000 with year precision', () => {
    const result = fromTimestamp(2451545, { precision: 'year', style: 'BC/AD' })
    expect(result).toBe('2000 AD')
  })
})

describe('toTimestamp', () => {
  it('should parse year-only BC date', () => {
    const result = toTimestamp('40000 BC')
    const components = timestampToDateComponents(result)
    expect(components.year).toBe(-39999)
    expect(components.month).toBe(1)
    expect(components.day).toBe(1)
  })

  it('should parse year-only AD date', () => {
    const result = toTimestamp('2025 AD')
    const components = timestampToDateComponents(result)
    expect(components.year).toBe(2025)
    expect(components.month).toBe(1)
    expect(components.day).toBe(1)
  })

  it('should parse month and year', () => {
    const result = toTimestamp('June 2025 AD')
    const components = timestampToDateComponents(result)
    expect(components.year).toBe(2025)
    expect(components.month).toBe(6)
    expect(components.day).toBe(1)
  })

  it('should parse full date', () => {
    const result = toTimestamp('June 19, 2025 AD')
    const components = timestampToDateComponents(result)
    expect(components.year).toBe(2025)
    expect(components.month).toBe(6)
    expect(components.day).toBe(19)
  })

  it('should parse BCE style', () => {
    const result = toTimestamp('306 BCE')
    const components = timestampToDateComponents(result)
    expect(components.year).toBe(-305)
  })

  it('should parse CE style', () => {
    const result = toTimestamp('2025 CE')
    const components = timestampToDateComponents(result)
    expect(components.year).toBe(2025)
  })

  it('should parse comma-formatted years', () => {
    const result = toTimestamp('40,000 BC')
    const components = timestampToDateComponents(result)
    expect(components.year).toBe(-39999)
  })

  it('should return JDN 1721426 for January 1, 1 AD', () => {
    const result = toTimestamp('January 1, 1 AD')
    expect(result).toBe(1721426)
  })

  it('should return JDN 2451545 for January 1, 2000 AD', () => {
    const result = toTimestamp('January 1, 2000 AD')
    expect(result).toBe(2451545)
  })

  it('should throw for missing era suffix', () => {
    expect(() => toTimestamp('2025')).toThrow(/missing era suffix/)
  })

  it('should throw for invalid day', () => {
    expect(() => toTimestamp('February 30, 2025 AD')).toThrow(/Invalid day/)
  })

  it('should accept Feb 29 in leap year', () => {
    const result = toTimestamp('February 29, 2024 AD')
    const components = timestampToDateComponents(result)
    expect(components.month).toBe(2)
    expect(components.day).toBe(29)
  })

  it('should reject Feb 29 in non-leap year', () => {
    expect(() => toTimestamp('February 29, 2025 AD')).toThrow(/Invalid day/)
  })
})

describe('fromTimestamp and toTimestamp round-trip', () => {
  const testCases = [
    { ts: 1721426, desc: 'Jan 1, 1 AD' },
    { ts: 1721425, desc: 'Dec 31, 1 BC' },
    { ts: 1721791, desc: 'Jan 1, 2 AD' },
    { ts: 2451545, desc: 'Jan 1, 2000 AD' },
    { ts: 2440423, desc: 'Jul 20, 1969 (Moon Landing)' },
    { ts: -12888274, desc: 'Jan 1, 40000 BC' },
  ]

  for (const { ts, desc } of testCases) {
    it(`should round-trip ${desc} (JDN=${ts})`, () => {
      const formatted = fromTimestamp(ts, { precision: 'day', style: 'BC/AD' })
      const parsed = toTimestamp(formatted)
      expect(parsed).toBe(ts)
    })
  }
})

describe('validateEventDates', () => {
  describe('valid inputs', () => {
    it('should accept year only', () => {
      const result = validateEventDates({ startYear: 2000 })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.result.startTimestamp).toBe(2451545)
        expect(result.result.endTimestamp).toBeNull()
      }
    })

    it('should accept year and month (defaults day to 1)', () => {
      const result = validateEventDates({ startYear: 2000, startMonth: 1 })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.result.startTimestamp).toBe(2451545)
      }
    })

    it('should accept year, month, and day', () => {
      const result = validateEventDates({ startYear: 1969, startMonth: 7, startDay: 20 })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.result.startTimestamp).toBe(2440423)
      }
    })

    it('should accept full start and end dates', () => {
      const result = validateEventDates({
        startYear: 1939, startMonth: 9, startDay: 1,
        endYear: 1945, endMonth: 9, endDay: 2,
      })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.result.startTimestamp).toBe(2429508)
        expect(result.result.endTimestamp).toBe(2431701)
      }
    })

    it('should default endMonth to 12 and endDay to 31 when only endYear given', () => {
      const result = validateEventDates({ startYear: 2000, endYear: 2001 })
      expect(result.valid).toBe(true)
      if (result.valid) {
        const endComponents = timestampToDateComponents(result.result.endTimestamp!)
        expect(endComponents.year).toBe(2001)
        expect(endComponents.month).toBe(12)
        expect(endComponents.day).toBe(31)
      }
    })

    it('should default endDay to last day of endMonth', () => {
      const result = validateEventDates({ startYear: 2000, endYear: 2000, endMonth: 2 })
      expect(result.valid).toBe(true)
      if (result.valid) {
        const endComponents = timestampToDateComponents(result.result.endTimestamp!)
        expect(endComponents.month).toBe(2)
        expect(endComponents.day).toBe(29)
      }
    })

    it('should accept same start and end year with end month >= start month', () => {
      const result = validateEventDates({
        startYear: 2000, startMonth: 6,
        endYear: 2000, endMonth: 12,
      })
      expect(result.valid).toBe(true)
    })

    it('should accept start and end on the same day', () => {
      const result = validateEventDates({
        startYear: 2000, startMonth: 6, startDay: 15,
        endYear: 2000, endMonth: 6, endDay: 15,
      })
      expect(result.valid).toBe(true)
    })

    it('should accept the earliest allowed date (Jan 1, 4713 BC = astronomical year -4712)', () => {
      const result = validateEventDates({ startYear: -4712 })
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('should reject startDay without startMonth', () => {
      const result = validateEventDates({ startYear: 2000, startDay: 15 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('startDay cannot be given without startMonth'))).toBe(true)
      }
    })

    it('should reject endMonth without endYear', () => {
      const result = validateEventDates({ startYear: 2000, endMonth: 6 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('endMonth cannot be given without endYear'))).toBe(true)
      }
    })

    it('should reject endDay without endYear', () => {
      const result = validateEventDates({ startYear: 2000, endDay: 15 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('endDay cannot be given without endYear'))).toBe(true)
      }
    })

    it('should reject endDay without endMonth when endYear is given', () => {
      const result = validateEventDates({ startYear: 2000, endYear: 2001, endDay: 15 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('endDay cannot be given without endMonth'))).toBe(true)
      }
    })

    it('should reject invalid startMonth (0)', () => {
      const result = validateEventDates({ startYear: 2000, startMonth: 0 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('startMonth must be between 1 and 12'))).toBe(true)
      }
    })

    it('should reject invalid startMonth (13)', () => {
      const result = validateEventDates({ startYear: 2000, startMonth: 13 })
      expect(result.valid).toBe(false)
    })

    it('should reject invalid startDay for given month', () => {
      const result = validateEventDates({ startYear: 2025, startMonth: 2, startDay: 29 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('startDay is invalid'))).toBe(true)
      }
    })

    it('should reject date before earliest allowed (before Jan 1, 4713 BC)', () => {
      const result = validateEventDates({ startYear: -4713 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('earliest allowed date'))).toBe(true)
      }
    })

    it('should reject endYear less than startYear', () => {
      const result = validateEventDates({ startYear: 2000, endYear: 1999 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('endYear must be greater than or equal to startYear'))).toBe(true)
      }
    })

    it('should reject endMonth < startMonth when same year', () => {
      const result = validateEventDates({
        startYear: 2000, startMonth: 6,
        endYear: 2000, endMonth: 5,
      })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('endMonth must be greater than or equal to startMonth'))).toBe(true)
      }
    })

    it('should reject endDay < startDay when same year and month', () => {
      const result = validateEventDates({
        startYear: 2000, startMonth: 6, startDay: 15,
        endYear: 2000, endMonth: 6, endDay: 14,
      })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some((e) => e.includes('endDay must be greater than or equal to startDay'))).toBe(true)
      }
    })
  })
})
