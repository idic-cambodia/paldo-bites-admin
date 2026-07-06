<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import SidebarNav from "@/components/layout/SidebarNav.vue";
import TopBar from "@/components/layout/TopBar.vue";
import { useOrdersStore } from "@/stores/orders";
import { useAuthStore } from "@/stores/auth";
import { useAdminSocket } from "@/composables/useSocket";

const route = useRoute();
const hideLayout = computed(() => Boolean(route.meta.hideLayout));
const orders = useOrdersStore();
const auth = useAuthStore();

onMounted(() => {
    if (auth.token) {
        orders.fetchOrders({ page: 1, limit: 100 });
    }
    // Initialize real-time socket listener for orders
    useAdminSocket(orders);
});
</script>

<template>
    <RouterView v-if="hideLayout" />
    <div v-else class="shell">
        <SidebarNav />
        <div class="main-wrap">
            <TopBar />
            <main class="content">
                <RouterView />
            </main>
        </div>
    </div>
</template>

<style scoped>
.shell {
    display: flex;
    min-height: 100vh;
}
.main-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-left: var(--sidebar-w);
}
.content {
    flex: 1;
    padding: 28px 32px;
    overflow-y: auto;
}

@media (max-width: 768px) {
    .main-wrap {
        margin-left: 0;
    }
    .content {
        padding: 20px 16px;
    }
}
</style>
