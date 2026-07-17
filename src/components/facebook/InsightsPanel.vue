<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useFacebookStore } from "@/stores/facebook";
import type { InsightPeriod } from "@/types/facebook";

const fb = useFacebookStore();

const DEFAULT_METRICS = ["page_fans", "page_impressions", "page_engaged_users", "page_views_total"];
const metricsInput = ref(DEFAULT_METRICS.join(", "));
const period = ref<InsightPeriod>("day");

async function load() {
    if (!fb.activePageId) return;
    const metrics = metricsInput.value
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
    if (!metrics.length) return;
    await fb.fetchInsights({ metrics, period: period.value });
}

function latestValue(values: { value: number; endTime?: string }[]) {
    return values.length ? values[values.length - 1].value : 0;
}

function metricLabel(name: string) {
    return name
        .replace(/^page_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const chartData = computed(() =>
    fb.insights.map((metric) => {
        const max = Math.max(1, ...metric.values.map((v) => v.value));
        return {
            ...metric,
            bars: metric.values.map((v, i) => ({
                x: i,
                height: Math.round((v.value / max) * 60),
                value: v.value,
                endTime: v.endTime
            }))
        };
    })
);

onMounted(load);
watch(() => fb.activePageId, load);
</script>

<template>
    <div class="insights-panel">
        <div class="panel-head">
            <div>
                <h3>Insights</h3>
                <p class="sub">{{ fb.activePage?.name || "Select a page" }}</p>
            </div>
        </div>

        <div class="empty" v-if="!fb.activePageId">
            <div class="empty-icon">📘</div>
            <p>Select a page first.</p>
        </div>

        <template v-else>
            <div class="controls">
                <div class="field">
                    <label>Metrics (comma separated)</label>
                    <input v-model="metricsInput" type="text" placeholder="page_fans, page_impressions" />
                </div>
                <div class="field narrow">
                    <label>Period</label>
                    <select v-model="period">
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="days_28">28 Days</option>
                    </select>
                </div>
                <button class="btn-load" :disabled="fb.insightsLoading" @click="load">
                    {{ fb.insightsLoading ? "Loading..." : "Refresh" }}
                </button>
            </div>

            <div class="empty" v-if="fb.insightsLoading && !fb.insights.length">
                <div class="empty-icon">⏳</div>
                <p>Loading insights...</p>
            </div>

            <div class="empty" v-else-if="fb.insightsError && !fb.insights.length">
                <div class="empty-icon">⚠️</div>
                <p>{{ fb.insightsError }}</p>
            </div>

            <div class="empty" v-else-if="!fb.insights.length">
                <div class="empty-icon">📊</div>
                <p>No insight data yet — try refreshing.</p>
            </div>

            <div class="metrics-grid" v-else>
                <div class="metric-card" v-for="metric in chartData" :key="metric.name">
                    <div class="metric-top">
                        <span class="metric-name">{{ metricLabel(metric.name) }}</span>
                        <span class="metric-value">{{ latestValue(metric.values).toLocaleString() }}</span>
                    </div>
                    <svg class="metric-chart" viewBox="0 0 100 60" preserveAspectRatio="none" v-if="metric.bars.length > 1">
                        <g v-for="bar in metric.bars" :key="bar.x">
                            <rect
                                :x="(bar.x / metric.bars.length) * 100"
                                :y="60 - bar.height"
                                :width="Math.max(2, 100 / metric.bars.length - 2)"
                                :height="bar.height"
                                fill="#C8472A"
                                rx="1"
                            />
                        </g>
                    </svg>
                    <div class="metric-period">{{ metric.period }}</div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.insights-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.panel-head h3 {
    font-size: 16px;
}
.sub {
    font-size: 12px;
    color: var(--text-soft);
    margin-top: 2px;
}

.controls {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    flex-wrap: wrap;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    box-shadow: var(--shadow);
}
.field {
    flex: 1;
    min-width: 220px;
}
.field.narrow {
    flex: 0 0 140px;
    min-width: 120px;
}
.field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-soft);
    margin-bottom: 6px;
}
.field input,
.field select {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
}
.btn-load {
    padding: 9px 18px;
    border-radius: 8px;
    background: var(--brand);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}
.btn-load:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.btn-load:hover:not(:disabled) {
    background: var(--brand-deep);
}

.empty {
    text-align: center;
    padding: 50px 20px;
    color: var(--text-soft);
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
}
.empty-icon {
    font-size: 34px;
    margin-bottom: 10px;
}
.empty p {
    font-size: 13px;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
}
.metric-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.metric-top {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.metric-name {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-soft);
}
.metric-value {
    font-family: "Fraunces", serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--text);
}
.metric-chart {
    width: 100%;
    height: 60px;
}
.metric-period {
    font-size: 10px;
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
</style>
