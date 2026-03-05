import { test, expect } from '@playwright/test'

test('new lens panel shows empty controls without add timeline action', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('add-lens-panel-action').click()

  await expect(page.getByTestId('lens-event-list')).toHaveCount(1)
  await expect(page.getByTestId('lens-event-item')).toHaveCount(0)
  await expect(page.getByTestId('lens-event-input')).toBeVisible()
  await expect(page.getByTestId('add-event-action')).toHaveCount(1)
  await expect(page.locator('[data-testid="add-timeline-panel-button"]')).toHaveCount(0)
})
