/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { eq } from 'drizzle-orm'

import { event } from '../../db/schema'
import { AppEnv } from '../../local-types'
import { signedInAccess } from '../../middleware/signed-in-access'
import { validateEventInput, EventInput } from '../../validators/event-validator'
import { parseEvent } from './event-utils'

const eventRouter = new Hono<AppEnv>()

eventRouter.get('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const events = await db.select().from(event).where(eq(event.id, id))

  if (events.length === 0) {
    return c.json({ error: 'Event not found' }, 404)
  }

  return c.json(parseEvent(events[0]))
})

eventRouter.put('/:id', signedInAccess, async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = await c.req.json<EventInput>()
  const validation = validateEventInput(body)

  if (!validation.valid) {
    return c.json({ error: validation.errors }, 400)
  }

  const existing = await db.select().from(event).where(eq(event.id, id))

  if (existing.length === 0) {
    return c.json({ error: 'Event not found' }, 404)
  }

  const now = new Date().toISOString()

  const updatedEvent = {
    startTimestamp: body.startTimestamp,
    endTimestamp: body.endTimestamp ?? null,
    name: body.name,
    basicDescription: body.basicDescription,
    longerDescription: body.longerDescription ?? null,
    referenceUrls: JSON.stringify(body.referenceUrls),
    relatedEventIds: body.relatedEventIds
      ? JSON.stringify(body.relatedEventIds)
      : null,
    updatedAt: now,
  }

  await db.update(event).set(updatedEvent).where(eq(event.id, id))

  return c.json(
    parseEvent({
      id,
      ...updatedEvent,
      createdAt: existing[0].createdAt,
    }),
    200
  )
})

eventRouter.delete('/:id', signedInAccess, async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const existing = await db.select().from(event).where(eq(event.id, id))

  if (existing.length === 0) {
    return c.json({ error: 'Event not found' }, 404)
  }

  await db.delete(event).where(eq(event.id, id))

  return c.json({ success: true }, 200)
})

export { eventRouter }
