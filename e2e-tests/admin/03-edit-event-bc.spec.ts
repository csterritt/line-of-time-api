import { test, expect } from '@playwright/test'

import {
  clearEvents,
  seedEvents,
  seedDatabase,
  clearDatabase,
  setWikiMock,
  resetWikiMock,
  setAiMock,
  resetAiMock,
} from '../support/db-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'
import { submitSignInForm } from '../support/form-helpers'

// Known JDN values for BC dates
const BC_1_JAN = 1721060 // Jan 1, 1 BC (astronomical year 0)
const AD_2000_JAN = 2451545 // Jan 1, 2000 AD

test.describe('Edit Event BC Support', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    await clearEvents()
    await seedEvents()

    // Mock Wikipedia response for "Test Event" and "Ancient Event"
    await setWikiMock({
      name: 'Test Event',
      query: {
        query: {
          searchinfo: { totalhits: 1 },
          search: [{ title: 'Test Event' }],
        },
      },
      parse: {
        parse: {
          pageid: 12345,
          title: 'Test Event',
          text: { '*': '<p>Test Event occurred in 2000</p>' },
          links: [],
        },
        categorization: {
          type: 'other',
          'start-date': '2000-01-01-AD',
        },
      },
    })

    await setWikiMock({
      name: 'Ancient Event',
      query: {
        query: {
          searchinfo: { totalhits: 1 },
          search: [{ title: 'Ancient Event' }],
        },
      },
      parse: {
        parse: {
          pageid: 12346,
          title: 'Ancient Event',
          text: { '*': '<p>Ancient Event occurred in 500 BC</p>' },
          links: [],
        },
        categorization: {
          type: 'other',
          'start-date': '500-01-01-AD',
        },
      },
    })

    // Set AI mock for categorization
    await setAiMock({ type: 'other' })
  })

  test.afterEach(async () => {
    await clearEvents()
    await clearDatabase()
    await resetWikiMock()
    await resetAiMock()
  })

  test('edit existing event to BC date shows BC swap and positive year', async ({
    page,
  }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    // Go to UI page to ensure user info is loaded
    await page.goto(BASE_URLS.TIMELINE)
    await page.waitForSelector('[data-testid="event-list"]', { timeout: 10000 })

    // Get authentication cookies
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    // Find an existing event to edit
    const editButton = page
      .locator('[data-testid^="edit-event-"][data-testid$="-action"]')
      .first()
    await editButton.click()

    await page.waitForURL(/\/edit-event\//)
    await page.waitForSelector('[data-testid="edit-name-input"]', {
      state: 'visible',
    })

    // Check if we're on the right page
    console.log(`Current URL: ${page.url()}`)
    const pageTitle = await page.locator('h2').first().textContent()
    console.log(`Page title: ${pageTitle}`)

    // Wait for the edit form to load
    await page.waitForSelector('[data-testid="edit-start-year-input"]', {
      state: 'visible',
      timeout: 5000,
    })

    // Verify initial AD state
    const startEraSwap = page.locator('[data-testid="edit-start-era-swap"]')
    await expect(startEraSwap.locator('.swap-off')).toContainText('AD')

    const startYearInput = page.locator('[data-testid="edit-start-year-input"]')
    const initialYear = await startYearInput.inputValue()
    console.log(`Initial year: ${initialYear}`)

    // Toggle to BC
    await startEraSwap.click()

    // Should still show positive year (e.g., 1732 → 1732 BC)
    await expect(startYearInput).toHaveValue(initialYear)
    await expect(startEraSwap.locator('.swap-on')).toContainText('BC')
  })

  test('round-trip: edit to BC, save, reload preserves values', async ({
    page,
  }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    // Go to UI page to ensure user info is loaded
    await page.goto(BASE_URLS.TIMELINE)
    await page.waitForSelector('[data-testid="event-list"]', { timeout: 10000 })

    // Get authentication cookies
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    // Create a new event to edit
    const createResponse = await page.request.post(
      `${BASE_URLS.TIME_INFO_NEW_EVENT}`,
      {
        data: {
          startTimestamp: AD_2000_JAN,
          name: 'Test Event',
          basicDescription: 'Test description',
          referenceUrl: 'https://example.com/test',
        },
        headers: { Cookie: cookieHeader },
      }
    )

    expect(createResponse.status()).toBe(201)
    const createdEvent = await createResponse.json()
    console.log(`Created event with ID: ${createdEvent.id}`)

    // Go back to timeline to see the new event
    await page.goto(BASE_URLS.TIMELINE)
    await page.waitForSelector('[data-testid="event-list"]', { timeout: 10000 })

    // Find and click the edit button for the new event
    const editButton = page
      .locator('[data-testid^="edit-event-"][data-testid$="-action"]')
      .first()
    await editButton.click()

    await page.waitForURL(/\/edit-event\//)
    await page.waitForSelector('[data-testid="edit-name-input"]', {
      state: 'visible',
    })

    // Change to BC 500
    const startEraSwap = page.locator('[data-testid="edit-start-era-swap"]')
    const startYearInput = page.locator('[data-testid="edit-start-year-input"]')

    await startEraSwap.click() // Switch to BC
    await startYearInput.clear()
    await startYearInput.fill('500')

    // Save the changes
    await page.locator('[data-testid="save-event-action"]').click()

    // Wait for save to complete and redirect back to timeline
    await page.waitForURL(/\/ui/)

    // Go back to timeline and click edit button again
    await page.goto(BASE_URLS.TIMELINE)
    await page.waitForSelector('[data-testid="event-list"]', { timeout: 10000 })

    // Find and click the edit button for the event again
    const editButton2 = page
      .locator('[data-testid^="edit-event-"][data-testid$="-action"]')
      .first()
    await editButton2.click()

    await page.waitForURL(/\/edit-event\//)
    await page.waitForSelector('[data-testid="edit-name-input"]', {
      state: 'visible',
      timeout: 5000,
    })

    // Get the swap and input elements again
    const startEraSwap2 = page.locator('[data-testid="edit-start-era-swap"]')
    const startYearInput2 = page.locator(
      '[data-testid="edit-start-year-input"]'
    )

    // Verify BC values are preserved
    await expect(startEraSwap2.locator('.swap-on')).toContainText('BC')
    await expect(startYearInput2).toHaveValue('500')
  })

  test('new event form includes BC/AD swaps', async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    // Go to UI page to ensure user info is loaded
    await page.goto(BASE_URLS.TIMELINE)
    await page.waitForSelector('[data-testid="event-list"]', { timeout: 10000 })

    // Click "Add a new event" button
    await page.locator('[data-testid="add-event-action"]').click()
    await page.waitForURL(/\/search/)

    // Enter a search term to proceed
    await page.locator('[data-testid="name-input"]').fill('Test Event')
    await page.locator('[data-testid="search-wikipedia-action"]').click()

    // Wait for categorization to complete and form to load
    await page.waitForSelector('[data-testid="start-era-swap"]', {
      state: 'visible',
      timeout: 15000,
    })

    // Check page title and URL
    const pageTitle = await page.locator('h2').first().textContent()
    console.log(`New event page title: ${pageTitle}`)
    console.log(`Current URL: ${page.url()}`)

    // Check what's actually on the page
    const hasStartInput = await page
      .locator('[data-testid="start-year-input"]')
      .isVisible()
    const hasNameInput = await page
      .locator('[data-testid="name-input"]')
      .isVisible()
    console.log(
      `Has start-year-input: ${hasStartInput}, has name-input: ${hasNameInput}`
    )

    // Check for BC/AD swap components
    const startEraSwap = page.locator('[data-testid="start-era-swap"]')
    const endEraSwap = page.locator('[data-testid="end-era-swap"]')

    await expect(startEraSwap).toBeVisible({ timeout: 5000 })
    await expect(endEraSwap).toBeVisible({ timeout: 5000 })

    // Check default state is AD
    await expect(startEraSwap.locator('.swap-off')).toContainText('AD')
    await expect(startEraSwap.locator('.swap-on')).toContainText('BC')
  })

  test('can create event with BC date via UI', async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.ADMIN_USER)
    await page.waitForURL(/\/ui/)

    // Go to UI page to ensure user info is loaded
    await page.goto(BASE_URLS.TIMELINE)
    await page.waitForSelector('[data-testid="event-list"]', { timeout: 10000 })

    // Click "Add a new event" button
    await page.locator('[data-testid="add-event-action"]').click()
    await page.waitForURL(/\/search/)

    // Enter a search term to proceed
    await page.locator('[data-testid="name-input"]').fill('Ancient Event')
    await page.locator('[data-testid="search-wikipedia-action"]').click()
    await page.waitForLoadState('networkidle')

    // Fill form with BC date
    await page.locator('[data-testid="event-name-input"]').fill('Ancient Event')
    await page
      .locator('[data-testid="event-description-input"]')
      .fill('An ancient event')
    await page
      .locator('[data-testid="event-reference-url-input"]')
      .fill('https://example.com/ancient')

    // Set BC date
    const startEraSwap = page.locator('[data-testid="start-era-swap"]')
    await startEraSwap.click() // Switch to BC

    const startYearInput = page.locator('[data-testid="start-year-input"]')
    await startYearInput.fill('500')

    // Submit form
    await page.locator('[data-testid="new-event-submit"]').click()

    // Should redirect to admin page and show success
    await expect(page).toHaveURL(`${BASE_URLS.HOME}/admin`)
    await expect(page.locator('text=Ancient Event')).toBeVisible()
  })
})
