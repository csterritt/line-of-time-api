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
} from '../src/lib/timestamp'

describe('timestampToDateComponents', () => {
  it('should return Jan 1, 1 AD for timestamp 0', () => {
    const result = timestampToDateComponents(0)
    expect(result).toEqual({ year: 1, month: 1, day: 1 })
  })

  it('should return Jan 2, 1 AD for timestamp 1', () => {
    const result = timestampToDateComponents(1)
    expect(result).toEqual({ year: 1, month: 1, day: 2 })
  })

  it('should return Dec 31, 1 BC for timestamp -1', () => {
    const result = timestampToDateComponents(-1)
    expect(result).toEqual({ year: 0, month: 12, day: 31 })
  })

  it('should return Feb 1, 1 AD for timestamp 31', () => {
    const result = timestampToDateComponents(31)
    expect(result).toEqual({ year: 1, month: 2, day: 1 })
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
  it('should return 0 for Jan 1, 1 AD', () => {
    const result = dateComponentsToTimestamp({ year: 1, month: 1, day: 1 })
    expect(result).toBe(0)
  })

  it('should return 1 for Jan 2, 1 AD', () => {
    const result = dateComponentsToTimestamp({ year: 1, month: 1, day: 2 })
    expect(result).toBe(1)
  })

  it('should return -1 for Dec 31, 1 BC', () => {
    const result = dateComponentsToTimestamp({ year: 0, month: 12, day: 31 })
    expect(result).toBe(-1)
  })

  it('should return 365 for Jan 1, 2 AD', () => {
    const result = dateComponentsToTimestamp({ year: 2, month: 1, day: 1 })
    expect(result).toBe(365)
  })
})

describe('round-trip conversions', () => {
  const testTimestamps = [
    0, 1, -1, 365, -365, 366, -366, 1000, -1000, 10000, -10000, 100000, -100000,
    730000, -14600000,
  ]

  for (const ts of testTimestamps) {
    it(`should round-trip timestamp ${ts}`, () => {
      const components = timestampToDateComponents(ts)
      const result = dateComponentsToTimestamp(components)
      expect(result).toBe(ts)
    })
  }
})

describe('fromTimestamp', () => {
  it('should format Jan 1, 1 AD with day precision', () => {
    const result = fromTimestamp(0, { precision: 'day', style: 'BC/AD' })
    expect(result).toBe('January 1, 1 AD')
  })

  it('should format Jan 1, 1 AD with month precision', () => {
    const result = fromTimestamp(0, { precision: 'month', style: 'BC/AD' })
    expect(result).toBe('January 1 AD')
  })

  it('should format Jan 1, 1 AD with year precision', () => {
    const result = fromTimestamp(0, { precision: 'year', style: 'BC/AD' })
    expect(result).toBe('1 AD')
  })

  it('should format Dec 31, 1 BC correctly', () => {
    const result = fromTimestamp(-1, { precision: 'day', style: 'BC/AD' })
    expect(result).toBe('December 31, 1 BC')
  })

  it('should format with BCE/CE style', () => {
    const result = fromTimestamp(-1, { precision: 'day', style: 'BCE/CE' })
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
    { ts: 0, desc: 'Jan 1, 1 AD' },
    { ts: -1, desc: 'Dec 31, 1 BC' },
    { ts: 365, desc: 'Jan 1, 2 AD' },
    { ts: -365, desc: 'approx Jan 1, 1 BC' },
    { ts: 738000, desc: 'modern date' },
    { ts: -14600000, desc: '40,000 BC' },
  ]

  for (const { ts, desc } of testCases) {
    it(`should round-trip ${desc} (ts=${ts})`, () => {
      const formatted = fromTimestamp(ts, { precision: 'day', style: 'BC/AD' })
      const parsed = toTimestamp(formatted)
      expect(parsed).toBe(ts)
    })
  }
})
