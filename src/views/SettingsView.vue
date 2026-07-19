<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const SETTINGS_ENDPOINT = "/api/admin/settings";

type SettingsResponse = {
    status?: number;
    msg?: string;
    success?: boolean;
    message?: string;
    data?: {
        _id?: string;
        shopName?: string;
        location?: string;
        phone?: string;
        email?: string;
        openTime?: string;
        maxOrdersPerDay?: number;
        grabEnabled?: boolean;
        pickupEnabled?: boolean;
        isOpen?: boolean;
        telegram?: string;
        telegramSupport?: string;
        facebook?: string;
        payment_link?: string;
        payment_qr?: string;
    };
};

const auth = useAuthStore();

const shopName = ref("");
const location = ref("");
const phone = ref("");
const email = ref("");
const openTime = ref("11:00");
const grabEnabled = ref(true);
const pickupEnabled = ref(true);
const maxOrders = ref(50);
const telegram = ref("");
const telegramSupport = ref("");
const facebook = ref("");
const paymentLink = ref("");
const paymentQr = ref("");
const paymentQrFile = ref<File | null>(null);
const paymentQrPreview = ref("");
const isOpen = ref(true);

const loading = ref(false);
const saving = ref(false);
const error = ref("");

const saved = ref(false);
async function save() {
    if (!auth.token) {
        error.value = "Not authenticated.";
        return;
    }

    const authorization = auth.token.startsWith("Bearer ") ? auth.token : `Bearer ${auth.token}`;
    const payload = new FormData();
    payload.append("shopName", shopName.value.trim());
    payload.append("location", location.value.trim());
    payload.append("phone", phone.value.trim());
    payload.append("email", email.value.trim());
    payload.append("openTime", openTime.value);
    payload.append("maxOrdersPerDay", String(Number(maxOrders.value || 0)));
    payload.append("grabEnabled", String(grabEnabled.value));
    payload.append("pickupEnabled", String(pickupEnabled.value));
    payload.append("telegram", telegram.value.trim());
    payload.append("telegramSupport", telegramSupport.value.trim());
    payload.append("facebook", facebook.value.trim());
    payload.append("payment_link", paymentLink.value.trim());
    payload.append("isOpen", String(isOpen.value));
    if (paymentQrFile.value) payload.append("payment_qr", paymentQrFile.value);

    saving.value = true;
    error.value = "";
    try {
        const response = await fetch(SETTINGS_ENDPOINT, {
            method: "PATCH",
            headers: {
                Authorization: authorization
            },
            body: payload
        });

        const body = (await response.json().catch(() => ({}))) as SettingsResponse;
        if (!response.ok || body.success === false) {
            throw new Error(body.msg || body.message || "Failed to update settings.");
        }

        saved.value = true;
        setTimeout(() => (saved.value = false), 2500);
    } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to update settings.";
    } finally {
        saving.value = false;
    }
}

const minOrderRules = [
    { name: "Lumpiang Shanghai (per pc)", min: 5 },
    { name: "BBQ per pc", min: 5 },
    { name: "BBQ per pc (value)", min: 5 }
];

async function fetchSettings() {
    if (!auth.token) {
        error.value = "Not authenticated.";
        return;
    }

    const authorization = auth.token.startsWith("Bearer ") ? auth.token : `Bearer ${auth.token}`;

    loading.value = true;
    error.value = "";
    try {
        const response = await fetch(SETTINGS_ENDPOINT, {
            method: "GET",
            headers: { Authorization: authorization }
        });

        const body = (await response.json().catch(() => ({}))) as SettingsResponse;
        if (!response.ok || body.success === false || !body.data) {
            throw new Error(body.msg || body.message || "Failed to load settings.");
        }

        shopName.value = body.data.shopName || "";
        location.value = body.data.location || "";
        phone.value = body.data.phone || "";
        email.value = body.data.email || "";
        openTime.value = body.data.openTime || "11:00";
        maxOrders.value = Number(body.data.maxOrdersPerDay ?? 50);
        grabEnabled.value = Boolean(body.data.grabEnabled);
        pickupEnabled.value = Boolean(body.data.pickupEnabled);
        telegram.value = body.data.telegram || "";
        telegramSupport.value = body.data.telegramSupport || "";
        facebook.value = body.data.facebook || "";
        paymentLink.value = body.data.payment_link || "";
        paymentQr.value = body.data.payment_qr || "";
        paymentQrPreview.value = body.data.payment_qr || "";
        isOpen.value = Boolean(body.data.isOpen ?? true);
    } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to load settings.";
    } finally {
        loading.value = false;
    }
}

