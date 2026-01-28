import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedDatabase,
  clearDatabase,
  getEventCount,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

const BASE_URL = 'http://localhost:3000'

const validEvent = {
  startDate: '2024-01-15T00:00:00.000Z',
  name: 'Test Event',
  basicDescription: 'A test event description',
  referenceUrls: ['https://example.com/reference'],
}

test.describe('POST /time-info/events', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    await clearEvents()
  })

  test.afterEach(async () => {
    await clearEvents()
    await clearDatabase()
  })

  test('requires authentication', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/time-info/events`, {
      data: validEvent,
    })

    expect(response.status()).toBe(302)
  })

  test('creates event when authenticated', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URL}/time-info/events`, {
      data: validEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(200)
    const event = await response.json()
    expect(event.name).toBe('Test Event')
    expect(event.id).toBeDefined()
    expect(event.createdAt).toBeDefined()

    const count = await getEventCount()
    expect(count).toBe(1)
  })

  test('creates event with all optional fields', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const fullEvent = {
      ...validEvent,
      endDate: '2024-01-16T00:00:00.000Z',
      longerDescription: 'A longer description of the test event',
      relatedEventIds: ['related-1', 'related-2'],
    }

    const response = await request.post(`${BASE_URL}/time-info/events`, {
      data: fullEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(200)
    const event = await response.json()
    expect(event.endDate).toBe('2024-01-16T00:00:00.000Z')
    expect(event.longerDescription).toBe('A longer description of the test event')
    expect(event.relatedEventIds).toEqual(['related-1', 'related-2'])
  })

  test('returns 400 for missing required fields', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URL}/time-info/events`, {
      data: { name: 'Incomplete Event' },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(Array.isArray(body.error)).toBe(true)
  })

  test('returns 400 for invalid URL in referenceUrls', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URL}/time-info/events`, {
      data: { ...validEvent, referenceUrls: ['not-a-valid-url'] },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
  })

  test('returns 400 for empty referenceUrls array', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URL}/time-info/events`, {
      data: { ...validEvent, referenceUrls: [] },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
  })
})
