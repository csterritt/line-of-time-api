import { ref } from 'vue'
import { defineStore } from 'pinia'

export type EventInput = {
  name: string
  basicDescription: string
  startTimestamp: number
  endTimestamp?: number | null
  referenceUrls: string[]
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

  const events = ref<EventResponse[]>([])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/time-info/events/0/99999999999')
      if (response.ok) {
        const data = await response.json() as EventResponse[]
        events.value = data.slice(0, 20)
      } else {
        events.value = []
      }
    } catch {
      events.value = []
    }
  }

  return { successMessage, errorMessage, clearMessages, createNewEvent, events, fetchEvents }
})
