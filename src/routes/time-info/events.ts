/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'

import { getEventsByTimestampRange } from '../../lib/db-access'
import { AppEnv } from '../../local-types'
import { parseEvent } from './event-utils'

const eventsRouter = new Hono<AppEnv>()

eventsRouter.get('/:start/:end', async (c) => {
  const db = c.get('db')
  const startParam = c.req.param('start')
  const endParam = c.req.param('end')

  const start = parseInt(startParam, 10)
  const end = parseInt(endParam, 10)

  if (isNaN(start) || isNaN(end)) {
    return c.json({ error: 'start and end must be valid integers' }, 400)
  }

  if (start > end) {
    return c.json({ error: 'start must be less than or equal to end' }, 400)
  }

  const eventsResult = await getEventsByTimestampRange(db, start, end)

  if (eventsResult.isErr) {
    console.error('Failed to get events by timestamp range:', eventsResult.error)
    return c.json({ error: 'Failed to get events' }, 500)
  }

  return c.json(eventsResult.value.map(parseEvent))
})

export { eventsRouter }
