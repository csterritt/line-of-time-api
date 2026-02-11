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

const utilityLinkPattern = /^[A-Z ]\S*:[A-Z]/i

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(currentDir, '../../test-data/pages')

const loadFixture = (filename: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(fixturesDir, filename), 'utf-8'))

test.describe('POST /time-info/initial-search — utility link filtering', () => {
  test.beforeEach(async () => {
    const queryData = loadFixture('george-washington-query.json')
    const parseData = loadFixture('george-washington-parse.json')

    await setWikiMock({
      name: 'George Washington',
      query: queryData,
      parse: parseData,
    })
    await setAiMock({ type: 'other' })
  })

  test.afterEach(async () => {
    await resetWikiMock()
    await resetAiMock()
  })

  test('filters out utility links like Wikipedia:X and Category:X', async ({
    request,
  }) => {
    const response = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      data: { name: 'George Washington' },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    const links: string[] = body.links
    expect(Array.isArray(links)).toBe(true)
    expect(links.length).toBeGreaterThan(0)

    for (const link of links) {
      expect(link).not.toMatch(utilityLinkPattern)
    }
  })

  test('returns expected number of normal links after filtering', async ({
    request,
  }) => {
    const response = await request.post(BASE_URLS.TIME_INFO_INITIAL_SEARCH, {
      data: { name: 'George Washington' },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()

    const links: string[] = body.links
    expect(links.length).toBe(15)
  })
})
