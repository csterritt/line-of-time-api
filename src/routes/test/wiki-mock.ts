/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { STANDARD_SECURE_HEADERS } from '../../constants'

interface WikiMockEntry {
  query: unknown
  parse: unknown
}

const wikiMockData = new Map<string, WikiMockEntry>()

export const getWikiMockData = (name: string): WikiMockEntry | undefined =>
  wikiMockData.get(name)

const testWikiMockRouter = new Hono()

testWikiMockRouter.post(
  '/set',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const body = (await c.req.json()) as {
        name: string
        query: unknown
        parse: unknown
      }

      if (!body.name || !body.query || !body.parse) {
        return c.json(
          { success: false, error: 'name, query, and parse are required' },
          400
        )
      }

      wikiMockData.set(body.name, { query: body.query, parse: body.parse })

      console.log('Wiki mock data set for:', body.name)

      return c.json({
        success: true,
        message: `Wiki mock data set for "${body.name}"`,
      })
    } catch (error) {
      console.error('Failed to set wiki mock data:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to set wiki mock data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

testWikiMockRouter.post(
  '/reset',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      wikiMockData.clear()
      console.log('Wiki mock data cleared')

      return c.json({
        success: true,
        message: 'Wiki mock data reset',
      })
    } catch (error) {
      console.error('Failed to reset wiki mock data:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to reset wiki mock data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

export { testWikiMockRouter }
