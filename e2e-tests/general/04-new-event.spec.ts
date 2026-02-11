import { expect, test } from '@playwright/test'
import {
  clearDatabase,
  seedDatabase,
  clearEvents,
  seedEvents,
  setAiMock,
  resetAiMock,
} from '../support/db-helpers'
import { submitSignInForm } from '../support/form-helpers'
import {
  clickLink,
  fillInput,
  isElementVisible,
  getElementText,
} from '../support/finders'
import { BASE_URLS, TEST_USERS } from '../support/test-data'

test.beforeEach(async () => {
  await clearDatabase()
  await seedDatabase()
  await setAiMock({ type: 'other' })
})

test.afterEach(async () => {
  await resetAiMock()
  await clearEvents()
  await clearDatabase()
})

test('"Add a new event" button not visible when not signed in', async ({
  page,
}) => {
  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="sign-in-prompt"]')
  expect(await isElementVisible(page, 'add-event-action')).toBe(false)
})

test('"Add a new event" button visible when signed in', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)

  await page.waitForSelector('[data-testid="welcome-message"]')
  expect(await isElementVisible(page, 'add-event-action')).toBe(true)
})

test('clicking "Add a new event" navigates to search page with only name and search button', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="add-event-action"]')
  await clickLink(page, 'add-event-action')

  await page.waitForSelector('[data-testid="name-input"]')
  expect(await isElementVisible(page, 'name-input')).toBe(true)
  expect(await isElementVisible(page, 'search-wikipedia-action')).toBe(true)
  expect(await isElementVisible(page, 'basic-description-input')).toBe(false)
  expect(await isElementVisible(page, 'start-timestamp-input')).toBe(false)
  expect(await isElementVisible(page, 'reference-url-input')).toBe(false)
  expect(await isElementVisible(page, 'create-event-action')).toBe(false)
})

test('searching Wikipedia for a known term redirects to new-event page with pre-filled fields', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  expect(page.url()).toContain('/ui/new-event')
  expect(await isElementVisible(page, 'basic-description-input')).toBe(true)
  expect(await isElementVisible(page, 'start-timestamp-input')).toBe(true)
  expect(await isElementVisible(page, 'reference-url-input')).toBe(true)
  expect(await isElementVisible(page, 'create-event-action')).toBe(true)
  expect(await isElementVisible(page, 'wiki-page')).toBe(true)
  expect(await isElementVisible(page, 'wiki-links-list')).toBe(true)

  const descriptionValue = await page
    .getByTestId('basic-description-input')
    .inputValue()
  expect(descriptionValue.length).toBeGreaterThan(0)
})

test('searching Wikipedia for gibberish shows nothing found error on search page', async ({
  page,
}) => {
  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Aldjkfaljdsfaljsdfalsdjf')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="error-message"]', {
    timeout: 15000,
  })
  expect(page.url()).toContain('/ui/search')
  expect(await getElementText(page, 'error-message')).toContain('Nothing found')
  expect(await isElementVisible(page, 'basic-description-input')).toBe(false)
  expect(await isElementVisible(page, 'create-event-action')).toBe(false)
})

test('pressing Enter in name field triggers Wikipedia search', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await page.getByTestId('name-input').press('Enter')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  expect(page.url()).toContain('/ui/new-event')
  expect(await isElementVisible(page, 'basic-description-input')).toBe(true)
})

test('name is displayed as non-editable text and reference URL is read-only on new-event page', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  const nameDisplay = page.getByTestId('name-display')
  const refUrlInput = page.getByTestId('reference-url-input')

  const nameTag = await nameDisplay.evaluate((el) => el.tagName.toLowerCase())
  expect(nameTag).toBe('div')
  expect(await refUrlInput.getAttribute('readonly')).not.toBeNull()
})

test('"Search again" button navigates back to search page with empty fields', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="search-again-action"]', {
    timeout: 15000,
  })
  await clickLink(page, 'search-again-action')

  await page.waitForSelector('[data-testid="name-input"]')
  expect(page.url()).toContain('/ui/search')

  const nameValue = await page.getByTestId('name-input').inputValue()
  expect(nameValue).toBe('')
})

