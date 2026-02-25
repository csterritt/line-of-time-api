import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h2.card-title').first()).toHaveText('Home')
})

test('has navbar with brand link', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-action')).toHaveText('Line of Time project')
})

