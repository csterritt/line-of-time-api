import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import {
  setAiMock,
  resetAiMock,
  setWikiMock,
  resetWikiMock,
} from '../support/db-helpers'
import { BASE_URLS } from '../support/test-data'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(currentDir, '../../test-data/pages')

const loadFixture = (filename: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(fixturesDir, filename), 'utf-8'))

test.describe('POST /time-info/initial-search — categorization via AI', () => {
  test.beforeEach(async () => {
    const queryData = loadFixture('george-washington-query.json')
    const parseData = loadFixture('george-washington-parse.json')

    await setWikiMock({
      name: 'George Washington',
      query: queryData,
      parse: parseData,
    })
  })

  test.afterEach(async () => {
    await resetWikiMock()
    await resetAiMock()
  })

  test('returns categorization field from AI mock when type is person', async ({
    request,
  }) => {
    await setAiMock({
      type: 'person',
      'birth-date': '1732-02-22',
      'death-date': '1799-12-14',
    })

    const response = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      data: { name: 'George Washington' },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    expect(body.categorization).toBeDefined()
    expect(body.categorization.type).toBe('person')
    expect(body.categorization['birth-date']).toBe('1732-02-22')
    expect(body.categorization['death-date']).toBe('1799-12-14')
  })

  test('returns categorization field from AI mock when type is other', async ({
    request,
  }) => {
    await setAiMock({ type: 'other' })

    const response = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      data: { name: 'George Washington' },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    expect(body.categorization).toBeDefined()
    expect(body.categorization.type).toBe('other')
  })

  test('returns 400 for missing name', async ({ request }) => {
    const response = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      data: {},
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('returns 400 for whitespace-only name', async ({ request }) => {
    const response = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      data: { name: '   ' },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('returns 400 for invalid JSON body', async ({ request }) => {
    const response = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-json',
    })

    expect(response.status()).toBe(400)
  })
})
