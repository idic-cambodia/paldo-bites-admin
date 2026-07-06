<script setup lang="ts">
import { computed } from "vue";

type ChartPoint = { label: string; revenue: number; orders: number };

const props = defineProps<{ points?: ChartPoint[] }>();

const source = computed(() => props.points ?? []);
const hasData = computed(() => source.value.length > 0);
const max = computed(() => Math.max(1, ...source.value.map((d) => d.revenue)));
const chartW = 384;
const chartH = 160;
const chartBottom = 136;
const barH = 120;
const slotWidth = computed(() => chartW / Math.max(1, source.value.length));
const barWidth = computed(() => Math.min(36, Math.max(18, slotWidth.value * 0.55)));

const bars = computed(() =>
    source.value.map((d, i) => ({
        ...d,
        x: i * slotWidth.value + (slotWidth.value - barWidth.value) / 2,
        height: Math.round((d.revenue / max.value) * barH),
        isToday: i === source.value.length - 1
    }))
);

const totalRevenue = computed(() => source.value.reduce((sum, d) => sum + d.revenue, 0));
</script>

<template>
    <div class="chart-card">
        <div class="chart-header">
            <div>
                <h3>Weekly Revenue</h3>
                <p class="chart-sub">Phnom Penh, Cambodia · This week</p>
            </div>
            <div class="total-chip">${{ totalRevenue.toFixed(2) }}</div>
        </div>
        <div v-if="!hasData" class="empty-state">
            <div class="empty-icon">📈</div>
            <p>No weekly revenue data yet.</p>
        </div>
        <svg v-else class="chart-svg" :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
            <!-- grid lines -->
            <line v-for="n in 4" :key="n" :y1="chartH - n * 30" :y2="chartH - n * 30" x1="0" :x2="chartW" stroke="#f0ebe3" stroke-width="1" />
            <!-- bars -->
            <g v-for="bar in bars" :key="bar.label">
                <rect
                    :x="bar.x"
                    :y="chartBottom - bar.height"
                    :width="barWidth"
                    :height="bar.height"
                    :fill="bar.isToday ? '#C8472A' : '#e8dfd4'"
                    rx="4"
                />
                <text :x="bar.x + barWidth / 2" y="155" text-anchor="middle" font-size="10" fill="#9a8070" font-family="Work Sans, sans-serif">
                    {{ bar.label }}
                </text>
                <text
                    :x="bar.x + barWidth / 2"
                    :y="Math.max(12, chartBottom - bar.height - 8)"
                    text-anchor="middle"
                    font-size="9"
                    :fill="bar.isToday ? '#C8472A' : '#9a8070'"
                    font-family="Work Sans, sans-serif"
                    font-weight="600"
                >
                    ${{ bar.revenue }}
                </text>
            </g>
        </svg>
    </div>
</template>

<style scoped>
.chart-card {
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 20px;
    box-shadow: var(--shadow);
}
.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}
.chart-header h3 {
    font-size: 16px;
}
.chart-sub {
    font-size: 12px;
    color: var(--text-soft);
    margin-top: 2px;
}
.total-chip {
    background: var(--brand-light);
    color: var(--brand);
    border-radius: 20px;
    padding: 6px 14px;
    font-weight: 700;
    font-size: 15px;
    white-space: nowrap;
}
.chart-svg {
    width: 100%;
    height: 160px;
}
.empty-state {
    display: grid;
    place-items: center;
    height: 160px;
    border: 1px dashed #eadfd0;
    border-radius: 14px;
    background: linear-gradient(180deg, #fffdfb 0%, #faf6f1 100%);
    color: var(--text-soft);
    text-align: center;
}
.empty-icon {
    font-size: 28px;
    margin-bottom: 8px;
}
.empty-state p {
    font-size: 13px;
    font-weight: 600;
}
</style>
