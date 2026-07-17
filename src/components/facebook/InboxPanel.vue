<script setup lang="ts">
import { nextTick, ref, onMounted, watch } from "vue";
import { useFacebookStore } from "@/stores/facebook";

const fb = useFacebookStore();
const draft = ref("");
const sending = ref(false);
const composingNew = ref(false);
const newRecipientId = ref("");
const newMessage = ref("");
const sendingNew = ref(false);
const threadMessagesEl = ref<HTMLElement | null>(null);

async function refresh() {
    if (fb.activePageId) await fb.fetchInbox({ reset: true });
}

function participantName(convo: (typeof fb.conversations)[number]) {
    return convo.participants.map((p) => p.name).join(", ") || "Unknown";
}

async function openConvo(id: string) {
    draft.value = "";
    await fb.openConversation(id);
    await nextTick();
    scrollThreadToBottom();
}

async function sendReply() {
    if (!draft.value.trim()) return;
    sending.value = true;
    const ok = await fb.replyConversation(draft.value.trim());
    sending.value = false;
    if (ok) draft.value = "";
}

async function sendNew() {
    if (!newRecipientId.value.trim() || !newMessage.value.trim()) return;
    sendingNew.value = true;
    const ok = await fb.sendNewMessage(newRecipientId.value.trim(), newMessage.value.trim());
    sendingNew.value = false;
    if (ok) {
        composingNew.value = false;
        newRecipientId.value = "";
        newMessage.value = "";
    }
}

function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
}

function scrollThreadToBottom() {
    const el = threadMessagesEl.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
}

watch(
    () => [fb.activeConversationId, fb.messages.length],
    async () => {
        await nextTick();
        scrollThreadToBottom();
    }
);

onMounted(refresh);
watch(() => fb.activePageId, refresh);
</script>

