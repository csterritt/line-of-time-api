import { test, expect } from '@playwright/test'

test('signed-out home shows the current shell and empty timeline state', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h2.card-title').first()).toHaveText('Home')
  await expect(page.getByTestId('sign-in-prompt')).toHaveText('Sign in for more options')
  await expect(page.getByTestId('filter-controls')).toBeVisible()
  await expect(page.getByTestId('no-events-message')).toHaveText('No events yet')
})

test('signed-out navbar shows the brand link and sign-in action', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('home-action')).toHaveText('Line of Time project')
  await expect(page.getByTestId('home-action')).toHaveAttribute('href', '/ui/')
  await expect(page.getByTestId('sign-in-action')).toHaveText('Sign in')
  await expect(page.getByTestId('sign-out-action')).toHaveCount(0)
})

