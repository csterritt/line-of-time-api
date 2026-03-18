/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export type DatePrecision = 'year' | 'month' | 'day'
export type EraStyle = 'BC/AD' | 'BCE/CE'

export interface DateComponents {
  year: number
  month: number
  day: number
}

export interface FromTimestampOptions {
  precision: DatePrecision
  style: EraStyle
}

export interface EventDateInput {
  startYear: number
  startMonth?: number
  startDay?: number
  endYear?: number
  endMonth?: number
  endDay?: number
}

export interface EventDateResult {
  startTimestamp: number
  endTimestamp: number | null
}

export interface EventDateValidationError {
  valid: false
  errors: string[]
}

export interface EventDateValidationSuccess {
  valid: true
  result: EventDateResult
}

export type EventDateValidation = EventDateValidationError | EventDateValidationSuccess

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const isLeapYear = (year: number): boolean => {
  if (year <= 0) {
    const adjustedYear = 1 - year
    return (
      adjustedYear % 4 === 0 &&
      (adjustedYear % 100 !== 0 || adjustedYear % 400 === 0)
    )
  }

  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

const getDaysInMonth = (year: number, month: number): number => {
  if (month === 2 && isLeapYear(year)) {
    return 29
  }

  return DAYS_IN_MONTH[month - 1]
}

/**
 * Convert year/month/day (astronomical year, 0 = 1 BC) to Julian Day Number.
 * Uses the proleptic Gregorian calendar algorithm.
 */
const ymdToJDN = (year: number, month: number, day: number): number => {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

/**
 * Convert Julian Day Number to year/month/day (astronomical year, 0 = 1 BC).
 * Uses the proleptic Gregorian calendar algorithm.
 */
const jdnToYMD = (jdn: number): DateComponents => {
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  }
}

export const timestampToDateComponents = (timestamp: number): DateComponents => {
  return jdnToYMD(timestamp)
}

export const dateComponentsToTimestamp = (components: DateComponents): number => {
  return ymdToJDN(components.year, components.month, components.day)
}

const formatYear = (year: number): string => {
  const absYear = Math.abs(year)
  if (absYear >= 10000) {
    return absYear.toLocaleString('en-US')
  }

  return absYear.toString()
}

const getEraSuffix = (year: number, style: EraStyle): string => {
  if (year <= 0) {
    return style === 'BC/AD' ? ' BC' : ' BCE'
  }

  return style === 'BC/AD' ? ' AD' : ' CE'
}

export const fromTimestamp = (
  timestamp: number,
  options: FromTimestampOptions
): string => {
  const { precision, style } = options
  const components = jdnToYMD(timestamp)
  const displayYear =
    components.year <= 0 ? 1 - components.year : components.year
  const eraSuffix = getEraSuffix(components.year, style)

  if (precision === 'year') {
    return `${formatYear(displayYear)}${eraSuffix}`
  }

  const monthName = MONTH_NAMES[components.month - 1]

  if (precision === 'month') {
    return `${monthName} ${formatYear(displayYear)}${eraSuffix}`
  }

  return `${monthName} ${components.day}, ${formatYear(displayYear)}${eraSuffix}`
}

const parseMonthName = (name: string): number | null => {
  const lowerName = name.toLowerCase()
  const index = MONTH_NAMES.findIndex(
    (m) =>
      m.toLowerCase() === lowerName || m.toLowerCase().startsWith(lowerName)
  )

  return index >= 0 ? index + 1 : null
}

const parseYear = (yearStr: string): number => {
  return parseInt(yearStr.replace(/,/g, ''), 10)
}

export const toTimestamp = (dateString: string): number => {
  const trimmed = dateString.trim()
  const eraMatch = trimmed.match(/\s+(BC|AD|BCE|CE)$/i)

  if (!eraMatch) {
    throw new Error(`Invalid date string: missing era suffix (BC/AD/BCE/CE)`)
  }

  const era = eraMatch[1].toUpperCase()
  const isBC = era === 'BC' || era === 'BCE'
  const datePartRaw = trimmed.slice(0, -eraMatch[0].length).trim()
  const parts = datePartRaw.split(/\s+/)

  let year: number
  let month = 1
  let day = 1

  if (parts.length === 1) {
    year = parseYear(parts[0])
  } else if (parts.length === 2) {
    const parsedMonth = parseMonthName(parts[0])
    if (parsedMonth !== null) {
      month = parsedMonth
      year = parseYear(parts[1])
    } else {
      throw new Error(`Invalid date string: cannot parse "${dateString}"`)
    }
  } else if (parts.length === 3) {
    const parsedMonth = parseMonthName(parts[0])
    if (parsedMonth !== null) {
      month = parsedMonth
      day = parseInt(parts[1], 10)
      year = parseYear(parts[2])
    } else {
      throw new Error(`Invalid date string: cannot parse "${dateString}"`)
    }
  } else {
    throw new Error(`Invalid date string: cannot parse "${dateString}"`)
  }

  if (isNaN(year) || year <= 0) {
    throw new Error(`Invalid year in date string: "${dateString}"`)
  }

  if (isNaN(day) || day < 1 || day > 31) {
    throw new Error(`Invalid day in date string: "${dateString}"`)
  }

  const internalYear = isBC ? 1 - year : year
  const maxDays = getDaysInMonth(internalYear, month)

  if (day > maxDays) {
    throw new Error(
      `Invalid day ${day} for ${MONTH_NAMES[month - 1]} in year ${year}`
    )
  }

  return ymdToJDN(internalYear, month, day)
}

// Minimum Julian Day Number allowed: January 1, 4713 BC (proleptic Gregorian = astronomical year -4712)
const MIN_JDN = 38

/**
 * Validate event date inputs and compute Julian Day Number timestamps.
 * startYear uses the historical (positive) year convention (1 = 1 AD, not astronomical).
 * Applies defaults for missing month/day fields per the spec.
 */
export const validateEventDates = (input: EventDateInput): EventDateValidation => {
  const errors: string[] = []
  const { startYear, startMonth, startDay, endYear, endMonth, endDay } = input

  if (startMonth == null && startDay != null) {
    errors.push('startDay cannot be given without startMonth')
  }

  if (endYear == null) {
    if (endMonth != null) {
      errors.push('endMonth cannot be given without endYear')
    }
    if (endDay != null) {
      errors.push('endDay cannot be given without endYear')
    }
  } else if (endMonth == null && endDay != null) {
    errors.push('endDay cannot be given without endMonth when endYear is given')
  }

  if (startMonth != null && (startMonth < 1 || startMonth > 12)) {
    errors.push('startMonth must be between 1 and 12')
  }

  if (endMonth != null && (endMonth < 1 || endMonth > 12)) {
    errors.push('endMonth must be between 1 and 12')
  }

  const effStartMonth = startMonth ?? 1
  const effStartDay = startDay ?? 1

  if (startDay != null) {
    const maxStartDay = getDaysInMonth(startYear, effStartMonth)
    if (startDay < 1 || startDay > maxStartDay) {
      errors.push('startDay is invalid for the given month and year')
    }
  }

  const startJDN = ymdToJDN(startYear, effStartMonth, effStartDay)

  if (startJDN < MIN_JDN) {
    errors.push('Start date is before the earliest allowed date (January 1, 4713 BC)')
  }

  let endJDN: number | null = null

  if (endYear != null) {
    const effEndMonth = endMonth ?? 12
    const effEndDay = endDay ?? getDaysInMonth(endYear, effEndMonth)

    if (endDay != null && endMonth != null) {
      const maxEndDay = getDaysInMonth(endYear, endMonth)
      if (endDay < 1 || endDay > maxEndDay) {
        errors.push('endDay is invalid for the given month and year')
      }
    }

    endJDN = ymdToJDN(endYear, effEndMonth, effEndDay)

    if (errors.length === 0) {
      if (endYear < startYear) {
        errors.push('endYear must be greater than or equal to startYear')
      } else if (endYear === startYear) {
        if (effEndMonth < effStartMonth) {
          errors.push('endMonth must be greater than or equal to startMonth when years are equal')
        } else if (effEndMonth === effStartMonth && effEndDay < effStartDay) {
          errors.push('endDay must be greater than or equal to startDay when year and month are equal')
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    result: {
      startTimestamp: startJDN,
      endTimestamp: endJDN,
    },
  }
}
