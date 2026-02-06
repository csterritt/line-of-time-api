import { expect, test } from '@playwright/test'
import { clearDatabase, seedDatabase, clearEvents, seedEvents } from '../support/db-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { clickLink, fillInput, isElementVisible, getElementText } from '../support/finders'
import { BASE_URLS, TEST_USERS } from '../support/test-data'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
})

test.afterEach(async () => {
  await clearEvents()
  await clearDatabase()
})

test('"Add a new event" button not visible when not signed in', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="sign-in-prompt"]')
  expect(await isElementVisible(page, 'add-event-action')).toBe(false)
})

test('"Add a new event" button visible when signed in', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="welcome-message"]')
  expect(await isElementVisible(page, 'add-event-action')).toBe(true)
})

test('clicking "Add a new event" navigates to new event form', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="add-event-action"]')
  await clickLink(page, 'add-event-action')

  await page.waitForSelector('[data-testid="name-input"]')
  expect(await isElementVisible(page, 'name-input')).toBe(true)
  expect(await isElementVisible(page, 'basic-description-input')).toBe(true)
  expect(await isElementVisible(page, 'start-timestamp-input')).toBe(true)
  expect(await isElementVisible(page, 'reference-url-input')).toBe(true)
  expect(await isElementVisible(page, 'create-event-action')).toBe(true)
})

test('successfully creating an event redirects to home with success message and event in list', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/new-event`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Test Event')
  await fillInput(page, 'basic-description-input', 'A test event description')
  await fillInput(page, 'start-timestamp-input', '2026-06-15T10:00')
  await fillInput(page, 'reference-url-input', 'https://example.com')

  await clickLink(page, 'create-event-action')

  await page.waitForSelector('[data-testid="success-message"]')
  expect(await getElementText(page, 'success-message')).toContain('Event created successfully')
  expect(await isElementVisible(page, 'welcome-message')).toBe(true)
  expect(await isElementVisible(page, 'event-list')).toBe(true)
  expect(await getElementText(page, 'event-list')).toContain('Test Event')
})

test('creating event without signing in shows error', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/new-event`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Test Event')
  await fillInput(page, 'basic-description-input', 'A test event description')
  await fillInput(page, 'start-timestamp-input', '2026-06-15T10:00')
  await fillInput(page, 'reference-url-input', 'https://example.com')

  await clickLink(page, 'create-event-action')

  await page.waitForSelector('[data-testid="error-message"]')
  expect(await isElementVisible(page, 'error-message')).toBe(true)
})

test('event list shows seeded events when signed in', async ({ page }) => {
  await seedEvents()

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')
  expect(await isElementVisible(page, 'event-list')).toBe(true)

  const items = page.locator('[data-testid="event-item"]')
  expect(await items.count()).toBeGreaterThan(0)
})

test('event list not shown when not signed in', async ({ page }) => {
  await seedEvents()

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="sign-in-prompt"]')
  expect(await isElementVisible(page, 'event-list')).toBe(false)
})

test('shows "No events yet" when signed in with no events', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="no-events-message"]')
  expect(await getElementText(page, 'no-events-message')).toContain('No events yet')
})
