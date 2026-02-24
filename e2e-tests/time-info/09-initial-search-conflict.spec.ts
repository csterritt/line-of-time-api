import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { BASE_URLS, TEST_USERS } from '../support/test-data'
import { submitSignInForm } from '../support/form-helpers'
import { clearDatabase, getEventCount, seedDatabase, setWikiMock, resetWikiMock } from '../support/db-helpers'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(currentDir, '../../test-data/pages')

const loadFixture = (filename: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(fixturesDir, filename), 'utf-8'))

test.describe('POST /time-info/initial-search — conflict check', () => {
  test.beforeEach(async () => {
    await clearDatabase()
    await seedDatabase()
    const queryData = loadFixture('george-washington-query.json')
    const parseData = loadFixture('george-washington-parse.json')
    
    await setWikiMock({
      name: 'George Washington',
      query: queryData,
      parse: parseData,
    })
  })

  test.afterEach(async () => {
    await clearDatabase()
    await resetWikiMock()
  })

  test('returns 409 Conflict when event with same referenceUrl already exists', async ({
    page,
    request,
  }) => {
    // 1. Log in to create an event
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)
    await page.waitForURL(/\/ui/)

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    // 2. Create the event
    const eventName = 'George Washington'
    const referenceUrl = `https://en.wikipedia.org/wiki/George%20Washington`
    
    const validEvent = {
      name: eventName,
      basicDescription: 'First president of the United States',
      startTimestamp: 1732,
      referenceUrl: referenceUrl,
    }

    const createResponse = await request.post(`${BASE_URLS.TIME_INFO_NEW_EVENT}`, {
      data: validEvent,
      headers: { Cookie: cookieHeader },
    })
    expect(createResponse.status()).toBe(201)

    // 3. Search for the same event via initial-search
    const searchResponse = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      data: { name: eventName },
    })

    // 4. Verify 409 Conflict is returned
    expect(searchResponse.status()).toBe(409)
    
    const body = await searchResponse.json()
    expect(body.error).toBe('An event for this Wikipedia page already exists.')
  })
})
