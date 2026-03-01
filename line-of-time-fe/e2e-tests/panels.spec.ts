import { test, expect } from '@playwright/test'

test('can add and interact with panels', async ({ page }) => {
  await page.goto('/')

  // Should start with one Timeline panel
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toBeVisible()
  await expect(page.getByTestId('add-lens-panel-action')).toBeVisible()

  // Add a Lens panel
  await page.getByTestId('add-lens-panel-action').click()
  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toBeVisible()

  // Add a Timeline panel from the Lens panel
  await page.getByTestId('add-timeline-panel-action').click()
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toHaveCount(2)
})
