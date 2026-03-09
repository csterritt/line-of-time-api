import { expect, test } from '@playwright/test'

import {
  clearDatabase,
  seedDatabase,
  clearEvents,
  seedEvents,
} from '../support/db-helpers'
import { signInAndWaitForSeededTimeline } from '../support/workflow-helpers'

test.beforeAll(async () => {
  await clearDatabase()
  await seedDatabase()
  await seedEvents()
})

test.afterAll(async () => {
  await clearEvents()
  await clearDatabase()
})

const signInAndGoHome = async (
  page: Parameters<typeof signInAndWaitForSeededTimeline>[0]
) => {
  await signInAndWaitForSeededTimeline(page)
}

test('adding a lens creates a trailing timeline panel', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(
    page.locator('h2.card-title', { hasText: 'Timeline' })
  ).toHaveCount(1)
  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(
    0
  )

  await page.getByTestId('add-lens-panel-action').click()

  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(
    1
  )
  await expect(
    page.locator('h2.card-title', { hasText: 'Timeline' })
  ).toHaveCount(2)

  const titles = page.locator('h2.card-title')
  const allTitles = await titles.allTextContents()
  const panelTitles = allTitles
    .map((title) => title.trim())
    .filter((title) => title !== 'Home')
  expect(panelTitles.slice(0, 3)).toEqual(['Timeline', 'Lens', 'Timeline'])
})

test('lens panel does not show add timeline action', async ({ page }) => {
  await signInAndGoHome(page)

  await page.getByTestId('add-lens-panel-action').click()

  await expect(
    page.locator('[data-testid="add-timeline-panel-button"]')
  ).toHaveCount(0)
})

test('lens panel has a close button', async ({ page }) => {
  await signInAndGoHome(page)

  await page.getByTestId('add-lens-panel-action').click()

  await expect(page.getByTestId('close-lens-panel-action')).toHaveCount(1)
})

test('clicking close button on lens panel removes lens and its child timeline', async ({ page }) => {
  await signInAndGoHome(page)

  await page.getByTestId('add-lens-panel-action').click()

  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(1)
  await expect(
    page.locator('h2.card-title', { hasText: 'Timeline' })
  ).toHaveCount(2)

  await page.getByTestId('close-lens-panel-action').click()

  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(0)
  await expect(
    page.locator('h2.card-title', { hasText: 'Timeline' })
  ).toHaveCount(1)
})
