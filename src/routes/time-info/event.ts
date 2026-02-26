/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'

import {
  getEventById,
  updateEventById,
  deleteEventById,
} from '../../lib/db-access'
import { AppEnv } from '../../local-types'
import { signedInAccess } from '../../middleware/signed-in-access'
import {
  validateEventInput,
  EventInput,
} from '../../validators/event-validator'
import { parseEvent } from './event-utils'

const eventRouter = new Hono<AppEnv>()

eventRouter.get('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const eventResult = await getEventById(db, id)

  if (eventResult.isErr) {
    console.error('Failed to get event by id:', eventResult.error)
    return c.json({ error: 'Failed to get event' }, 500)
  }

  const foundEvent = eventResult.value

  if (foundEvent === null) {
    return c.json({ error: 'Event not found' }, 404)
  }

  return c.json(parseEvent(foundEvent))
})

eventRouter.put('/:id', signedInAccess, async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  let body: EventInput
  try {
    body = await c.req.json<EventInput>()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const validation = validateEventInput(body)

  if (!validation.valid) {
    return c.json({ error: validation.errors }, 400)
  }

  const existingResult = await getEventById(db, id)

  if (existingResult.isErr) {
    console.error('Failed to get existing event for update:', existingResult.error)
    return c.json({ error: 'Failed to update event' }, 500)
  }

  const existing = existingResult.value

  if (existing === null) {
    return c.json({ error: 'Event not found' }, 404)
  }

  const now = new Date().toISOString()

  const startTimestamp = body.startTimestamp
  const endTimestamp = body.endTimestamp ?? null

  const updatedEvent = {
    startTimestamp,
    endTimestamp,
    name: body.name,
    basicDescription: body.basicDescription,
    referenceUrl: body.referenceUrl,
    relatedEventIds: body.relatedEventIds
      ? JSON.stringify(body.relatedEventIds)
      : null,
    eventType: body.eventType ?? null,
    updatedAt: now,
  }

  const updateResult = await updateEventById(db, id, updatedEvent)

  if (updateResult.isErr) {
    console.error('Failed to update event:', updateResult.error)
    return c.json({ error: 'Failed to update event' }, 500)
  }

  return c.json(
    parseEvent({
      id,
      ...updatedEvent,
      createdAt: existing.createdAt,
    }),
    200
  )
})

eventRouter.delete('/:id', signedInAccess, async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const existingResult = await getEventById(db, id)

  if (existingResult.isErr) {
    console.error('Failed to get existing event for delete:', existingResult.error)
    return c.json({ error: 'Failed to delete event' }, 500)
  }

  const existing = existingResult.value

  if (existing === null) {
    return c.json({ error: 'Event not found' }, 404)
  }

  const deleteResult = await deleteEventById(db, id)

  if (deleteResult.isErr) {
    console.error('Failed to delete event:', deleteResult.error)
    return c.json({ error: 'Failed to delete event' }, 500)
  }

  return c.json({ success: true }, 200)
})

export { eventRouter }
