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
import { dateComponentsToTimestamp } from '../../lib/timestamp'

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

  const startTime = new Date(body.startTimestamp)
  const startTimestamp = dateComponentsToTimestamp({
    year: startTime.getFullYear(),
    month: startTime.getMonth() + 1,
    day: startTime.getDate(),
  })

  const endTimestamp = body.endTimestamp
    ? (() => {
        const endTime = new Date(body.endTimestamp)
        const endComponents = {
          year: endTime.getFullYear(),
          month: endTime.getMonth() + 1,
          day: endTime.getDate(),
        }
        return dateComponentsToTimestamp(endComponents)
      })()
    : null

  const newEvent = {
    id,
    startTimestamp: startTimestamp,
    endTimestamp,
    name: body.name,
    basicDescription: body.basicDescription,
    referenceUrls: JSON.stringify(body.referenceUrls),
    relatedEventIds: body.relatedEventIds
      ? JSON.stringify(body.relatedEventIds)
      : null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(event).values(newEvent)

  return c.json(
    parseEvent({
      ...newEvent,
      referenceUrls: newEvent.referenceUrls,
      relatedEventIds: newEvent.relatedEventIds,
    }),
    201
  )
})

export { newEventRouter }
