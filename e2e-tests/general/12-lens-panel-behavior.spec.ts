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
}

test('adding a lens creates a trailing timeline panel', async ({ page }) => {
  await signInAndGoHome(page)

  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toHaveCount(1)
  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(0)

  await page.getByTestId('add-lens-panel-button').click()

  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(1)
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toHaveCount(2)

  const titles = page.locator('h2.card-title')
  const allTitles = await titles.allTextContents()
  const panelTitles = allTitles.map(title => title.trim()).filter(title => title !== 'Home')
  expect(panelTitles.slice(0, 3)).toEqual(['Timeline', 'Lens', 'Timeline'])
})

test('lens panel does not show add timeline action', async ({ page }) => {
  await signInAndGoHome(page)

  await page.getByTestId('add-lens-panel-button').click()

  await expect(page.locator('[data-testid="add-timeline-panel-button"]')).toHaveCount(0)
})
