import { test, expect } from '@playwright/test'

test('debug page content', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const html = await page.content()
  console.log('PAGE HTML:', html.substring(0, 2000))
})
