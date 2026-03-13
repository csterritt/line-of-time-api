/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { validateEventInput } from './event-validator'

interface BulkEventInput {
  id?: string
  start_timestamp: number
  end_timestamp?: number | null
  name: string
  basic_description: string
  reference_url: string
  related_event_ids?: string[] | null
  event_type?: string | null
  created_at?: string
  updated_at?: string
}

interface BulkValidationResult {
  valid: boolean
  error?: string
  token?: string
  events?: Array<{
    id: string
    startTimestamp: number
    endTimestamp: number | null
    name: string
    basicDescription: string
    referenceUrl: string
    relatedEventIds: string[] | null
    eventType: string | null
    createdAt: string
    updatedAt: string
  }>
}

const MAX_BULK_SIZE = 1000

const transformToCamelCase = (
  event: BulkEventInput
): {
  startTimestamp: number
  endTimestamp?: number | null
  name: string
  basicDescription: string
  referenceUrl: string
  relatedEventIds?: string[] | null
  eventType?: string | null
} => ({
  startTimestamp: event.start_timestamp,
  endTimestamp: event.end_timestamp,
  name: event.name,
  basicDescription: event.basic_description,
  referenceUrl: event.reference_url,
  relatedEventIds: event.related_event_ids,
  eventType: event.event_type,
})

export const validateBulkEvents = (input: unknown): BulkValidationResult => {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Input must be an object with token and events' }
  }

  const data = input as Record<string, unknown>

  if (typeof data.token !== 'string' || data.token.trim() === '') {
    return { valid: false, error: 'Token is required and must be a non-empty string' }
  }

  if (!Array.isArray(data.events)) {
    return { valid: false, error: 'Events must be an array' }
  }

  const events = data.events as BulkEventInput[]

  if (events.length === 0) {
    return { valid: false, error: 'Cannot upload empty array of events' }
  }

  if (events.length > MAX_BULK_SIZE) {
    return {
      valid: false,
      error: `Batch size exceeds maximum of ${MAX_BULK_SIZE} events`,
    }
  }

  const referenceUrls = new Set<string>()
  const validatedEvents: BulkValidationResult['events'] = []

  for (let i = 0; i < events.length; i++) {
    const event = events[i] as BulkEventInput

    const camelCaseEvent = transformToCamelCase(event)
    const validation = validateEventInput(camelCaseEvent)

    if (!validation.valid) {
      return {
        valid: false,
        error: `Event ${i}: ${validation.errors.join(', ')}`,
      }
    }

    if (referenceUrls.has(event.reference_url)) {
      return {
        valid: false,
        error: `Duplicate reference_url found in batch: ${event.reference_url}`,
      }
    }

    referenceUrls.add(event.reference_url)

    const now = new Date().toISOString()
    const id = event.id || crypto.randomUUID()

    validatedEvents.push({
      id,
      startTimestamp: event.start_timestamp,
      endTimestamp: event.end_timestamp ?? null,
      name: event.name,
      basicDescription: event.basic_description,
      referenceUrl: event.reference_url,
      relatedEventIds: event.related_event_ids ?? null,
      eventType: event.event_type ?? null,
      createdAt: event.created_at || now,
      updatedAt: event.updated_at || now,
    })
  }

  return { valid: true, token: data.token as string, events: validatedEvents }
}
