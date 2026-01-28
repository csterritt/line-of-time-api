import { test, expect } from '@playwright/test'

import { clearEvents, seedEvents, seedDatabase, clearDatabase } from '../support/db-helpers'

const BASE_URL = 'http://localhost:3000'

test.describe('GET /time-info/events/:id', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    await clearEvents()
    await seedEvents()
  })

  test.afterEach(async () => {
    await clearEvents()
    await clearDatabase()
  })

  test('returns event by ID', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events/test-event-1`)

    expect(response.status()).toBe(200)
    const event = await response.json()
    expect(event.id).toBe('test-event-1')
    expect(event.name).toBe('Moon Landing')
    expect(event.basicDescription).toBe('First human on the moon')
  })

  test('returns 404 for non-existent event', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events/non-existent-id`)

    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Event not found')
  })

  test('returns event with all fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events/test-event-2`)

    expect(response.status()).toBe(200)
    const event = await response.json()

    expect(event).toMatchObject({
      id: 'test-event-2',
      startDate: '1939-09-01T00:00:00.000Z',
      endDate: '1945-09-02T00:00:00.000Z',
      name: 'World War II',
      basicDescription: 'Global war from 1939 to 1945',
      longerDescription: null,
    })
    expect(event.referenceUrls).toEqual(['https://en.wikipedia.org/wiki/World_War_II'])
  })

  test('does not require authentication', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/time-info/events/test-event-1`)

    expect(response.status()).toBe(200)
  })
})
