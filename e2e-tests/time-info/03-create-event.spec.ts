import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedDatabase,
  clearDatabase,
  getEventCount,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'
import { submitSignInForm } from '../support/form-helpers'

const validEvent = {
  startTimestamp: 738534,
  name: 'Test Event',
  basicDescription: 'A test event description',
  referenceUrls: ['https://example.com/reference'],
}

test.describe('POST /time-info/new-event', () => {
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
    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: validEvent,
    })

    expect(response.url()).toContain('/auth/sign-in')
  })

  test('creates event when authenticated', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: validEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(201)
    const event = await response.json()
    expect(event.name).toBe('Test Event')
    expect(event.startTimestamp).toBe(738534)
    expect(event.id).toBeDefined()
    expect(event.createdAt).toBeDefined()

    const count = await getEventCount()
    expect(count).toBe(1)
  })

  test('creates event with all optional fields', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const fullEvent = {
      ...validEvent,
      endTimestamp: 738535,
      longerDescription: 'A longer description of the test event',
      relatedEventIds: ['related-1', 'related-2'],
    }

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: fullEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(201)
    const event = await response.json()
    expect(event.endTimestamp).toBe(738535)
    expect(event.longerDescription).toBe(
      'A longer description of the test event'
    )
    expect(event.relatedEventIds).toEqual(['related-1', 'related-2'])
  })

  test('returns 400 for missing required fields', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { name: 'Incomplete Event' },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(Array.isArray(body.error)).toBe(true)
  })

  test('returns 400 for invalid URL in referenceUrls', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { ...validEvent, referenceUrls: ['not-a-valid-url'] },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
  })

  test('returns 400 for empty referenceUrls array', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/private/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { ...validEvent, referenceUrls: [] },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
  })
})
