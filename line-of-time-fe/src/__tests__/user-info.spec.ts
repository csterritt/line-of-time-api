import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserInfoStore } from '../stores/user-info'

describe('useUserInfoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('has correct initial state', () => {
    const store = useUserInfoStore()
    expect(store.name).toBe('')
    expect(store.isSignedIn).toBe(false)
  })

  it('sets name and isSignedIn when user is signed in', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ 'user-signed-in': true, name: 'Alice' }),
    } as Response)

    const store = useUserInfoStore()
    await store.fetchUserInfo()

    expect(store.name).toBe('Alice')
    expect(store.isSignedIn).toBe(true)
  })

  it('sets name to empty string when user is not signed in', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ 'user-signed-in': false }),
    } as Response)

    const store = useUserInfoStore()
    await store.fetchUserInfo()

    expect(store.name).toBe('')
    expect(store.isSignedIn).toBe(false)
  })

  it('sets name to empty string on fetch error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    const store = useUserInfoStore()
    await store.fetchUserInfo()

    expect(store.name).toBe('')
    expect(store.isSignedIn).toBe(false)
  })

  it('sets name to empty string on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    } as Response)

    const store = useUserInfoStore()
    await store.fetchUserInfo()

    expect(store.name).toBe('')
    expect(store.isSignedIn).toBe(false)
  })
})
