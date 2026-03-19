import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/components/HomeView.vue'
import AboutView from '@/components/AboutView.vue'
import SearchView from '@/components/SearchView.vue'
import NewEventView from '@/components/NewEventView.vue'
import EditEventView from '@/components/EditEventView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
  { path: '/search', component: SearchView },
  { path: '/new-event', component: NewEventView },
  { path: '/edit-event/:id', component: EditEventView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
export default router
