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
  longerDescription: string | null
  referenceUrls: string[]
  relatedEventIds: string[]
  createdAt: string
  updatedAt: string
}

export const parseEvent = (dbEvent: typeof event.$inferSelect): EventResponse => ({
  id: dbEvent.id,
  startTimestamp: dbEvent.startTimestamp,
  endTimestamp: dbEvent.endTimestamp,
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
