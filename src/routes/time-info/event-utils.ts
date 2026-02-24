/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { event } from '../../db/schema'

export interface EventResponse {
  id: string
  startTimestamp: number
  endTimestamp: number | null
  name: string
  basicDescription: string
  referenceUrl: string
  relatedEventIds: string[]
  eventType: string | null
  createdAt: string
  updatedAt: string
}

export const parseEvent = (
  dbEvent: typeof event.$inferSelect
): EventResponse => {
  let relatedEventIds: string[] = []
  if (dbEvent.relatedEventIds) {
    try {
      relatedEventIds = JSON.parse(dbEvent.relatedEventIds) as string[]
    } catch {
      console.error('Failed to parse relatedEventIds for event:', dbEvent.id)
      relatedEventIds = []
    }
  }

  return {
    id: dbEvent.id,
    startTimestamp: dbEvent.startTimestamp,
    endTimestamp: dbEvent.endTimestamp,
    name: dbEvent.name,
    basicDescription: dbEvent.basicDescription,
    referenceUrl: dbEvent.referenceUrl,
    relatedEventIds,
    eventType: dbEvent.eventType ?? null,
    createdAt: dbEvent.createdAt,
    updatedAt: dbEvent.updatedAt,
  }
}
