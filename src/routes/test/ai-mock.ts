/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { STANDARD_SECURE_HEADERS } from '../../constants'
import type { CategorizationResult } from '../../lib/ai-search'

let aiMockResult: CategorizationResult | null = null

export const getAiMockResult = (): CategorizationResult | null => aiMockResult

const testAiMockRouter = new Hono()

testAiMockRouter.post(
  '/set',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const body = await c.req.json()
      aiMockResult = body as CategorizationResult

      console.log('AI mock result set:', JSON.stringify(aiMockResult))

      return c.json({
        success: true,
        message: 'AI mock result set',
        result: aiMockResult,
      })
    } catch (error) {
      console.error('Failed to set AI mock result:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to set AI mock result',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

testAiMockRouter.post(
  '/reset',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      aiMockResult = null
      console.log('AI mock result cleared')

      return c.json({
        success: true,
        message: 'AI mock result reset',
      })
    } catch (error) {
      console.error('Failed to reset AI mock result:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to reset AI mock result',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

export { testAiMockRouter }
