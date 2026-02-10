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

  return DAYS_IN_MONTH[month - 1]!
}

const getDaysInYear = (year: number): number => {
  return isLeapYear(year) ? 366 : 365
}

const countLeapYears = (fromYear: number, toYear: number): number => {
  if (fromYear > toYear) {
    return 0
  }
  const countUpTo = (y: number): number => {
    if (y < 0) {
      return 0
    }
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

type DateComponents = {
  year: number
  month: number
  day: number
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

export const timestampToYmd = (timestamp: number): string => {
  const { year, month, day } = timestampToComponents(timestamp)
  const yStr = String(Math.abs(year)).padStart(4, '0')
  const mStr = String(month).padStart(2, '0')
  const dStr = String(day).padStart(2, '0')
  return `${yStr}-${mStr}-${dStr}`
}
