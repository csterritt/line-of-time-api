/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Centralized database access layer with retry logic and Result types
 * @module lib/db-access
 */
import retry from 'async-retry'
import Result from 'true-myth/result'
import { eq, and, isNull, sql, gte, lte, or } from 'drizzle-orm'

import {
  user,
  account,
  session,
  singleUseCode,
  interestedEmail,
  event,
  Event,
  NewEvent,
  NewUser,
  NewAccount,
  NewSingleUseCode,
} from '../db/schema'
import { STANDARD_RETRY_OPTIONS } from '../constants'
import type { DrizzleClient } from '../local-types'

/**
 * Type definitions for database operations
 */
export interface UserWithAccountData {
  userId: string
  userName: string | null
  userEmail: string
  emailVerified: boolean
  accountUpdatedAt: Date | null
}

export interface UserIdData {
  id: string
}

export interface SearchEventResult {
  id: string
  name: string
  basicDescription: string
}

export interface TestDatabaseCounts {
  users: number
  accounts: number
  sessions: number
  singleUseCodes: number
  interestedEmail: number
}

/**
 * Wrap a database operation with retry logic and Result type handling
 * @param operationName - Name of the operation for logging
 * @param operation - The async operation to execute
 * @returns Promise<Result<T, Error>>
 */
const withRetry = async <T>(
  operationName: string,
  operation: () => Promise<Result<T, Error>>
): Promise<Result<T, Error>> => {
  try {
    return await retry(async () => {
      const result = await operation()
      if (result.isErr) {
        throw result.error
      }
      return result
    }, STANDARD_RETRY_OPTIONS)
  } catch (err) {
    console.log(`${operationName} final error:`, err)
    return Result.err(err instanceof Error ? err : new Error(String(err)))
  }
}

/**
 * Wrap a value in Result.ok, or wrap an error in Result.err
 * @param fn - The async function to execute
 * @returns Promise<Result<T, Error>>
 */
