import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedEvents,
  seedDatabase,
  clearDatabase,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

const BASE_URL = 'http://localhost:3000'

const updatedEvent = {
  startTimestamp: 719164,
  name: 'Updated Moon Landing',
  basicDescription: 'Updated description',
  referenceUrls: ['https://example.com/updated'],
}

test.describe('PUT /time-info/event/:id', () => {
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

  test('requires authentication', async ({ request }) => {
    const response = await request.put(
      `${BASE_URL}/time-info/event/test-event-1`,
      {
        data: updatedEvent,
      }
    )

    expect(response.url()).toContain('/auth/sign-in')
  })

  test('updates event when authenticated', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.put(
      `${BASE_URL}/time-info/event/test-event-1`,
      {
        data: updatedEvent,
        headers: { Cookie: cookieHeader },
      }
    )

    expect(response.status()).toBe(200)
    const event = await response.json()
    expect(event.name).toBe('Updated Moon Landing')
    expect(event.basicDescription).toBe('Updated description')
    expect(event.id).toBe('test-event-1')
  })

  test('preserves createdAt on update', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const getResponse = await request.get(
      `${BASE_URL}/time-info/event/test-event-1`
    )
    const originalEvent = await getResponse.json()

    const updateResponse = await request.put(
      `${BASE_URL}/time-info/event/test-event-1`,
      {
        data: updatedEvent,
        headers: { Cookie: cookieHeader },
      }
    )

    const updatedEventResult = await updateResponse.json()
    expect(updatedEventResult.createdAt).toBe(originalEvent.createdAt)
    expect(updatedEventResult.updatedAt).not.toBe(originalEvent.updatedAt)
  })

  test('returns 404 for non-existent event', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.put(
      `${BASE_URL}/time-info/event/non-existent-id`,
      {
        data: updatedEvent,
        headers: { Cookie: cookieHeader },
      }
    )

    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Event not found')
  })

  test('returns 400 for invalid input', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.put(
      `${BASE_URL}/time-info/event/test-event-1`,
      {
        data: { name: 'Missing required fields' },
        headers: { Cookie: cookieHeader },
      }
    )

    expect(response.status()).toBe(400)
  })
})
