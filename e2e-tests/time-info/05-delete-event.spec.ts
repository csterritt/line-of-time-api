import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedEvents,
  seedDatabase,
  clearDatabase,
  getEventCount,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

const BASE_URL = 'http://localhost:3000'

test.describe('DELETE /time-info/events/:id', () => {
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
    const response = await request.delete(`${BASE_URL}/time-info/events/test-event-1`)

    expect(response.status()).toBe(302)
  })

  test('deletes event when authenticated', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const countBefore = await getEventCount()
    expect(countBefore).toBe(3)

    const response = await request.delete(`${BASE_URL}/time-info/events/test-event-1`, {
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)

    const countAfter = await getEventCount()
    expect(countAfter).toBe(2)
  })

  test('event is no longer retrievable after deletion', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    await request.delete(`${BASE_URL}/time-info/events/test-event-1`, {
      headers: { Cookie: cookieHeader },
    })

    const getResponse = await request.get(`${BASE_URL}/time-info/events/test-event-1`)
    expect(getResponse.status()).toBe(404)
  })

  test('returns 404 for non-existent event', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.delete(`${BASE_URL}/time-info/events/non-existent-id`, {
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Event not found')
  })

  test('cannot delete same event twice', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await page.fill('input[name="email"]', TEST_USERS.KNOWN_USER.email)
    await page.fill('input[name="password"]', TEST_USERS.KNOWN_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const firstDelete = await request.delete(`${BASE_URL}/time-info/events/test-event-1`, {
      headers: { Cookie: cookieHeader },
    })
    expect(firstDelete.status()).toBe(200)

    const secondDelete = await request.delete(`${BASE_URL}/time-info/events/test-event-1`, {
      headers: { Cookie: cookieHeader },
    })
    expect(secondDelete.status()).toBe(404)
  })
})
