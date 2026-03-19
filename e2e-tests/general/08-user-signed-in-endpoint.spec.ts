import { test, expect } from '@playwright/test'

import { signOutAndVerify } from '../support/auth-helpers'
import { navigateToHome } from '../support/navigation-helpers'
import { completeSignInFlow } from '../support/workflow-helpers'
import { getWithRetry, testWithDatabase } from '../support/test-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

/**
 * Test the /auth/user-signed-in endpoint
 * Tests three scenarios:
 * 1. User is signed in - returns {"user-signed-in": true, name: "..."}
 * 2. User is not signed in - returns {"user-signed-in": false}
 * 3. Error handling (if auth system fails)
 */

test(
  'user-signed-in endpoint returns false when not signed in',
  testWithDatabase(async ({ page }) => {
    // Navigate to home to ensure we're not signed in
    await navigateToHome(page)

    // Call the endpoint
    const response = await page.request.get(
      `${BASE_URLS.HOME}/auth/user-signed-in`
    )

    // Verify response
    expect(response.ok()).toBe(true)
    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json).toEqual({ 'user-signed-in': false })

    // Verify Content-Type header
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })
)

test(
  'user-signed-in endpoint returns true when signed in',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await completeSignInFlow(page, TEST_USERS.KNOWN_USER)

    // Call the endpoint with the authenticated context
    // The session cookies should be automatically included
    const response = await getWithRetry(
      page.request,
      `${BASE_URLS.HOME}/auth/user-signed-in`
    )

    // Verify response
    expect(response.ok()).toBe(true)
    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json).toEqual({
      'user-signed-in': true,
      name: TEST_USERS.KNOWN_USER.name,
      isAdmin: false,
    })

    // Verify Content-Type header
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })
)

test(
  'user-signed-in endpoint returns false after signing out',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await completeSignInFlow(page, TEST_USERS.KNOWN_USER)

    // Verify signed in
    let response = await getWithRetry(
      page.request,
      `${BASE_URLS.HOME}/auth/user-signed-in`
    )
    let json = await response.json()
    expect(json).toEqual({
      'user-signed-in': true,
      name: TEST_USERS.KNOWN_USER.name,
      isAdmin: false,
    })

    // Sign out by navigating to sign-out page and clicking sign-out
    await signOutAndVerify(page)

    // Call the endpoint again
    response = await getWithRetry(
      page.request,
      `${BASE_URLS.HOME}/auth/user-signed-in`
    )

    // Verify response shows not signed in
    expect(response.ok()).toBe(true)
    expect(response.status()).toBe(200)

    json = await response.json()
    expect(json).toEqual({ 'user-signed-in': false })
  })
)
