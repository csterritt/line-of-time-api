import { expect, test } from '@playwright/test'
import {
  clearDatabase,
  seedDatabase,
  seedEvents,
} from '../support/db-helpers'
import { signInAndWaitForSeededTimeline } from '../support/workflow-helpers'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
  await seedEvents()
})

test.afterEach(async () => {
  await clearDatabase()
})

const expectedTimelineBounds = {
  minYear: '1732',
  minMonth: '02',
  minDay: '22',
  maxYear: '1969',
  maxMonth: '07',
  maxDay: '20',
}

const signInReadyTimeoutMs = 30000

const signInAndGoHome = async (page: Parameters<typeof signInAndWaitForSeededTimeline>[0]) => {
  await signInAndWaitForSeededTimeline(page)
  await expect(page.getByTestId('filter-min-year')).toHaveValue(
    expectedTimelineBounds.minYear,
    { timeout: signInReadyTimeoutMs }
  )
  await expect(page.getByTestId('filter-min-month')).toHaveValue(
    expectedTimelineBounds.minMonth,
    { timeout: signInReadyTimeoutMs }
  )
  await expect(page.getByTestId('filter-min-day')).toHaveValue(
    expectedTimelineBounds.minDay,
    { timeout: signInReadyTimeoutMs }
  )
  await expect(page.getByTestId('filter-max-year')).toHaveValue(
    expectedTimelineBounds.maxYear,
    { timeout: signInReadyTimeoutMs }
  )
  await expect(page.getByTestId('filter-max-month')).toHaveValue(
    expectedTimelineBounds.maxMonth,
    { timeout: signInReadyTimeoutMs }
  )
  await expect(page.getByTestId('filter-max-day')).toHaveValue(
    expectedTimelineBounds.maxDay,
    { timeout: signInReadyTimeoutMs }
  )
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
  expect(minMonth).toBe('02')
  expect(minDay).toBe('22')
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

