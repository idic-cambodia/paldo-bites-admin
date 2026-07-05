<script setup lang="ts">
import { useOrdersStore } from '@/stores/orders'
const orders = useOrdersStore()

const nav = [
  { to: '/',         icon: '▦',  label: 'Dashboard' },
  { to: '/orders',   icon: '📋', label: 'Orders'    },
  { to: '/menu',     icon: '🍽️', label: 'Menu'      },
  { to: '/settings', icon: '⚙️', label: 'Settings'  },
]
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-icon">🌯</div>
      <div>
        <div class="brand-name">Paldo Bites</div>
        <div class="brand-sub">Admin Panel</div>
      </div>
    </div>

    <nav class="nav">
      <RouterLink
        v-for="item in nav" :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: $route.path === item.to }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span class="badge" v-if="item.to === '/orders' && orders.pending.length">
          {{ orders.pending.length }}
        </span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="shop-status">
        <span class="status-dot open"></span>
        <div>
          <div class="status-label">Shop is Open</div>
          <div class="status-sub">Open from 11am</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed; top: 0; left: 0; bottom: 0;
  width: var(--sidebar-w);
  background: var(--sidebar-bg);
  display: flex; flex-direction: column;
  z-index: 40; overflow: hidden;
}
.brand {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.brand-icon { font-size: 28px; line-height: 1; }
.brand-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: #fff; }
.brand-sub  { font-size: 10px; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .06em; }

.nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  font-size: 14px; font-weight: 500; color: rgba(255,255,255,.55);
  transition: background .15s, color .15s; position: relative;
}
.nav-item:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.85); }
.nav-item.active { background: var(--brand); color: #fff; }
.nav-icon  { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.nav-label { flex: 1; }
.badge {
  background: #ef4444; color: #fff;
  border-radius: 20px; font-size: 11px; font-weight: 700;
  padding: 1px 7px; min-width: 20px; text-align: center;
}

.sidebar-footer { padding: 16px 14px; border-top: 1px solid rgba(255,255,255,.07); }
.shop-status { display: flex; align-items: center; gap: 10px; }
.status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.status-dot.open  { background: var(--grab); box-shadow: 0 0 0 3px rgba(0,177,79,.25); }
.status-dot.closed{ background: #ef4444; }
.status-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.85); }
.status-sub   { font-size: 11px; color: rgba(255,255,255,.35); }

@media (max-width: 768px) { .sidebar { display: none; } }
</style>
