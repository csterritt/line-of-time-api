/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Bindings } from '../local-types'
import { getAiMockResult } from '../routes/test/ai-mock' // PRODUCTION:REMOVE

export type PersonResult = {
  type: 'person'
  'birth-date': string
  'death-date'?: string
}

export type OneTimeEventResult = {
  type: 'one-time-event'
  'start-date': string
}

export type BoundedEventResult = {
  type: 'bounded-event'
  'start-date': string
  'end-date': string
}

export type RedirectResult = {
  type: 'redirect'
}

export type DisambiguationResult = {
  type: 'disambiguation'
}

export type OtherResult = {
  type: 'other'
}

export type CategorizationResult =
  | PersonResult
  | OneTimeEventResult
  | BoundedEventResult
  | RedirectResult
  | DisambiguationResult
  | OtherResult

const OTHER_FALLBACK: OtherResult = { type: 'other' }

export const aiCategorizationAndSearch = async (
  env: Bindings,
  rawText: string
): Promise<CategorizationResult> => {
  // PRODUCTION:REMOVE-NEXT-LINE
  const mockResult = getAiMockResult() // PRODUCTION:REMOVE
  // PRODUCTION:REMOVE-NEXT-LINE
  if (mockResult) {
    console.log('Using AI mock result:', JSON.stringify(mockResult)) // PRODUCTION:REMOVE
    return mockResult // PRODUCTION:REMOVE
  } // PRODUCTION:REMOVE

  try {
    const response = await fetch('https://bap.cls.cloud/pipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectionSecret: env.BENT_AI_CONNECTION_SECRET,
        content: rawText,
      }),
    })

    const text = await response.text()
    try {
      const result = JSON.parse(text)
      return result?.result || OTHER_FALLBACK
    } catch (error) {
      console.error('Error parsing response from https://bap.cls.cloud:', error)
    }
  } catch (error) {
    console.error('Error calling https://bap.cls.cloud:', error)
  }

  return OTHER_FALLBACK
}
