<script setup lang="ts">
import { ref } from 'vue'

const shopName    = ref('Shawarma Best x Paldo Bites KH Order')
const location    = ref('Toul Pong Ro, Phnom Penh, Cambodia')
const phone       = ref('+855 XX XXX XXXX')
const email       = ref('paldobiteskh@gmail.com')
const openTime    = ref('11:00')
const grabEnabled = ref(true)
const pickupEnabled = ref(true)
const maxOrders   = ref(30)

const saved = ref(false)
function save() { saved.value = true; setTimeout(() => saved.value = false, 2500) }

const minOrderRules = [
  { name: 'Lumpiang Shanghai (per pc)', min: 5 },
  { name: 'BBQ per pc',                 min: 5 },
  { name: 'BBQ per pc (value)',          min: 5 },
]
</script>

<template>
  <div class="settings-view">

    <!-- Shop Info -->
    <section class="settings-card">
      <h3 class="card-title">🏪 Shop Information</h3>
      <div class="fields">
        <div class="field">
          <label>Shop name</label>
          <input v-model="shopName" type="text"/>
        </div>
        <div class="field">
          <label>Location</label>
          <input v-model="location" type="text"/>
        </div>
        <div class="field two-col">
          <div>
            <label>Phone</label>
            <input v-model="phone" type="tel"/>
          </div>
          <div>
            <label>Email</label>
            <input v-model="email" type="email"/>
          </div>
        </div>
      </div>
    </section>

    <!-- Operating Hours -->
    <section class="settings-card">
      <h3 class="card-title">🕐 Operating Hours</h3>
      <div class="fields">
        <div class="field two-col">
          <div>
            <label>Opens at</label>
            <input v-model="openTime" type="time" min="06:00" max="23:00"/>
          </div>
          <div>
            <label>Max orders per day</label>
            <input v-model.number="maxOrders" type="number" min="1" max="200"/>
          </div>
        </div>
        <div class="info-chip">
          ℹ️ Shop closes when sold out. Staff can close early from the dashboard.
        </div>
      </div>
    </section>

    <!-- Order Channels -->
    <section class="settings-card">
      <h3 class="card-title">🛵 Order Channels</h3>
      <div class="toggle-list">
        <div class="toggle-row">
          <div>
            <div class="toggle-name">Grab Delivery</div>
            <div class="toggle-desc">Accept orders placed via Grab app</div>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="grabEnabled"/>
            <span class="slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <div>
            <div class="toggle-name">Pick-up</div>
            <div class="toggle-desc">Customers can walk in or call ahead</div>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="pickupEnabled"/>
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </section>

    <!-- Min Order Rules -->
    <section class="settings-card">
      <h3 class="card-title">⚠️ Minimum Order Rules</h3>
      <p class="card-desc">Items that require a minimum quantity per order.</p>
      <table class="rules-table">
        <thead><tr><th>Item</th><th>Min. Qty</th></tr></thead>
        <tbody>
          <tr v-for="rule in minOrderRules" :key="rule.name">
            <td>{{ rule.name }}</td>
            <td><span class="min-badge">{{ rule.min }} pcs</span></td>
          </tr>
        </tbody>
      </table>
      <p class="rules-note">To change these, update the menu item data in <code>src/data/mockData.ts</code>.</p>
    </section>

    <!-- Save -->
    <div class="save-row">
      <Transition name="saved">
        <span class="saved-msg" v-if="saved">✅ Settings saved!</span>
      </Transition>
      <button class="btn-save" @click="save">Save settings</button>
    </div>

  </div>
</template>

<style scoped>
.settings-view { display: flex; flex-direction: column; gap: 20px; max-width: 720px; }

.settings-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 24px; box-shadow: var(--shadow); }
.card-title { font-size: 16px; margin-bottom: 18px; }
.card-desc  { font-size: 13px; color: var(--text-soft); margin-bottom: 14px; margin-top: -12px; }

.fields { display: flex; flex-direction: column; gap: 14px; }
.field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-soft); margin-bottom: 6px; }
.field input {
  width: 100%; border: 1.5px solid var(--border); border-radius: 8px;
  padding: 10px 12px; font-size: 14px; font-family: inherit; color: var(--text);
  transition: border-color .15s; outline: none; background: #fff;
}
.field input:focus { border-color: var(--brand); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.info-chip { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #1e40af; }

/* Toggle */
.toggle-list { display: flex; flex-direction: column; gap: 16px; }
.toggle-row  { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.toggle-name { font-weight: 600; font-size: 14px; }
.toggle-desc { font-size: 12px; color: var(--text-soft); margin-top: 2px; }
.toggle { display: flex; align-items: center; cursor: pointer; }
.toggle input { display: none; }
.slider { width: 44px; height: 24px; border-radius: 12px; background: #d1d5db; position: relative; transition: background .2s; flex-shrink: 0; }
.slider::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
.toggle input:checked ~ .slider { background: var(--grab); }
.toggle input:checked ~ .slider::after { transform: translateX(20px); }

/* Rules table */
.rules-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 10px; }
.rules-table th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-soft); padding: 8px 12px; border-bottom: 1px solid var(--border); }
.rules-table td { padding: 10px 12px; border-bottom: 1px solid #f5f0e8; }
.min-badge { background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
.rules-note { font-size: 12px; color: var(--text-soft); }
.rules-note code { background: #f3f4f6; padding: 1px 6px; border-radius: 4px; font-size: 11px; }

/* Save */
.save-row { display: flex; align-items: center; justify-content: flex-end; gap: 16px; }
.btn-save { background: var(--brand); color: #fff; padding: 11px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; transition: background .15s; }
.btn-save:hover { background: var(--brand-deep); }
.saved-msg { font-size: 14px; font-weight: 600; color: var(--grab); }
.saved-enter-active, .saved-leave-active { transition: opacity .3s; }
.saved-enter-from, .saved-leave-to { opacity: 0; }

@media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }
</style>
