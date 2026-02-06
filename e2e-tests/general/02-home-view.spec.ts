import { expect, test } from '@playwright/test'
import { clearDatabase, seedDatabase } from '../support/db-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { clickLink, isElementVisible, getElementText } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { BASE_URLS, TEST_USERS } from '../support/test-data'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
})

test.afterEach(async () => {
  await clearDatabase()
})

test('shows sign-in prompt and Sign In button when not signed in', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="sign-in-prompt"]')
  expect(await getElementText(page, 'sign-in-prompt')).toContain(
    'Sign in for more options'
  )
  expect(await isElementVisible(page, 'welcome-message')).toBe(false)
  expect(await isElementVisible(page, 'sign-in-action')).toBe(true)
  expect(await isElementVisible(page, 'sign-out-action')).toBe(false)
})

test('shows welcome message and Sign Out button when signed in', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="welcome-message"]')
  expect(await getElementText(page, 'welcome-message')).toContain(
    `Welcome ${TEST_USERS.KNOWN_USER.name}`
  )
  expect(await isElementVisible(page, 'sign-in-prompt')).toBe(false)
  expect(await isElementVisible(page, 'sign-out-action')).toBe(true)
  expect(await isElementVisible(page, 'sign-in-action')).toBe(false)
})

test('clicking Sign In navigates to sign-in page', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="sign-in-action"]')
  await clickLink(page, 'sign-in-action')
  await verifyOnSignInPage(page)
})

test('full sign-in flow from /ui/ shows welcome and Sign Out', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="sign-in-action"]')
  await clickLink(page, 'sign-in-action')
  await verifyOnSignInPage(page)

  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="welcome-message"]')
  expect(await getElementText(page, 'welcome-message')).toContain(
    `Welcome ${TEST_USERS.KNOWN_USER.name}`
  )
  expect(await isElementVisible(page, 'sign-out-action')).toBe(true)
})
