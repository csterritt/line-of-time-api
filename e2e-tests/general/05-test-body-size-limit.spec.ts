import { test, expect } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { HTML_STATUS } from '../../src/constants'

test.describe('Body size limit', () => {
  test.describe.configure({ timeout: 90000 })

  test(
    'returns 413 status when JSON payload exceeds size limit',
    testWithDatabase(async ({ request }) => {
      // Create a large payload (5KB) - exceeds the 4KB body limit
      const largePayload = { search: 'X'.repeat(5000) }

      // Attempt to POST to the search endpoint with the large payload
      const response = await request.post(
        'http://localhost:3000/time-info/search',
        {
          data: largePayload,
          headers: {
            // Set the Origin header to match the allowed origin in the CSRF middleware
            Origin: 'http://localhost:3000',
            'Content-Type': 'application/json',
          },
          failOnStatusCode: false, // Don't fail the test on non-2xx status codes
        }
      )

      // Verify the response status is 413 Content Too Large
      expect(response.status()).toBe(HTML_STATUS.CONTENT_TOO_LARGE)

      // Verify the response contains the overflow error message
      const responseText = await response.text()
      expect(responseText).toContain('overflow :(')
    })
  )

  test(
    'returns 413 status when form data payload exceeds size limit',
    testWithDatabase(async ({ request }) => {
      // Create form data with a large value (5KB) - exceeds the 4KB body limit
      // Using forgot password endpoint which accepts form data
      const formData = {
        email: 'X'.repeat(5000) + '@example.com',
      }

      // Attempt to POST to the forgot password endpoint with the large form data payload
      const response = await request.post(
        'http://localhost:3000/auth/forgot-password',
        {
          form: formData,
          headers: {
            // Set the Origin header to match the allowed origin in the CSRF middleware
            Origin: 'http://localhost:3000',
          },
          failOnStatusCode: false, // Don't fail the test on non-2xx status codes
        }
      )

      // Verify the response status is 413 Content Too Large
      expect(response.status()).toBe(HTML_STATUS.CONTENT_TOO_LARGE)

      // Verify the response contains the overflow error message
      const responseText = await response.text()
      expect(responseText).toContain('overflow :(')
    })
  )

  test(
    'correctly handles payloads at the size limit boundary',
    testWithDatabase(async ({ request }) => {
      // Create a payload just under the search endpoint's 50-byte limit
      const validSearchPayload = { search: 'X'.repeat(40) } // Well under 50 bytes

      // Attempt to POST with valid search payload
      const validSearchResponse = await request.post(
        'http://localhost:3000/time-info/search',
        {
          data: validSearchPayload,
          headers: {
            Origin: 'http://localhost:3000',
            'Content-Type': 'application/json',
          },
          failOnStatusCode: false,
        }
      )

      // This should succeed (200 OK)
      expect(validSearchResponse.status()).toBe(200)

      // Create a payload over the search endpoint's 50-byte limit but under body size limit
      const tooLongSearchPayload = { search: 'X'.repeat(100) } // Over 50 bytes, under 1024 bytes

      // Attempt to POST with search that's too long
      const tooLongSearchResponse = await request.post(
        'http://localhost:3000/time-info/search',
        {
          data: tooLongSearchPayload,
          headers: {
            Origin: 'http://localhost:3000',
            'Content-Type': 'application/json',
          },
          failOnStatusCode: false,
        }
      )

      // This should fail with 400 Bad Request (search validation error, not body size error)
      expect(tooLongSearchResponse.status()).toBe(400)
    })
  )
})
