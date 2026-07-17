<script setup lang="ts">
import { ref } from "vue";
import { useFacebookStore } from "@/stores/facebook";
import ConnectPageModal from "./ConnectPageModal.vue";

const fb = useFacebookStore();
const connecting = ref(false);
const submitting = ref(false);
const refreshingId = ref<string | null>(null);

async function handleConnect(payload: { userAccessToken: string; pageId: string }) {
    submitting.value = true;
    const ok = await fb.connectPage(payload.userAccessToken, payload.pageId);
    submitting.value = false;
    if (ok) connecting.value = false;
}

async function handleDisconnect(pageId: string, name: string) {
    if (!window.confirm(`Disconnect "${name}"? Posts, comments and messages for this page will no longer be manageable here.`)) return;
    await fb.disconnectPage(pageId);
}

async function handleRefresh(pageId: string) {
    refreshingId.value = pageId;
    await fb.refreshPage(pageId);
    refreshingId.value = null;
}
</script>

<template>
    <div class="pages-panel">
        <div class="panel-head">
            <div>
                <h3>Connected Pages</h3>
                <p class="sub">Manage every Facebook Page linked to this shop.</p>
            </div>
            <button class="btn-connect" @click="connecting = true">+ Connect Page</button>
        </div>

        <div class="empty" v-if="fb.pagesLoading && !fb.pages.length">
            <div class="empty-icon">⏳</div>
            <p>Loading pages...</p>
        </div>

        <div class="empty" v-else-if="fb.pagesError && !fb.pages.length">
            <div class="empty-icon">⚠️</div>
            <p>{{ fb.pagesError }}</p>
        </div>

        <div class="empty" v-else-if="!fb.pages.length">
            <div class="empty-icon">📘</div>
            <p>No Facebook pages connected yet.</p>
            <button class="btn-connect" @click="connecting = true">+ Connect your first page</button>
        </div>

        <div class="pages-grid" v-else>
            <div class="page-card" v-for="page in fb.pages" :key="page.pageId" :class="{ active: page.pageId === fb.activePageId }">
                <div class="page-top" @click="fb.setActivePage(page.pageId)">
                    <img v-if="page.picture" :src="page.picture" :alt="page.name" class="page-avatar" />
                    <div v-else class="page-avatar placeholder">📘</div>
                    <div class="page-info">
                        <div class="page-name">{{ page.name }}</div>
                        <div class="page-meta">
                            <span v-if="page.category">{{ page.category }}</span>
                            <span v-if="page.followers !== undefined">· {{ page.followers.toLocaleString() }} followers</span>
                        </div>
                    </div>
                    <span class="status-pill" :class="page.status">{{ page.status || "connected" }}</span>
                </div>

                <p class="page-about" v-if="page.about">{{ page.about }}</p>

                <div class="page-actions">
                    <button class="btn-select" v-if="page.pageId !== fb.activePageId" @click="fb.setActivePage(page.pageId)">
                        Use this page
                    </button>
                    <span class="in-use" v-else>✓ Active</span>
                    <button class="btn-refresh" :disabled="refreshingId === page.pageId" @click="handleRefresh(page.pageId)">
                        {{ refreshingId === page.pageId ? "Refreshing..." : "↻ Refresh" }}
                    </button>
                    <button class="btn-disconnect" @click="handleDisconnect(page.pageId, page.name)">Disconnect</button>
                </div>
            </div>
        </div>

        <ConnectPageModal
            v-if="connecting"
            :submitting="submitting"
            :error="fb.pagesError"
            @connect="handleConnect"
            @close="connecting = false"
        />
    </div>
</template>

<style scoped>
.pages-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.panel-head h3 {
    font-size: 16px;
}
.sub {
    font-size: 12px;
    color: var(--text-soft);
    margin-top: 2px;
}
.btn-connect {
    padding: 9px 16px;
    border-radius: 10px;
    background: var(--brand);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}
.btn-connect:hover {
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
    margin-bottom: 14px;
}

.pages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
}
.page-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.15s;
}
.page-card.active {
    border-color: var(--brand);
}
.page-top {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}
.page-avatar {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid var(--border);
    flex-shrink: 0;
}
.page-avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--brand-light);
    font-size: 20px;
}
.page-info {
    flex: 1;
    min-width: 0;
}
.page-name {
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.page-meta {
    font-size: 11px;
    color: var(--text-soft);
}
.status-pill {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 20px;
    background: #d1fae5;
    color: #065f46;
    white-space: nowrap;
}
.status-pill.expired,
.status-pill.error {
    background: #fee2e2;
    color: #991b1b;
}
.page-about {
    font-size: 12px;
    color: var(--text-soft);
    line-height: 1.4;
}
.page-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
}
.btn-select,
.btn-refresh {
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
}
.btn-select:hover,
.btn-refresh:hover:not(:disabled) {
    background: var(--brand-light);
    color: var(--brand);
    border-color: var(--brand);
}
.btn-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.in-use {
    font-size: 11px;
    font-weight: 700;
    color: var(--brand);
}
.btn-disconnect {
    margin-left: auto;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
}
.btn-disconnect:hover {
    background: #fecaca;
}
</style>