function selectPaymentQr(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    if (paymentQrPreview.value.startsWith("blob:")) URL.revokeObjectURL(paymentQrPreview.value);
    paymentQrFile.value = file;
    paymentQrPreview.value = URL.createObjectURL(file);
}

onMounted(() => {
    fetchSettings();
});

onUnmounted(() => {
    if (paymentQrPreview.value.startsWith("blob:")) URL.revokeObjectURL(paymentQrPreview.value);
});
</script>

<template>
    <div class="settings-view">
        <section class="settings-card state-card" v-if="loading">Loading settings...</section>

        <section class="settings-card state-card state-error" v-else-if="error">
            {{ error }}
        </section>

        <!-- Shop Info -->
        <section class="settings-card">
            <h3 class="card-title">🏪 Shop Information</h3>
            <div class="fields">
                <div class="field">
                    <label>Shop name</label>
                    <input v-model="shopName" type="text" />
                </div>
                <div class="field">
                    <label>Location</label>
                    <input v-model="location" type="text" />
                </div>
                <div class="field two-col">
                    <div>
                        <label>Phone</label>
                        <input v-model="phone" type="tel" />
                    </div>
                    <div>
                        <label>Email</label>
                        <input v-model="email" type="email" />
                    </div>
                </div>
                <div class="field two-col">
                    <div>
                        <label>Telegram</label>
                        <input v-model="telegram" type="text" placeholder="shawarmaxpaldobitesKH" />
                        <div v-if="telegram" class="social-link">
                            <a :href="`https://t.me/${telegram}`" target="_blank" rel="noopener noreferrer">
                                {{ `https://t.me/${telegram}` }}
                            </a>
                        </div>
                    </div>
                    <div>
                        <label>Facebook</label>
                        <input v-model="facebook" type="text" placeholder="shawarmapaldokh" />
                        <div v-if="facebook" class="social-link">
                            <a :href="`https://www.facebook.com/${facebook}`" target="_blank" rel="noopener noreferrer">
                                {{ `https://www.facebook.com/${facebook}` }}
                            </a>
                        </div>
                    </div>
                </div>
                <div class="field">
                    <label>Telegram Support</label>
                    <input v-model="telegramSupport" type="text" placeholder="shawarmapaldokh" />
                    <div v-if="telegramSupport" class="social-link">
                        <a :href="`https://t.me/${telegramSupport}`" target="_blank" rel="noopener noreferrer">
                            {{ `https://t.me/${telegramSupport}` }}
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Payment -->
        <section class="settings-card">
            <h3 class="card-title">💳 Payment</h3>
            <div class="fields">
                <div class="field">
                    <label>Payment Link</label>
                    <input v-model="paymentLink" type="url" placeholder="https://..." />
                </div>
                <div class="field">
                    <label>Payment QR</label>
                    <label class="image-picker">
                        <input type="file" accept="image/*" @change="selectPaymentQr" />
                        <span>{{ paymentQrFile ? paymentQrFile.name : "Choose QR image" }}</span>
                    </label>
                    <img v-if="paymentQrPreview" :src="paymentQrPreview" alt="Payment QR preview" class="qr-preview" />
                </div>
            </div>
        </section>

        <!-- Shop Status -->
        <section class="settings-card">
            <h3 class="card-title">🔌 Shop Status</h3>
            <div class="toggle-list">
                <div class="toggle-row">
                    <div>
                        <div class="toggle-name">Shop is Open</div>
                        <div class="toggle-desc">Toggle shop availability for customer orders</div>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" v-model="isOpen" />
                        <span class="slider"></span>
                    </label>
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
                        <input v-model="openTime" type="time" min="06:00" max="23:00" />
                    </div>
                    <div>
                        <label>Max orders per day</label>
                        <input v-model.number="maxOrders" type="number" min="1" max="200" />
                    </div>
                </div>
                <div class="info-chip">ℹ️ Shop closes when sold out. Staff can close early from the dashboard.</div>
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
                        <input type="checkbox" v-model="grabEnabled" />
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-row">
                    <div>
                        <div class="toggle-name">Pick-up</div>
                        <div class="toggle-desc">Customers can walk in or call ahead</div>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" v-model="pickupEnabled" />
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
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Min. Qty</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="rule in minOrderRules" :key="rule.name">
                        <td>{{ rule.name }}</td>
                        <td>
                            <span class="min-badge">{{ rule.min }} pcs</span>
                        </td>
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
            <button class="btn-save" :disabled="saving" @click="save">{{ saving ? "Saving..." : "Save settings" }}</button>
        </div>
    </div>
