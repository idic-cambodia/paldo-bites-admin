<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useOrdersStore } from "@/stores/orders";
import { useAuthStore } from "@/stores/auth";
import StatCard from "@/components/dashboard/StatCard.vue";
import RevenueChart from "@/components/dashboard/RevenueChart.vue";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge.vue";

const orders = useOrdersStore();
const auth = useAuthStore();
const router = useRouter();

const DASHBOARD_ENDPOINT = "/api/admin/dashboard/stats";

type DashboardApiResponse = {
    success?: boolean;
    message?: string;
    data?: {
        today?: {
            revenue?: number;
            totalOrders?: number;
            completedOrders?: number;
            pipeline?: {
                pending?: number;
                preparing?: number;
                ready?: number;
                completed?: number;
            };
        };
        topItems?: Array<{
            _id?: string;
            totalQty?: number;
            revenue?: number;
        }>;
        weekly?: Array<{
            _id?: string;
            revenue?: number;
            orders?: number;
        }>;
    };
};

type ChartPoint = { label: string; revenue: number; orders: number };

const dashboardLoading = ref(false);
const dashboardData = ref<DashboardApiResponse["data"]>();

const todayRevenue = computed(() => dashboardData.value?.today?.revenue ?? orders.todayRevenue);
const todayOrders = computed(() => dashboardData.value?.today?.totalOrders ?? orders.todayOrders);
const completedOrders = computed(() => dashboardData.value?.today?.completedOrders ?? orders.completed.length);
const pendingCount = computed(() => dashboardData.value?.today?.pipeline?.pending ?? orders.pending.length);
const preparingCount = computed(() => dashboardData.value?.today?.pipeline?.preparing ?? orders.preparing.length);
const readyCount = computed(() => dashboardData.value?.today?.pipeline?.ready ?? orders.ready.length);
const doneCount = computed(() => dashboardData.value?.today?.pipeline?.completed ?? orders.completed.length);

const topItems = computed(() => (dashboardData.value?.topItems ?? []).slice(0, 5));
const weeklyStats = computed<ChartPoint[]>(() =>
    (dashboardData.value?.weekly ?? [])
        .map((d) => ({
            label: (d._id || "").slice(5),
            revenue: Number(d.revenue ?? 0),
            orders: Number(d.orders ?? 0)
        }))
        .filter((d) => d.label.length > 0)
);

