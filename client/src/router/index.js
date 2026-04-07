import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/EarthScene.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../components/admin/AdminView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
