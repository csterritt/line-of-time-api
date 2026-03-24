const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const isLeapYear = (year: number): boolean => {
  if (year <= 0) {
    const adjustedYear = 1 - year
    return adjustedYear % 4 === 0 && (adjustedYear % 100 !== 0 || adjustedYear % 400 === 0)
  }

  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

const getDaysInMonth = (year: number, month: number): number => {
  if (month === 2 && isLeapYear(year)) {
    return 29
  }

  return DAYS_IN_MONTH[month - 1]!
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
const jdnToYMD = (jdn: number): { year: number; month: number; day: number } => {
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

export const isTimestampBC = (jdn: number): boolean => {
  const { year } = jdnToYMD(jdn)
  return year <= 0
}

export const timestampToYmd = (jdn: number): string => {
  const { year, month, day } = jdnToYMD(jdn)
  const displayYear = year <= 0 ? 1 - year : year
  const yStr = String(displayYear)
  const mStr = String(month).padStart(2, '0')
  const dStr = String(day).padStart(2, '0')
  return `${yStr}-${mStr}-${dStr}`
}

export const timestampToYear = (jdn: number): string => {
  const { year } = jdnToYMD(jdn)
  const displayYear = year <= 0 ? 1 - year : year
  return String(displayYear)
}

export const timestampToYearMonth = (jdn: number): string => {
  const { year, month } = jdnToYMD(jdn)
  const displayYear = year <= 0 ? 1 - year : year
  const yStr = String(displayYear)
  const mStr = String(month).padStart(2, '0')
  return `${yStr}-${mStr}`
}

export const timestampToDateInput = (jdn: number): string => {
  return timestampToYmd(jdn)
}

export const dateInputToTimestamp = (dateStr: string): number => {
  const isNegative = dateStr.startsWith('-')
  const trimmed = isNegative ? dateStr.slice(1) : dateStr
  const parts = trimmed.split('-')
  console.log(`parts is ${JSON.stringify(parts)}`)
  if (
    (parts.length !== 3 && parts.length !== 4) ||
    (parts.length === 4 && parts[3] !== 'BC' && parts[3] !== 'AD')
  ) {
    return 0
  }
  const year = parseInt(parts[0]!, 10) * (isNegative ? -1 : 1)
  const month = parseInt(parts[1]!, 10)
  const day = parseInt(parts[2]!, 10)
  return ymdToJDN(year, month, day)
}

export const DAYS_PER_YEAR = 365

export { getDaysInMonth }