<template>
    <div class="inbox-panel">
        <div class="panel-head">
            <div>
                <h3>Inbox</h3>
                <p class="sub">{{ fb.activePage?.name || "Select a page" }}</p>
            </div>
            <button class="btn-new" :disabled="!fb.activePageId" @click="composingNew = true">✎ New Message</button>
        </div>

        <div class="empty" v-if="!fb.activePageId">
            <div class="empty-icon">📘</div>
            <p>Select a page first.</p>
        </div>

        <div class="inbox-layout" v-else>
            <!-- conversation list -->
            <div class="convo-list">
                <div class="empty small" v-if="fb.inboxLoading && !fb.conversations.length">
                    <p>Loading...</p>
                </div>
                <div class="empty small" v-else-if="fb.inboxError && !fb.conversations.length">
                    <p>{{ fb.inboxError }}</p>
                </div>
                <div class="empty small" v-else-if="!fb.conversations.length">
                    <p>No conversations yet.</p>
                </div>

                <button
                    v-for="convo in fb.conversations"
                    :key="convo.id"
                    class="convo-item"
                    :class="{ active: convo.id === fb.activeConversationId }"
                    @click="openConvo(convo.id)"
                >
                    <div class="convo-name">{{ participantName(convo) }}</div>
                    <div class="convo-snippet">{{ convo.snippet }}</div>
                    <div class="convo-bottom">
                        <span class="convo-time">{{ timeAgo(convo.updatedAt) }}</span>
                        <span class="unread-badge" v-if="convo.unreadCount">{{ convo.unreadCount }}</span>
                    </div>
                </button>

                <button class="btn-more" v-if="fb.inboxHasMore" :disabled="fb.inboxLoading" @click="fb.fetchInbox()">
                    {{ fb.inboxLoading ? "Loading..." : "Load more" }}
                </button>
            </div>

            <!-- thread -->
            <div class="thread">
                <div class="empty" v-if="!fb.activeConversationId">
                    <div class="empty-icon">💬</div>
                    <p>Select a conversation to view messages.</p>
                </div>

                <template v-else>
                    <div class="thread-messages" ref="threadMessagesEl">
                        <div class="empty small" v-if="fb.messagesLoading && !fb.messages.length">
                            <p>Loading messages...</p>
                        </div>
                        <button class="btn-more subtle" v-if="fb.messagesHasMore" :disabled="fb.messagesLoading" @click="fb.fetchMessages()">
                            {{ fb.messagesLoading ? "Loading..." : "Load earlier messages" }}
                        </button>

                        <div class="message-bubble" v-for="msg in fb.messages" :key="msg.id" :class="{ outgoing: msg.fromId === fb.activePageId }">
                            <div class="bubble-author">{{ msg.fromName }}</div>
                            <div class="bubble-text" v-if="msg.message">{{ msg.message }}</div>
                            <div class="bubble-attachments" v-if="msg.attachments?.length">
                                <a
                                    v-for="attachment in msg.attachments"
                                    :key="attachment.id"
                                    class="attachment-card"
                                    :href="attachment.image?.url || attachment.image?.previewUrl || '#'"
                                    target="_blank"
                                    rel="noreferrer"
                                    :class="{ image: Boolean(attachment.image?.previewUrl || attachment.image?.url) }"
                                >
                                    <img
                                        v-if="attachment.image?.previewUrl || attachment.image?.url"
                                        :src="attachment.image?.previewUrl || attachment.image?.url"
                                        :alt="attachment.name || 'Attachment preview'"
                                    />
                                    <div class="attachment-meta">
                                        <span class="attachment-label">Attachment</span>
                                        <span class="attachment-name">{{ attachment.name || attachment.mimeType || "Open file" }}</span>
                                    </div>
                                </a>
                            </div>
                            <div class="bubble-time">{{ timeAgo(msg.createdAt) }}</div>
                        </div>
                    </div>

                    <div class="thread-composer">
                        <input v-model="draft" type="text" placeholder="Type a reply..." @keyup.enter="sendReply" />
                        <button class="btn-send" :disabled="sending || !draft.trim()" @click="sendReply">
                            {{ sending ? "Sending..." : "Send" }}
                        </button>
                    </div>
                </template>
            </div>
        </div>

        <!-- new message modal -->
        <div class="overlay" v-if="composingNew" @click.self="composingNew = false">
            <div class="modal">
                <div class="modal-head">
                    <h3>New Message</h3>
                    <button class="close-btn" @click="composingNew = false">×</button>
                </div>
                <div class="field">
                    <label>Recipient PSID</label>
                    <input v-model="newRecipientId" type="text" placeholder="Facebook user ID / PSID" />
                </div>
                <div class="field">
                    <label>Message</label>
                    <textarea v-model="newMessage" rows="3" placeholder="Type your message..."></textarea>
                </div>
                <div class="modal-foot">
                    <button class="btn-cancel" @click="composingNew = false">Cancel</button>
                    <button class="btn-save" :disabled="sendingNew" @click="sendNew">
                        {{ sendingNew ? "Sending..." : "Send" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.inbox-panel {
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
.empty.small {
    padding: 20px 10px;
}
.empty-icon {
    font-size: 34px;
    margin-bottom: 10px;
}
.empty p {
    font-size: 13px;
}

.inbox-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 14px;
    min-height: 420px;
}
.convo-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 10px;
    overflow-y: auto;
    max-height: 560px;
}
.convo-item {
    text-align: left;
    padding: 10px 12px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    transition: background 0.15s;
}
.convo-item:hover {
    background: var(--bg);
}
.convo-item.active {
    background: var(--brand-light);
}
.convo-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
}
.convo-snippet {
    font-size: 12px;
    color: var(--text-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.convo-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
}
.convo-time {
    font-size: 10px;
    color: var(--text-soft);
}
.unread-badge {
    background: var(--brand);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 20px;
    padding: 1px 7px;
}

.thread {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.thread-messages {
    flex: 1;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    max-height: 480px;
}
.message-bubble {
    align-self: flex-start;
    max-width: 70%;
    background: linear-gradient(180deg, #f7fafc 0%, #eef4ff 100%);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 16px;
    padding: 10px 12px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
}
.message-bubble.outgoing {
    align-self: flex-end;
    background: linear-gradient(180deg, rgba(79, 70, 229, 0.12) 0%, rgba(79, 70, 229, 0.08) 100%);
    border-color: rgba(79, 70, 229, 0.14);
}
.bubble-author {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-soft);
    margin-bottom: 2px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.bubble-text {
    font-size: 13px;
    color: var(--text);
    white-space: pre-wrap;
    line-height: 1.45;
}
.bubble-attachments {
    display: grid;
    gap: 8px;
    margin-top: 8px;
}
.attachment-card {
    display: grid;
    gap: 8px;
    padding: 8px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.18);
    color: inherit;
}
.attachment-card.image img {
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    border-radius: 10px;
    display: block;
}
.attachment-meta {
    display: grid;
    gap: 2px;
}
.attachment-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-soft);
}
.attachment-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.bubble-time {
    font-size: 10px;
    color: var(--text-soft);
    margin-top: 4px;
    text-align: right;
}
.thread-composer {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--border);
}
.thread-composer input {
    flex: 1;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 13px;
}
.btn-send {
    padding: 9px 18px;
    border-radius: 8px;
    background: var(--brand);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
}
.btn-send:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.btn-send:hover:not(:disabled) {
    background: var(--brand-deep);
}

.btn-more {
    padding: 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
}
.btn-more.subtle {
    align-self: center;
    margin-bottom: 6px;
}
.btn-more:disabled {
    opacity: 0.6;
}

@media (max-width: 900px) {
    .inbox-layout {
        grid-template-columns: 1fr;
    }
}

/* new message modal */
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.modal {
    background: #fff;
    border-radius: 16px;
    width: 100%;
    max-width: 420px;
    padding: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}
.modal-head h3 {
    font-size: 18px;
}
.close-btn {
    font-size: 22px;
    color: var(--text-soft);
    padding: 4px;
}
.field {
    margin-bottom: 14px;
}
.field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-soft);
    margin-bottom: 6px;
}
.field input,
.field textarea {
    width: 100%;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    background: #fff;
}
.field input:focus,
.field textarea:focus {
    border-color: var(--brand);
}
.modal-foot {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 8px;
}
.btn-cancel {
    padding: 9px 18px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-soft);
    background: #f3f4f6;
}
.btn-save {
    padding: 9px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    background: var(--brand);
    color: #fff;
}
.btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
