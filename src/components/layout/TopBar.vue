<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOrdersStore } from '@/stores/orders'

const route  = useRoute()
const orders = useOrdersStore()

const titles: Record<string, string> = {
  '/': 'Dashboard', '/orders': 'Orders', '/menu': 'Menu', '/settings': 'Settings'
}
const pageTitle = computed(() => titles[route.path] ?? 'Admin')

const now = new Date().toLocaleDateString('en-KH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
</script>

<template>
  <header class="topbar">
    <div class="left">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <span class="date">{{ now }}</span>
    </div>
    <div class="right">
      <div class="alert-chip" v-if="orders.pending.length">
        🔔 {{ orders.pending.length }} new order{{ orders.pending.length > 1 ? 's' : '' }}
      </div>
      <div class="avatar">AD</div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 32px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  gap: 16px; flex-wrap: wrap;
}
.page-title { font-size: 20px; color: var(--text); }
.date { font-size: 12px; color: var(--text-soft); display: block; margin-top: 1px; }
.right { display: flex; align-items: center; gap: 12px; }
.alert-chip {
  background: #fef3c7; color: #92400e;
  border: 1px solid #fde68a;
  padding: 6px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--brand); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
}
@media (max-width: 768px) { .topbar { padding: 14px 16px; } }
</style>
