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
  minMonth: '01',
  minDay: '01',
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
  await expect(page.getByTestId('event-list')).toBeVisible({
    timeout: signInReadyTimeoutMs,
  })
}

test('connector SVG exists when events have end timestamps', async ({ page }) => {
  await signInAndGoHome(page)

  const svg = page.getByTestId('connector-svg')
  await expect(svg).toBeVisible({ timeout: 10000 })
})

test('connector line count matches events with end timestamps (2 events = 6 lines)', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(page.getByTestId('connector-svg')).toBeVisible({ timeout: 10000 })
  const lines = page.locator('[data-testid="connector-line"]')
  const count = await lines.count()
  expect(count).toBe(6)
})

test('connector lines have stroke-width of 4', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(page.getByTestId('connector-svg')).toBeVisible({ timeout: 10000 })
  const lines = page.locator('[data-testid="connector-line"]')
  const count = await lines.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const strokeWidth = await lines.nth(i).getAttribute('stroke-width')
    expect(strokeWidth).toBe('4')
  }
})

test('connector lines use pastel colors with oklch format', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(page.getByTestId('connector-svg')).toBeVisible({ timeout: 10000 })
  const lines = page.locator('[data-testid="connector-line"]')
  const count = await lines.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const stroke = await lines.nth(i).getAttribute('stroke')
    expect(stroke).toMatch(/^oklch\(/)
  }
})

test('three lines in a connector group share the same color', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(page.getByTestId('connector-svg')).toBeVisible({ timeout: 10000 })
  const lines = page.locator('[data-testid="connector-line"]')
  const count = await lines.count()
  expect(count).toBe(6)

  const eventIds = new Set<string>()
  for (let i = 0; i < count; i++) {
    const eventId = await lines.nth(i).getAttribute('data-connector-event')
    if (eventId) {
      eventIds.add(eventId)
    }
  }

  for (const eventId of eventIds) {
    const eventLines = page.locator(`[data-connector-event="${eventId}"]`)
    const eventLineCount = await eventLines.count()
    expect(eventLineCount).toBe(3)

    const colors = new Set<string>()
    for (let i = 0; i < eventLineCount; i++) {
      const stroke = await eventLines.nth(i).getAttribute('stroke')
      if (stroke) {
        colors.add(stroke)
      }
    }
    expect(colors.size).toBe(1)
  }
})

test('no connector lines for events without end timestamps', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(page.getByTestId('connector-svg')).toBeVisible({ timeout: 10000 })
  const lines = page.locator('[data-testid="connector-line"]')
  const count = await lines.count()

  for (let i = 0; i < count; i++) {
    const eventId = await lines.nth(i).getAttribute('data-connector-event')
    expect(eventId).not.toBe('test-event-1')
    expect(eventId).not.toBe('test-event-3')
  }
})

test('connectors re-draw after filter change', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(page.getByTestId('connector-svg')).toBeVisible({ timeout: 10000 })
  const lines = page.locator('[data-testid="connector-line"]')
  const initialCount = await lines.count()
  expect(initialCount).toBe(6)

  await page.getByTestId('filter-min-year').fill('1900')
  await page.getByTestId('filter-min-go-action').click()

  await page.waitForTimeout(500)

  const filteredLines = page.locator('[data-testid="connector-line"]')
  const filteredCount = await filteredLines.count()
  expect(filteredCount).toBe(3)
})
