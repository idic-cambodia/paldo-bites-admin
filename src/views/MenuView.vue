<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useMenuStore } from "@/stores/menu";
import EditItemModal from "@/components/menu/EditItemModal.vue";
import CreateItemModal from "@/components/menu/CreateItemModal.vue";
import type { MenuItem, MenuCategory } from "@/types";

const menu = useMenuStore();
const activeTab = ref<MenuCategory>("Ulam");
const editing = ref<MenuItem | null>(null);
const creating = ref(false);

const filtered = computed(() => menu.items.filter((i) => i.category === activeTab.value));
const tabs = computed<MenuCategory[]>(() => {
    const defaults: MenuCategory[] = ["Ulam", "Merienda"];
    const discovered = menu.items.map((item) => item.category).filter((value) => value && value.trim().length > 0);
    return [...new Set([...defaults, ...discovered])];
});

async function saveEdit(patch: { name: string; price: number; desc: string; minQty?: number; imageFile?: File }) {
    if (editing.value) {
        const ok = await menu.patchMenu(editing.value.id, patch);
        if (ok) editing.value = null;
    }
}

async function createItem(payload: { name: string; price: number; category: MenuCategory; desc: string; available: boolean; minQty?: number }) {
    const ok = await menu.createMenu(payload);
    if (ok) creating.value = false;
}

async function deleteItem(item: MenuItem) {
    const okToDelete = window.confirm(`Delete menu item \"${item.name}\"?`);
    if (!okToDelete) return;
    await menu.deleteMenu(item.id);
}

onMounted(() => {
    menu.fetchMenu();
});

watch(tabs, (nextTabs) => {
    if (!nextTabs.includes(activeTab.value) && nextTabs.length) {
        activeTab.value = nextTabs[0];
    }
});

const solveImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${window.location.origin}${url}`;
};
</script>

<template>
    <div class="menu-view">
        <!-- Tabs -->
        <div class="tab-bar">
            <button v-for="tab in tabs" :key="tab" class="tab-btn" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</button>
            <button class="tab-btn add-btn" @click="creating = true">+ Add Item</button>
        </div>

        <!-- Summary chips -->
        <div class="summary-row">
            <span class="chip available">✓ {{ filtered.filter((i) => i.available).length }} available</span>
            <span class="chip unavailable">✕ {{ filtered.filter((i) => !i.available).length }} hidden</span>
        </div>

        <div class="empty" v-if="menu.loading">
            <div class="empty-icon">⏳</div>
            <p>Loading menu items...</p>
        </div>

        <div class="empty" v-else-if="menu.error">
            <div class="empty-icon">⚠️</div>
            <p>{{ menu.error }}</p>
        </div>

        <!-- Table -->
        <div class="table-wrap" v-else>
            <table class="menu-table">
                <thead>
                    <tr>
                        <th style="width: 40px"></th>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Min Qty</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in filtered" :key="item.id" :class="{ 'row-hidden': !item.available }">
                        <td class="icon-cell">
                            <img v-if="item.img" :src="solveImageUrl(item.img)" :alt="item.name" class="item-img" />
                            <span v-else>{{ item.icon }}</span>
                        </td>
                        <td>
                            <div class="item-name">{{ item.name }}</div>
                            <div class="item-desc">{{ item.desc }}</div>
                        </td>
                        <td class="price-cell">${{ item.price.toFixed(3).replace(/\.?0+$/, "") }}</td>
                        <td class="soft">{{ item.minQty ? `${item.minQty} pcs` : "—" }}</td>
                        <td>
                            <label class="toggle">
                                <input type="checkbox" :checked="item.available" @change="menu.toggleAvailable(item.id)" />
                                <span class="slider"></span>
                                <span class="toggle-label">{{ item.available ? "Available" : "Hidden" }}</span>
                            </label>
                        </td>
                        <td>
                            <button class="btn-edit" @click="editing = item">✏️ Edit</button>
                            <button class="btn-delete" @click="deleteItem(item)">🗑 Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Edit modal -->
        <EditItemModal v-if="editing" :item="editing" @save="saveEdit" @close="editing = null" />
        <CreateItemModal
            v-if="creating"
            :categories="tabs"
            :initial-category="activeTab"
            @save="createItem"
            @close="creating = false"
        />
    </div>
</template>

<style scoped>
.menu-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tab-bar {
    display: flex;
    gap: 6px;
}
.tab-btn {
    padding: 9px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-soft);
    background: var(--card);
    border: 1px solid var(--border);
    transition: all 0.15s;
}
.tab-btn.active {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
}
.add-btn {
    margin-left: auto;
    background: #fff8f3;
    color: var(--brand);
    border-color: #f2d5c6;
}

.summary-row {
    display: flex;
    gap: 10px;
}
.chip {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
}
.chip.available {
    background: #d1fae5;
    color: #065f46;
}
.chip.unavailable {
    background: #fee2e2;
    color: #991b1b;
}

.table-wrap {
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    overflow: hidden;
    box-shadow: var(--shadow);
    overflow-x: auto;
}
.menu-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}
.menu-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-soft);
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: #faf8f5;
}
.menu-table td {
    padding: 13px 16px;
    border-bottom: 1px solid #f5f0e8;
    vertical-align: middle;
}
.menu-table tr:last-child td {
    border-bottom: none;
}
.row-hidden {
    opacity: 0.5;
}
.icon-cell {
    font-size: 20px;
    text-align: center;
    width: 56px;
}
.item-img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--border);
    display: block;
    margin: 0 auto;
}
.item-name {
    font-weight: 600;
    color: var(--text);
}
.item-desc {
    font-size: 12px;
    color: var(--text-soft);
    margin-top: 2px;
}
.price-cell {
    font-family: "Fraunces", serif;
    font-weight: 700;
    color: var(--brand);
    font-size: 15px;
}
.soft {
    color: var(--text-soft);
    font-size: 13px;
}

/* Toggle switch */
.toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}
.toggle input {
    display: none;
}
.slider {
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: #d1d5db;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
}
.slider::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.toggle input:checked ~ .slider {
    background: var(--grab);
}
.toggle input:checked ~ .slider::after {
    transform: translateX(16px);
}
.toggle-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-soft);
}

.btn-edit {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    transition: all 0.15s;
}
.btn-edit:hover {
    background: var(--brand-light);
    color: var(--brand);
    border-color: var(--brand);
}
.btn-delete {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
    transition: all 0.15s;
    margin-left: 8px;
}
.btn-delete:hover {
    background: #fecaca;
}
</style>
