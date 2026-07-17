<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useFacebookStore } from "@/stores/facebook";

const props = defineProps<{ initialObjectId?: string }>();
const fb = useFacebookStore();

const objectId = ref(props.initialObjectId || "");
const replyDrafts = ref<Record<string, string>>({});
const replyingId = ref<string | null>(null);

async function loadFor(id: string) {
    if (!id || !fb.activePageId) return;
    await fb.fetchComments(id, { reset: true });
}

function loadInput() {
    if (objectId.value.trim()) loadFor(objectId.value.trim());
}

async function sendReply(commentId: string) {
    const message = (replyDrafts.value[commentId] || "").trim();
    if (!message) return;
    replyingId.value = commentId;
    const ok = await fb.replyComment(commentId, message);
    replyingId.value = null;
    if (ok) replyDrafts.value[commentId] = "";
}

async function toggleHide(commentId: string, current?: boolean) {
    await fb.setCommentHidden(commentId, !current);
}

async function remove(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    await fb.deleteComment(commentId);
}

function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
}

watch(
    () => props.initialObjectId,
    (id) => {
        if (id) {
            objectId.value = id;
            loadFor(id);
        }
    }
);

onMounted(() => {
    if (objectId.value) loadFor(objectId.value);
});
</script>

<template>
    <div class="comments-panel">
        <div class="panel-head">
            <div>
                <h3>Comments</h3>
                <p class="sub">Moderate comments on a post — paste a Post ID or jump here from the Posts tab.</p>
            </div>
        </div>

        <div class="object-picker">
            <input v-model="objectId" type="text" placeholder="Post or object ID" @keyup.enter="loadInput" />
            <button class="btn-load" :disabled="!objectId.trim() || !fb.activePageId" @click="loadInput">Load comments</button>
        </div>

        <div class="empty" v-if="!fb.activePageId">
            <div class="empty-icon">📘</div>
            <p>Select a page first.</p>
        </div>

        <div class="empty" v-else-if="!objectId">
            <div class="empty-icon">💬</div>
            <p>Enter a post ID above, or click "Comments" on a post in the Posts tab.</p>
        </div>

        <div class="empty" v-else-if="fb.commentsLoading && !fb.comments.length">
            <div class="empty-icon">⏳</div>
            <p>Loading comments...</p>
        </div>

        <div class="empty" v-else-if="fb.commentsError && !fb.comments.length">
            <div class="empty-icon">⚠️</div>
            <p>{{ fb.commentsError }}</p>
        </div>

        <div class="empty" v-else-if="!fb.comments.length">
            <div class="empty-icon">🗨️</div>
            <p>No comments on this post yet.</p>
        </div>

        <div class="comments-list" v-else>
            <div class="comment-card" v-for="comment in fb.comments" :key="comment.id" :class="{ hidden: comment.hidden }">
                <img v-if="comment.from.picture" :src="comment.from.picture" class="avatar" :alt="comment.from.name" />
                <div v-else class="avatar placeholder">{{ comment.from.name.slice(0, 1).toUpperCase() }}</div>

                <div class="comment-body">
                    <div class="comment-top">
                        <span class="author">{{ comment.from.name }}</span>
                        <span class="time">{{ timeAgo(comment.createdAt) }}</span>
                        <span v-if="comment.hidden" class="hidden-tag">Hidden</span>
                    </div>
                    <p class="text">{{ comment.message }}</p>
                    <div class="comment-actions">
                        <span class="likes">❤️ {{ comment.likeCount ?? 0 }}</span>
                        <button class="btn-hide" @click="toggleHide(comment.id, comment.hidden)">
                            {{ comment.hidden ? "Unhide" : "Hide" }}
                        </button>
                        <button class="btn-delete" @click="remove(comment.id)">Delete</button>
                    </div>

                    <div class="reply-row" v-if="comment.canReply !== false">
                        <input
                            v-model="replyDrafts[comment.id]"
                            type="text"
                            placeholder="Write a reply..."
                            @keyup.enter="sendReply(comment.id)"
                        />
                        <button class="btn-reply" :disabled="replyingId === comment.id" @click="sendReply(comment.id)">
                            {{ replyingId === comment.id ? "Sending..." : "Reply" }}
                        </button>
                    </div>
                </div>
            </div>

            <button class="btn-more" v-if="fb.commentsHasMore" :disabled="fb.commentsLoading" @click="fb.fetchComments(objectId)">
                {{ fb.commentsLoading ? "Loading..." : "Load more" }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.comments-panel {
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
.object-picker {
    display: flex;
    gap: 8px;
}
.object-picker input {
    flex: 1;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 13px;
}
.btn-load {
    padding: 9px 16px;
    border-radius: 8px;
    background: var(--brand);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}
.btn-load:disabled {
    opacity: 0.5;
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

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.comment-card {
    display: flex;
    gap: 10px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 14px;
    box-shadow: var(--shadow);
}
.comment-card.hidden {
    opacity: 0.55;
}
.avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}
.avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--brand-light);
    color: var(--brand);
    font-weight: 700;
    font-size: 13px;
}
.comment-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.comment-top {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}
.author {
    font-weight: 700;
    color: var(--text);
}
.time {
    color: var(--text-soft);
}
.hidden-tag {
    background: #fee2e2;
    color: #991b1b;
    padding: 1px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
}
.text {
    font-size: 13px;
    color: var(--text);
    line-height: 1.4;
}
.comment-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
.likes {
    font-size: 11px;
    color: var(--text-soft);
}
.btn-hide,
.btn-delete {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
}
.btn-delete {
    background: #fee2e2;
    color: #991b1b;
    border-color: #fecaca;
}
.btn-hide:hover {
    background: var(--brand-light);
    color: var(--brand);
    border-color: var(--brand);
}
.btn-delete:hover {
    background: #fecaca;
}
.reply-row {
    display: flex;
    gap: 6px;
    margin-top: 2px;
}
.reply-row input {
    flex: 1;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
}
.btn-reply {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    background: var(--brand);
    color: #fff;
}
.btn-reply:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
