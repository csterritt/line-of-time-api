import { test, expect } from '@playwright/test'

test('can add and interact with panels', async ({ page }) => {
  await page.goto('/')

  // Should start with one Timeline panel
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toBeVisible()
  await expect(page.getByTestId('add-lens-panel-button')).toBeVisible()

  // Add a Lens panel
  await page.getByTestId('add-lens-panel-button').click()
  await expect(page.locator('h2.card-title', { hasText: 'Lens' })).toBeVisible()
  
  // Add a Timeline panel from the Lens panel
  await page.getByTestId('add-timeline-panel-button').click()
  await expect(page.locator('h2.card-title', { hasText: 'Timeline' })).toHaveCount(2)
})
