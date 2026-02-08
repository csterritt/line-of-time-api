import { dateComponentsToTimestamp, timestampToDateComponents } from '../src/lib/timestamp'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: bun run scripts/show-dates.ts <mode> [args...]')
  console.error('Modes:')
  console.error('  date <month> <day> <year>  - Convert date to timestamp and back')
  console.error('  ts <timestamp>              - Convert timestamp to date')
  process.exit(1)
}

const mode = args[0]

if (mode === 'date') {
  if (args.length !== 4) {
    console.error('Usage: bun run scripts/show-dates.ts date <month> <day> <year>')
    process.exit(1)
  }

  const month = parseInt(args[1], 10)
  const day = parseInt(args[2], 10)
  const year = parseInt(args[3], 10)

  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    console.error('Error: month, day, and year must be valid numbers')
    process.exit(1)
  }

  const timestamp = dateComponentsToTimestamp({ year, month, day })
  const components = timestampToDateComponents(timestamp)

  console.log(`Timestamp: ${timestamp}`)
  console.log(`Month: ${components.month}`)
  console.log(`Day: ${components.day}`)
  console.log(`Year: ${components.year}`)
} else if (mode === 'ts') {
  if (args.length !== 2) {
    console.error('Usage: bun run scripts/show-dates.ts ts <timestamp>')
    process.exit(1)
  }

  const timestamp = parseInt(args[1], 10)

  if (isNaN(timestamp)) {
    console.error('Error: timestamp must be a valid number')
    process.exit(1)
  }

  const components = timestampToDateComponents(timestamp)

  console.log(`Month: ${components.month}`)
  console.log(`Day: ${components.day}`)
  console.log(`Year: ${components.year}`)
} else {
  console.error(`Error: unknown mode "${mode}"`)
  console.error('Valid modes: date, ts')
  process.exit(1)
}
