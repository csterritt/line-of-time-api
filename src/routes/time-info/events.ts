/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { and, gte, lte } from 'drizzle-orm'

import { event } from '../../db/schema'
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

  const events = await db
    .select()
    .from(event)
    .where(
      and(gte(event.startTimestamp, start), lte(event.startTimestamp, end))
    )
    .orderBy(event.startTimestamp)

  return c.json(events.map(parseEvent))
})

export { eventsRouter }
