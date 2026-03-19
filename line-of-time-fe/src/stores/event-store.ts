import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type EventInput = {
  name: string
  basicDescription: string
  startTimestamp: number
  endTimestamp?: number | null
  referenceUrl: string
  eventType?: string | null
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
  referenceUrl: string
  relatedEventIds: string[]
  eventType: string | null
  createdAt: string
  updatedAt: string
}

const transientStatuses = new Set([502, 503, 504])
const loadAllEventsAttempts = 6
const loadAllEventsRetryDelayMs = 500
const getInfoAttempts = 3
const getInfoRetryDelayMs = 300

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const cleanUninterestingLinks = (wikiInfo: WikiInfo | null) => {
  if (!wikiInfo) {
    return
  }
  wikiInfo.links = wikiInfo.links.filter((link) => {
    return !link.startsWith('Wiki')
  })
}

export const useEventStore = defineStore('event-store', () => {
  const successMessage = ref('')
  const errorMessage = ref('')
  const allEvents = ref<EventResponse[]>([])
  const eventsLoaded = ref(false)

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
        eventsLoaded.value = false
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

  const editEvent = async (id: string, eventData: EventInput): Promise<boolean> => {
    clearMessages()
    try {
      const response = await fetch(`/time-info/edit-event/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.status === 200) {
        const updated = (await response.json()) as EventResponse
        const idx = allEvents.value.findIndex((e) => e.id === id)
        if (idx !== -1) {
          allEvents.value[idx] = updated
        }
        successMessage.value = 'Event updated successfully!'
        return true
      }

      const data = await response.json()
      if (Array.isArray(data.error)) {
        errorMessage.value = data.error.join(', ')
      } else if (typeof data.error === 'string') {
        errorMessage.value = data.error
      } else {
        errorMessage.value = 'Failed to update event.'
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
      for (let attempt = 1; attempt <= getInfoAttempts; attempt++) {
        try {
          const response = await fetch('/time-info/initial-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          })

          if (response.ok) {
            const data = (await response.json()) as WikiInfo
            wikiInfo.value = data
            cleanUninterestingLinks(wikiInfo.value)
            return data
          }

          if (transientStatuses.has(response.status) && attempt < getInfoAttempts) {
            await sleep(getInfoRetryDelayMs * attempt)
            continue
          }

          const data = await response.json()
          errorMessage.value = typeof data.error === 'string' ? data.error : 'Search failed.'
          return null
        } catch {
          if (attempt === getInfoAttempts) {
            errorMessage.value = 'Network error. Please try again.'
            return null
          }
        }

        await sleep(getInfoRetryDelayMs * attempt)
      }

      errorMessage.value = 'Search failed.'
      return null
    } catch {
      errorMessage.value = 'Network error. Please try again.'
      return null
    } finally {
      wikiLoading.value = false
    }
  }

  const minTimestamp = computed((): number | null => {
    if (allEvents.value.length === 0) {
      return null
    }
    return allEvents.value.reduce(
      (min, evt) => (evt.startTimestamp < min ? evt.startTimestamp : min),
      allEvents.value[0]!.startTimestamp
    )
  })

  const maxTimestamp = computed((): number | null => {
    if (allEvents.value.length === 0) {
      return null
    }
    return allEvents.value.reduce((max, evt) => {
      const evtMax = evt.endTimestamp != null ? evt.endTimestamp : evt.startTimestamp
      return evtMax > max ? evtMax : max
    }, allEvents.value[0]!.startTimestamp)
  })

  const loadAllEvents = async (): Promise<void> => {
    if (eventsLoaded.value) {
      return
    }

    try {
      for (let attempt = 1; attempt <= loadAllEventsAttempts; attempt++) {
        try {
          const response = await fetch('/time-info/events/-99999999999/99999999999', {
            cache: 'no-store',
          })

          if (response.ok) {
            const events = (await response.json()) as EventResponse[]

            if (events.length > 0 || attempt === loadAllEventsAttempts) {
              allEvents.value = events
              return
            }

            await sleep(loadAllEventsRetryDelayMs * attempt)
            continue
          }

          if (!transientStatuses.has(response.status) || attempt === loadAllEventsAttempts) {
            allEvents.value = []
            return
          }
        } catch {
          if (attempt === loadAllEventsAttempts) {
            allEvents.value = []
            return
          }
        }

        await sleep(loadAllEventsRetryDelayMs * attempt)
      }
    } catch {
      allEvents.value = []
    } finally {
      eventsLoaded.value = true
    }
  }

  return {
    successMessage,
    errorMessage,
    clearMessages,
    createNewEvent,
    editEvent,
    wikiInfo,
    wikiLoading,
    getInfo,
    allEvents,
    eventsLoaded,
    minTimestamp,
    maxTimestamp,
    loadAllEvents,
  }
})
