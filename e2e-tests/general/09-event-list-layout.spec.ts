import { expect, test } from '@playwright/test'
import {
  clearDatabase,
  seedDatabase,
  clearEvents,
  seedEvents,
} from '../support/db-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { BASE_URLS, TEST_USERS } from '../support/test-data'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
  await seedEvents()
})

test.afterEach(async () => {
  await clearEvents()
  await clearDatabase()
})

test('date labels show in yyyy format when range is more than 1 year', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const dateCells = page.locator('[data-testid="timeline-date-cell"]').filter({ hasText: /\d/ })
  const count = await dateCells.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const text = (await dateCells.nth(i).textContent())?.trim()
    expect(text).toMatch(/^\d{4}$/)
  }
})

test('timeline shows correct years for seeded events', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).toContain('1969')
  expect(listText).toContain('1939')
  expect(listText).toContain('1776')
  expect(listText).toContain('1732')
})

test('event with end timestamp shows "End of X" end row', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const endDescriptions = page.locator('[data-testid="event-end-description"]')
  const count = await endDescriptions.count()
  expect(count).toBeGreaterThan(0)

  const texts = await endDescriptions.allTextContents()
  const hasEndOf = texts.some((t) => t.startsWith('End of '))
  expect(hasEndOf).toBe(true)
})

test('person event with end timestamp shows "Death of X" end row', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).toContain('Death of George Washington')
})

test('end descriptions are italicized', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const endDescriptions = page.locator('[data-testid="event-end-description"]')
  const count = await endDescriptions.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const tag = await endDescriptions.nth(i).evaluate((el) => el.tagName.toLowerCase())
    expect(tag).toBe('em')
  }
})

test('event name is bold', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const names = page.locator('[data-testid="event-name"]')
  const count = await names.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const fontWeight = await names.nth(i).evaluate((el) => getComputedStyle(el).fontWeight)
    expect(Number(fontWeight)).toBeGreaterThanOrEqual(700)
  }
})

test('event description has truncate class and title attribute', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const descriptions = page.locator('[data-testid="event-description"]')
  const count = await descriptions.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const el = descriptions.nth(i)
    const classes = await el.getAttribute('class')
    expect(classes).toContain('truncate')

    const title = await el.getAttribute('title')
    expect(title).toBeTruthy()
    const text = await el.textContent()
    expect(title).toBe(text?.trim())
  }
})

test('vertical dividers exist for each timeline row', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const rows = page.locator('[data-testid="timeline-row"]')
  const rowCount = await rows.count()
  expect(rowCount).toBeGreaterThan(0)

  const dividers = page.getByTestId('event-list').locator('.divider-horizontal')
  expect(await dividers.count()).toBe(rowCount)
})

test('WWII event shows correct end year', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).toContain('1945')
})

test('date shown once when multiple events on same date', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const dateCells = page.locator('[data-testid="timeline-date-cell"]').filter({ hasText: /\d/ })
  const allDates = await dateCells.allTextContents()
  const trimmed = allDates.map((t) => t.trim())
  const unique = new Set(trimmed)
  expect(trimmed.length).toBe(unique.size)
})
