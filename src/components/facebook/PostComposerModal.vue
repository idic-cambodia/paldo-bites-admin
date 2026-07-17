<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{ submitting?: boolean; error?: string }>();
const emit = defineEmits<{
    (e: "publish", payload: { message: string; link?: string; imageBase64?: string }): void;
    (e: "close"): void;
}>();

type Mode = "link" | "image";
const mode = ref<Mode>("link");
const message = ref("");
const link = ref("");
const imageFile = ref<File | null>(null);
const imagePreview = ref("");
const imageName = ref("");

const canSubmit = computed(() => message.value.trim().length > 0 && !props.submitting);

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
    });
}

async function handleImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
        imageFile.value = null;
        imagePreview.value = "";
        imageName.value = "";
        return;
    }
    imageFile.value = file;
    imageName.value = file.name;
    imagePreview.value = await fileToDataUrl(file);
}

function submit() {
    if (!canSubmit.value) return;
    const payload: { message: string; link?: string; imageBase64?: string } = { message: message.value.trim() };
    if (mode.value === "link" && link.value.trim()) payload.link = link.value.trim();
    if (mode.value === "image" && imagePreview.value) payload.imageBase64 = imagePreview.value;
    emit("publish", payload);
}
</script>

<template>
    <div class="overlay" @click.self="emit('close')">
        <div class="modal">
            <div class="modal-head">
                <h3>New Post</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </div>

            <div class="field">
                <label>Message</label>
                <textarea v-model="message" rows="4" placeholder="What's happening at the shop today?"></textarea>
            </div>

            <div class="mode-tabs">
                <button class="mode-btn" :class="{ active: mode === 'link' }" @click="mode = 'link'">🔗 Link</button>
                <button class="mode-btn" :class="{ active: mode === 'image' }" @click="mode = 'image'">🖼️ Image</button>
            </div>

            <div class="field" v-if="mode === 'link'">
                <label>Link (optional)</label>
                <input v-model="link" type="text" placeholder="https://..." />
            </div>

            <div class="field" v-else>
                <label>Image</label>
                <input type="file" accept="image/*" @change="handleImageChange" />
                <div v-if="imagePreview" class="img-preview-wrap">
                    <img :src="imagePreview" alt="Post preview" class="img-preview" />
                    <div class="img-meta">{{ imageName }}</div>
                </div>
            </div>

            <p v-if="error" class="error-text">{{ error }}</p>

            <div class="modal-foot">
                <button class="btn-cancel" @click="emit('close')">Cancel</button>
                <button class="btn-save" :disabled="!canSubmit" @click="submit">
                    {{ submitting ? "Publishing..." : "Publish" }}
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
    max-width: 520px;
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
    color: var(--text);
    outline: none;
    background: #fff;
    resize: vertical;
}
.field input:focus,
.field textarea:focus {
    border-color: var(--brand);
}
.mode-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 14px;
}
.mode-btn {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-soft);
}
.mode-btn.active {
    background: var(--brand-light);
    color: var(--brand);
    border-color: var(--brand);
}
.img-preview-wrap {
    margin-top: 8px;
}
.img-preview {
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid var(--border);
}
.img-meta {
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-soft);
    word-break: break-all;
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
