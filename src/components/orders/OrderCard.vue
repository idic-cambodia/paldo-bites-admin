<script setup lang="ts">
import { ref } from "vue";
import type { Order, OrderStatus } from "@/types";
import OrderStatusBadge from "./OrderStatusBadge.vue";

const props = defineProps<{ order: Order }>();
const emit = defineEmits<{
    (e: "update-status", id: string, status: OrderStatus, grabTracking?: string): void;
}>();

const expanded = ref(false);
const grabTrackingInput = ref(props.order.grabTracking || "");

function timeAgo(date: Date): string {
    const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

const nextStatus: Record<string, OrderStatus> = {
    pending: "preparing",
    preparing: "ready",
    ready: "completed"
};
const nextLabel: Record<string, string> = {
    pending: "→ Start Preparing",
    preparing: "→ Mark Ready",
    ready: "✓ Complete"
};
</script>

<template>
    <div class="card" :class="order.status">
        <!-- header row -->
        <div class="card-head" @click="expanded = !expanded">
            <div class="id-col">
                <span class="order-id">{{ order.id }}</span>
                <OrderStatusBadge :status="order.status" />
            </div>
            <div class="info-col">
                <span class="phone">{{ order.phone }}</span>
                <span class="pickup">🕐 {{ order.pickupTime }}</span>
            </div>
            <div class="total-col">
                <span class="total">${{ order.total.toFixed(2) }}</span>
                <span class="ago">{{ timeAgo(order.createdAt) }}</span>
            </div>
            <div class="chevron">{{ expanded ? "▲" : "▼" }}</div>
        </div>

        <!-- expanded body -->
        <div class="card-body" v-if="expanded">
            <!-- items -->
            <div class="items-list">
                <div class="item-row" v-for="item in order.items" :key="item.dishId">
                    <span class="item-qty">×{{ item.qty }}</span>
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-price">${{ (item.price * item.qty).toFixed(2) }}</span>
                </div>
            </div>

            <!-- meta -->
            <div class="meta-grid">
                <div class="meta-item" v-if="order.remark">
                    <span class="meta-label">📝 Remark</span>
                    <span class="meta-val">{{ order.remark }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">📍 Location</span>
                    <a :href="order.mapUrl" target="_blank" rel="noopener" class="map-link"> {{ order.location }} → </a>
                </div>
                <div class="meta-item" v-if="order.grabTracking">
                    <span class="meta-label">🛵 Grab Tracking</span>
                    <a :href="order.grabTracking" target="_blank" rel="noopener" class="map-link"> {{ order.grabTracking }} → </a>
                </div>
            </div>

            <!-- grab tracking input (when ready) -->
            <div class="grab-input-section" v-if="order.status === 'ready'">
                <label class="grab-label">🛵 Add Grab Tracking Link (when ready):</label>
                <input v-model="grabTrackingInput" type="text" placeholder="https://grab.com/track/..." class="grab-input" />
            </div>

            <!-- actions -->
            <div class="actions" v-if="order.status !== 'completed' && order.status !== 'cancelled'">
                <button
                    class="btn-next"
                    @click="emit('update-status', order.id, nextStatus[order.status], order.status === 'ready' ? grabTrackingInput : undefined)"
                >
                    {{ nextLabel[order.status] }}
                </button>
                <button class="btn-cancel" @click="emit('update-status', order.id, 'cancelled')">✕ Cancel</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card {
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    overflow: hidden;
    border-left: 4px solid var(--border);
    box-shadow: var(--shadow);
}
.card.pending {
    border-left-color: #d97706;
}
.card.preparing {
    border-left-color: #2563eb;
}
.card.ready {
    border-left-color: #059669;
}
.card.completed {
    border-left-color: #9ca3af;
    opacity: 0.8;
}
.card.cancelled {
    border-left-color: #dc2626;
    opacity: 0.6;
}

.card-head {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    cursor: pointer;
    transition: background 0.12s;
}
.card-head:hover {
    background: #faf8f5;
}

.id-col,
.info-col,
.total-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.order-id {
    font-family: "Fraunces", serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
}
.phone {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
}
.pickup {
    font-size: 12px;
    color: var(--text-soft);
}
.total {
    font-family: "Fraunces", serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--brand);
}
.ago {
    font-size: 11px;
    color: var(--text-soft);
}
.chevron {
    font-size: 10px;
    color: var(--text-soft);
}

.card-body {
    padding: 0 18px 18px;
    border-top: 1px solid var(--border);
    margin-top: 0;
}

.items-list {
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.item-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}
.item-qty {
    width: 28px;
    text-align: center;
    font-weight: 700;
    color: var(--brand);
    background: var(--brand-light);
    border-radius: 6px;
    padding: 1px 4px;
}
.item-name {
    flex: 1;
    color: var(--text);
}
.item-price {
    font-weight: 600;
    color: var(--text-soft);
}

.meta-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0 14px;
    border-top: 1px dashed var(--border);
}
.meta-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 13px;
}
.meta-label {
    color: var(--text-soft);
    white-space: nowrap;
}
.meta-val {
    color: var(--text);
}
.map-link {
    color: #2563eb;
    text-decoration: underline;
    font-size: 12px;
}

.actions {
    display: flex;
    gap: 10px;
    padding-top: 4px;
    flex-wrap: wrap;
}
.btn-next {
    background: var(--brand);
    color: #fff;
    padding: 9px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    transition: background 0.15s;
}
.btn-next:hover {
    background: var(--brand-deep);
}
.btn-cancel {
    background: #fee2e2;
    color: #991b1b;
    padding: 9px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    transition: background 0.15s;
}
.btn-cancel:hover {
    background: #fecaca;
}

.grab-input-section {
    padding: 12px;
    background: #f0fdf4;
    border: 1px solid #dcfce7;
    border-radius: 6px;
    margin: 12px 0;
}
.grab-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #166534;
    margin-bottom: 6px;
}
.grab-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #86efac;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    background: #fff;
}
.grab-input:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

@media (max-width: 600px) {
    .card-head {
        grid-template-columns: 1fr auto;
    }
    .info-col,
    .total-col {
        display: none;
    }
}
</style>