</template>

<style scoped>
.settings-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 720px;
}

.settings-card {
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 24px;
    box-shadow: var(--shadow);
}
.state-card {
    padding: 14px 18px;
    font-size: 14px;
    font-weight: 600;
}
.state-error {
    color: #991b1b;
    background: #fff5f5;
    border-color: #fecaca;
}
.card-title {
    font-size: 16px;
    margin-bottom: 18px;
}
.card-desc {
    font-size: 13px;
    color: var(--text-soft);
    margin-bottom: 14px;
    margin-top: -12px;
}

.fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
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
.field input {
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
.field input:focus {
    border-color: var(--brand);
}
.image-picker {
    display: flex !important;
    align-items: center;
    min-height: 44px;
    padding: 10px 12px;
    border: 1.5px dashed var(--border);
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    text-transform: none !important;
    letter-spacing: normal !important;
    color: var(--text) !important;
}
.image-picker:hover {
    border-color: var(--brand);
}
.image-picker input {
    display: none;
}
.qr-preview {
    display: block;
    width: 180px;
    height: 180px;
    margin-top: 12px;
    object-fit: contain;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fff;
    padding: 8px;
}
.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.social-link {
    margin-top: 6px;
    font-size: 12px;
}
.social-link a {
    color: var(--primary);
    text-decoration: none;
    word-break: break-all;
}
.social-link a:hover {
    text-decoration: underline;
}
.info-chip {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: #1e40af;
}

/* Toggle */
.toggle-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}
.toggle-name {
    font-weight: 600;
    font-size: 14px;
}
.toggle-desc {
    font-size: 12px;
    color: var(--text-soft);
    margin-top: 2px;
}
.toggle {
    display: flex;
    align-items: center;
    cursor: pointer;
}
.toggle input {
    display: none;
}
.slider {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    background: #d1d5db;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
}
.slider::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
.toggle input:checked ~ .slider {
    background: var(--grab);
}
.toggle input:checked ~ .slider::after {
    transform: translateX(20px);
}

/* Rules table */
.rules-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    margin-bottom: 10px;
}
.rules-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-soft);
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
}
.rules-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f5f0e8;
}
.min-badge {
    background: #fef3c7;
    color: #92400e;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
}
.rules-note {
    font-size: 12px;
    color: var(--text-soft);
}
.rules-note code {
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
}

/* Save */
.save-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
}
.btn-save {
    background: var(--brand);
    color: #fff;
    padding: 11px 28px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    transition: background 0.15s;
}
.btn-save:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
.btn-save:hover {
    background: var(--brand-deep);
}
.saved-msg {
    font-size: 14px;
    font-weight: 600;
    color: var(--grab);
}
.saved-enter-active,
.saved-leave-active {
    transition: opacity 0.3s;
}
.saved-enter-from,
.saved-leave-to {
    opacity: 0;
}

@media (max-width: 600px) {
    .two-col {
        grid-template-columns: 1fr;
    }
}
</style>
