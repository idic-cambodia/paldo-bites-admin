<script setup lang="ts">
defineProps<{ icon: string; label: string; value: string; sub?: string; accent?: string }>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-icon" :style="accent ? `background:${accent}18;color:${accent}` : ''">{{ icon }}</div>
    <div class="stat-body">
      <div class="stat-value">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-sub" v-if="sub">{{ sub }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--card); border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 20px; display: flex; align-items: flex-start; gap: 16px;
  box-shadow: var(--shadow);
}
.stat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: var(--brand-light); color: var(--brand);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.stat-value { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: var(--text); line-height: 1; }
.stat-label { font-size: 13px; color: var(--text-soft); margin-top: 4px; }
.stat-sub   { font-size: 11px; color: var(--text-soft); margin-top: 2px; opacity: .7; }
</style>
