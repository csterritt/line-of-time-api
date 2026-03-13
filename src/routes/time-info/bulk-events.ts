/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'

import { insertBulkEvents } from '../../lib/db-access'
import { AppEnv } from '../../local-types'
import { validateBulkEvents } from '../../validators/bulk-event-validator'

const bulkEventsRouter = new Hono<AppEnv>()

bulkEventsRouter.post('/', async (c) => {
  const db = c.get('db')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const validation = validateBulkEvents(body)

  if (!validation.valid) {
    return c.json({ error: validation.error }, 400)
  }

  const uploadSecret = c.env.UPLOAD_SECRET
  if (!uploadSecret || uploadSecret.trim() === '') {
    console.error('UPLOAD_SECRET environment variable is not set')
    return c.json({ error: 'Server configuration error' }, 500)
  }

  console.log('Received token:', JSON.stringify(validation.token))
  console.log('Expected token:', JSON.stringify(uploadSecret))
  console.log('Match:', validation.token === uploadSecret)

  if (validation.token !== uploadSecret) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const eventsToInsert = validation.events!.map((event) => ({
    id: event.id,
    startTimestamp: event.startTimestamp,
    endTimestamp: event.endTimestamp,
    name: event.name,
    basicDescription: event.basicDescription,
    referenceUrl: event.referenceUrl,
    relatedEventIds: event.relatedEventIds
      ? JSON.stringify(event.relatedEventIds)
      : null,
    eventType: event.eventType,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }))

  const insertResult = await insertBulkEvents(db, eventsToInsert)

  if (insertResult.isErr) {
    console.error('Failed to insert bulk events:', insertResult.error)
    return c.json({ error: insertResult.error.message }, 400)
  }

  return c.json(
    {
      success: true,
      count: insertResult.value,
    },
    201
  )
})

export { bulkEventsRouter }
