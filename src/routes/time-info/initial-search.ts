/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
// @ts-expect-error html-to-text has no type declarations
import { convert } from 'html-to-text'

import { AppEnv } from '../../local-types'

const MAX_BASIC_DESCRIPTION_LENGTH = 1000

interface InitialSearchInput {
  name: string
}

interface WikiQueryPage {
  pageid?: number
  ns: number
  title: string
  extract?: string
  missing?: string
}

interface WikiQueryResponse {
  batchcomplete: string
  query: {
    pages: Record<string, WikiQueryPage>
  }
}

interface WikiParseLink {
  '*': string
  exists?: string
  ns: number
}

interface WikiParseResponse {
  parse: {
    pageid: number
    title: string
    text: {
      '*': string
    }
    links: WikiParseLink[]
  }
  error?: {
    code: string
    info: string
  }
}

interface WikiParseErrorResponse {
  error: {
    code: string
    info: string
  }
}

const trimToMaxWords = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }

  const words = text.split(/\s+/)
  let result = ''

  for (const word of words) {
    const candidate = result.length === 0 ? word : `${result} ${word}`
    if (candidate.length > maxLength) {
      break
    }
    result = candidate
  }

  return result || text.slice(0, maxLength)
}

const WIKI_FETCH_HEADERS = {
  'User-Agent':
    'LineOfTimeApp/1.0 (https://line-of-time-api.cls.cloud; contact-wiki-search@cls.cloud)',
}

const initialSearchRouter = new Hono<AppEnv>()

initialSearchRouter.post('/', async (c) => {
  let body: InitialSearchInput
  try {
    body = await c.req.json<InitialSearchInput>()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { name } = body

  if (typeof name !== 'string' || name.trim().length === 0) {
    return c.json(
      {
        error:
          'name is required and must be a non-empty, non-whitespace-only string',
      },
      400
    )
  }

  const encodedName = encodeURIComponent(name.trim())

  // GET 1: Query for extract
  let queryData: WikiQueryResponse
  try {
    const queryUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodedName}`
    const queryResponse = await fetch(queryUrl, { headers: WIKI_FETCH_HEADERS })
    queryData = (await queryResponse.json()) as WikiQueryResponse
  } catch {
    return c.json({ error: 'Failed to fetch from Wikipedia' }, 502)
  }

  const pages = queryData.query.pages
  if ('-1' in pages) {
    return c.json({ error: 'Nothing found for that name' }, 404)
  }

  const firstPage = Object.values(pages)[0]
  const rawTitle = firstPage.title
  const rawExtract = firstPage.extract ?? ''

  // GET 2: Parse for text and links
  let parseData: WikiParseResponse | WikiParseErrorResponse
  try {
    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text|links&page=${encodedName}`
    const parseResponse = await fetch(parseUrl, { headers: WIKI_FETCH_HEADERS })
    parseData = (await parseResponse.json()) as
      | WikiParseResponse
      | WikiParseErrorResponse
  } catch {
    return c.json({ error: 'Failed to fetch from Wikipedia' }, 502)
  }

  if ('error' in parseData && !('parse' in parseData)) {
    return c.json({ error: 'Nothing found for that name' }, 404)
  }

  const parsed = (parseData as WikiParseResponse).parse
  const rawText = parsed.text['*']
  const rawLinks = parsed.links.map((link) => link['*'])

  // Convert HTML to text
  const convertedName = convert(rawTitle) as string
  const convertedExtract = convert(rawExtract) as string
  const convertedText = convert(rawText) as string
  const convertedLinks = rawLinks.map((link) => convert(link) as string)

  // Trim extract to fit within MAX_BASIC_DESCRIPTION_LENGTH
  const trimmedExtract = trimToMaxWords(
    convertedExtract,
    MAX_BASIC_DESCRIPTION_LENGTH
  )

  return c.json({
    name: convertedName,
    extract: trimmedExtract,
    text: convertedText,
    links: convertedLinks,
  })
})

export { initialSearchRouter }
