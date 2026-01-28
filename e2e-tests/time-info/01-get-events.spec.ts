import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedEvents,
  seedDatabase,
  clearDatabase,
} from '../support/db-helpers'

const BASE_URL = 'http://localhost:3000'

test.describe('GET /time-info/events/:start/:end', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    await clearEvents()
  })

  test.afterEach(async () => {
    await clearEvents()
    await clearDatabase()
  })

  test('returns empty array when no events exist in range', async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}/time-info/events/0/100`)

    expect(response.status()).toBe(200)
    const events = await response.json()
    expect(events).toEqual([])
  })

  test('returns events within timestamp range ordered by startTimestamp', async ({
    request,
  }) => {
    await seedEvents()

    const response = await request.get(`${BASE_URL}/time-info/events/0/800000`)

    expect(response.status()).toBe(200)
    const events = await response.json()
    expect(events).toHaveLength(3)
    expect(events[0].name).toBe('US Declaration of Independence')
    expect(events[1].name).toBe('World War II')
    expect(events[2].name).toBe('Moon Landing')
  })

  test('filters events by timestamp range', async ({ request }) => {
    await seedEvents()

    const response = await request.get(
      `${BASE_URL}/time-info/events/700000/720000`
    )

    expect(response.status()).toBe(200)
    const events = await response.json()
    expect(events).toHaveLength(2)
    expect(events[0].name).toBe('World War II')
    expect(events[1].name).toBe('Moon Landing')
  })

  test('returns events with correct structure', async ({ request }) => {
    await seedEvents()

    const response = await request.get(`${BASE_URL}/time-info/events/0/800000`)

    expect(response.status()).toBe(200)
    const events = await response.json()
    const event = events.find(
      (e: { name: string }) => e.name === 'Moon Landing'
    )

    expect(event).toMatchObject({
      id: 'test-event-1',
      startTimestamp: 719163,
      endTimestamp: null,
      name: 'Moon Landing',
      basicDescription: 'First human on the moon',
      longerDescription:
        'Apollo 11 was the American spaceflight that first landed humans on the Moon.',
    })
    expect(event.referenceUrls).toEqual([
      'https://en.wikipedia.org/wiki/Apollo_11',
    ])
    expect(event.relatedEventIds).toEqual([])
    expect(event.createdAt).toBeDefined()
    expect(event.updatedAt).toBeDefined()
  })

  test('returns 400 for invalid start parameter', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/time-info/events/invalid/100`
    )

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('valid integers')
  })

  test('returns 400 when start is greater than end', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events/100/50`)

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('less than or equal')
  })

  test('does not require authentication', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events/0/100`)

    expect(response.status()).toBe(200)
  })
})
