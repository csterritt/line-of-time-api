import { expect, test } from '@playwright/test'
import {
  clearDatabase,
  seedDatabase,
  clearEvents,
  seedEvents,
} from '../support/db-helpers'
import { submitSignInForm } from '../support/form-helpers'
import {
  clickLink,
  fillInput,
  isElementVisible,
  getElementText,
} from '../support/finders'
import { BASE_URLS, TEST_USERS } from '../support/test-data'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
})

test.afterEach(async () => {
  await clearEvents()
  await clearDatabase()
})

test('"Add a new event" button not visible when not signed in', async ({
  page,
}) => {
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

test('clicking "Add a new event" navigates to search page with only name and search button', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="add-event-action"]')
  await clickLink(page, 'add-event-action')

  await page.waitForSelector('[data-testid="name-input"]')
  expect(await isElementVisible(page, 'name-input')).toBe(true)
  expect(await isElementVisible(page, 'search-wikipedia-action')).toBe(true)
  expect(await isElementVisible(page, 'basic-description-input')).toBe(false)
  expect(await isElementVisible(page, 'start-timestamp-input')).toBe(false)
  expect(await isElementVisible(page, 'reference-url-input')).toBe(false)
  expect(await isElementVisible(page, 'create-event-action')).toBe(false)
})

test('searching Wikipedia for a known term redirects to new-event page with pre-filled fields', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  expect(page.url()).toContain('/ui/new-event')
  expect(await isElementVisible(page, 'basic-description-input')).toBe(true)
  expect(await isElementVisible(page, 'start-timestamp-input')).toBe(true)
  expect(await isElementVisible(page, 'reference-url-input')).toBe(true)
  expect(await isElementVisible(page, 'create-event-action')).toBe(true)
  expect(await isElementVisible(page, 'wiki-text-preview')).toBe(true)
  expect(await isElementVisible(page, 'wiki-links-list')).toBe(true)

  const descriptionValue = await page
    .getByTestId('basic-description-input')
    .inputValue()
  expect(descriptionValue.length).toBeGreaterThan(0)
})

test('searching Wikipedia for gibberish shows nothing found error on search page', async ({
  page,
}) => {
  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Aldjkfaljdsfaljsdfalsdjf')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="error-message"]', {
    timeout: 15000,
  })
  expect(page.url()).toContain('/ui/search')
  expect(await getElementText(page, 'error-message')).toContain('Nothing found')
  expect(await isElementVisible(page, 'basic-description-input')).toBe(false)
  expect(await isElementVisible(page, 'create-event-action')).toBe(false)
})

test('pressing Enter in name field triggers Wikipedia search', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await page.getByTestId('name-input').press('Enter')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  expect(page.url()).toContain('/ui/new-event')
  expect(await isElementVisible(page, 'basic-description-input')).toBe(true)
})

test('name and reference URL are read-only on new-event page', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  const nameInput = page.getByTestId('name-input')
  const refUrlInput = page.getByTestId('reference-url-input')

  expect(await nameInput.getAttribute('readonly')).not.toBeNull()
  expect(await refUrlInput.getAttribute('readonly')).not.toBeNull()
})

test('"Search again" button navigates back to search page with empty fields', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="search-again-action"]', {
    timeout: 15000,
  })
  await clickLink(page, 'search-again-action')

  await page.waitForSelector('[data-testid="name-input"]')
  expect(page.url()).toContain('/ui/search')

  const nameValue = await page.getByTestId('name-input').inputValue()
  expect(nameValue).toBe('')
})

test('Wikipedia Text Preview and Related Links sections are scrollable', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="wiki-text-preview"]', {
    timeout: 15000,
  })

  const textPreviewOverflow = await page
    .getByTestId('wiki-text-preview')
    .evaluate((el) => getComputedStyle(el).overflowY)
  expect(textPreviewOverflow).toBe('auto')

  const linksOverflow = await page
    .getByTestId('wiki-links-list')
    .evaluate((el) => getComputedStyle(el).overflowY)
  expect(linksOverflow).toBe('auto')
})

test('"Search again" button text says "Search again" not "Search Wikipedia"', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="search-again-action"]', {
    timeout: 15000,
  })
  const buttonText = await getElementText(page, 'search-again-action')
  expect(buttonText).toContain('Search again')
})

test('successfully creating an event redirects to home with success message and event in list', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  await fillInput(page, 'start-timestamp-input', '2026-06-15T10:00')

  await clickLink(page, 'create-event-action')

  await page.waitForSelector('[data-testid="success-message"]')
  expect(await getElementText(page, 'success-message')).toContain(
    'Event created successfully'
  )
  expect(await isElementVisible(page, 'welcome-message')).toBe(true)
  expect(await isElementVisible(page, 'event-list')).toBe(true)
  expect(await getElementText(page, 'event-list')).toContain('Mercury')
})

test('creating event without signing in shows error', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  await fillInput(page, 'start-timestamp-input', '2026-06-15T10:00')

  await clickLink(page, 'create-event-action')

  await page.waitForSelector('[data-testid="error-message"]')
  expect(await isElementVisible(page, 'error-message')).toBe(true)
})

test('navigating directly to /ui/new-event without search redirects to search page', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/new-event`)
  await page.waitForSelector('[data-testid="name-input"]')
  expect(page.url()).toContain('/ui/search')
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

test('shows "No events yet" when signed in with no events', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="no-events-message"]')
  expect(await getElementText(page, 'no-events-message')).toContain(
    'No events yet'
  )
})
