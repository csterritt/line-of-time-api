/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export interface EventInput {
  startTimestamp: number
  endTimestamp?: number | null
  name: string
  basicDescription: string
  longerDescription?: string | null
  referenceUrls: string[]
  relatedEventIds?: string[] | null
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

const isValidTimestamp = (value: unknown): boolean => {
  return typeof value === 'number' && Number.isInteger(value)
}

const isValidUrl = (urlStr: string): boolean => {
  try {
    new URL(urlStr)
    return true
  } catch {
    return false
  }
}

export const validateEventInput = (input: unknown): ValidationResult => {
  const errors: string[] = []

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Invalid input: expected an object'] }
  }

  const data = input as Record<string, unknown>

  if (!isValidTimestamp(data.startTimestamp)) {
    errors.push('startTimestamp is required and must be an integer')
  }

  if (data.endTimestamp !== undefined && data.endTimestamp !== null) {
    if (!isValidTimestamp(data.endTimestamp)) {
      errors.push('endTimestamp must be an integer if provided')
    }
  }

  if (typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('name is required and must be a non-empty string')
  }

  if (
    typeof data.basicDescription !== 'string' ||
    data.basicDescription.trim() === ''
  ) {
    errors.push('basicDescription is required and must be a non-empty string')
  }

  if (!Array.isArray(data.referenceUrls)) {
    errors.push('referenceUrls is required and must be an array')
  } else if (data.referenceUrls.length === 0) {
    errors.push('referenceUrls must contain at least one URL')
  } else {
    const invalidUrls = data.referenceUrls.filter(
      (url) => typeof url !== 'string' || !isValidUrl(url)
    )
    if (invalidUrls.length > 0) {
      errors.push('referenceUrls must contain only valid URLs')
    }
  }

  if (data.relatedEventIds !== undefined && data.relatedEventIds !== null) {
    if (!Array.isArray(data.relatedEventIds)) {
      errors.push('relatedEventIds must be an array if provided')
    } else {
      const invalidIds = data.relatedEventIds.filter(
        (id) => typeof id !== 'string'
      )
      if (invalidIds.length > 0) {
        errors.push('relatedEventIds must contain only strings')
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
