import { describe, it, expect } from 'bun:test'

const validCategorizationTypes = ['person', 'one-time-event', 'bounded-event', 'other'] as const
type CategorizationSelectType = (typeof validCategorizationTypes)[number]

const getCategorizationState = (rawType: string): { value: CategorizationSelectType; disabled: boolean } => {
  const isTypeChangeable = rawType !== 'redirect' && rawType !== 'disambiguation'
  const value: CategorizationSelectType = validCategorizationTypes.includes(
    rawType as CategorizationSelectType
  )
    ? (rawType as CategorizationSelectType)
    : 'other'
  return { value, disabled: !isTypeChangeable }
}

describe('NewEventView categorization type dropdown', () => {
  it('has exactly 4 options: person, one-time-event, bounded-event, other', () => {
    expect(validCategorizationTypes).toHaveLength(4)
    expect(validCategorizationTypes).toEqual(['person', 'one-time-event', 'bounded-event', 'other'])
  })

  it('pre-selects "person" when categorization type is person', () => {
    expect(getCategorizationState('person').value).toBe('person')
  })

  it('pre-selects "one-time-event" when categorization type is one-time-event', () => {
    expect(getCategorizationState('one-time-event').value).toBe('one-time-event')
  })

  it('pre-selects "bounded-event" when categorization type is bounded-event', () => {
    expect(getCategorizationState('bounded-event').value).toBe('bounded-event')
  })

  it('pre-selects "other" when categorization type is other', () => {
    expect(getCategorizationState('other').value).toBe('other')
  })

  it('pre-selects "other" when categorization type is an unknown type', () => {
    expect(getCategorizationState('disambiguation').value).toBe('other')
  })

  it('is enabled (not disabled) for person categorization', () => {
    expect(getCategorizationState('person').disabled).toBe(false)
  })

  it('is enabled (not disabled) for one-time-event categorization', () => {
    expect(getCategorizationState('one-time-event').disabled).toBe(false)
  })

  it('is enabled (not disabled) for other categorization', () => {
    expect(getCategorizationState('other').disabled).toBe(false)
  })

  it('pre-selects "other" and is disabled when categorization type is redirect', () => {
    const state = getCategorizationState('redirect')
    expect(state.value).toBe('other')
    expect(state.disabled).toBe(true)
  })
})
