import * as fs from 'fs'
import * as path from 'path'

import { getWikipediaEvent } from '../src/routes/time-info/initial-search'

const args = process.argv.slice(2)

if (args.length < 2) {
  console.error(
    'Usage: bun run scripts/get-wikipedia-event.ts <directory> <name> [<name> ...]'
  )
  process.exit(1)
}

const [dir, ...nameParts] = args
const name = nameParts.join(' ')
const hyphenatedName = nameParts.join('-').toLocaleLowerCase()
const outputPath = path.join(dir, `${hyphenatedName}.json`)

const result = await getWikipediaEvent(name, {} as any, {
  useAi: false,
  htmlText: false,
})

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
console.log(`Written to ${outputPath}`)