test('Related Links section is scrollable and Wikipedia Page has no height restriction', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="wiki-page"]', {
    timeout: 15000,
  })

  const linksOverflow = await page
    .getByTestId('wiki-links-list')
    .evaluate((el) => getComputedStyle(el).overflowY)
  expect(linksOverflow).toBe('auto')

  const wikiPageMaxHeight = await page
    .getByTestId('wiki-page')
    .evaluate((el) => getComputedStyle(el).maxHeight)
  expect(wikiPageMaxHeight).toBe('none')
})

test('"Search again" button text says "Search again" not "Search Wikipedia"', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="search-again-action"]', {
    timeout: 15000,
  })
  const buttonText = await getElementText(page, 'search-again-action')
  expect(buttonText).toContain('Search again')
})

test('related links in new-event page are clickable anchor tags', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="wiki-links-list"]', {
    timeout: 15000,
  })

  const relatedLinks = page.getByTestId('related-link')
  const count = await relatedLinks.count()
  expect(count).toBeGreaterThan(0)

  const firstLinkTag = await relatedLinks.first().evaluate((el) => el.tagName.toLowerCase())
  expect(firstLinkTag).toBe('a')
})

test('clicking a related link searches and navigates to new-event page', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="wiki-links-list"]', {
    timeout: 15000,
  })

  const firstLink = page.getByTestId('related-link').first()
  const linkText = (await firstLink.textContent())?.trim() ?? ''
  expect(linkText.length).toBeGreaterThan(0)

  await firstLink.click()

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  expect(page.url()).toContain('/ui/new-event')

  const nameText = (await page.getByTestId('name-display').textContent())?.trim() ?? ''
  expect(nameText.length).toBeGreaterThan(0)
})

test('Wikipedia Page section contains HTML content', async ({ page }) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="wiki-page"]', {
    timeout: 15000,
  })

  const wikiContent = page.getByTestId('wiki-page').locator('.wiki-content')
  const innerHTML = await wikiContent.innerHTML()
  expect(innerHTML.length).toBeGreaterThan(0)
  expect(innerHTML).toContain('<')
})

test('Related Links section appears before Wikipedia Page section', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="wiki-page"]', {
    timeout: 15000,
  })

  const linksTop = await page
    .getByTestId('wiki-links-list')
    .evaluate((el) => el.getBoundingClientRect().top)
  const wikiPageTop = await page
    .getByTestId('wiki-page')
    .evaluate((el) => el.getBoundingClientRect().top)
  expect(linksTop).toBeLessThan(wikiPageTop)
})

test('successfully creating an event redirects to home with success message and event in list', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  await fillInput(page, 'start-timestamp-input', '2026-06-15')

  await clickLink(page, 'create-event-action')

  await page.waitForSelector('[data-testid="success-message"]')
  expect(await getElementText(page, 'success-message')).toContain(
    'Event created successfully'
  )
  expect(await isElementVisible(page, 'welcome-message')).toBe(true)
  expect(await isElementVisible(page, 'event-list')).toBe(true)
  expect(await getElementText(page, 'event-list')).toContain('Mercury')
})

test('creating event without signing in shows error', async ({ page }) => {
  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 15000,
  })
  await fillInput(page, 'start-timestamp-input', '2026-06-15')

  await clickLink(page, 'create-event-action')

  await page.waitForSelector('[data-testid="error-message"]')
  expect(await isElementVisible(page, 'error-message')).toBe(true)
})

test('navigating directly to /ui/new-event without search redirects to search page', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/new-event`)
  await page.waitForSelector('[data-testid="name-input"]')
  expect(page.url()).toContain('/ui/search')
})

test('event list shows seeded events when signed in', async ({ page }) => {
  await seedEvents()

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="event-list"]')
  expect(await isElementVisible(page, 'event-list')).toBe(true)

  const items = page.locator('[data-testid="event-item"]')
  expect(await items.count()).toBeGreaterThan(0)
})

test('event list not shown when not signed in', async ({ page }) => {
  await seedEvents()

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="sign-in-prompt"]')
  expect(await isElementVisible(page, 'event-list')).toBe(false)
})

test('shows "No events yet" when signed in with no events', async ({
  page,
}) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/`)
  await page.waitForSelector('[data-testid="no-events-message"]')
  expect(await getElementText(page, 'no-events-message')).toContain(
    'No events yet'
  )
})

