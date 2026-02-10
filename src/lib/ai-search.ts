/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Bindings } from '../local-types'

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

export const aiCategorizationAndSearch = async (
  env: Bindings,
  rawText: string
): Promise<void> => {
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

      const result = Response.json(response)
      const resultBody = await result.json()
      console.log(
        `Model: ${model.fullName}`,
        JSON.stringify(
          (resultBody as any).choices[0].message.content || 'no content?'
        )
      )
    } catch (error) {
      console.log(`Model: ${model.fullName} — error:`, error)
    }
  }
}
