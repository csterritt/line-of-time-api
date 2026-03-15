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
  referenceUrl: 'https://example.com/reference',
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
    await page.waitForURL(/\/ui/)

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
    expect(event.endTimestamp).toBeNull()
    expect(event.id).toBeDefined()
    expect(event.createdAt).toBeDefined()

    const count = await getEventCount()
    expect(count).toBe(1)
  })

  test('creates event with all optional fields', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const fullEvent = {
      ...validEvent,
      endTimestamp: 738535,
      relatedEventIds: ['related-1', 'related-2'],
    }

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: fullEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(201)
    const event = await response.json()
    expect(event.endTimestamp).toBe(738535)
    expect(event.relatedEventIds).toEqual(['related-1', 'related-2'])
  })

  test('returns 400 for missing required fields', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

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

  test('returns 400 for invalid URL in referenceUrl', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { ...validEvent, referenceUrl: 'not-a-valid-url' },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
  })

  test('returns 400 for empty referenceUrl string', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { ...validEvent, referenceUrl: '' },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
  })

  test('returns 400 when startTimestamp is after endTimestamp', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { ...validEvent, endTimestamp: 738533 },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(
      body.error.some((e: string) =>
        e.includes(
          'endTimestamp must be greater than or equal to startTimestamp'
        )
      )
    ).toBe(true)

    const count = await getEventCount()
    expect(count).toBe(0)
  })

  test("creates event with eventType 'person' and response contains that eventType", async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { ...validEvent, eventType: 'person' },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(201)
    const event = await response.json()
    expect(event.eventType).toBe('person')
  })

  test("creates event with eventType 'event' and response contains that eventType", async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: { ...validEvent, eventType: 'event' },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(201)
    const event = await response.json()
    expect(event.eventType).toBe('event')
  })

  test('eventType is persisted and readable via GET after creation', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const createResponse = await request.post(
      `${BASE_URLS.TIME_INFO_NEW_EVENT}`,
      {
        data: { ...validEvent, eventType: 'person' },
        headers: { Cookie: cookieHeader },
      }
    )

    expect(createResponse.status()).toBe(201)
    const created = await createResponse.json()
    expect(created.id).toBeDefined()

    const getResponse = await request.get(
      `${BASE_URLS.TIME_INFO_EVENT}/${created.id}`
    )
    expect(getResponse.status()).toBe(200)
    const fetched = await getResponse.json()
    expect(fetched.eventType).toBe('person')
  })

  test('eventType defaults to null when omitted from creation', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: validEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(201)
    const event = await response.json()
    expect(event.eventType).toBeNull()
  })
})
