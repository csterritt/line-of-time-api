import { test, expect } from '@playwright/test'

test('lens panel has a close button that removes lens and child timeline', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('add-lens-panel-action').click()

  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(1)
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toHaveCount(2)
  await expect(page.getByTestId('close-lens-panel-action')).toHaveCount(1)

  await page.getByTestId('close-lens-panel-action').click()

  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(0)
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toHaveCount(1)
})

test('adding a lens creates a trailing timeline panel with the current layout', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toBeVisible()
  await expect(page.getByTestId('add-lens-panel-action')).toBeVisible()
  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toHaveCount(0)

  await page.getByTestId('add-lens-panel-action').click()

  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toBeVisible()
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toHaveCount(2)

  const titles = page.locator('h2.card-title')
  const allTitles = await titles.allTextContents()
  const panelTitles = allTitles
    .map((title) => title.trim())
    .filter((title) => title !== 'Home')

  expect(panelTitles.slice(0, 3)).toEqual(['Timeline', 'Lens', 'Timeline'])
  await expect(page.getByTestId('lens-event-list')).toHaveCount(1)
  await expect(page.getByTestId('lens-event-item')).toHaveCount(0)
  await expect(page.locator('[data-testid="add-timeline-panel-button"]')).toHaveCount(0)
})
