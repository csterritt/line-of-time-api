/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'

import { searchEvents } from '../../lib/db-access'
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

  const searchResult = await searchEvents(db, search, SEARCH.RESULTS_LIMIT)

  if (searchResult.isErr) {
    console.error('Failed to search events:', searchResult.error)
    return c.json({ error: 'Failed to search events' }, 500)
  }

  return c.json(searchResult.value as SearchResult[])
})

export { searchRouter }
