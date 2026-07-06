<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrdersStore } from "@/stores/orders";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const orders = useOrdersStore();
const auth = useAuthStore();

const titles: Record<string, string> = {
    "/": "Dashboard",
    "/orders": "Orders",
    "/menu": "Menu",
    "/settings": "Settings",
    "/login": "Login"
};
const pageTitle = computed(() => titles[route.path] ?? "Admin");

const now = new Date().toLocaleDateString("en-KH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

function onLogout() {
    auth.logout();
    router.push("/login");
}
</script>

<template>
    <header class="topbar">
        <div class="left">
            <h1 class="page-title">{{ pageTitle }}</h1>
            <span class="date">{{ now }}</span>
        </div>
        <div class="right">
            <div class="alert-chip" v-if="orders.pending.length">
                🔔 {{ orders.pending.length }} new order{{ orders.pending.length > 1 ? "s" : "" }}
            </div>
            <div class="admin-chip">{{ auth.adminName }}</div>
            <button class="logout-btn" @click="onLogout">Logout</button>
            <div class="avatar">{{ auth.adminName.slice(0, 2).toUpperCase() }}</div>
        </div>
    </header>
</template>

<style scoped>
.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    background: var(--card);
    border-bottom: 1px solid var(--border);
    gap: 16px;
    flex-wrap: wrap;
}
.page-title {
    font-size: 20px;
    color: var(--text);
}
.date {
    font-size: 12px;
    color: var(--text-soft);
    display: block;
    margin-top: 1px;
}
.right {
    display: flex;
    align-items: center;
    gap: 12px;
}
.admin-chip {
    background: #f4ede4;
    border: 1px solid #e8dccd;
    color: #553d2b;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
}
.alert-chip {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}
.logout-btn {
    height: 34px;
    border-radius: 9px;
    border: 1px solid #e7d8c8;
    background: #fffaf4;
    color: #8a3f2d;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 700;
}
.logout-btn:hover {
    background: #fef0e3;
}
.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--brand);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
}
@media (max-width: 768px) {
    .topbar {
        padding: 14px 16px;
    }
    .admin-chip {
        display: none;
    }
}
</style>