test('person categorization displays type and prefills birth/death dates', async ({
  page,
}) => {
  await setAiMock({
    type: 'person',
    'birth-date': '1732-02-22',
    'death-date': '1799-12-14',
  })

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'George Washington')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="type-display"]', {
    timeout: 15000,
  })

  expect(await getElementText(page, 'type-display')).toBe('person')
  expect(await page.getByTestId('start-timestamp-input').inputValue()).toBe(
    '1732-02-22'
  )
  expect(await page.getByTestId('end-timestamp-input').inputValue()).toBe(
    '1799-12-14'
  )
})

test('person categorization without death date leaves end date empty', async ({
  page,
}) => {
  await setAiMock({
    type: 'person',
    'birth-date': '1946-08-19',
  })

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Bill Clinton')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="type-display"]', {
    timeout: 15000,
  })

  expect(await getElementText(page, 'type-display')).toBe('person')
  expect(await page.getByTestId('start-timestamp-input').inputValue()).toBe(
    '1946-08-19'
  )
  expect(await page.getByTestId('end-timestamp-input').inputValue()).toBe('')
})

test('one-time-event categorization prefills start date only', async ({
  page,
}) => {
  await setAiMock({
    type: 'one-time-event',
    'start-date': '1969-07-20',
  })

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Moon landing')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="type-display"]', {
    timeout: 15000,
  })

  expect(await getElementText(page, 'type-display')).toBe('one-time-event')
  expect(await page.getByTestId('start-timestamp-input').inputValue()).toBe(
    '1969-07-20'
  )
  expect(await page.getByTestId('end-timestamp-input').inputValue()).toBe('')
})

test('bounded-event categorization prefills start and end dates', async ({
  page,
}) => {
  await setAiMock({
    type: 'bounded-event',
    'start-date': '1739-10-22',
    'end-date': '1748-10-18',
  })

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="type-display"]', {
    timeout: 15000,
  })

  expect(await getElementText(page, 'type-display')).toBe('bounded-event')
  expect(await page.getByTestId('start-timestamp-input').inputValue()).toBe(
    '1739-10-22'
  )
  expect(await page.getByTestId('end-timestamp-input').inputValue()).toBe(
    '1748-10-18'
  )
})

test('other categorization leaves dates empty', async ({ page }) => {
  await setAiMock({ type: 'other' })

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="type-display"]', {
    timeout: 15000,
  })

  expect(await getElementText(page, 'type-display')).toBe('other')
  expect(await page.getByTestId('start-timestamp-input').inputValue()).toBe('')
  expect(await page.getByTestId('end-timestamp-input').inputValue()).toBe('')
})

test('redirect categorization auto-navigates to first link search', async ({
  page,
}) => {
  await setAiMock({ type: 'redirect' })

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'Mercury')
  await clickLink(page, 'search-wikipedia-action')

  // Wait for redirect to search page, then set mock to 'other' so the
  // follow-up search doesn't loop
  await page.waitForURL('**/ui/search?name=**', { timeout: 30000 })
  await setAiMock({ type: 'other' })

  await page.waitForSelector('[data-testid="basic-description-input"]', {
    timeout: 30000,
  })
  expect(page.url()).toContain('/ui/new-event')

  const nameText = (await page.getByTestId('name-display').textContent())?.trim() ?? ''
  expect(nameText.length).toBeGreaterThan(0)
})

test('type display shows categorization type next to name', async ({
  page,
}) => {
  await setAiMock({
    type: 'person',
    'birth-date': '1732-02-22',
    'death-date': '1799-12-14',
  })

  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)

  await page.goto(`${BASE_URLS.HOME}/ui/search`)
  await page.waitForSelector('[data-testid="name-input"]')

  await fillInput(page, 'name-input', 'George Washington')
  await clickLink(page, 'search-wikipedia-action')

  await page.waitForSelector('[data-testid="type-display"]', {
    timeout: 15000,
  })

  expect(await isElementVisible(page, 'name-display')).toBe(true)
  expect(await isElementVisible(page, 'type-display')).toBe(true)

  const nameDisplay = page.getByTestId('name-display')
  const typeDisplay = page.getByTestId('type-display')

  const nameRect = await nameDisplay.boundingBox()
  const typeRect = await typeDisplay.boundingBox()

  expect(nameRect).not.toBeNull()
  expect(typeRect).not.toBeNull()
  if (nameRect && typeRect) {
    expect(Math.abs(nameRect.y - typeRect.y)).toBeLessThan(20)
  }
})
