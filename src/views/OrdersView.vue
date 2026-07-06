<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useOrdersStore } from "@/stores/orders";
import OrderCard from "@/components/orders/OrderCard.vue";
import type { OrderStatus } from "@/types";

const store = useOrdersStore();

type Filter = "all" | OrderStatus;
const activeFilter = ref<Filter>("all");

const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "preparing", label: "Preparing" },
    { key: "ready", label: "Ready" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" }
];

const filtered = computed(() => {
    const list = [...store.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return activeFilter.value === "all" ? list : list.filter((o) => o.status === activeFilter.value);
});

function count(f: Filter) {
    return f === "all" ? store.orders.length : store.orders.filter((o) => o.status === f).length;
}

async function refreshOrders() {
    await store.fetchOrders({ page: 1, limit: 20 });
}

async function handleStatusUpdate(id: string, status: any, grabTracking?: string) {
    await store.updateStatus(id, status, grabTracking);
}

onMounted(() => {
    refreshOrders();
});

watch(activeFilter, () => {
    refreshOrders();
});
</script>

<template>
    <div class="orders-view">
        <!-- Filter tabs -->
        <div class="filter-bar">
            <button v-for="f in filters" :key="f.key" class="filter-btn" :class="{ active: activeFilter === f.key }" @click="activeFilter = f.key">
                {{ f.label }}
                <span class="filter-count">{{ count(f.key) }}</span>
            </button>
        </div>

        <div class="empty" v-if="store.loading">
            <div class="empty-icon">⏳</div>
            <p>Loading orders...</p>
        </div>

        <div class="empty" v-else-if="store.error">
            <div class="empty-icon">⚠️</div>
            <p>{{ store.error }}</p>
        </div>

        <!-- Order list -->
        <div class="orders-list" v-else-if="filtered.length">
            <OrderCard v-for="order in filtered" :key="order.id" :order="order" @update-status="handleStatusUpdate" />
        </div>
        <div class="empty" v-else>
            <div class="empty-icon">📋</div>
            <p>No orders in this category yet.</p>
        </div>
    </div>
</template>

<style scoped>
.orders-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.filter-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 10px;
    box-shadow: var(--shadow);
}
.filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-soft);
    transition: all 0.15s;
}
.filter-btn:hover {
    background: var(--bg);
    color: var(--text);
}
.filter-btn.active {
    background: var(--brand);
    color: #fff;
}
.filter-count {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    font-size: 11px;
    padding: 1px 6px;
    font-weight: 700;
}
.filter-btn.active .filter-count {
    background: rgba(255, 255, 255, 0.25);
}

.orders-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-soft);
}
.empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
}
.empty p {
    font-size: 14px;
}
</style>
