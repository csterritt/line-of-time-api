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

  await expect(page.getByTestId('filter-min-year')).toBeVisible()
  await expect(page.getByTestId('filter-min-month')).toBeVisible()
  await expect(page.getByTestId('filter-min-day')).toBeVisible()
  await expect(page.getByTestId('filter-min-go-action')).toBeVisible()
  await expect(page.getByTestId('filter-max-year')).toBeVisible()
  await expect(page.getByTestId('filter-max-month')).toBeVisible()
  await expect(page.getByTestId('filter-max-day')).toBeVisible()
  await expect(page.getByTestId('filter-max-go-action')).toBeVisible()
  await expect(page.getByTestId('reset-min-action')).toBeVisible()
  await expect(page.getByTestId('reset-max-action')).toBeVisible()
})

test('min date picker starts with the earliest event date', async ({ page }) => {
  await signInAndGoHome(page)

  const minYear = await page.getByTestId('filter-min-year').inputValue()
  const minMonth = await page.getByTestId('filter-min-month').inputValue()
  const minDay = await page.getByTestId('filter-min-day').inputValue()
  expect(minYear).toBe('1732')
  expect(minMonth).toBe('01')
  expect(minDay).toBe('01')
})

test('max date picker starts with the latest event date', async ({ page }) => {
  await signInAndGoHome(page)

  const maxYear = await page.getByTestId('filter-max-year').inputValue()
  const maxMonth = await page.getByTestId('filter-max-month').inputValue()
  const maxDay = await page.getByTestId('filter-max-day').inputValue()
  expect(maxYear).toBe('1969')
  expect(maxMonth).toBe('07')
  expect(maxDay).toBe('20')
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

  await page.getByTestId('filter-min-year').fill('1939')
  await page.getByTestId('filter-min-month').fill('9')
  await page.getByTestId('filter-min-day').fill('1')
  await page.getByTestId('filter-min-go-action').click()

  await page.getByTestId('filter-max-year').fill('1939')
  await page.getByTestId('filter-max-month').fill('12')
  await page.getByTestId('filter-max-day').fill('31')
  await page.getByTestId('filter-max-go-action').click()

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

  await page.getByTestId('filter-min-year').fill('1900')
  await page.getByTestId('filter-min-month').fill('1')
  await page.getByTestId('filter-min-day').fill('1')
  await page.getByTestId('filter-min-go-action').click()

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

  await page.getByTestId('filter-max-year').fill('1945')
  await page.getByTestId('filter-max-month').fill('1')
  await page.getByTestId('filter-max-day').fill('1')
  await page.getByTestId('filter-max-go-action').click()

  await page.waitForTimeout(500)

  const filteredCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(filteredCount).toBeLessThan(initialCount)

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).not.toContain('1969')
})

test('reset min button restores to original min date', async ({ page }) => {
  await signInAndGoHome(page)

  const originalMin = {
    year: await page.getByTestId('filter-min-year').inputValue(),
    month: await page.getByTestId('filter-min-month').inputValue(),
    day: await page.getByTestId('filter-min-day').inputValue(),
  }

  await page.getByTestId('filter-min-year').fill('1900')
  await page.getByTestId('filter-min-month').fill('1')
  await page.getByTestId('filter-min-day').fill('1')
  await page.getByTestId('filter-min-go-action').click()
  await page.waitForTimeout(300)

  await page.getByTestId('reset-min-action').click()
  await page.waitForTimeout(300)

  const restoredMin = {
    year: await page.getByTestId('filter-min-year').inputValue(),
    month: await page.getByTestId('filter-min-month').inputValue(),
    day: await page.getByTestId('filter-min-day').inputValue(),
  }
  expect(restoredMin).toEqual(originalMin)
})

test('reset max button restores to original max date', async ({ page }) => {
  await signInAndGoHome(page)

  const originalMax = {
    year: await page.getByTestId('filter-max-year').inputValue(),
    month: await page.getByTestId('filter-max-month').inputValue(),
    day: await page.getByTestId('filter-max-day').inputValue(),
  }

  await page.getByTestId('filter-max-year').fill('1945')
  await page.getByTestId('filter-max-month').fill('1')
  await page.getByTestId('filter-max-day').fill('1')
  await page.getByTestId('filter-max-go-action').click()
  await page.waitForTimeout(300)

  await page.getByTestId('reset-max-action').click()
  await page.waitForTimeout(300)

  const restoredMax = {
    year: await page.getByTestId('filter-max-year').inputValue(),
    month: await page.getByTestId('filter-max-month').inputValue(),
    day: await page.getByTestId('filter-max-day').inputValue(),
  }
  expect(restoredMax).toEqual(originalMax)
})

test('editing values does not apply until Go is used', async ({ page }) => {
  await signInAndGoHome(page)

  const initialCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(initialCount).toBeGreaterThan(0)

  await page.getByTestId('filter-min-year').fill('1900')
  await page.waitForTimeout(500)

  const afterEditCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(afterEditCount).toBe(initialCount)

  await page.getByTestId('filter-min-go-action').click()
  await page.waitForTimeout(500)

  const filteredCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(filteredCount).toBeLessThan(initialCount)
})

test('pressing Enter in min day applies the same as clicking Go', async ({ page }) => {
  await signInAndGoHome(page)

  const initialCount = await page.locator('[data-testid="timeline-row"]').count()

  await page.getByTestId('filter-min-year').fill('1900')
  await page.getByTestId('filter-min-month').fill('1')
  await page.getByTestId('filter-min-day').fill('1')
  await page.getByTestId('filter-min-day').press('Enter')
  await page.waitForTimeout(500)

  const filteredCount = await page.locator('[data-testid="timeline-row"]').count()
  expect(filteredCount).toBeLessThan(initialCount)
})

test('year-only and year-month inputs default missing values on apply', async ({ page }) => {
  await signInAndGoHome(page)

  await page.getByTestId('filter-min-year').fill('1900')
  await page.getByTestId('filter-min-month').fill('')
  await page.getByTestId('filter-min-day').fill('')
  await page.getByTestId('filter-min-go-action').click()
  await page.waitForTimeout(300)

  await expect(page.getByTestId('filter-min-month')).toHaveValue('1')
  await expect(page.getByTestId('filter-min-day')).toHaveValue('1')

  await page.getByTestId('filter-max-year').fill('1945')
  await page.getByTestId('filter-max-month').fill('1')
  await page.getByTestId('filter-max-day').fill('')
  await page.getByTestId('filter-max-go-action').click()
  await page.waitForTimeout(300)

  await expect(page.getByTestId('filter-max-day')).toHaveValue('1')
})

test('filter controls do not appear when not signed in', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForTimeout(500)

  const filterControls = page.getByTestId('filter-controls')
  await expect(filterControls).not.toBeVisible()
})
