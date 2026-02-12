import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedEvents,
  seedDatabase,
  clearDatabase,
  getEventCount,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'
import { submitSignInForm } from '../support/form-helpers'

test.describe('DELETE /time-info/event/:id', () => {
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
    const response = await request.delete(
      `${BASE_URLS.TIME_INFO_EVENT}/test-event-1`
    )

    expect(
      [302, 303, 403].includes(response.status()) ||
        response.url().includes('/auth/sign-in')
    ).toBe(true)
  })

  test('deletes event when authenticated', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const countBefore = await getEventCount()
    expect(countBefore).toBe(3)

    // Use page.evaluate to make the DELETE request with the page's cookies
    const result = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      })
      return {
        status: response.status,
        body: await response.json(),
      }
    }, `${BASE_URLS.TIME_INFO_EVENT}/test-event-1`)

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)

    const countAfter = await getEventCount()
    expect(countAfter).toBe(2)
  })

  test('event is no longer retrievable after deletion', async ({
    page,
    request,
  }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    // Use page.evaluate to make the DELETE request with the page's cookies
    await page.evaluate(async (url) => {
      await fetch(url, { method: 'DELETE', credentials: 'include' })
    }, `${BASE_URLS.TIME_INFO_EVENT}/test-event-1`)

    const getResponse = await request.get(
      `${BASE_URLS.TIME_INFO_EVENT}/test-event-1`
    )
    expect(getResponse.status()).toBe(404)
  })

  test('returns 404 for non-existent event', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const result = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      })
      return { status: response.status, body: await response.json() }
    }, `${BASE_URLS.TIME_INFO_EVENT}/non-existent-id`)

    expect(result.status).toBe(404)
    expect(result.body.error).toBe('Event not found')
  })

  test('cannot delete same event twice', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const firstDelete = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      })
      return response.status
    }, `${BASE_URLS.TIME_INFO_EVENT}/test-event-1`)
    expect(firstDelete).toBe(200)

    const secondDelete = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      })
      return response.status
    }, `${BASE_URLS.TIME_INFO_EVENT}/test-event-1`)
    expect(secondDelete).toBe(404)
  })
})
