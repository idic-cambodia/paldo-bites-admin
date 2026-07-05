import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',        name: 'dashboard', component: DashboardView },
    { path: '/orders',  name: 'orders',    component: () => import('@/views/OrdersView.vue') },
    { path: '/menu',    name: 'menu',      component: () => import('@/views/MenuView.vue') },
    { path: '/settings',name: 'settings',  component: () => import('@/views/SettingsView.vue') },
  ],
})
