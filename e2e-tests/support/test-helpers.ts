import type { APIResponse, APIRequestContext } from '@playwright/test'

import { clearDatabase, clearSessions, seedDatabase } from './db-helpers'

const transientStatuses = new Set([502, 503, 504])
const requestRetryAttempts = 3
const requestRetryDelayMs = 500
const requestTimeoutMs = 5000

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Wrapper type for Playwright test function
 */
type PlaywrightTestFunction = ({
  page,
  request,
}: {
  page: any
  request: any
}) => Promise<void>
/**
 * Enhanced test wrapper that provides database isolation
 * Clears and seeds database before each test, cleans up after
 */
export const testWithDatabase = (
  testFn: PlaywrightTestFunction
): PlaywrightTestFunction => {
  return async ({ page, request }) => {
    try {
      // Setup: Clear and seed database
      await clearDatabase()
      await seedDatabase()
      await clearSessions()

      // Run the test
      await testFn({ page, request })
    } finally {
      // Cleanup: Clear database after test
      await clearDatabase()
    }
  }
}

export const getWithRetry = async (
  request: APIRequestContext,
  url: string
): Promise<APIResponse> => {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= requestRetryAttempts; attempt++) {
    try {
      const response = await request.get(url, { timeout: requestTimeoutMs })

      if (
        transientStatuses.has(response.status()) &&
        attempt < requestRetryAttempts
      ) {
        await sleep(requestRetryDelayMs * attempt)
        continue
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === requestRetryAttempts) {
        throw lastError
      }
    }

    await sleep(requestRetryDelayMs * attempt)
  }

  throw lastError ?? new Error(`GET ${url} failed after retries`)
}
