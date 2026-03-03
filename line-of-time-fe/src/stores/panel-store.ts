import { ref, shallowRef, markRaw, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { dateInputToTimestamp } from '../utils/timestamp'
import type { EventResponse } from '../stores/event-store'

export type LensStore = {
  type: 'lens'
  index: number
  parentLens: LensStore | null
  childTimeline: TimelineStore | null
  events: Ref<EventResponse[]>
  eventMap: Ref<Map<string, EventResponse>>
  nameList: Ref<string[]>
  addEvent: (name: string) => void
  removeEvent: (name: string) => void
}

export type TimelineStore = {
  type: 'timeline'
  index: number
  parentLens: LensStore
  startTimestamp: Ref<number>
  endTimestamp: Ref<number>
}

type Structure = LensStore | TimelineStore

const todayTimestamp = (): number => {
  const now = new Date()
  const yyyy = now.getFullYear().toString().padStart(4, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return dateInputToTimestamp(`${yyyy}-${mm}-${dd}`)
}

const makeLensStore = (index: number, parentLens: LensStore | null): LensStore => {
  const events = ref<EventResponse[]>([])
  const eventMap = ref<Map<string, EventResponse>>(new Map())
  const nameList = ref<string[]>([])

  if (parentLens != null) {
    const parentEvents = parentLens.events.value
    nameList.value = parentEvents.map((e) => e.name) ?? []
    eventMap.value = new Map(parentEvents.map((e) => [e.name, e]))
  }

  const store: LensStore = markRaw({
    type: 'lens',
    index,
    parentLens,
    childTimeline: null,
    events,
    eventMap,
    nameList,
    addEvent(name: string) {
      const evt = eventMap.value.get(name)
      if (!evt) {
        return
      }

      if (!events.value.find((e) => e.name === name)) {
        events.value = [...events.value, evt]
      }
      nameList.value = nameList.value.filter((n) => n !== name)
    },
    removeEvent(name: string) {
      events.value = events.value.filter((e) => e.name !== name)
      nameList.value = nameList.value.filter((n) => n !== name)
    },
  })

  return store
}

const makeTimelineStore = (index: number, parentLens: LensStore): TimelineStore => {
  const isFirst = index === 1
  const startTimestamp = ref(isFirst ? -99999999999 : todayTimestamp())
  const endTimestamp = ref(isFirst ? 99999999999 : todayTimestamp())

  return markRaw({
    type: 'timeline',
    index,
    parentLens,
    startTimestamp,
    endTimestamp,
  })
}

export const usePanelStore = defineStore('panel-store', () => {
  const firstLens = makeLensStore(0, null)
  const firstTimeline = makeTimelineStore(1, firstLens)
  firstLens.childTimeline = firstTimeline

  const structures = shallowRef<Structure[]>([firstLens, firstTimeline])

  const setAllEvents = (allEvents: EventResponse[]) => {
    firstLens.events.value = allEvents
    firstLens.eventMap.value = new Map(allEvents.map((e) => [e.name, e]))
  }

  const addLensPanel = () => {
    const currentStructures = structures.value
    const newIndex = currentStructures.length
    const lastLens =
      [...currentStructures].reverse().find((s): s is LensStore => s.type === 'lens') ?? firstLens
    const newLens = makeLensStore(newIndex, lastLens)

    const newTimeline = makeTimelineStore(newIndex + 1, newLens)
    newLens.childTimeline = newTimeline

    structures.value = [...currentStructures, newLens, newTimeline]
  }

  return {
    structures,
    setAllEvents,
    addLensPanel,
  }
})
