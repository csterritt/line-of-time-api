import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import NewEventView from '../components/NewEventView.vue'
import { useEventStore } from '../stores/event-store'
import type { WikiInfo } from '../stores/event-store'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/search', component: { template: '<div />' } },
      { path: '/new-event', component: NewEventView },
    ],
  })

const makeWikiInfo = (type: string): WikiInfo => {
  const base = {
    name: 'Test Subject',
    extract: 'A test extract.',
    text: '',
    htmlText: '',
    links: [],
  }
  if (type === 'person') {
    return { ...base, categorization: { type: 'person', 'birth-date': '1900-01-01' } }
  }
  if (type === 'one-time-event') {
    return { ...base, categorization: { type: 'one-time-event', 'start-date': '2000-06-01' } }
  }
  if (type === 'bounded-event') {
    return {
      ...base,
      categorization: { type: 'bounded-event', 'start-date': '2000-01-01', 'end-date': '2001-01-01' },
    }
  }
  if (type === 'redirect') {
    return { ...base, categorization: { type: 'redirect' } }
  }
  return { ...base, categorization: { type: 'other' } }
}

const mountComponent = async (wikiInfoType: string) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = makeRouter()
  await router.push('/new-event')
  await router.isReady()

  const store = useEventStore()
  store.wikiInfo = makeWikiInfo(wikiInfoType)

  const wrapper = mount(NewEventView, {
    global: {
      plugins: [pinia, router],
    },
  })
  return wrapper
}

describe('NewEventView categorization type dropdown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders a select element with data-testid="type-select"', async () => {
    const wrapper = await mountComponent('person')
    expect(wrapper.find('[data-testid="type-select"]').exists()).toBe(true)
  })

  it('has exactly 4 options: person, one-time-event, bounded-event, other', async () => {
    const wrapper = await mountComponent('person')
    const select = wrapper.find('[data-testid="type-select"]')
    const options = select.findAll('option')
    expect(options).toHaveLength(4)
    const values = options.map((o) => o.element.value)
    expect(values).toEqual(['person', 'one-time-event', 'bounded-event', 'other'])
  })

  it('pre-selects "person" when categorization type is person', async () => {
    const wrapper = await mountComponent('person')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.value).toBe('person')
  })

  it('pre-selects "one-time-event" when categorization type is one-time-event', async () => {
    const wrapper = await mountComponent('one-time-event')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.value).toBe('one-time-event')
  })

  it('pre-selects "bounded-event" when categorization type is bounded-event', async () => {
    const wrapper = await mountComponent('bounded-event')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.value).toBe('bounded-event')
  })

  it('pre-selects "other" when categorization type is other', async () => {
    const wrapper = await mountComponent('other')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.value).toBe('other')
  })

  it('is enabled (not disabled) for person categorization', async () => {
    const wrapper = await mountComponent('person')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.disabled).toBe(false)
  })

  it('is enabled (not disabled) for one-time-event categorization', async () => {
    const wrapper = await mountComponent('one-time-event')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.disabled).toBe(false)
  })

  it('is enabled (not disabled) for other categorization', async () => {
    const wrapper = await mountComponent('other')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.disabled).toBe(false)
  })

  it('pre-selects "other" and is disabled when categorization type is redirect', async () => {
    const wrapper = await mountComponent('redirect')
    const select = wrapper.find<HTMLSelectElement>('[data-testid="type-select"]')
    expect(select.element.value).toBe('other')
    expect(select.element.disabled).toBe(true)
  })
})
