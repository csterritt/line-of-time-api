import { test, expect } from '@playwright/test'
import { BASE_URLS } from '../support/test-data'

test.describe('Performance optimizations', () => {
  test('/ui serves SPA directly without redirect', async ({ request }) => {
    const response = await request.get(`${BASE_URLS.HOME}/ui`, {
      maxRedirects: 0,
    })

    // Should serve HTML directly, not redirect
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<div id="app">')
  })

  test('/ui/ still serves SPA correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URLS.HOME}/ui/`)

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<div id="app">')
  })
})
