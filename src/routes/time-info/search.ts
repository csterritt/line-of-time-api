/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { or, sql } from 'drizzle-orm'

import { event } from '../../db/schema'
import { AppEnv } from '../../local-types'
import { SEARCH } from '../../constants'

interface SearchInput {
  search: string
}

interface SearchResult {
  id: string
  name: string
  basicDescription: string
}

const searchRouter = new Hono<AppEnv>()

searchRouter.post('/', async (c) => {
  const db = c.get('db')

  let body: SearchInput
  try {
    body = await c.req.json<SearchInput>()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { search } = body

  // Validate search is a string
  if (typeof search !== 'string') {
    return c.json({ error: 'search must be a string' }, 400)
  }

  // Validate search is not empty or whitespace-only
  if (search.trim().length === 0) {
    return c.json({ error: 'search must not be empty or whitespace-only' }, 400)
  }

  // Validate search length in bytes (for UTF-8 multi-byte chars)
  const searchBytes = new TextEncoder().encode(search).length
  if (searchBytes > SEARCH.MAX_BYTES) {
    return c.json(
      { error: `search must not exceed ${SEARCH.MAX_BYTES} bytes` },
      400
    )
  }

  // Build the search pattern with wildcards
  // The search term is parameterized by Drizzle, preventing SQL injection
  // Escape LIKE special characters (% and _) to prevent unintended wildcard matching
  const escapedSearch = search.replace(/[%_]/g, '\\$&')
  const searchPattern = `%${escapedSearch}%`

  // Query with case-insensitive LIKE using LOWER() for full Unicode support
  // Using parameterized sql template to prevent SQL injection
  const lowerPattern = searchPattern.toLowerCase()
  const results = await db
    .select({
      id: event.id,
      name: event.name,
      basicDescription: event.basicDescription,
    })
    .from(event)
    .where(
      or(
        sql`LOWER(${event.name}) LIKE ${lowerPattern}`,
        sql`LOWER(${event.basicDescription}) LIKE ${lowerPattern}`
      )
    )
    .orderBy(event.startTimestamp)
    .limit(SEARCH.RESULTS_LIMIT)

  return c.json(results as SearchResult[])
})

export { searchRouter }
