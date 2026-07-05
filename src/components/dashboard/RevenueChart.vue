<script setup lang="ts">
import { computed } from 'vue'
import { weeklyStats } from '@/data/mockData'

const max = Math.max(...weeklyStats.map(d => d.revenue))
const barH = 120

const bars = computed(() => weeklyStats.map((d, i) => ({
  ...d,
  x: i * 52 + 10,
  height: Math.round((d.revenue / max) * barH),
  isToday: i === 6
})))
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <h3>Weekly Revenue</h3>
        <p class="chart-sub">Phnom Penh, Cambodia · This week</p>
      </div>
      <div class="total-chip">${{ weeklyStats.reduce((s,d) => s+d.revenue,0).toFixed(2) }}</div>
    </div>
    <svg class="chart-svg" viewBox="0 0 384 160" preserveAspectRatio="none">
      <!-- grid lines -->
      <line v-for="n in 4" :key="n" :y1="160 - n*30" y2="160 - n*30" x1="0" x2="384" stroke="#f0ebe3" stroke-width="1"/>
      <!-- bars -->
      <g v-for="bar in bars" :key="bar.label">
        <rect
          :x="bar.x" :y="160 - bar.height - 24"
          width="36" :height="bar.height"
          :fill="bar.isToday ? '#C8472A' : '#e8dfd4'"
          rx="4"
        />
        <text :x="bar.x + 18" y="155" text-anchor="middle" font-size="10" fill="#9a8070" font-family="Work Sans, sans-serif">
          {{ bar.label }}
        </text>
        <text :x="bar.x + 18" :y="160 - bar.height - 28" text-anchor="middle" font-size="9" :fill="bar.isToday ? '#C8472A' : '#9a8070'" font-family="Work Sans, sans-serif" font-weight="600">
          ${{ bar.revenue }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.chart-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px; box-shadow: var(--shadow); }
.chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.chart-header h3 { font-size: 16px; }
.chart-sub { font-size: 12px; color: var(--text-soft); margin-top: 2px; }
.total-chip { background: var(--brand-light); color: var(--brand); border-radius: 20px; padding: 6px 14px; font-weight: 700; font-size: 15px; white-space: nowrap; }
.chart-svg { width: 100%; height: 160px; }
</style>
