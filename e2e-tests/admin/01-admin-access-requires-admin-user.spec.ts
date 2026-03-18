import { test, expect } from '@playwright/test'

import { clearDatabase, seedDatabase } from '../support/db-helpers'
import { signInUser } from '../support/auth-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'
import { verifyAlert } from '../support/finders'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
})

test('admin endpoint rejects non-admin user', async ({ page }) => {
  // Navigate to home page first
  await page.goto(BASE_URLS.HOME)
  
  // Sign in as a regular user (FredF is not an admin)
  await signInUser(page, TEST_USERS.KNOWN_USER.email, TEST_USERS.KNOWN_USER.password)

  // Try to access an admin-only endpoint
  const response = await page.goto('http://localhost:3000/test/admin-check')

  // Should receive 403 Forbidden
  expect(response?.status()).toBe(403)
  
  // Verify the error message
  const content = await page.textContent('body')
  expect(content).toContain('Admin access required')
})

test('admin endpoint allows admin user', async ({ page }) => {
  // Navigate to home page first
  await page.goto(BASE_URLS.HOME)
  
  // Sign in as an admin user (Chris is an admin)
  await signInUser(page, TEST_USERS.ADMIN_USER.email, TEST_USERS.ADMIN_USER.password)

  // Try to access an admin-only endpoint
  const response = await page.goto('http://localhost:3000/test/admin-check')

  // Should receive 200 OK
  expect(response?.status()).toBe(200)
  
  // Verify success response
  const content = await page.textContent('body')
  expect(content).toContain('Admin access granted')
})

test('admin endpoint redirects unauthenticated user', async ({ page }) => {
  // Try to access admin endpoint without signing in
  await page.goto('http://localhost:3000/test/admin-check')

  // Should be redirected to sign-in page
  await page.waitForURL('**/auth/sign-in**')
  expect(page.url()).toContain('/auth/sign-in')
  
  // Should show error message
  await verifyAlert(page, 'Admin access required')
})
