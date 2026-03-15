import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedDatabase,
  clearDatabase,
  getEventCount,
} from '../support/db-helpers'
import { BASE_URLS } from '../support/test-data'

const TEST_TOKEN = 'test-upload-secret-token'

const validBulkEvents = [
  {
    id: '92d620c9-a643-4165-ba92-3c863a31f7d3',
    start_timestamp: 635085,
    end_timestamp: 638369,
    name: "War of Jenkins' Ear",
    basic_description:
      "The War of Jenkins' Ear was fought between Great Britain and Spain from 1739 to 1748.",
    reference_url: "https://en.wikipedia.org/wiki/War_of_Jenkins'_Ear",
    related_event_ids: null,
    event_type: 'one-time-event',
    created_at: '2026-02-10T00:31:40.230Z',
    updated_at: '2026-02-10T00:31:40.230Z',
  },
  {
    id: 'e6242e89-6d5d-4613-a203-278e40797a25',
    start_timestamp: 697648,
    end_timestamp: 731736,
    name: 'Ronald Reagan',
    basic_description:
      'Ronald Wilson Reagan (February 6, 1911 – June 5, 2004) was an American politician and actor.',
    reference_url: 'https://en.wikipedia.org/wiki/Ronald_Reagan',
    related_event_ids: null,
    event_type: 'person',
    created_at: '2026-02-08T23:17:33.772Z',
    updated_at: '2026-02-08T23:17:33.772Z',
  },
]

test.describe('POST /time-info/bulk-events', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    await clearEvents()
  })

  test.afterEach(async () => {
    await clearEvents()
    await clearDatabase()
  })

  test('returns 401 for missing token', async ({ request }) => {
    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { events: validBulkEvents },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('Token is required')
  })

  test('returns 401 for invalid token', async ({ request }) => {
    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: 'wrong-token', events: validBulkEvents },
      }
    )

    expect(response.status()).toBe(401)
    const result = await response.json()
    expect(result.error).toBe('Invalid token')
  })

  test('successfully inserts valid bulk events with correct token', async ({
    request,
  }) => {
    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: validBulkEvents },
      }
    )

    if (response.status() !== 201) {
      const errorBody = await response.json()
      console.log('Error response:', errorBody)
      console.log('Status:', response.status())
    }

    expect(response.status()).toBe(201)
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.count).toBe(2)

    const count = await getEventCount()
    expect(count).toBe(2)
  })

  test('returns 400 for missing events field', async ({ request }) => {
    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('Events must be an array')
  })

  test('returns 400 for non-array events', async ({ request }) => {
    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: 'not-an-array' },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('Events must be an array')
  })

  test('returns 400 for empty array', async ({ request }) => {
    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: [] },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('Cannot upload empty array')
  })

  test('returns 400 when any event is invalid', async ({ request }) => {
    const invalidBulk = [
      validBulkEvents[0],
      {
        ...validBulkEvents[1],
        name: '',
      },
    ]

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: invalidBulk },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toBeDefined()
    expect(result.error).toContain('Event 1')

    const count = await getEventCount()
    expect(count).toBe(0)
  })

  test('returns 400 for duplicate reference_url within batch', async ({
    request,
  }) => {
    const duplicateBulk = [
      validBulkEvents[0],
      {
        ...validBulkEvents[1],
        reference_url: validBulkEvents[0].reference_url,
      },
    ]

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: duplicateBulk },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toBeDefined()

    const count = await getEventCount()
    expect(count).toBe(0)
  })

  test('returns 400 when reference_url already exists in database', async ({
    request,
  }) => {
    await request.post(`${BASE_URLS.HOME}/time-info/bulk-events`, {
      data: { token: TEST_TOKEN, events: [validBulkEvents[0]] },
    })

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: validBulkEvents },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toBeDefined()

    const count = await getEventCount()
    expect(count).toBe(1)
  })

  test('returns 413 for batch exceeding body size limit', async ({
    request,
  }) => {
    const largeBulk = Array.from({ length: 1001 }, (_, i) => ({
      ...validBulkEvents[0],
      id: `event-${i}`,
      reference_url: `https://example.com/event-${i}`,
    }))

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: largeBulk },
      }
    )

    expect(response.status()).toBe(413)

    const count = await getEventCount()
    expect(count).toBe(0)
  })

  test('handles events with related_event_ids array', async ({ request }) => {
    const eventsWithRelated = [
      {
        ...validBulkEvents[0],
        related_event_ids: ['event-1', 'event-2'],
      },
    ]

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: eventsWithRelated },
      }
    )

    expect(response.status()).toBe(201)
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
  })

  test('handles events with null end_timestamp', async ({ request }) => {
    const eventsWithNullEnd = [
      {
        ...validBulkEvents[0],
        end_timestamp: null,
      },
    ]

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: eventsWithNullEnd },
      }
    )

    expect(response.status()).toBe(201)
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
  })

  test('returns 400 when a bulk event has startTimestamp after endTimestamp', async ({
    request,
  }) => {
    const invalidTimestampBulk = [
      {
        ...validBulkEvents[0],
        end_timestamp: 635084,
      },
    ]

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: invalidTimestampBulk },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toBeDefined()
    expect(result.error).toContain(
      'endTimestamp must be greater than or equal to startTimestamp'
    )

    const count = await getEventCount()
    expect(count).toBe(0)
  })

  test('validates each event with proper error messages', async ({
    request,
  }) => {
    const invalidBulk = [
      validBulkEvents[0],
      {
        ...validBulkEvents[1],
        reference_url: 'not-a-url',
      },
    ]

    const response = await request.post(
      `${BASE_URLS.HOME}/time-info/bulk-events`,
      {
        data: { token: TEST_TOKEN, events: invalidBulk },
      }
    )

    expect(response.status()).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('Event 1')
    expect(result.error).toContain('referenceUrl')
  })
})
