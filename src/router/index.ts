import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { publicOnly: true, hideLayout: true },
    },
    { path: '/',        name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/orders',  name: 'orders',    component: () => import('@/views/OrdersView.vue'), meta: { requiresAuth: true } },
    { path: '/menu',    name: 'menu',      component: () => import('@/views/MenuView.vue'), meta: { requiresAuth: true } },
    { path: '/settings',name: 'settings',  component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      return { name: 'login' }
    }

    const isValid = await auth.verifyToken()
    if (!isValid) {
      return { name: 'login' }
    }
  }

  if (to.meta.publicOnly && auth.isAuthenticated) {
    const isValid = await auth.verifyToken()
    if (isValid) {
      return { name: 'dashboard' }
    }
  }
})
