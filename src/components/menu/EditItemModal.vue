<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MenuItem } from '@/types'

const props = defineProps<{ item: MenuItem }>()
const emit  = defineEmits<{
  (e: 'save',  patch: { name: string; price: number; desc: string }): void
  (e: 'close'): void
}>()

const name  = ref(props.item.name)
const price = ref(props.item.price)
const desc  = ref(props.item.desc)

watch(() => props.item, (i) => { name.value = i.name; price.value = i.price; desc.value = i.desc })

function save() {
  if (!name.value.trim() || price.value <= 0) return
  emit('save', { name: name.value.trim(), price: price.value, desc: desc.value.trim() })
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <h3>Edit Item</h3>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="field">
        <label>Item name</label>
        <input v-model="name" type="text" placeholder="Item name"/>
      </div>
      <div class="field">
        <label>Price (USD)</label>
        <div class="input-prefix-wrap">
          <span class="prefix">$</span>
          <input v-model.number="price" type="number" step="0.25" min="0" placeholder="0.00"/>
        </div>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea v-model="desc" rows="2" placeholder="Short description…"></textarea>
      </div>

      <div class="modal-foot">
        <button class="btn-cancel" @click="emit('close')">Cancel</button>
        <button class="btn-save"   @click="save">Save changes</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { background: #fff; border-radius: 16px; width: 100%; max-width: 420px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-head h3 { font-size: 18px; }
.close-btn { font-size: 22px; color: var(--text-soft); padding: 4px; }

.field { margin-bottom: 14px; }
.field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-soft); margin-bottom: 6px; }
.field input, .field textarea {
  width: 100%; border: 1.5px solid var(--border); border-radius: 8px;
  padding: 10px 12px; font-size: 14px; font-family: inherit; color: var(--text);
  transition: border-color .15s; outline: none; background: #fff;
}
.field input:focus, .field textarea:focus { border-color: var(--brand); }
.field textarea { resize: vertical; }
.input-prefix-wrap { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; transition: border-color .15s; }
.input-prefix-wrap:focus-within { border-color: var(--brand); }
.prefix { padding: 0 10px; font-weight: 700; color: var(--text-soft); background: #f5f0e8; align-self: stretch; display: flex; align-items: center; border-right: 1px solid var(--border); }
.input-prefix-wrap input { border: none; border-radius: 0; flex: 1; }

.modal-foot { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel { padding: 9px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; color: var(--text-soft); background: #f3f4f6; }
.btn-save   { padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; background: var(--brand); color: #fff; }
.btn-save:hover { background: var(--brand-deep); }
</style>
