import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('user-info', () => {
  const name = ref('')
  const isAdmin = ref(false)

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
          isAdmin.value = data.isAdmin === true
        } else {
          name.value = ''
          isAdmin.value = false
        }
      } else {
        name.value = ''
        isAdmin.value = false
      }
    } catch {
      name.value = ''
      isAdmin.value = false
    }
  }

  return { name, isAdmin, isSignedIn, fetchUserInfo }
})
