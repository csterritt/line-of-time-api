// ====================================
// Tests for event-validator.ts
// To run this, cd to this directory and type 'bun test'
// ====================================

import { describe, it, expect } from 'bun:test'
import { validateEventInput } from '../src/validators/event-validator'

const validEvent = {
  startTimestamp: 738534,
  name: 'Moon Landing',
  basicDescription: 'First human on the moon',
  referenceUrls: ['https://en.wikipedia.org/wiki/Moon_landing'],
}

describe('validateEventInput', () => {
  describe('valid inputs', () => {
    it('should accept a valid event with required fields only', () => {
      const result = validateEventInput(validEvent)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should accept a valid event with all optional fields', () => {
      const fullEvent = {
        ...validEvent,
        endTimestamp: 738535,
        longerDescription: 'A longer description of the event',
        relatedEventIds: ['event-1', 'event-2'],
      }
      const result = validateEventInput(fullEvent)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should accept null for optional fields', () => {
      const eventWithNulls = {
        ...validEvent,
        endTimestamp: null,
        longerDescription: null,
        relatedEventIds: null,
      }
      const result = validateEventInput(eventWithNulls)
      expect(result.valid).toBe(true)
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
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('should reject null input', () => {
      const result = validateEventInput(null)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid input: expected an object')
    })

    it('should reject non-object input', () => {
      const result = validateEventInput('not an object')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid input: expected an object')
    })

    it('should reject missing startTimestamp', () => {
      const { startTimestamp, ...eventWithoutStartTimestamp } = validEvent
      const result = validateEventInput(eventWithoutStartTimestamp)
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('startTimestamp is required'))
      ).toBe(true)
    })

    it('should reject non-integer startTimestamp', () => {
      const result = validateEventInput({
        ...validEvent,
        startTimestamp: 'not-a-number',
      })
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('startTimestamp is required'))
      ).toBe(true)
    })

    it('should reject float startTimestamp', () => {
      const result = validateEventInput({
        ...validEvent,
        startTimestamp: 123.45,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('startTimestamp'))).toBe(true)
    })

    it('should reject non-integer endTimestamp', () => {
      const result = validateEventInput({
        ...validEvent,
        endTimestamp: 'not-a-number',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('endTimestamp'))).toBe(true)
    })

    it('should reject missing name', () => {
      const { name, ...eventWithoutName } = validEvent
      const result = validateEventInput(eventWithoutName)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('name is required'))).toBe(
        true
      )
    })

    it('should reject empty name', () => {
      const result = validateEventInput({ ...validEvent, name: '   ' })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('name is required'))).toBe(
        true
      )
    })

    it('should reject missing basicDescription', () => {
      const { basicDescription, ...eventWithoutDesc } = validEvent
      const result = validateEventInput(eventWithoutDesc)
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('basicDescription is required'))
      ).toBe(true)
    })

    it('should reject missing referenceUrls', () => {
      const { referenceUrls, ...eventWithoutUrls } = validEvent
      const result = validateEventInput(eventWithoutUrls)
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('referenceUrls is required'))
      ).toBe(true)
    })

    it('should reject empty referenceUrls array', () => {
      const result = validateEventInput({ ...validEvent, referenceUrls: [] })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('at least one URL'))).toBe(
        true
      )
    })

    it('should reject invalid URLs in referenceUrls', () => {
      const result = validateEventInput({
        ...validEvent,
        referenceUrls: ['not-a-url'],
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('valid URLs'))).toBe(true)
    })

    it('should reject non-array referenceUrls', () => {
      const result = validateEventInput({
        ...validEvent,
        referenceUrls: 'https://example.com',
      })
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('referenceUrls is required'))
      ).toBe(true)
    })

    it('should reject non-array relatedEventIds', () => {
      const result = validateEventInput({
        ...validEvent,
        relatedEventIds: 'event-1',
      })
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) =>
          e.includes('relatedEventIds must be an array')
        )
      ).toBe(true)
    })

    it('should reject non-string items in relatedEventIds', () => {
      const result = validateEventInput({
        ...validEvent,
        relatedEventIds: [123, 456],
      })
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) =>
          e.includes('relatedEventIds must contain only strings')
        )
      ).toBe(true)
    })

    it('should collect multiple errors', () => {
      const result = validateEventInput({
        startTimestamp: 'invalid',
        name: '',
        basicDescription: '',
        referenceUrls: [],
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(4)
    })
  })
})
