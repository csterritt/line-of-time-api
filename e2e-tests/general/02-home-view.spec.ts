import { expect, test } from '@playwright/test'
import { clearDatabase, seedDatabase } from '../support/db-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { isElementVisible, getElementText } from '../support/finders'
import { BASE_URLS, TEST_USERS } from '../support/test-data'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
})

test.afterEach(async () => {
  await clearDatabase()
})

test('shows sign-in prompt when not signed in', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="sign-in-prompt"]')
  expect(await getElementText(page, 'sign-in-prompt')).toContain(
    'Sign in for more options'
  )
  expect(await isElementVisible(page, 'welcome-message')).toBe(false)
})

test('shows welcome message when signed in', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="welcome-message"]')
  expect(await getElementText(page, 'welcome-message')).toContain(
    `Welcome ${TEST_USERS.KNOWN_USER.name}`
  )
  expect(await isElementVisible(page, 'sign-in-prompt')).toBe(false)
})