const toResult = async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
  try {
    return Result.ok(await fn())
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Insert a new event
 * @param db - Database instance
 * @param newEvent - Event payload to insert
 * @returns Promise<Result<boolean, Error>>
 */
export const insertEvent = (
  db: DrizzleClient,
  newEvent: NewEvent
): Promise<Result<boolean, Error>> =>
  withRetry('insertEvent', () => insertEventActual(db, newEvent))

const insertEventActual = (
  db: DrizzleClient,
  newEvent: NewEvent
): Promise<Result<boolean, Error>> =>
  toResult(async () => {
    await db.insert(event).values(newEvent)
    return true
  })

/**
 * Get a single event by ID
 * @param db - Database instance
 * @param id - Event ID
 * @returns Promise<Result<Event | null, Error>>
 */
export const getEventById = (
  db: DrizzleClient,
  id: string
): Promise<Result<Event | null, Error>> =>
  withRetry('getEventById', () => getEventByIdActual(db, id))

const getEventByIdActual = async (
  db: DrizzleClient,
  id: string
): Promise<Result<Event | null, Error>> => {
  try {
    const events = await db.select().from(event).where(eq(event.id, id)).limit(1)
    return Result.ok(events.length > 0 ? events[0] : null)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Get events where start timestamp is within [start, end]
 * @param db - Database instance
 * @param start - Start timestamp inclusive
 * @param end - End timestamp inclusive
 * @returns Promise<Result<Event[], Error>>
 */
export const getEventsByTimestampRange = (
  db: DrizzleClient,
  start: number,
  end: number
): Promise<Result<Event[], Error>> =>
  withRetry('getEventsByTimestampRange', () =>
    getEventsByTimestampRangeActual(db, start, end)
  )

const getEventsByTimestampRangeActual = async (
  db: DrizzleClient,
  start: number,
  end: number
): Promise<Result<Event[], Error>> => {
  try {
    const eventsInRange = await db
      .select()
      .from(event)
      .where(and(gte(event.startTimestamp, start), lte(event.startTimestamp, end)))
      .orderBy(event.startTimestamp)
    return Result.ok(eventsInRange)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Search events by case-insensitive name/description match
 * @param db - Database instance
 * @param searchTerm - Search input
 * @param limit - Max number of results
 * @returns Promise<Result<SearchEventResult[], Error>>
 */
export const searchEvents = (
  db: DrizzleClient,
  searchTerm: string,
  limit: number
): Promise<Result<SearchEventResult[], Error>> =>
  withRetry('searchEvents', () => searchEventsActual(db, searchTerm, limit))

const searchEventsActual = async (
  db: DrizzleClient,
  searchTerm: string,
  limit: number
): Promise<Result<SearchEventResult[], Error>> => {
  try {
    const escapedSearch = searchTerm.replace(/[%_]/g, '\\$&')
    const searchPattern = `%${escapedSearch}%`
    const lowerPattern = searchPattern.toLowerCase()

    const results = await db
      .select({
        id: event.id,
        name: event.name,
        basicDescription: event.basicDescription,
      })
      .from(event)
      .where(
        or(
          sql`LOWER(${event.name}) LIKE ${lowerPattern}`,
          sql`LOWER(${event.basicDescription}) LIKE ${lowerPattern}`
        )
      )
      .orderBy(event.startTimestamp)
      .limit(limit)

    return Result.ok(results)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Update an event by ID
 * @param db - Database instance
 * @param id - Event ID
 * @param updatedEvent - Partial update payload
 * @returns Promise<Result<boolean, Error>>
 */
export const updateEventById = (
  db: DrizzleClient,
  id: string,
  updatedEvent: Partial<NewEvent>
): Promise<Result<boolean, Error>> =>
  withRetry('updateEventById', () => updateEventByIdActual(db, id, updatedEvent))

const updateEventByIdActual = async (
  db: DrizzleClient,
  id: string,
  updatedEvent: Partial<NewEvent>
): Promise<Result<boolean, Error>> => {
  try {
    await db.update(event).set(updatedEvent).where(eq(event.id, id))
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Delete an event by ID
 * @param db - Database instance
 * @param id - Event ID
 * @returns Promise<Result<boolean, Error>>
 */
export const deleteEventById = (
  db: DrizzleClient,
  id: string
): Promise<Result<boolean, Error>> =>
  withRetry('deleteEventById', () => deleteEventByIdActual(db, id))

const deleteEventByIdActual = async (
  db: DrizzleClient,
  id: string
): Promise<Result<boolean, Error>> => {
  try {
    await db.delete(event).where(eq(event.id, id))
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Clear all test database tables in FK-safe order
 * @param db - Database instance
 * @returns Promise<Result<boolean, Error>>
 */
export const clearTestDatabase = (
  db: DrizzleClient
): Promise<Result<boolean, Error>> =>
  withRetry('clearTestDatabase', () => clearTestDatabaseActual(db))

const clearTestDatabaseActual = async (
  db: DrizzleClient
): Promise<Result<boolean, Error>> => {
  try {
    await db.delete(session)
    await db.delete(account)
    await db.delete(user)
    await db.delete(singleUseCode)
    await db.delete(interestedEmail)
    await db.delete(event)
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Clear test sessions
 * @param db - Database instance
 * @returns Promise<Result<boolean, Error>>
 */
export const clearTestSessions = (
  db: DrizzleClient
): Promise<Result<boolean, Error>> =>
  withRetry('clearTestSessions', () => clearTestSessionsActual(db))

const clearTestSessionsActual = async (
  db: DrizzleClient
): Promise<Result<boolean, Error>> => {
  try {
    await db.delete(session)
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Seed auth-related test data
 * @param db - Database instance
 * @param users - User records
 * @param accounts - Account records
 * @param codes - Single use code records
 * @returns Promise<Result<boolean, Error>>
 */
export const seedAuthTestData = (
  db: DrizzleClient,
  users: NewUser[],
  accounts: NewAccount[],
  codes: NewSingleUseCode[]
): Promise<Result<boolean, Error>> =>
  withRetry('seedAuthTestData', () =>
    seedAuthTestDataActual(db, users, accounts, codes)
  )

const seedAuthTestDataActual = async (
  db: DrizzleClient,
  users: NewUser[],
  accounts: NewAccount[],
  codes: NewSingleUseCode[]
): Promise<Result<boolean, Error>> => {
  try {
    for (const userData of users) {
      await db.insert(user).values(userData)
    }

    for (const accountData of accounts) {
      await db.insert(account).values(accountData)
    }

    for (const codeData of codes) {
      await db.insert(singleUseCode).values(codeData)
    }

    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Get table counts used by test status endpoint
 * @param db - Database instance
 * @returns Promise<Result<TestDatabaseCounts, Error>>
 */
export const getTestDatabaseCounts = (
  db: DrizzleClient
): Promise<Result<TestDatabaseCounts, Error>> =>
  withRetry('getTestDatabaseCounts', () => getTestDatabaseCountsActual(db))

const getTestDatabaseCountsActual = async (
  db: DrizzleClient
): Promise<Result<TestDatabaseCounts, Error>> => {
  try {
    const userCount = await db.select().from(user)
    const accountCount = await db.select().from(account)
    const sessionCount = await db.select().from(session)
    const singleUseCodeCount = await db.select().from(singleUseCode)
    const interestedEmailCount = await db.select().from(interestedEmail)

    return Result.ok({
      users: userCount.length,
      accounts: accountCount.length,
      sessions: sessionCount.length,
      singleUseCodes: singleUseCodeCount.length,
      interestedEmail: interestedEmailCount.length,
    })
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Check if a single-use code exists and is unclaimed
 * @param db - Database instance
 * @param code - Code to check
 * @returns Promise<Result<boolean, Error>>
 */
export const checkSingleUseCodeAvailable = (
  db: DrizzleClient,
  code: string
): Promise<Result<boolean, Error>> =>
  withRetry('checkSingleUseCodeAvailable', () =>
    checkSingleUseCodeAvailableActual(db, code)
  )

const checkSingleUseCodeAvailableActual = async (
  db: DrizzleClient,
  code: string
): Promise<Result<boolean, Error>> => {
  try {
    const result = await db
      .select({ code: singleUseCode.code })
      .from(singleUseCode)
      .where(and(eq(singleUseCode.code, code), isNull(singleUseCode.email)))
      .limit(1)
    return Result.ok(result.length === 1)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Clear all events for test setup
 * @param db - Database instance
 * @returns Promise<Result<boolean, Error>>
 */
export const clearAllEvents = (
  db: DrizzleClient
): Promise<Result<boolean, Error>> =>
  withRetry('clearAllEvents', () => clearAllEventsActual(db))

const clearAllEventsActual = async (
  db: DrizzleClient
): Promise<Result<boolean, Error>> => {
  try {
    await db.delete(event)
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Seed event test data
 * @param db - Database instance
 * @param events - Event records
 * @returns Promise<Result<boolean, Error>>
 */
export const seedEventTestData = (
  db: DrizzleClient,
  events: NewEvent[]
): Promise<Result<boolean, Error>> =>
  withRetry('seedEventTestData', () => seedEventTestDataActual(db, events))

const seedEventTestDataActual = async (
  db: DrizzleClient,
  events: NewEvent[]
): Promise<Result<boolean, Error>> => {
  try {
    for (const eventData of events) {
      await db.insert(event).values(eventData)
    }
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Count all events
 * @param db - Database instance
 * @returns Promise<Result<number, Error>>
 */
export const getEventCount = (
  db: DrizzleClient
): Promise<Result<number, Error>> =>
  withRetry('getEventCount', () => getEventCountActual(db))

const getEventCountActual = async (
  db: DrizzleClient
): Promise<Result<number, Error>> => {
  try {
    const events = await db.select().from(event)
    return Result.ok(events.length)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Get user with account data for rate limiting checks
 * @param db - Database instance
 * @param email - User email to look up
 * @returns Promise<Result<UserWithAccountData[], Error>>
 */
export const getUserWithAccountByEmail = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserWithAccountData[], Error>> =>
  withRetry('getUserWithAccountByEmail', () =>
    getUserWithAccountByEmailActual(db, email)
  )

const getUserWithAccountByEmailActual = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserWithAccountData[], Error>> =>
  toResult(() =>
    db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        emailVerified: user.emailVerified,
        accountUpdatedAt: account.updatedAt,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email))
      .limit(1)
  )

/**
 * Find user by email and return user ID
 * @param db - Database instance
 * @param email - User email to look up
 * @returns Promise<Result<UserIdData[], Error>>
 */
export const getUserIdByEmail = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserIdData[], Error>> =>
  withRetry('getUserIdByEmail', () => getUserIdByEmailActual(db, email))

const getUserIdByEmailActual = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserIdData[], Error>> =>
  toResult(() =>
    db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)
  )

/**
 * Check if a name already exists (case-insensitive)
 * @param db - Database instance
 * @param name - User name to check
 * @returns Promise<Result<boolean, Error>> - true if name exists, false otherwise
 */
export const checkNameExists = (
  db: DrizzleClient,
  name: string
): Promise<Result<boolean, Error>> =>
  withRetry('checkNameExists', () => checkNameExistsActual(db, name))

const checkNameExistsActual = async (
  db: DrizzleClient,
  name: string
): Promise<Result<boolean, Error>> => {
  try {
    const result = await db
      .select({ id: user.id })
      .from(user)
      .where(sql`LOWER(${user.name}) = LOWER(${name})`)
      .limit(1)
    return Result.ok(result.length > 0)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Update account timestamp for rate limiting
 * @param db - Database instance
 * @param userId - User ID whose account to update
 * @returns Promise<Result<boolean, Error>>
 */
export const updateAccountTimestamp = (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> =>
  withRetry('updateAccountTimestamp', () =>
    updateAccountTimestampActual(db, userId)
  )

const updateAccountTimestampActual = async (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> => {
  try {
    await db
      .update(account)
      .set({ updatedAt: new Date() })
      .where(eq(account.userId, userId))
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Atomically claim a single-use code for an email address.
 * Uses UPDATE with WHERE email IS NULL to ensure only one request wins the race.
 * @param db - Database instance
 * @param code - The code to claim
 * @param email - The email address claiming the code
 * @returns Promise<Result<boolean, Error>> - true if code was claimed, false if invalid or already claimed
 */
export const claimSingleUseCode = (
  db: DrizzleClient,
  code: string,
  email: string
): Promise<Result<boolean, Error>> =>
  withRetry('claimSingleUseCode', () =>
    claimSingleUseCodeActual(db, code, email)
  )

const claimSingleUseCodeActual = async (
  db: DrizzleClient,
  code: string,
  email: string
): Promise<Result<boolean, Error>> => {
  try {
    const result = await db
      .update(singleUseCode)
      .set({ email })
      .where(and(eq(singleUseCode.code, code), isNull(singleUseCode.email)))
    const rowsUpdated = result.meta?.changes || 0
    return Result.ok(rowsUpdated === 1)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Add an email to the interested emails list
 * @param db - Database instance
 * @param email - Email address to add
 * @returns Promise<Result<boolean, Error>> - true if added successfully, false if already exists
 */
export const addInterestedEmail = (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> =>
  withRetry('addInterestedEmail', () => addInterestedEmailActual(db, email))

/**
 * Check if an email is already in the interested emails list
 * @param db - Database instance
 * @param email - Email address to check
 * @returns Promise<Result<boolean, Error>> - true if email exists, false otherwise
 */
export const checkInterestedEmailExists = (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> =>
  withRetry('checkInterestedEmailExists', () =>
    checkInterestedEmailExistsActual(db, email)
  )

const isUniqueConstraintError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toUpperCase()
    if (
      message.includes('UNIQUE CONSTRAINT') ||
      message.includes('UNIQUE_CONSTRAINT') ||
      message.includes('SQLITE_CONSTRAINT_UNIQUE') ||
      message.includes('SQLITE_CONSTRAINT') ||
      message.includes('DUPLICATE KEY') ||
      message.includes('D1_ERROR: UNIQUE')
    ) {
      return true
    }
    // Check the cause property for nested errors (Drizzle wraps D1 errors)
    const cause = (error as { cause?: unknown }).cause
    if (cause) {
      return isUniqueConstraintError(cause)
    }
  }
  return false
}

const addInterestedEmailActual = async (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> => {
  try {
    await db.insert(interestedEmail).values({ email })
    return Result.ok(true)
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return Result.ok(false)
    }
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

const checkInterestedEmailExistsActual = async (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> => {
  try {
    const existingEmails = await db
      .select()
      .from(interestedEmail)
      .where(eq(interestedEmail.email, email))
    return Result.ok(existingEmails.length > 0)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Delete a user account by user ID
 * FK cascade will automatically delete associated sessions and accounts
 * @param db - Database instance
 * @param userId - User ID to delete
 * @returns Promise<Result<boolean, Error>> - true if user was deleted
 */
export const deleteUserAccount = (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> =>
  withRetry('deleteUserAccount', () => deleteUserAccountActual(db, userId))

const deleteUserAccountActual = async (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> => {
  try {
    const result = await db.delete(user).where(eq(user.id, userId))
    // D1 returns changes in meta.changes, but fallback to rowsAffected for compatibility
    const rowsDeleted =
      result.meta?.changes ??
      (result as { rowsAffected?: number }).rowsAffected ??
      0
    return Result.ok(rowsDeleted >= 1)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Get an event by its reference URL
 * @param db - Database instance
 * @param referenceUrl - Reference URL to search for
 * @returns Promise<Result<Event | null, Error>>
 */
export const getEventByReferenceUrl = (
  db: DrizzleClient,
  referenceUrl: string
): Promise<Result<Event | null, Error>> =>
  withRetry('getEventByReferenceUrl', () =>
    getEventByReferenceUrlActual(db, referenceUrl)
  )

const getEventByReferenceUrlActual = async (
  db: DrizzleClient,
  referenceUrl: string
): Promise<Result<Event | null, Error>> => {
  try {
    const result = await db
      .select()
      .from(event)
      .where(eq(event.referenceUrl, referenceUrl))
      .limit(1)

    return Result.ok(result.length > 0 ? result[0] : null)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}
