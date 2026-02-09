import { expect, test } from '@playwright/test'
import {
  clearDatabase,
  seedDatabase,
  clearEvents,
  seedEvents,
} from '../support/db-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { isElementVisible, getElementText } from '../support/finders'
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

test('event rows show start date in yyyy-mm-dd format', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const startDates = page.locator('[data-testid="event-start-date"]')
  const count = await startDates.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const text = (await startDates.nth(i).textContent())?.trim()
    expect(text).toMatch(/^\d{4}-\d{2}-\d{2}( -)?$/)
  }
})

test('event rows show correct dates for seeded events', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).toContain('1970-01-02')
  expect(listText).toContain('1940-02-15')
  expect(listText).toContain('1777-07-05')
})

test('event with end timestamp shows dash after start date and end date on next line', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const items = page.locator('[data-testid="event-item"]')
  const count = await items.count()
  let foundWithEnd = false

  for (let i = 0; i < count; i++) {
    const endDate = items.nth(i).locator('[data-testid="event-end-date"]')
    if ((await endDate.count()) > 0) {
      foundWithEnd = true
      const startText = (await items.nth(i).locator('[data-testid="event-start-date"]').textContent())?.trim()
      expect(startText).toMatch(/\d{4}-\d{2}-\d{2} -$/)

      const endText = (await endDate.textContent())?.trim()
      expect(endText).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      const endClasses = await endDate.getAttribute('class')
      expect(endClasses).toContain('ml-2')
    }
  }

  expect(foundWithEnd).toBe(true)
})

test('event without end timestamp has no dash and no end date', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const items = page.locator('[data-testid="event-item"]')
  const count = await items.count()
  let foundWithoutEnd = false

  for (let i = 0; i < count; i++) {
    const endDate = items.nth(i).locator('[data-testid="event-end-date"]')
    if ((await endDate.count()) === 0) {
      foundWithoutEnd = true
      const startText = (await items.nth(i).locator('[data-testid="event-start-date"]').textContent())?.trim()
      expect(startText).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(startText).not.toContain('-'  + ' ')
    }
  }

  expect(foundWithoutEnd).toBe(true)
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

test('event description has truncate class and title attribute', async ({
  page,
}) => {
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

test('vertical divider exists between date and name/description', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const items = page.locator('[data-testid="event-item"]')
  const count = await items.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const divider = items.nth(i).locator('.divider-horizontal')
    expect(await divider.count()).toBe(1)
  }
})

test('WWII event shows correct end date', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).toContain('1946-02-14')
})
