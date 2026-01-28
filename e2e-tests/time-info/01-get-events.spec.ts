import { test, expect } from '@playwright/test'

import { clearEvents, seedEvents, seedDatabase, clearDatabase } from '../support/db-helpers'

const BASE_URL = 'http://localhost:3000'

test.describe('GET /time-info/events', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    await clearEvents()
  })

  test.afterEach(async () => {
    await clearEvents()
    await clearDatabase()
  })

  test('returns empty array when no events exist', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events`)

    expect(response.status()).toBe(200)
    const events = await response.json()
    expect(events).toEqual([])
  })

  test('returns all events ordered by start date', async ({ request }) => {
    await seedEvents()

    const response = await request.get(`${BASE_URL}/time-info/events`)

    expect(response.status()).toBe(200)
    const events = await response.json()
    expect(events).toHaveLength(3)
    expect(events[0].name).toBe('US Declaration of Independence')
    expect(events[1].name).toBe('World War II')
    expect(events[2].name).toBe('Moon Landing')
  })

  test('returns events with correct structure', async ({ request }) => {
    await seedEvents()

    const response = await request.get(`${BASE_URL}/time-info/events`)

    expect(response.status()).toBe(200)
    const events = await response.json()
    const event = events.find((e: { name: string }) => e.name === 'Moon Landing')

    expect(event).toMatchObject({
      id: 'test-event-1',
      startDate: '1969-07-20T00:00:00.000Z',
      endDate: null,
      name: 'Moon Landing',
      basicDescription: 'First human on the moon',
      longerDescription: 'Apollo 11 was the American spaceflight that first landed humans on the Moon.',
    })
    expect(event.referenceUrls).toEqual(['https://en.wikipedia.org/wiki/Apollo_11'])
    expect(event.relatedEventIds).toEqual([])
    expect(event.createdAt).toBeDefined()
    expect(event.updatedAt).toBeDefined()
  })

  test('does not require authentication', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events`)

    expect(response.status()).toBe(200)
  })
})
