import { ref } from 'vue'
import { defineStore } from 'pinia'

export type TimelinePanel = {
  type: 'timeline'
  startTimestamp: number
  endTimestamp: number
}

export type LensPanel = {
  type: 'lens'
  eventNames: string[]
}

export type Panel = TimelinePanel | LensPanel

export const usePanelStore = defineStore('panel-store', () => {
  const displayList = ref<Panel[]>([
    {
      type: 'timeline',
      startTimestamp: -99999999999,
      endTimestamp: 99999999999,
    },
  ])

  const addTimelinePanel = () => {
    displayList.value.push({
      type: 'timeline',
      startTimestamp: -99999999999,
      endTimestamp: 99999999999,
    })
  }

  const addLensPanel = () => {
    displayList.value.push({
      type: 'lens',
      eventNames: [],
    })
    displayList.value.push({
      type: 'timeline',
      startTimestamp: -99999999999,
      endTimestamp: 99999999999,
    })
  }

  return {
    displayList,
    addTimelinePanel,
    addLensPanel,
  }
})
