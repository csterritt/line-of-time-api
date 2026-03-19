import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedEvents,
  seedDatabase,
  clearDatabase,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'
import { submitSignInForm } from '../support/form-helpers'

const editedEvent = {
  startTimestamp: 2451545,
  name: 'Edited Moon Landing',
  basicDescription: 'Edited description',
  referenceUrl: 'https://example.com/edited',
}

const EDIT_EVENT_URL = 'http://localhost:3000/time-info/edit-event'

test.describe('POST /time-info/edit-event/:id', () => {
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

  test('requires admin - rejects non-admin user with 403', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${EDIT_EVENT_URL}/test-event-1`, {
      data: editedEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(403)
  })

  test('requires authentication - redirects unauthenticated user', async ({ request }) => {
    const response = await request.post(`${EDIT_EVENT_URL}/test-event-1`, {
      data: editedEvent,
    })

    expect(response.url()).toContain('/auth/sign-in')
  })

  test('admin can edit an event', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${EDIT_EVENT_URL}/test-event-1`, {
      data: editedEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(200)
    const event = await response.json()
    expect(event.name).toBe('Edited Moon Landing')
    expect(event.basicDescription).toBe('Edited description')
    expect(event.id).toBe('test-event-1')
  })

  test('preserves createdAt on edit', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const getResponse = await request.get(`${BASE_URLS.TIME_INFO_EVENT}/test-event-1`)
    const originalEvent = await getResponse.json()

    const editResponse = await request.post(`${EDIT_EVENT_URL}/test-event-1`, {
      data: editedEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(editResponse.status()).toBe(200)
    const editedResult = await editResponse.json()
    expect(editedResult.createdAt).toBe(originalEvent.createdAt)
    expect(editedResult.updatedAt).not.toBe(originalEvent.updatedAt)
  })

  test('returns 404 for non-existent event', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${EDIT_EVENT_URL}/non-existent-id`, {
      data: editedEvent,
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Event not found')
  })

  test('returns 400 for invalid input', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${EDIT_EVENT_URL}/test-event-1`, {
      data: { name: 'Missing required fields' },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
  })

  test('returns 400 when startTimestamp is after endTimestamp', async ({ page, request }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const response = await request.post(`${EDIT_EVENT_URL}/test-event-1`, {
      data: { ...editedEvent, endTimestamp: 2451544 },
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(
      body.error.some((e: string) =>
        e.includes('endTimestamp must be greater than or equal to startTimestamp')
      )
    ).toBe(true)
  })
})
