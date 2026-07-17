<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
    (e: "connect", payload: { userAccessToken: string; pageId: string }): void;
    (e: "close"): void;
}>();

defineProps<{ submitting?: boolean; error?: string }>();

const userAccessToken = ref("");
const pageId = ref("");

function submit() {
    if (!userAccessToken.value.trim() || !pageId.value.trim()) return;
    emit("connect", { userAccessToken: userAccessToken.value.trim(), pageId: pageId.value.trim() });
}
</script>

<template>
    <div class="overlay" @click.self="emit('close')">
        <div class="modal">
            <div class="modal-head">
                <h3>Connect Facebook Page</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </div>

            <p class="helper">
                Paste the Page ID and a User Access Token with <code>pages_manage_posts</code>,
                <code>pages_read_engagement</code> and <code>pages_messaging</code> permissions. You can generate one
                from the Meta Graph API Explorer or your app's OAuth flow.
            </p>

            <div class="field">
                <label>Page ID</label>
                <input v-model="pageId" type="text" placeholder="e.g. 102938475610293" />
            </div>

            <div class="field">
                <label>User Access Token</label>
                <textarea v-model="userAccessToken" rows="3" placeholder="EAAB...."></textarea>
            </div>

            <p v-if="error" class="error-text">{{ error }}</p>

            <div class="modal-foot">
                <button class="btn-cancel" @click="emit('close')">Cancel</button>
                <button class="btn-save" :disabled="submitting" @click="submit">
                    {{ submitting ? "Connecting..." : "Connect Page" }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    max-width: 480px;
    padding: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.modal-head h3 {
    font-size: 18px;
}
.close-btn {
    font-size: 22px;
    color: var(--text-soft);
    padding: 4px;
}
.helper {
    font-size: 12px;
    color: var(--text-soft);
    line-height: 1.5;
    margin-bottom: 18px;
}
.helper code {
    background: #f3f4f6;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 11px;
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
    font-size: 13px;
    font-family: inherit;
    color: var(--text);
    outline: none;
    background: #fff;
    resize: vertical;
}
.field input:focus,
.field textarea:focus {
    border-color: var(--brand);
}
.error-text {
    font-size: 12px;
    color: #b91c1c;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 10px;
    margin-bottom: 4px;
}
.modal-foot {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 18px;
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
.btn-save:hover:not(:disabled) {
    background: var(--brand-deep);
}
</style>
