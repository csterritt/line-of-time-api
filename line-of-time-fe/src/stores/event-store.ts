import { ref } from 'vue'
import { defineStore } from 'pinia'

export type EventInput = {
  name: string
  basicDescription: string
  startTimestamp: string
  endTimestamp?: string | null
  referenceUrls: string[]
}

export type CategorizationResult =
  | { type: 'person'; 'birth-date': string; 'death-date'?: string }
  | { type: 'one-time-event'; 'start-date': string }
  | { type: 'bounded-event'; 'start-date': string; 'end-date': string }
  | { type: 'redirect' }
  | { type: 'other' }

export type WikiInfo = {
  name: string
  extract: string
  text: string
  htmlText: string
  links: string[]
  categorization: CategorizationResult
}

export type EventResponse = {
  id: string
  name: string
  basicDescription: string
  startTimestamp: number
  endTimestamp: number | null
  referenceUrls: string[]
  relatedEventIds: string[]
  createdAt: string
  updatedAt: string
}

export const useEventStore = defineStore('event-store', () => {
  const successMessage = ref('')
  const errorMessage = ref('')

  const clearMessages = () => {
    successMessage.value = ''
    errorMessage.value = ''
  }

  const createNewEvent = async (eventData: EventInput): Promise<boolean> => {
    clearMessages()
    try {
      const response = await fetch('/time-info/new-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.status === 201) {
        successMessage.value = 'Event created successfully!'
        return true
      }

      const data = await response.json()
      if (Array.isArray(data.error)) {
        errorMessage.value = data.error.join(', ')
      } else if (typeof data.error === 'string') {
        errorMessage.value = data.error
      } else {
        errorMessage.value = 'Failed to create event.'
      }
      return false
    } catch {
      errorMessage.value = 'Network error. Please try again.'
      return false
    }
  }

  const wikiInfo = ref<WikiInfo | null>(null)
  const wikiLoading = ref(false)

  const getInfo = async (name: string): Promise<WikiInfo | null> => {
    clearMessages()
    wikiInfo.value = null
    wikiLoading.value = true
    try {
      const response = await fetch('/time-info/initial-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        errorMessage.value = typeof data.error === 'string' ? data.error : 'Search failed.'
        return null
      }

      const data = (await response.json()) as WikiInfo
      wikiInfo.value = data
      return data
    } catch {
      errorMessage.value = 'Network error. Please try again.'
      return null
    } finally {
      wikiLoading.value = false
    }
  }

  const events = ref<EventResponse[]>([])
  const minTimestamp = ref<number | null>(null)
  const maxTimestamp = ref<number | null>(null)
  const filterStart = ref<number | null>(null)
  const filterEnd = ref<number | null>(null)

  const fetchAllEvents = async (): Promise<EventResponse[]> => {
    try {
      const response = await fetch('/time-info/events/-99999999999/99999999999')
      if (response.ok) {
        return (await response.json()) as EventResponse[]
      }
      return []
    } catch {
      return []
    }
  }

  const computeMinMax = (allEvents: EventResponse[]): void => {
    if (allEvents.length === 0) {
      minTimestamp.value = null
      maxTimestamp.value = null
      return
    }
    let min = allEvents[0]!.startTimestamp
    let max = allEvents[0]!.startTimestamp
    for (const evt of allEvents) {
      if (evt.startTimestamp < min) {
        min = evt.startTimestamp
      }
      const evtMax = evt.endTimestamp != null ? evt.endTimestamp : evt.startTimestamp
      if (evtMax > max) {
        max = evtMax
      }
    }
    minTimestamp.value = min
    maxTimestamp.value = max
  }

  const fetchEvents = async (start?: number, end?: number) => {
    const s = start ?? -99999999999
    const e = end ?? 99999999999
    try {
      const response = await fetch(`/time-info/events/${s}/${e}`)
      if (response.ok) {
        const data = (await response.json()) as EventResponse[]
        events.value = data
      } else {
        events.value = []
      }
    } catch {
      events.value = []
    }
  }

  const initializeEvents = async () => {
    const allEvents = await fetchAllEvents()
    computeMinMax(allEvents)
    filterStart.value = minTimestamp.value
    filterEnd.value = maxTimestamp.value
    await fetchEvents(filterStart.value ?? undefined, filterEnd.value ?? undefined)
  }

  return {
    successMessage,
    errorMessage,
    clearMessages,
    createNewEvent,
    wikiInfo,
    wikiLoading,
    getInfo,
    events,
    minTimestamp,
    maxTimestamp,
    filterStart,
    filterEnd,
    fetchEvents,
    initializeEvents,
  }
})
