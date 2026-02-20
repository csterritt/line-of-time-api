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

const signInAndGoHome = async (page: Parameters<typeof submitSignInForm>[0]) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)
  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')
  await page.waitForSelector('[data-testid="filter-controls"]')
}

test('filter controls appear when signed in with events', async ({ page }) => {
  await signInAndGoHome(page)

  const filterControls = page.getByTestId('filter-controls')
  await expect(filterControls).toBeVisible()

  await expect(page.getByTestId('filter-min-date')).toBeVisible()
  await expect(page.getByTestId('filter-max-date')).toBeVisible()
  await expect(page.getByTestId('reset-min-action')).toBeVisible()
  await expect(page.getByTestId('reset-max-action')).toBeVisible()
})

test('min date picker starts with the earliest event date', async ({ page }) => {
  await signInAndGoHome(page)

  const minDate = await page.getByTestId('filter-min-date').inputValue()
  expect(minDate).toBeTruthy()
  expect(minDate.startsWith('1732')).toBe(true)
})

test('max date picker starts with the latest event date', async ({ page }) => {
  await signInAndGoHome(page)

  const maxDate = await page.getByTestId('filter-max-date').inputValue()
  expect(maxDate).toBeTruthy()
  expect(maxDate.startsWith('1969')).toBe(true)
})

test('date display shows year-only when range is more than 1 year', async ({ page }) => {
  await signInAndGoHome(page)

  const dateCells = page.locator('[data-testid="timeline-date-cell"]').filter({ hasText: /\d/ })
  const count = await dateCells.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const text = (await dateCells.nth(i).textContent())?.trim()
    expect(text).toMatch(/^\d{4}$/)
  }
})

test('changing max date to narrow range shows year-month format', async ({ page }) => {
  await signInAndGoHome(page)

  await page.getByTestId('filter-min-date').fill('1939-09-01')
  await page.getByTestId('filter-min-date').dispatchEvent('change')

  await page.getByTestId('filter-max-date').fill('1939-12-31')
  await page.getByTestId('filter-max-date').dispatchEvent('change')

  await page.waitForTimeout(500)

  const dateCells = page.locator('[data-testid="timeline-date-cell"]').filter({ hasText: /\d/ })
  const count = await dateCells.count()

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const text = (await dateCells.nth(i).textContent())?.trim()
      expect(text).toMatch(/^\d{4}-\d{2}$/)
    }
  }
})

test('changing min date filters the event list', async ({ page }) => {
  await signInAndGoHome(page)

  const initialCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(initialCount).toBeGreaterThan(0)

  await page.getByTestId('filter-min-date').fill('1900-01-01')
  await page.getByTestId('filter-min-date').dispatchEvent('change')

  await page.waitForTimeout(500)

  const filteredCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(filteredCount).toBeLessThan(initialCount)

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).not.toContain('1776')
})

test('changing max date filters the event list', async ({ page }) => {
  await signInAndGoHome(page)

  const initialCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(initialCount).toBeGreaterThan(0)

  await page.getByTestId('filter-max-date').fill('1945-01-01')
  await page.getByTestId('filter-max-date').dispatchEvent('change')

  await page.waitForTimeout(500)

  const filteredCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(filteredCount).toBeLessThan(initialCount)

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).not.toContain('1969')
})

test('reset min button restores to original min date', async ({ page }) => {
  await signInAndGoHome(page)

  const originalMin = await page.getByTestId('filter-min-date').inputValue()

  await page.getByTestId('filter-min-date').fill('1900-01-01')
  await page.getByTestId('filter-min-date').dispatchEvent('change')
  await page.waitForTimeout(300)

  await page.getByTestId('reset-min-action').click()
  await page.waitForTimeout(300)

  const restoredMin = await page.getByTestId('filter-min-date').inputValue()
  expect(restoredMin).toBe(originalMin)
})

test('reset max button restores to original max date', async ({ page }) => {
  await signInAndGoHome(page)

  const originalMax = await page.getByTestId('filter-max-date').inputValue()

  await page.getByTestId('filter-max-date').fill('1945-01-01')
  await page.getByTestId('filter-max-date').dispatchEvent('change')
  await page.waitForTimeout(300)

  await page.getByTestId('reset-max-action').click()
  await page.waitForTimeout(300)

  const restoredMax = await page.getByTestId('filter-max-date').inputValue()
  expect(restoredMax).toBe(originalMax)
})

test('filter controls do not appear when not signed in', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForTimeout(500)

  const filterControls = page.getByTestId('filter-controls')
  await expect(filterControls).not.toBeVisible()
})
