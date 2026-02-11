/**
 * Clear all data from authentication-related tables
 * Calls test-only server endpoint to clear database
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3000/test/database/clear', {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to clear database')
    }

    console.log('Database cleared successfully')
  } catch (error) {
    console.error('Failed to clear database:', error)
    throw error
  }
}

/**
 * Clear all data from authentication session table
 * Calls test-only server endpoint to clear database
 */
export const clearSessions = async (): Promise<void> => {
  try {
    const response = await fetch(
      'http://localhost:3000/test/database/clear-sessions',
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to clear sessions')
    }

    console.log('Database sessions cleared successfully')
  } catch (error) {
    console.error('Failed to clear sessions:', error)
    throw error
  }
}

/**
 * Check if a single-use code exists in the database
 * @param code - The code to check
 * @returns Promise<boolean> - true if code exists, false otherwise
 */
export const checkCodeExists = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `http://localhost:3000/test/database/code-exists/${encodeURIComponent(code)}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      exists: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to check code existence')
    }

    return result.exists
  } catch (error) {
    console.error('Failed to check code existence:', error)
    throw error
  }
}

/**
 * Seed database with test data
 * Calls test-only server endpoint to seed database
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3000/test/database/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
      usersCreated?: number
      accountsCreated?: number
      singleUseCodesCreated?: number
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to seed database')
    }

    console.log(
      `Database seeded successfully: ${result.usersCreated} users, ${result.accountsCreated} accounts, ${result.singleUseCodesCreated} codes`
    )
  } catch (error) {
    console.error('Failed to seed database:', error)
    throw error
  }
}

/**
 * Clear all events from the database
 */
export const clearEvents = async (): Promise<void> => {
  try {
    const response = await fetch(
      'http://localhost:3000/test/database/clear-events',
      { method: 'DELETE' }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to clear events')
    }

    console.log('Events cleared successfully')
  } catch (error) {
    console.error('Failed to clear events:', error)
    throw error
  }
}

/**
 * Seed database with test events
 */
export const seedEvents = async (): Promise<void> => {
  try {
    const response = await fetch(
      'http://localhost:3000/test/database/seed-events',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
      eventsCreated?: number
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to seed events')
    }

    console.log(`Events seeded successfully: ${result.eventsCreated} events`)
  } catch (error) {
    console.error('Failed to seed events:', error)
    throw error
  }
}

/**
 * Set AI mock categorization result for testing
 */
export const setAiMock = async (categorization: Record<string, string>): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3000/test/ai-mock/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categorization),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to set AI mock')
    }

    console.log('AI mock set successfully')
  } catch (error) {
    console.error('Failed to set AI mock:', error)
    throw error
  }
}

/**
 * Reset AI mock categorization result
 */
export const resetAiMock = async (): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3000/test/ai-mock/reset', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to reset AI mock')
    }

    console.log('AI mock reset successfully')
  } catch (error) {
    console.error('Failed to reset AI mock:', error)
    throw error
  }
}

/**
 * Get event count from the database
 */
export const getEventCount = async (): Promise<number> => {
  try {
    const response = await fetch(
      'http://localhost:3000/test/database/event-count',
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      count: number
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to get event count')
    }

    return result.count
  } catch (error) {
    console.error('Failed to get event count:', error)
    throw error
  }
}
