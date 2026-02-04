import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h2.card-title')).toHaveText('Home')
})

test('has navbar with brand link', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-action')).toHaveText('Line of Time project')
})

test('can navigate to about page', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('about-action').click()
  await expect(page.locator('h2.card-title')).toHaveText('About')
})

test('can increment counter', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('p').filter({ hasText: 'Count:' })).toContainText('Count: 0')
  await page.getByTestId('increment-action').click()
  await expect(page.locator('p').filter({ hasText: 'Count:' })).toContainText('Count: 1')
})
