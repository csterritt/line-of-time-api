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

export type OtherResult = {
  type: 'other'
}

export type CategorizationResult =
  | PersonResult
  | OneTimeEventResult
  | BoundedEventResult
  | RedirectResult
  | OtherResult

const VALID_TYPES = new Set([
  'person',
  'one-time-event',
  'bounded-event',
  'redirect',
  'other',
])

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && DATE_PATTERN.test(value)

const validateCategorizationResult = (
  parsed: unknown
): CategorizationResult | null => {
  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const obj = parsed as Record<string, unknown>

  if (typeof obj.type !== 'string' || !VALID_TYPES.has(obj.type)) {
    return null
  }

  switch (obj.type) {
    case 'person': {
      if (!isValidDate(obj['birth-date'])) {
        return null
      }
      const result: PersonResult = {
        type: 'person',
        'birth-date': obj['birth-date'],
      }
      if (isValidDate(obj['death-date'])) {
        result['death-date'] = obj['death-date']
      }
      return result
    }
    case 'one-time-event': {
      if (!isValidDate(obj['start-date'])) {
        return null
      }
      return {
        type: 'one-time-event',
        'start-date': obj['start-date'],
      }
    }
    case 'bounded-event': {
      if (!isValidDate(obj['start-date']) || !isValidDate(obj['end-date'])) {
        return null
      }
      return {
        type: 'bounded-event',
        'start-date': obj['start-date'],
        'end-date': obj['end-date'],
      }
    }
    case 'redirect':
      return { type: 'redirect' }
    case 'other':
      return { type: 'other' }
    default:
      return null
  }
}

const extractJsonFromText = (text: string): string => {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    return braceMatch[0].trim()
  }

  return text.trim()
}

const extractContentFromResponse = (response: unknown): string | null => {
  if (typeof response !== 'object' || response === null) {
    return null
  }

  const resp = response as Record<string, unknown>

  if (typeof resp.response === 'string') {
    return resp.response
  }

  if (typeof resp.result === 'string') {
    return resp.result
  }

  if (Array.isArray(resp.choices) && resp.choices.length > 0) {
    const choice = resp.choices[0] as Record<string, unknown>
    if (
      typeof choice.message === 'object' &&
      choice.message !== null &&
      typeof (choice.message as Record<string, unknown>).content === 'string'
    ) {
      return (choice.message as Record<string, unknown>).content as string
    }
  }

  return null
}

const CATEGORIZATION_PROMPT = `Examine the following wikipedia page and give me a categorization, either "person", "one-time-event", "bounded-event", "redirect", or "other". A one-time-event has a single occurance date, and a bounded-event has a start and end date. a person has a birth and, optionally, a death date. A redirect is a page that redirects to another page.

For example, for persons, "George Washington" has a birth date of "1732-02-22" and a death date of "1799-12-14". "Bill Clinton" only has a birth date. For a one-time-event, "The First Manned Moon Landing" has a date of "1969-07-20". For a bounded event, the "War of Jenkins Ear" has a start date of "1739-10-22" and an end date of "1748-10-18".

Return ONLY JSON of one of the following forms. Do not include any reasoning, reasoning_content, or explanation:

{"type": "person", "birth-date": "YYYY-MM-DD", "death-date": "YYYY-MM-DD"}
{"type": "one-time-event", "start-date": "YYYY-MM-DD"}
{"type": "bounded-event", "start-date": "YYYY-MM-DD", "end-date": "YYYY-MM-DD"}
{"type": "redirect"}
{"type": "other"}

For a person, the "death-date" is optional if there is no death date given in the input.
`

const SYSTEM_INSTRUCTION =
  'You are a research assistant examining wikipedia pages.'

interface ModelEntry {
  readonly fullName: string
  readonly maxInputSize: number
  readonly apiStyle: 'responses' | 'messages'
}

const MODELS: readonly ModelEntry[] = [
  // {
  //   fullName: '@cf/openai/gpt-oss-120b',
  //   maxInputSize: 126000,
  //   apiStyle: 'responses',
  // },
  {
    fullName: '@cf/qwen/qwen3-30b-a3b-fp8',
    maxInputSize: 30000,
    apiStyle: 'messages',
  },
  // {
  //   fullName: '@cf/mistralai/mistral-small-3.1-24b-instruct',
  //   maxInputSize: 126000,
  //   apiStyle: 'messages',
  // },
  // {
  //   fullName: '@cf/google/gemma-3-12b-it',
  //   maxInputSize: 78000,
  //   apiStyle: 'messages',
  // },
]

const OTHER_FALLBACK: OtherResult = { type: 'other' }

export const aiCategorizationAndSearch = async (
  env: Bindings,
  rawText: string
): Promise<CategorizationResult> => {
  // PRODUCTION:REMOVE-START
  const mockResult = getAiMockResult()
  if (mockResult) {
    console.log('Using AI mock result:', JSON.stringify(mockResult))
    return mockResult
  }
  // PRODUCTION:REMOVE-END

  for (const model of MODELS) {
    const rawTextPart = rawText.slice(0, model.maxInputSize)
    const input = CATEGORIZATION_PROMPT + rawTextPart

    try {
      let response: unknown

      if (model.apiStyle === 'responses') {
        response = await env.AI.run(model.fullName as any, {
          instructions: SYSTEM_INSTRUCTION,
          input,
        })
      } else {
        response = await env.AI.run(model.fullName as any, {
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: input },
          ],
        })
      }

      const content = extractContentFromResponse(response)
      if (!content) {
        console.log(
          `Model: ${model.fullName} — no content in response:`,
          JSON.stringify(response)
        )
        continue
      }

      const jsonText = extractJsonFromText(content)
      let parsed: unknown
      try {
        parsed = JSON.parse(jsonText)
      } catch {
        console.log(
          `Model: ${model.fullName} — failed to parse JSON:`,
          jsonText
        )
        continue
      }

      const validated = validateCategorizationResult(parsed)
      if (validated) {
        console.log(
          `Model: ${model.fullName} — categorization:`,
          JSON.stringify(validated)
        )
        return validated
      }

      console.log(
        `Model: ${model.fullName} — invalid categorization shape:`,
        JSON.stringify(parsed)
      )
    } catch (error) {
      console.log(`Model: ${model.fullName} — error:`, error)
    }
  }

  console.log('All models failed, returning fallback: other')
  return OTHER_FALLBACK
}
