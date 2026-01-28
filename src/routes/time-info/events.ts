/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { eq } from 'drizzle-orm'

import { event } from '../../db/schema'
import { AppEnv } from '../../local-types'
import { signedInAccess } from '../../middleware/signed-in-access'
import { validateEventInput, EventInput } from '../../validators/event-validator'

const eventsRouter = new Hono<AppEnv>()

interface EventResponse {
  id: string
  startDate: string
  endDate: string | null
  name: string
  basicDescription: string
  longerDescription: string | null
  referenceUrls: string[]
  relatedEventIds: string[]
  createdAt: string
  updatedAt: string
}

const parseEvent = (dbEvent: typeof event.$inferSelect): EventResponse => ({
  id: dbEvent.id,
  startDate: dbEvent.startDate,
  endDate: dbEvent.endDate,
  name: dbEvent.name,
  basicDescription: dbEvent.basicDescription,
  longerDescription: dbEvent.longerDescription,
  referenceUrls: JSON.parse(dbEvent.referenceUrls) as string[],
  relatedEventIds: dbEvent.relatedEventIds
    ? (JSON.parse(dbEvent.relatedEventIds) as string[])
    : [],
  createdAt: dbEvent.createdAt,
  updatedAt: dbEvent.updatedAt,
})

eventsRouter.get('/', async (c) => {
  const db = c.get('db')
  const events = await db.select().from(event).orderBy(event.startDate)

  return c.json(events.map(parseEvent))
})

eventsRouter.get('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const events = await db.select().from(event).where(eq(event.id, id))

  if (events.length === 0) {
    return c.json({ error: 'Event not found' }, 404)
  }

  return c.json(parseEvent(events[0]))
})

eventsRouter.post('/', signedInAccess, async (c) => {
  const db = c.get('db')
  const body = await c.req.json<EventInput>()
  const validation = validateEventInput(body)

  if (!validation.valid) {
    return c.json({ error: validation.errors }, 400)
  }

  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  const newEvent = {
    id,
    startDate: body.startDate,
    endDate: body.endDate ?? null,
    name: body.name,
    basicDescription: body.basicDescription,
    longerDescription: body.longerDescription ?? null,
    referenceUrls: JSON.stringify(body.referenceUrls),
    relatedEventIds: body.relatedEventIds
      ? JSON.stringify(body.relatedEventIds)
      : null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(event).values(newEvent)

  return c.json(parseEvent({ ...newEvent, referenceUrls: newEvent.referenceUrls, relatedEventIds: newEvent.relatedEventIds }), 200)
})

eventsRouter.put('/:id', signedInAccess, async (c) => {
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
    startDate: body.startDate,
    endDate: body.endDate ?? null,
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

eventsRouter.delete('/:id', signedInAccess, async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const existing = await db.select().from(event).where(eq(event.id, id))

  if (existing.length === 0) {
    return c.json({ error: 'Event not found' }, 404)
  }

  await db.delete(event).where(eq(event.id, id))

  return c.json({ success: true }, 200)
})

export { eventsRouter }
