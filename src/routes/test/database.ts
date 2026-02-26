/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createDbClient } from '../../db/client'
import {
  NewAccount,
  NewEvent,
  NewSingleUseCode,
  NewUser,
} from '../../db/schema'
import { testDbAccess } from '../../../e2e-tests/support/db-access'
import { checkSingleUseCodeAvailable } from '../../lib/db-access'
import { STANDARD_SECURE_HEADERS } from '../../constants'

/**
 * Test-only database manipulation endpoints
 * These endpoints should ONLY be available in development/test environments
 */

const testDatabaseRouter = new Hono<{
  Bindings: { LINE_OF_TIME_DB: D1Database }
}>()

/**
 * Clear all authentication data from the database
 * DELETE /test/database/clear
 */
testDatabaseRouter.delete(
  '/clear',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const db = createDbClient(c.env.LINE_OF_TIME_DB)

      const clearResult = await testDbAccess.clearTestDatabase(db)

      if (clearResult.isErr) {
        throw clearResult.error
      }

      console.log('Test database cleared successfully')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Database cleared successfully',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } catch (error) {
      console.error('Failed to clear test database:', error)

      return new Response(
        JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unknown error clearing test database',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
)

/**
 * Clear all authentication data from the database
 * DELETE /test/database/clear
 */
testDatabaseRouter.delete(
  '/clear-sessions',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const db = createDbClient(c.env.LINE_OF_TIME_DB)

      const clearResult = await testDbAccess.clearTestSessions(db)

      if (clearResult.isErr) {
        throw clearResult.error
      }

      console.log('Test database sessions cleared successfully')

      return c.json({
        success: true,
        message: 'Database sessions cleared successfully',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to clear test database sessions:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to clear database sessions',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * Seed the database with test data
 * POST /test/database/seed
 */
testDatabaseRouter.post(
  '/seed',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const db = createDbClient(c.env.LINE_OF_TIME_DB)

      // Insert test users
      const testUsers: NewUser[] = [
        {
          id: 'gv9HBfkV7WbSSAkgVW0g5WtYf6hqaJyv',
          name: 'Chris',
          email: 'csterritt@gmail.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(1754691970 * 1000),
          updatedAt: new Date(1754691970 * 1000),
        },
        {
          id: 'On2TgJxPrsP7McTAkYLxoEwsKSpTUldF',
          name: 'FredF',
          email: 'fredfred@team439980.testinator.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(1754692362 * 1000),
          updatedAt: new Date(1754692362 * 1000),
        },
      ]

      // Insert test accounts with credentials
      const testAccounts: NewAccount[] = [
        {
          id: 'u95mdScYyupHDIAF76793YXkI8mDBxwf',
          userId: 'gv9HBfkV7WbSSAkgVW0g5WtYf6hqaJyv',
          accountId: 'gv9HBfkV7WbSSAkgVW0g5WtYf6hqaJyv',
          providerId: 'credential',
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
          idToken: null,
          password:
            '9461538c8ed05944c1ff4744050320ec:7f25e93a4c138ce0dc5a0be87ca63ecdb2eb242d64a9270cb1c727114a2d55577b84d246c4b8e35cf804603df9917b854cbb61aec94cc3c7e6f29fb3502704d6',
          createdAt: new Date(1754691970 * 1000),
          updatedAt: new Date(1754691970 * 1000),
        },
        {
          id: 'HCRWSgAh2CAvHzT9JzvmJ1NVk2OQa75K',
          userId: 'On2TgJxPrsP7McTAkYLxoEwsKSpTUldF',
          accountId: 'On2TgJxPrsP7McTAkYLxoEwsKSpTUldF',
          providerId: 'credential',
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
          idToken: null,
          password:
            '7e5d7c0ecefe406431c83511212f4432:81ee5ebdd4123c3d78037185ace585897b9c3465f33f7a9f3f8bec31b919f373054b861ba18f3c6952609abb71cd870e2d2a8f3f14566e910d4d5bf0ac5ba6d5',
          createdAt: new Date(1754692362 * 1000),
          updatedAt: new Date(1754692362 * 1000),
        },
      ]

      // Insert test single-use codes for gated sign-up testing
      const testSingleUseCodes: NewSingleUseCode[] = [
        { code: 'WELCOME2024' },
        { code: 'BETA-ACCESS-123' },
        { code: 'EARLY-BIRD-456' },
        { code: 'TEST-CODE-789' },
        { code: 'DEMO-ACCESS-111' },
      ]

      const seedResult = await testDbAccess.seedAuthTestData(
        db,
        testUsers,
        testAccounts,
        testSingleUseCodes
      )

      if (seedResult.isErr) {
        throw seedResult.error
      }

      console.log('Test database seeded successfully')

      return c.json({
        success: true,
        message: 'Database seeded successfully',
        usersCreated: testUsers.length,
        accountsCreated: testAccounts.length,
        singleUseCodesCreated: testSingleUseCodes.length,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to seed test database:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to seed database',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * Get database status for debugging
 * GET /test/database/status
 */
testDatabaseRouter.get(
  '/status',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const db = createDbClient(c.env.LINE_OF_TIME_DB)

      const countsResult = await testDbAccess.getTestDatabaseCounts(db)

      if (countsResult.isErr) {
        throw countsResult.error
      }

      return c.json({
        success: true,
        counts: {
          users: countsResult.value.users,
          accounts: countsResult.value.accounts,
          sessions: countsResult.value.sessions,
          singleUseCodes: countsResult.value.singleUseCodes,
          interestedEmail: countsResult.value.interestedEmail,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to get database status:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to get database status',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * Check if a single-use code exists in the database
 * GET /test/database/code-exists/:code
 */
testDatabaseRouter.get(
  '/code-exists/:code',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const code = c.req.param('code')
      const db = createDbClient(c.env.LINE_OF_TIME_DB)

      const existsResult = await checkSingleUseCodeAvailable(db, code)

      if (existsResult.isErr) {
        throw existsResult.error
      }

      return c.json({
        success: true,
        exists: existsResult.value,
        code,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to check code existence:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to check code existence',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * Clear all events from the database
 * DELETE /test/database/clear-events
 */
testDatabaseRouter.delete(
  '/clear-events',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const db = createDbClient(c.env.LINE_OF_TIME_DB)
      const clearResult = await testDbAccess.clearAllEvents(db)

      if (clearResult.isErr) {
        throw clearResult.error
      }

      console.log('Test events cleared successfully')

      return c.json({
        success: true,
        message: 'Events cleared successfully',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to clear test events:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to clear events',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * Seed the database with test events
 * POST /test/database/seed-events
 */
testDatabaseRouter.post(
  '/seed-events',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const db = createDbClient(c.env.LINE_OF_TIME_DB)
      const now = new Date().toISOString()

      const testEvents: NewEvent[] = [
        {
          id: 'test-event-1',
          startTimestamp: 718997,
          endTimestamp: null,
          name: 'Moon Landing',
          basicDescription: 'First human on the moon',
          referenceUrl: 'https://en.wikipedia.org/wiki/Apollo_11',
          relatedEventIds: null,
          eventType: 'event',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'test-event-2',
          startTimestamp: 708082,
          endTimestamp: 710275,
          name: 'World War II',
          basicDescription: 'Global war from 1939 to 1945',
          referenceUrl: 'https://en.wikipedia.org/wiki/World_War_II',
          relatedEventIds: null,
          eventType: 'event',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'test-event-3',
          startTimestamp: 648490,
          endTimestamp: null,
          name: 'US Declaration of Independence',
          basicDescription: 'Declaration of Independence signed',
          referenceUrl:
            'https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence',
          relatedEventIds: null,
          eventType: 'event',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'test-event-4',
          startTimestamp: 632234,
          endTimestamp: 657053,
          name: 'George Washington',
          basicDescription: 'First President of the United States',
          referenceUrl: 'https://en.wikipedia.org/wiki/George_Washington',
          relatedEventIds: null,
          eventType: 'person',
          createdAt: now,
          updatedAt: now,
        },
      ]

      const seedResult = await testDbAccess.seedEventTestData(db, testEvents)

      if (seedResult.isErr) {
        throw seedResult.error
      }

      console.log('Test events seeded successfully')

      return c.json({
        success: true,
        message: 'Events seeded successfully',
        eventsCreated: testEvents.length,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to seed test events:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to seed events',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * Get event count for testing
 * GET /test/database/event-count
 */
testDatabaseRouter.get(
  '/event-count',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const db = createDbClient(c.env.LINE_OF_TIME_DB)

      const countResult = await testDbAccess.getEventCount(db)

      if (countResult.isErr) {
        throw countResult.error
      }

      return c.json({
        success: true,
        count: countResult.value,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to get event count:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to get event count',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

export { testDatabaseRouter }
