/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'

import { event } from '../../db/schema'
import { AppEnv } from '../../local-types'
import { signedInAccess } from '../../middleware/signed-in-access'
import {
  validateEventInput,
  EventInput,
} from '../../validators/event-validator'
import { parseEvent } from './event-utils'

const newEventRouter = new Hono<AppEnv>()

newEventRouter.post('/', signedInAccess, async (c) => {
  const db = c.get('db')

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

  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  const startTimestamp = body.startTimestamp
  const endTimestamp = body.endTimestamp ?? null

  const newEvent = {
    id,
    startTimestamp: startTimestamp,
    endTimestamp,
    name: body.name,
    basicDescription: body.basicDescription,
    referenceUrl: body.referenceUrl,
    relatedEventIds: body.relatedEventIds
      ? JSON.stringify(body.relatedEventIds)
      : null,
    eventType: body.eventType ?? null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(event).values(newEvent)

  return c.json(
    parseEvent({
      ...newEvent,
      referenceUrl: newEvent.referenceUrl,
      relatedEventIds: newEvent.relatedEventIds,
    }),
    201
  )
})

export { newEventRouter }
