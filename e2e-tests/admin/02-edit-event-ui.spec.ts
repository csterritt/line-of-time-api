import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedEvents,
  seedDatabase,
  clearDatabase,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'
import { submitSignInForm } from '../support/form-helpers'
import { fillInput } from '../support/finders'

test.describe('Edit Event UI', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    await clearEvents()
    await seedEvents()
  })

  test.afterEach(async () => {
    await clearEvents()
    await clearDatabase()
  })

  test('admin sees pencil edit button on event rows', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)
    await page.waitForSelector('[data-testid="event-list"]')

    const editButton = page.locator('[data-testid^="edit-event-"][data-testid$="-action"]').first()
    await expect(editButton).toBeVisible()
  })

  test('non-admin does not see pencil edit button', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)
    await page.waitForSelector('[data-testid="event-list"]')

    const editButton = page.locator('[data-testid^="edit-event-"][data-testid$="-action"]').first()
    await expect(editButton).not.toBeVisible()
  })

  test('clicking pencil button navigates to edit form', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)
    await page.waitForSelector('[data-testid="event-list"]')

    const editButton = page.locator('[data-testid^="edit-event-"][data-testid$="-action"]').first()
    await editButton.click()

    await page.waitForURL(/\/edit-event\//)
    await expect(page.getByTestId('edit-name-input')).toBeVisible()
  })

  test('edit form is pre-populated with event data', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)
    await page.waitForSelector('[data-testid="event-list"]')

    const editButton = page.locator('[data-testid="edit-event-test-event-1-action"]')
    await editButton.click()

    await page.waitForURL(/\/edit-event\/test-event-1/)

    const nameInput = page.getByTestId('edit-name-input')
    await expect(nameInput).toBeVisible()
    const nameValue = await nameInput.inputValue()
    expect(nameValue).toBeTruthy()
    expect(nameValue.length).toBeGreaterThan(0)

    const descValue = await page.getByTestId('edit-basic-description-input').inputValue()
    expect(descValue.length).toBeGreaterThan(0)

    const yearValue = await page.getByTestId('edit-start-year-input').inputValue()
    expect(yearValue.length).toBeGreaterThan(0)
  })

  test('successful edit redirects to home', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)
    await page.waitForSelector('[data-testid="event-list"]')

    const editButton = page.locator('[data-testid="edit-event-test-event-1-action"]')
    await editButton.click()

    await page.waitForURL(/\/edit-event\/test-event-1/)

    await fillInput(page, 'edit-name-input', 'Updated Test Event Name')
    await fillInput(page, 'edit-basic-description-input', 'Updated description for testing')
    await fillInput(page, 'edit-reference-url-input', 'https://example.com/updated-ref')

    await page.getByTestId('save-event-action').click()

    await page.waitForURL(/\/$|\/ui$|\/ui\//)
    await expect(page.getByTestId('success-message')).toContainText('updated')
  })

  test('cancel button navigates back to home', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)
    await page.waitForSelector('[data-testid="event-list"]')

    const editButton = page.locator('[data-testid="edit-event-test-event-1-action"]').first()
    await editButton.click()

    await page.waitForURL(/\/edit-event\//)

    await page.getByTestId('cancel-edit-action').click()

    await page.waitForURL(/\/$|\/ui$|\/ui\//)
  })

  test('BC/AD swap is visible on edit form', async ({ page }) => {
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)
    await page.waitForSelector('[data-testid="event-list"]')

    const editButton = page.locator('[data-testid="edit-event-test-event-1-action"]').first()
    await editButton.click()

    await page.waitForURL(/\/edit-event\//)

    // Verify BC/AD swap components are visible
    const startEraSwap = page.locator('[data-testid="edit-start-era-swap"]')
    const endEraSwap = page.locator('[data-testid="edit-end-era-swap"]')
    
    await expect(startEraSwap).toBeVisible()
    await expect(endEraSwap).toBeVisible()
    
    // Check default state shows AD
    await expect(startEraSwap.locator('.swap-off')).toContainText('AD')
    await expect(startEraSwap.locator('.swap-on')).toContainText('BC')
  })
})