const recentOrders = computed(() => [...orders.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5));
function timeAgo(date: Date) {
    const m = Math.floor((Date.now() - date.getTime()) / 60_000);
    return m < 1 ? "Just now" : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

async function fetchDashboardStats() {
    if (!auth.token) return;

    const authorization = auth.token.startsWith("Bearer ") ? auth.token : `Bearer ${auth.token}`;

    dashboardLoading.value = true;
    try {
        const response = await fetch(DASHBOARD_ENDPOINT, {
            method: "GET",
            headers: { Authorization: authorization }
        });

        const body = (await response.json().catch(() => ({}))) as DashboardApiResponse;
        if (response.ok && body.success && body.data) {
            dashboardData.value = body.data;
        }
    } finally {
        dashboardLoading.value = false;
    }
}

onMounted(() => {
    fetchDashboardStats();
});
</script>

<template>
    <div class="dashboard">
        <!-- Stats -->
        <div class="stats-grid">
            <StatCard icon="💰" label="Today's Revenue" :value="`$${todayRevenue.toFixed(2)}`" sub="From dashboard API" accent="#C8472A" />
            <StatCard icon="📋" label="Total Orders" :value="String(todayOrders)" sub="From dashboard API" accent="#2563eb" />
            <StatCard icon="⏳" label="Pending" :value="String(pendingCount)" sub="Awaiting confirmation" accent="#d97706" />
            <StatCard icon="✅" label="Completed" :value="String(completedOrders)" sub="Today completed" accent="#059669" />
        </div>

        <!-- Row: chart + kanban summary -->
        <div class="mid-row">
            <RevenueChart :points="weeklyStats" />
            <div class="kanban-summary">
                <h3 class="section-title">Order Pipeline</h3>
                <div class="pipeline">
                    <div class="pipe-col pending">
                        <div class="pipe-label">Pending</div>
                        <div class="pipe-count">{{ pendingCount }}</div>
                    </div>
                    <div class="pipe-arrow">→</div>
                    <div class="pipe-col preparing">
                        <div class="pipe-label">Preparing</div>
                        <div class="pipe-count">{{ preparingCount }}</div>
                    </div>
                    <div class="pipe-arrow">→</div>
                    <div class="pipe-col ready">
                        <div class="pipe-label">Ready</div>
                        <div class="pipe-count">{{ readyCount }}</div>
                    </div>
                    <div class="pipe-arrow">→</div>
                    <div class="pipe-col completed">
                        <div class="pipe-label">Done</div>
                        <div class="pipe-count">{{ doneCount }}</div>
                    </div>
                </div>
                <!-- Top items summary -->
                <h3 class="section-title" style="margin-top: 20px">Top Selling Today</h3>
                <div class="top-items">
                    <div v-if="dashboardLoading" class="soft">Loading top items...</div>
                    <div v-else-if="!topItems.length" class="soft">No top items yet.</div>
                    <div v-else class="top-item" v-for="item in topItems" :key="item._id">
                        {{ item._id || "Unknown Item" }}
                        <span>{{ item.totalQty ?? 0 }} sold</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Orders -->
        <div class="recent-section">
            <div class="section-header">
                <h3 class="section-title">Recent Orders</h3>
                <button class="view-all" @click="router.push('/orders')">View all →</button>
            </div>
            <div class="order-table-wrap">
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Phone</th>
                            <th>Delivery/Pickup</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="o in recentOrders" :key="o.id" @click="router.push('/orders')" class="order-row">
                            <td class="id-cell">{{ o.id }}</td>
                            <td>{{ o.phone }}</td>
                            <td>{{ o.pickupTime == "-" ? "🛵 " : "📍 " }}{{ o.deliveryTime || o.pickupTime }}</td>
                            <td>{{ o.items.reduce((s, i) => s + i.qty, 0) }} items</td>
                            <td class="total-cell">${{ o.total.toFixed(2) }}</td>
                            <td><OrderStatusBadge :status="o.status" /></td>
                            <td class="soft">{{ timeAgo(o.createdAt) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    gap: 24px;
}
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.mid-row {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 16px;
}
.kanban-summary {
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 20px;
    box-shadow: var(--shadow);
}

.section-title {
    font-size: 15px;
    margin-bottom: 14px;
}

.pipeline {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.pipe-col {
    flex: 1;
    text-align: center;
    padding: 12px 8px;
    border-radius: 10px;
    min-width: 60px;
}
.pipe-col.pending {
    background: #fef3c7;
}
.pipe-col.preparing {
    background: #dbeafe;
}
.pipe-col.ready {
    background: #d1fae5;
}
.pipe-col.completed {
    background: #f3f4f6;
}
.pipe-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-soft);
}
.pipe-count {
    font-family: "Fraunces", serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--text);
    margin-top: 4px;
}
.pipe-arrow {
    color: var(--text-soft);
    font-size: 14px;
}

.top-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.top-item {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--text);
    padding: 6px 10px;
    background: var(--bg);
    border-radius: 8px;
}
.top-item span {
    font-weight: 700;
    color: var(--brand);
}

.recent-section {
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 20px;
    box-shadow: var(--shadow);
}
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}
.view-all {
    font-size: 13px;
    font-weight: 600;
    color: var(--brand);
}
.view-all:hover {
    text-decoration: underline;
}

.order-table-wrap {
    overflow-x: auto;
}
.order-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}
.order-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-soft);
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
}
.order-table td {
    padding: 11px 12px;
    border-bottom: 1px solid #f5f0e8;
    vertical-align: middle;
}
.order-row {
    cursor: pointer;
    transition: background 0.1s;
}
.order-row:hover {
    background: #faf8f5;
}
.id-cell {
    font-family: "Fraunces", serif;
    font-weight: 700;
}
.total-cell {
    font-weight: 700;
    color: var(--brand);
}
.soft {
    color: var(--text-soft);
}

@media (max-width: 1100px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .mid-row {
        grid-template-columns: 1fr;
    }
}
@media (max-width: 600px) {
    .stats-grid {
        grid-template-columns: 1fr 1fr;
    }
}
</style>
