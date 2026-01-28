// ====================================
// Tests for event-validator.ts
// To run this, cd to this directory and type 'bun test'
// ====================================

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validateEventInput } from '../src/validators/event-validator'

const validEvent = {
  startDate: '2024-01-15T00:00:00.000Z',
  name: 'Moon Landing',
  basicDescription: 'First human on the moon',
  referenceUrls: ['https://en.wikipedia.org/wiki/Moon_landing'],
}

describe('validateEventInput', () => {
  describe('valid inputs', () => {
    it('should accept a valid event with required fields only', () => {
      const result = validateEventInput(validEvent)
      assert.strictEqual(result.valid, true)
      assert.deepStrictEqual(result.errors, [])
    })

    it('should accept a valid event with all optional fields', () => {
      const fullEvent = {
        ...validEvent,
        endDate: '2024-01-16T00:00:00.000Z',
        longerDescription: 'A longer description of the event',
        relatedEventIds: ['event-1', 'event-2'],
      }
      const result = validateEventInput(fullEvent)
      assert.strictEqual(result.valid, true)
      assert.deepStrictEqual(result.errors, [])
    })

    it('should accept null for optional fields', () => {
      const eventWithNulls = {
        ...validEvent,
        endDate: null,
        longerDescription: null,
        relatedEventIds: null,
      }
      const result = validateEventInput(eventWithNulls)
      assert.strictEqual(result.valid, true)
    })

    it('should accept multiple reference URLs', () => {
      const eventWithMultipleUrls = {
        ...validEvent,
        referenceUrls: [
          'https://example.com/1',
          'https://example.com/2',
          'https://example.com/3',
        ],
      }
      const result = validateEventInput(eventWithMultipleUrls)
      assert.strictEqual(result.valid, true)
    })
  })

  describe('invalid inputs', () => {
    it('should reject null input', () => {
      const result = validateEventInput(null)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.includes('Invalid input: expected an object'))
    })

    it('should reject non-object input', () => {
      const result = validateEventInput('not an object')
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.includes('Invalid input: expected an object'))
    })

    it('should reject missing startDate', () => {
      const { startDate, ...eventWithoutStartDate } = validEvent
      const result = validateEventInput(eventWithoutStartDate)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('startDate is required')))
    })

    it('should reject empty startDate', () => {
      const result = validateEventInput({ ...validEvent, startDate: '' })
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('startDate is required')))
    })

    it('should reject invalid startDate format', () => {
      const result = validateEventInput({
        ...validEvent,
        startDate: 'not-a-date',
      })
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('valid ISO date')))
    })

    it('should reject invalid endDate format', () => {
      const result = validateEventInput({
        ...validEvent,
        endDate: 'not-a-date',
      })
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('endDate')))
    })

    it('should reject missing name', () => {
      const { name, ...eventWithoutName } = validEvent
      const result = validateEventInput(eventWithoutName)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('name is required')))
    })

    it('should reject empty name', () => {
      const result = validateEventInput({ ...validEvent, name: '   ' })
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('name is required')))
    })

    it('should reject missing basicDescription', () => {
      const { basicDescription, ...eventWithoutDesc } = validEvent
      const result = validateEventInput(eventWithoutDesc)
      assert.strictEqual(result.valid, false)
      assert.ok(
        result.errors.some((e) => e.includes('basicDescription is required'))
      )
    })

    it('should reject missing referenceUrls', () => {
      const { referenceUrls, ...eventWithoutUrls } = validEvent
      const result = validateEventInput(eventWithoutUrls)
      assert.strictEqual(result.valid, false)
      assert.ok(
        result.errors.some((e) => e.includes('referenceUrls is required'))
      )
    })

    it('should reject empty referenceUrls array', () => {
      const result = validateEventInput({ ...validEvent, referenceUrls: [] })
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('at least one URL')))
    })

    it('should reject invalid URLs in referenceUrls', () => {
      const result = validateEventInput({
        ...validEvent,
        referenceUrls: ['not-a-url'],
      })
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('valid URLs')))
    })

    it('should reject non-array referenceUrls', () => {
      const result = validateEventInput({
        ...validEvent,
        referenceUrls: 'https://example.com',
      })
      assert.strictEqual(result.valid, false)
      assert.ok(
        result.errors.some((e) => e.includes('referenceUrls is required'))
      )
    })

    it('should reject non-array relatedEventIds', () => {
      const result = validateEventInput({
        ...validEvent,
        relatedEventIds: 'event-1',
      })
      assert.strictEqual(result.valid, false)
      assert.ok(
        result.errors.some((e) =>
          e.includes('relatedEventIds must be an array')
        )
      )
    })

    it('should reject non-string items in relatedEventIds', () => {
      const result = validateEventInput({
        ...validEvent,
        relatedEventIds: [123, 456],
      })
      assert.strictEqual(result.valid, false)
      assert.ok(
        result.errors.some((e) =>
          e.includes('relatedEventIds must contain only strings')
        )
      )
    })

    it('should collect multiple errors', () => {
      const result = validateEventInput({
        startDate: 'invalid',
        name: '',
        basicDescription: '',
        referenceUrls: [],
      })
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.length >= 4)
    })
  })
})
