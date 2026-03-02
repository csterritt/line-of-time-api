import { expect, test } from '@playwright/test'
import {
  clearDatabase,
  seedDatabase,
  clearEvents,
  seedEvents,
} from '../support/db-helpers'
import { BASE_URLS } from '../support/test-data'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
  await seedEvents()
})

test.afterEach(async () => {
  await clearEvents()
  await clearDatabase()
})

test('events are visible to non-signed-in users', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const rows = page.locator('[data-testid="timeline-row"]')
  const count = await rows.count()
  expect(count).toBeGreaterThan(0)
})

test('timeline years visible to non-signed-in users', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')

  const listText = await page.getByTestId('event-list').textContent()
  expect(listText).toContain('1969')
  expect(listText).toContain('1939')
  expect(listText).toContain('1776')
})

test('add-event button not visible to non-signed-in users', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForTimeout(500)

  const addEventButton = page.getByTestId('add-event-action')
  await expect(addEventButton).not.toBeVisible()
})
