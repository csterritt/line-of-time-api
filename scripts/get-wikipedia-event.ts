import { getWikipediaEvent } from '../src/routes/time-info/initial-search'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: bun run scripts/get-wikipedia-event.ts <name>')
  process.exit(1)
}

const name = args.join(' ')

const result = await getWikipediaEvent(name, {} as any, {
  useAi: false,
  htmlText: false,
})

console.log(JSON.stringify(result, null, 2))
