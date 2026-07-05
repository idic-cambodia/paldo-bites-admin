<script setup lang="ts">
import type { OrderStatus } from '@/types'
defineProps<{ status: OrderStatus }>()

const cfg: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fef3c7' },
  preparing: { label: 'Preparing', color: '#1e40af', bg: '#dbeafe' },
  ready:     { label: 'Ready',     color: '#065f46', bg: '#d1fae5' },
  completed: { label: 'Completed', color: '#374151', bg: '#f3f4f6' },
  cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fee2e2' },
}
</script>

<template>
  <span class="badge" :style="`color:${cfg[status].color};background:${cfg[status].bg}`">
    {{ cfg[status].label }}
  </span>
</template>

<style scoped>
.badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
</style>
