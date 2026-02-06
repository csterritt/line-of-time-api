import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('user-info', () => {
  const name = ref('')

  const isSignedIn = computed(() => {
    return name.value !== null && name.value !== undefined && name.value !== ''
  })

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/auth/user-signed-in')
      if (response.ok) {
        const data = await response.json()
        if (data['user-signed-in'] === true) {
          name.value = data.name
        } else {
          name.value = ''
        }
      } else {
        name.value = ''
      }
    } catch {
      name.value = ''
    }
  }

  return { name, isSignedIn, fetchUserInfo }
})
