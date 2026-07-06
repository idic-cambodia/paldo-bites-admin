<script setup lang="ts">
import { ref } from "vue";
import type { MenuCategory } from "@/types";

const emit = defineEmits<{
    (
        e: "save",
        payload: {
            name: string;
            price: number;
            category: MenuCategory;
            desc: string;
            available: boolean;
            minQty?: number;
            imageFile?: File;
        }
    ): void;
    (e: "close"): void;
}>();

const name = ref("");
const price = ref<number | null>(null);
const category = ref<MenuCategory>("Ulam");
const desc = ref("");
const available = ref(true);
const minQty = ref<number | null>(null);
const imageFile = ref<File | null>(null);
const imagePreview = ref("");
const imageName = ref("");

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

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
    });
}

function save() {
    if (!name.value.trim() || price.value === null || price.value <= 0) return;

    emit("save", {
        name: name.value.trim(),
        price: price.value,
        category: category.value,
        desc: desc.value.trim(),
        available: available.value,
        minQty: minQty.value && minQty.value > 0 ? minQty.value : undefined,
        imageFile: imageFile.value || undefined
    });
}
</script>

<template>
    <div class="overlay" @click.self="emit('close')">
        <div class="modal">
            <div class="modal-head">
                <h3>Add Menu Item</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </div>

            <div class="field">
                <label>Item name</label>
                <input v-model="name" type="text" placeholder="Item name" />
            </div>

            <div class="field two-col">
                <div>
                    <label>Price (USD)</label>
                    <div class="input-prefix-wrap">
                        <span class="prefix">$</span>
                        <input v-model.number="price" type="number" step="0.25" min="0" placeholder="0.00" />
                    </div>
                </div>
                <div>
                    <label>Category</label>
                    <select v-model="category">
                        <option value="Ulam">Ulam</option>
                        <option value="Merienda">Merienda</option>
                    </select>
                </div>
            </div>

            <div class="field">
                <label>Description</label>
                <textarea v-model="desc" rows="2" placeholder="Short description..."></textarea>
            </div>

            <div class="field">
                <label>Image</label>
                <input type="file" accept="image/*" @change="handleImageChange" />
                <div v-if="imagePreview" class="img-preview-wrap">
                    <img :src="imagePreview" alt="Menu preview" class="img-preview" />
                    <div class="img-meta">{{ imageName }}</div>
                </div>
            </div>

            <div class="field two-col">
                <div>
                    <label>Min Qty</label>
                    <input v-model.number="minQty" type="number" min="1" step="1" placeholder="Optional" />
                </div>
                <div>
                    <label>Status</label>
                    <select v-model="available">
                        <option :value="true">Available</option>
                        <option :value="false">Hidden</option>
                    </select>
                </div>
            </div>

            <div class="modal-foot">
                <button class="btn-cancel" @click="emit('close')">Cancel</button>
                <button class="btn-save" @click="save">Create Item</button>
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
    margin-bottom: 20px;
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
.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
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
.field textarea,
.field select {
    width: 100%;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: inherit;
    color: var(--text);
    transition: border-color 0.15s;
    outline: none;
    background: #fff;
}
.field input[type="file"] {
    margin-bottom: 10px;
    padding: 8px 12px;
}
.field input:focus,
.field textarea:focus,
.field select:focus {
    border-color: var(--brand);
}
.field textarea {
    resize: vertical;
}
.input-prefix-wrap {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.15s;
}
.input-prefix-wrap:focus-within {
    border-color: var(--brand);
}
.prefix {
    padding: 0 10px;
    font-weight: 700;
    color: var(--text-soft);
    background: #f5f0e8;
    align-self: stretch;
    display: flex;
    align-items: center;
    border-right: 1px solid var(--border);
}
.input-prefix-wrap input {
    border: none;
    border-radius: 0;
    flex: 1;
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
    background: #f8fafc;
}
.img-meta {
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-soft);
    word-break: break-all;
}

.modal-foot {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
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
.btn-save:hover {
    background: var(--brand-deep);
}

@media (max-width: 560px) {
    .two-col {
        grid-template-columns: 1fr;
    }
}
</style>
