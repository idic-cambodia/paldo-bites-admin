<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFacebookStore } from "@/stores/facebook";
import PagesPanel from "@/components/facebook/PagesPanel.vue";
import PostsPanel from "@/components/facebook/PostsPanel.vue";
import CommentsPanel from "@/components/facebook/CommentsPanel.vue";
import InboxPanel from "@/components/facebook/InboxPanel.vue";
import InsightsPanel from "@/components/facebook/InsightsPanel.vue";

const fb = useFacebookStore();

type Tab = "pages" | "posts" | "comments" | "inbox" | "insights";
const activeTab = ref<Tab>("pages");
const jumpToObjectId = ref<string | undefined>(undefined);

const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "pages", label: "Pages", icon: "📘" },
    { key: "posts", label: "Posts", icon: "📝" },
    { key: "comments", label: "Comments", icon: "💬" },
    { key: "inbox", label: "Inbox", icon: "✉️" },
    { key: "insights", label: "Insights", icon: "📊" }
];

const needsPage = computed(() => activeTab.value !== "pages" && !fb.activePageId);

function goToComments(postId: string) {
    jumpToObjectId.value = postId;
    activeTab.value = "comments";
}

onMounted(() => {
    fb.fetchPages();
});
</script>

<template>
    <div class="facebook-view">
        <div class="fb-head">
            <h2>Facebook</h2>

            <div class="page-switcher" v-if="fb.pages.length">
                <select :value="fb.activePageId" @change="fb.setActivePage(($event.target as HTMLSelectElement).value)">
                    <option v-for="page in fb.pages" :key="page.pageId" :value="page.pageId">{{ page.name }}</option>
                </select>
            </div>
        </div>

        <div class="tab-bar">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                class="tab-btn"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
            >
                {{ tab.icon }} {{ tab.label }}
            </button>
        </div>

        <div class="tab-content">
            <div class="needs-page" v-if="needsPage">
                <div class="empty-icon">📘</div>
                <p>Connect and select a Facebook page in the Pages tab to get started.</p>
                <button class="btn-go" @click="activeTab = 'pages'">Go to Pages</button>
            </div>

            <template v-else>
                <PagesPanel v-if="activeTab === 'pages'" />
                <PostsPanel v-else-if="activeTab === 'posts'" @view-comments="goToComments" />
                <CommentsPanel v-else-if="activeTab === 'comments'" :initial-object-id="jumpToObjectId" />
                <InboxPanel v-else-if="activeTab === 'inbox'" />
                <InsightsPanel v-else-if="activeTab === 'insights'" />
            </template>
        </div>
    </div>
</template>

<style scoped>
.facebook-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.fb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}
.fb-head h2 {
    font-size: 20px;
    color: var(--text);
}
.page-switcher select {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    background: var(--card);
    color: var(--text);
    min-width: 200px;
}

.tab-bar {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 10px;
    box-shadow: var(--shadow);
}
.tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-soft);
    transition: all 0.15s;
}
.tab-btn:hover {
    background: var(--bg);
    color: var(--text);
}
.tab-btn.active {
    background: var(--brand);
    color: #fff;
}

.tab-content {
    min-height: 200px;
}

.needs-page {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-soft);
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
}
.empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
}
.needs-page p {
    font-size: 14px;
    margin-bottom: 16px;
}
.btn-go {
    padding: 9px 20px;
    border-radius: 10px;
    background: var(--brand);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
}
.btn-go:hover {
    background: var(--brand-deep);
}
</style>
