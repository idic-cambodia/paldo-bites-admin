<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useFacebookStore } from "@/stores/facebook";
import PostComposerModal from "./PostComposerModal.vue";

const emit = defineEmits<{ (e: "view-comments", postId: string): void }>();

const fb = useFacebookStore();
const composing = ref(false);
const publishing = ref(false);

async function refresh() {
    if (fb.activePageId) await fb.fetchPosts({ reset: true });
}

async function handlePublish(payload: { message: string; link?: string; imageBase64?: string }) {
    publishing.value = true;
    const ok = await fb.createPost(payload);
    publishing.value = false;
    if (ok) composing.value = false;
}

async function handleDelete(postId: string) {
    if (!window.confirm("Delete this post from Facebook? This cannot be undone.")) return;
    await fb.deletePost(postId);
}

function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
}

onMounted(refresh);
watch(() => fb.activePageId, refresh);
</script>

<template>
    <div class="posts-panel">
        <div class="panel-head">
            <div>
                <h3>Posts</h3>
                <p class="sub">{{ fb.activePage?.name || "Select a page" }}</p>
            </div>
            <button class="btn-new" :disabled="!fb.activePageId" @click="composing = true">+ New Post</button>
        </div>

        <div class="empty" v-if="!fb.activePageId">
            <div class="empty-icon">📘</div>
            <p>Connect and select a page to see its posts.</p>
        </div>

        <div class="empty" v-else-if="fb.postsLoading && !fb.posts.length">
            <div class="empty-icon">⏳</div>
            <p>Loading posts...</p>
        </div>

        <div class="empty" v-else-if="fb.postsError && !fb.posts.length">
            <div class="empty-icon">⚠️</div>
            <p>{{ fb.postsError }}</p>
        </div>

        <div class="empty" v-else-if="!fb.posts.length">
            <div class="empty-icon">📝</div>
            <p>No posts yet on this page.</p>
        </div>

        <div class="posts-list" v-else>
            <article class="post-card" v-for="post in fb.posts" :key="post.id">
                <img v-if="post.imageUrl" :src="post.imageUrl" :alt="post.message" class="post-img" />
                <div class="post-body">
                    <p class="post-message">{{ post.message }}</p>
                    <a v-if="post.link" :href="post.link" target="_blank" rel="noopener" class="post-link">{{ post.link }}</a>
                    <div class="post-meta">
                        <span>{{ timeAgo(post.createdAt) }}</span>
                        <span>❤️ {{ post.likeCount ?? 0 }}</span>
                        <span>💬 {{ post.commentCount ?? 0 }}</span>
                        <span>🔁 {{ post.shareCount ?? 0 }}</span>
                    </div>
                    <div class="post-actions">
                        <a v-if="post.permalinkUrl" :href="post.permalinkUrl" target="_blank" rel="noopener" class="btn-view">
                            View on Facebook ↗
                        </a>
                        <button class="btn-comments" @click="emit('view-comments', post.id)">💬 Comments</button>
                        <button class="btn-delete" @click="handleDelete(post.id)">🗑 Delete</button>
                    </div>
                </div>
            </article>

            <button class="btn-more" v-if="fb.postsHasMore" :disabled="fb.postsLoading" @click="fb.fetchPosts()">
                {{ fb.postsLoading ? "Loading..." : "Load more" }}
            </button>
        </div>

        <PostComposerModal
            v-if="composing"
            :submitting="publishing"
            :error="fb.postsError"
            @publish="handlePublish"
            @close="composing = false"
        />
    </div>
</template>

<style scoped>
.posts-panel {
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
.btn-new {
    padding: 9px 16px;
    border-radius: 10px;
    background: var(--brand);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}
.btn-new:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.btn-new:hover:not(:disabled) {
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

.posts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.post-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
}
.post-img {
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    display: block;
}
.post-body {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.post-message {
    font-size: 14px;
    color: var(--text);
    white-space: pre-wrap;
    line-height: 1.5;
}
.post-link {
    font-size: 12px;
    color: #2563eb;
    text-decoration: underline;
    word-break: break-all;
}
.post-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--text-soft);
}
.post-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
}
.btn-view {
    font-size: 12px;
    font-weight: 600;
    color: var(--brand);
}
.btn-comments {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
}
.btn-comments:hover {
    background: var(--brand-light);
    color: var(--brand);
    border-color: var(--brand);
}
.btn-delete {
    margin-left: auto;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
}
.btn-delete:hover {
    background: #fecaca;
}
.btn-more {
    align-self: center;
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--text);
}
.btn-more:hover:not(:disabled) {
    background: var(--bg);
}
.btn-more:disabled {
    opacity: 0.6;
}
</style>
