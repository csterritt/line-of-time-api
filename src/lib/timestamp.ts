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

const getDaysInYear = (year: number): number => {
  return isLeapYear(year) ? 366 : 365
}

const countLeapYears = (fromYear: number, toYear: number): number => {
  if (fromYear > toYear) return 0
  const countUpTo = (y: number): number => {
    if (y < 0) return 0
    return Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)
  }
  return countUpTo(toYear) - countUpTo(fromYear - 1)
}

const daysFromYear1ToYear = (year: number): number => {
  if (year >= 1) {
    const y = year - 1
    return y * 365 + countLeapYears(1, y)
  }

  let totalDays = 0
  for (let y = year; y < 1; y++) {
    totalDays -= getDaysInYear(y)
  }
  return totalDays
}

const timestampToComponents = (timestamp: number): DateComponents => {
  let remainingDays = timestamp
  let year: number

  if (timestamp >= 0) {
    year = Math.floor(timestamp / 365.2425) + 1
    while (daysFromYear1ToYear(year) > timestamp) {
      year--
    }
    while (daysFromYear1ToYear(year + 1) <= timestamp) {
      year++
    }
    remainingDays = timestamp - daysFromYear1ToYear(year)
  } else {
    year = Math.floor(timestamp / 365.2425)
    while (daysFromYear1ToYear(year) > timestamp) {
      year--
    }
    while (daysFromYear1ToYear(year + 1) <= timestamp) {
      year++
    }
    remainingDays = timestamp - daysFromYear1ToYear(year)
  }

  let month = 1
  while (month <= 12) {
    const daysInThisMonth = getDaysInMonth(year, month)
    if (remainingDays < daysInThisMonth) {
      break
    }
    remainingDays -= daysInThisMonth
    month++
  }

  const day = remainingDays + 1

  return { year, month, day }
}

const componentsToTimestamp = (components: DateComponents): number => {
  const { year, month, day } = components
  let timestamp = daysFromYear1ToYear(year)

  for (let m = 1; m < month; m++) {
    timestamp += getDaysInMonth(year, m)
  }

  timestamp += day - 1

  return timestamp
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
  const components = timestampToComponents(timestamp)
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

  return componentsToTimestamp({ year: internalYear, month, day })
}

export const timestampToDateComponents = timestampToComponents
export const dateComponentsToTimestamp = componentsToTimestamp
