import retry from 'async-retry'
import Result from 'true-myth/result'

import {
  account,
  event,
  interestedEmail,
  NewAccount,
  NewEvent,
  NewSingleUseCode,
  NewUser,
  session,
  singleUseCode,
  user,
} from '../../src/db/schema'
import { STANDARD_RETRY_OPTIONS } from '../../src/constants'
import type { DrizzleClient } from '../../src/local-types'

interface TestDatabaseCounts {
  users: number
  accounts: number
  sessions: number
  singleUseCodes: number
  interestedEmail: number
}

interface TestDbAccess {
  clearTestDatabase: (db: DrizzleClient) => Promise<Result<boolean, Error>>
  clearTestSessions: (db: DrizzleClient) => Promise<Result<boolean, Error>>
  seedAuthTestData: (
    db: DrizzleClient,
    users: NewUser[],
    accounts: NewAccount[],
    codes: NewSingleUseCode[]
  ) => Promise<Result<boolean, Error>>
  getTestDatabaseCounts: (
    db: DrizzleClient
  ) => Promise<Result<TestDatabaseCounts, Error>>
  clearAllEvents: (db: DrizzleClient) => Promise<Result<boolean, Error>>
  seedEventTestData: (
    db: DrizzleClient,
    events: NewEvent[]
  ) => Promise<Result<boolean, Error>>
  getEventCount: (db: DrizzleClient) => Promise<Result<number, Error>>
}

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
  } catch (error) {
    console.log(`${operationName} final error:`, error)
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

const toResult = async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
  try {
    return Result.ok(await fn())
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error(String(error)))
  }
}

const clearTestDatabase = (
  db: DrizzleClient
): Promise<Result<boolean, Error>> =>
  withRetry('clearTestDatabase', () =>
    toResult(async () => {
      await db.delete(session)
      await db.delete(account)
      await db.delete(user)
      await db.delete(singleUseCode)
      await db.delete(interestedEmail)
      await db.delete(event)
      return true
    })
  )

const clearTestSessions = (
  db: DrizzleClient
): Promise<Result<boolean, Error>> =>
  withRetry('clearTestSessions', () =>
    toResult(async () => {
      await db.delete(session)
      return true
    })
  )

const seedAuthTestData = (
  db: DrizzleClient,
  users: NewUser[],
  accounts: NewAccount[],
  codes: NewSingleUseCode[]
): Promise<Result<boolean, Error>> =>
  withRetry('seedAuthTestData', () =>
    toResult(async () => {
      for (const userData of users) {
        await db.insert(user).values(userData)
      }
      for (const accountData of accounts) {
        await db.insert(account).values(accountData)
      }
      for (const codeData of codes) {
        await db.insert(singleUseCode).values(codeData)
      }
      return true
    })
  )

const getTestDatabaseCounts = (
  db: DrizzleClient
): Promise<Result<TestDatabaseCounts, Error>> =>
  withRetry('getTestDatabaseCounts', () =>
    toResult(async () => {
      const userCount = await db.select().from(user)
      const accountCount = await db.select().from(account)
      const sessionCount = await db.select().from(session)
      const singleUseCodeCount = await db.select().from(singleUseCode)
      const interestedEmailCount = await db.select().from(interestedEmail)
      return {
        users: userCount.length,
        accounts: accountCount.length,
        sessions: sessionCount.length,
        singleUseCodes: singleUseCodeCount.length,
        interestedEmail: interestedEmailCount.length,
      }
    })
  )

const clearAllEvents = (db: DrizzleClient): Promise<Result<boolean, Error>> =>
  withRetry('clearAllEvents', () =>
    toResult(async () => {
      await db.delete(event)
      return true
    })
  )

const seedEventTestData = (
  db: DrizzleClient,
  events: NewEvent[]
): Promise<Result<boolean, Error>> =>
  withRetry('seedEventTestData', () =>
    toResult(async () => {
      for (const eventData of events) {
        await db.insert(event).values(eventData)
      }
      return true
    })
  )

const getEventCount = (db: DrizzleClient): Promise<Result<number, Error>> =>
  withRetry('getEventCount', () =>
    toResult(async () => {
      const events = await db.select().from(event)
      return events.length
    })
  )

export const testDbAccess: TestDbAccess = {
  clearTestDatabase,
  clearTestSessions,
  seedAuthTestData,
  getTestDatabaseCounts,
  clearAllEvents,
  seedEventTestData,
  getEventCount,
}
