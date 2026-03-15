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
  referenceUrl: 'https://en.wikipedia.org/wiki/Moon_landing',
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
        relatedEventIds: null,
      }
      const result = validateEventInput(eventWithNulls)
      expect(result.valid).toBe(true)
    })

    it('should accept a valid single reference URL', () => {
      const eventWithReferenceUrl = {
        ...validEvent,
        referenceUrl: 'https://example.com/1',
      }
      const result = validateEventInput(eventWithReferenceUrl)
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

    it('should reject missing referenceUrl', () => {
      const { referenceUrl, ...eventWithoutUrl } = validEvent
      const result = validateEventInput(eventWithoutUrl)
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('referenceUrl is required'))
      ).toBe(true)
    })

    it('should reject empty referenceUrl string', () => {
      const result = validateEventInput({ ...validEvent, referenceUrl: '' })
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('referenceUrl is required'))
      ).toBe(true)
    })

    it('should reject invalid referenceUrl', () => {
      const result = validateEventInput({
        ...validEvent,
        referenceUrl: 'not-a-url',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('valid URL'))).toBe(true)
    })

    it('should reject non-string referenceUrl', () => {
      const result = validateEventInput({
        ...validEvent,
        referenceUrl: ['https://example.com'],
      })
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('referenceUrl is required'))
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

    it('should reject endTimestamp less than startTimestamp', () => {
      const result = validateEventInput({
        ...validEvent,
        endTimestamp: 738533,
      })
      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) =>
          e.includes(
            'endTimestamp must be greater than or equal to startTimestamp'
          )
        )
      ).toBe(true)
    })

    it('should accept endTimestamp equal to startTimestamp', () => {
      const result = validateEventInput({
        ...validEvent,
        endTimestamp: 738534,
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
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
