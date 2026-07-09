<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import type { MenuItem } from "@/types";
import L, { type LeafletMouseEvent, type Map as LeafletMap, type Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

type CreateOrderPayload = {
    name: string;
    phone: string;
    location?: string;
    mapUrl?: string;
    pickupTime: string;
    remark?: string;
    items: Array<{ menuItemId: string; qty: number }>;
};

const props = defineProps<{
    menuItems: MenuItem[];
    submitting?: boolean;
}>();

const emit = defineEmits<{
    (e: "create", payload: CreateOrderPayload): void;
    (e: "close"): void;
}>();

const name = ref("");
const phone = ref("");
const location = ref("11.556374, 104.928207");
const remark = ref("");
const rows = ref<Array<{ menuItemId: string; qty: number }>>([{ menuItemId: "", qty: 1 }]);

function to12Hour(minutes: number): string {
    const normalized = ((minutes % 1440) + 1440) % 1440;
    const hour24 = Math.floor(normalized / 60);
    const minute = normalized % 60;
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function currentTimeLabel(): string {
    const now = new Date();
    return to12Hour(now.getHours() * 60 + now.getMinutes());
}

const pickupTime = ref(currentTimeLabel());

const pickupTimeOptions = computed(() => {
    const options: string[] = [];
    for (let mins = 0; mins < 1440; mins += 30) {
        options.push(to12Hour(mins));
    }

    const current = pickupTime.value;
    if (!options.includes(current)) {
        options.unshift(current);
    }

    return options;
});

const menuById = computed(() => {
    const map = new Map<string, MenuItem>();
    for (const item of props.menuItems) {
        map.set(String(item.id), item);
    }
    return map;
});

const groupedMenuItems = computed(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of props.menuItems) {
        if (!item.available) continue;
        const key = item.category || "Other";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
});

const mapUrl = computed(() => {
    const raw = location.value.trim();
    if (!raw) return undefined;
    return `https://www.google.com/maps?q=${encodeURIComponent(raw)}`;
});

const mapEl = ref<HTMLElement | null>(null);
const map = shallowRef<LeafletMap | null>(null);
const markerPin = shallowRef<Marker | null>(null);
const locationError = ref("");

const pickupPinIcon = L.divIcon({
    className: "pickup-pin-icon",
    html: "📍",
    iconSize: [28, 28],
    iconAnchor: [14, 24]
});

const hasItems = computed(() => rows.value.some((row) => row.menuItemId && row.qty > 0));

function selectedItem(id: string) {
    return menuById.value.get(id);
}

function parseCoordinates(value: string): [number, number] | null {
    const [latRaw, lngRaw] = value.split(",").map((part) => part.trim());
    if (!latRaw || !lngRaw) return null;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
}

function setPinnedLocation(lat: number, lng: number) {
    const formatted = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    location.value = formatted;
    if (!map.value) return;

    if (!markerPin.value) {
        markerPin.value = L.marker([lat, lng], { icon: pickupPinIcon }).addTo(map.value);
    } else {
        markerPin.value.setLatLng([lat, lng]);
    }
    map.value.setView([lat, lng], Math.max(map.value.getZoom(), 15));
}

async function initMap() {
    await nextTick();
    if (!mapEl.value || map.value) return;

    const initial = parseCoordinates(location.value) ?? [11.556374, 104.928207];
    map.value = L.map(mapEl.value).setView(initial, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map.value);

    markerPin.value = L.marker(initial, { icon: pickupPinIcon }).addTo(map.value);
    map.value.on("click", (event: LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        setPinnedLocation(lat, lng);
    });
}

async function shareCurrentLocation() {
    locationError.value = "";
    if (!navigator.geolocation) {
        locationError.value = "Location sharing is not supported in this browser.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            setPinnedLocation(position.coords.latitude, position.coords.longitude);
        },
        () => {
            locationError.value = "Unable to access current location. Please allow location permission.";
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function addRow() {
    rows.value.push({ menuItemId: "", qty: 1 });
}

function removeRow(index: number) {
    if (rows.value.length === 1) return;
    rows.value.splice(index, 1);
}

function submit() {
    const payload: CreateOrderPayload = {
        name: name.value.trim() || "-",
        phone: phone.value.trim(),
        location: location.value.trim() || undefined,
        mapUrl: mapUrl.value,
        pickupTime: pickupTime.value.trim(),
        remark: remark.value.trim() || undefined,
        items: rows.value.filter((row) => row.menuItemId && row.qty > 0).map((row) => ({ menuItemId: row.menuItemId, qty: Number(row.qty) }))
    };

    if (!payload.name || !payload.phone || !payload.pickupTime || payload.items.length === 0) return;
    emit("create", payload);
}

watch(location, (value) => {
    const parsed = parseCoordinates(value);
    if (!parsed || !map.value || !markerPin.value) return;
    markerPin.value.setLatLng(parsed);
    map.value.setView(parsed, Math.max(map.value.getZoom(), 14));
});

onMounted(() => {
    initMap();
});

onUnmounted(() => {
    map.value?.remove();
    map.value = null;
    markerPin.value = null;
});

const solveImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${window.location.origin}${url}`;
};
</script>

<template>
    <div class="overlay" @click.self="emit('close')">
        <div class="modal">
            <div class="modal-head">
                <h3>Create Order</h3>
                <button class="close-btn" @click="emit('close')">x</button>
            </div>

            <!-- NAME -->
            <div class="field">
                <label>Name</label>
                <input v-model="name" type="text" placeholder="Shawarma Paldo" />
            </div>

            <!-- PHONE, PICKUP TIME -->
            <div class="grid two">
                <div class="field">
                    <label>Phone</label>
                    <input v-model="phone" type="text" placeholder="0967891234" />
                </div>
                <div class="field">
                    <label>Pickup Time</label>
                    <select v-model="pickupTime">
                        <option v-for="time in pickupTimeOptions" :key="time" :value="time">{{ time }}</option>
                    </select>
                </div>
            </div>

            <!-- LOCATION -->
            <div class="field">
                <div class="location-head">
                    <label>Location</label>
                    <button class="btn-share" @click="shareCurrentLocation">Share My Location</button>
                </div>
                <input v-model="location" type="text" placeholder="11.556374, 104.928207" />
                <p class="hint">Click on map to pin exact pickup location.</p>
                <p v-if="locationError" class="error-text">{{ locationError }}</p>
            </div>

            <!-- MAP URL -->
            <div class="field">
                <label>Map URL</label>
                <input :value="mapUrl || ''" type="text" readonly />
            </div>

            <div class="map-wrap">
                <div ref="mapEl" class="map-canvas"></div>
            </div>

            <!-- REMARK -->
            <div class="field">
                <label>Remark</label>
                <input v-model="remark" type="text" placeholder="Any special instructions?" />
            </div>

            <div class="items-head">
                <label>Items</label>
                <button class="btn-add-line" @click="addRow">+ Add item</button>
            </div>

            <div class="item-row" v-for="(row, index) in rows" :key="index">
                <div>
                    <select v-model="row.menuItemId">
                        <option value="" disabled>Select menu item</option>
                        <optgroup v-for="group in groupedMenuItems" :key="group.category" :label="group.category">
                            <option v-for="item in group.items" :key="item.id" :value="String(item.id)">
                                {{ item.icon }} {{ item.name }} - ${{ item.price.toFixed(2) }}
                            </option>
                        </optgroup>
                    </select>

                    <div class="selected-preview" v-if="selectedItem(row.menuItemId)">
                        <img
                            v-if="selectedItem(row.menuItemId)?.img"
                            :src="solveImageUrl(selectedItem(row.menuItemId)?.img)"
                            :alt="selectedItem(row.menuItemId)?.name"
                            class="preview-img"
                        />
                        <span v-else class="preview-icon">{{ selectedItem(row.menuItemId)?.icon }}</span>
                        <div class="preview-text">
                            <strong>{{ selectedItem(row.menuItemId)?.name }}</strong>
                            <small>{{ selectedItem(row.menuItemId)?.category }} | ${{ selectedItem(row.menuItemId)?.price.toFixed(2) }}</small>
                        </div>
                    </div>
                </div>
                <input v-model.number="row.qty" type="number" min="1" step="1" placeholder="Qty" />
                <button class="btn-remove" @click="removeRow(index)">Remove</button>
            </div>

            <p class="note" v-if="!props.menuItems.length">No menu items loaded yet. Open Menu page or refresh after login.</p>

            <div class="modal-foot">
                <button class="btn-cancel" @click="emit('close')">Cancel</button>
                <button class="btn-save" :disabled="!hasItems || props.submitting" @click="submit">
                    {{ props.submitting ? "Creating..." : "Create Order" }}
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
    max-width: 680px;
    padding: 22px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
}
.close-btn {
    font-size: 20px;
    color: var(--text-soft);
    padding: 4px;
}
.grid.two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
.field {
    margin-bottom: 12px;
}
.field label,
.items-head label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-soft);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.field input,
.field select,
.item-row input,
.item-row select {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 10px;
    font-size: 14px;
}
.items-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    margin-bottom: 8px;
}
.btn-add-line {
    background: #f5f0e8;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
}
.item-row {
    display: grid;
    grid-template-columns: minmax(200px, 1fr) 90px 90px;
    gap: 8px;
    margin-bottom: 8px;
    align-items: start;
}
.location-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
}
.btn-share {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 700;
}
.map-wrap {
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 12px;
}
.map-canvas {
    width: 100%;
    height: 240px;
}
:deep(.pickup-pin-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    line-height: 1;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35));
}
.hint {
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-soft);
}
.error-text {
    margin-top: 6px;
    font-size: 12px;
    color: #b91c1c;
}
.selected-preview {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #faf8f5;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 7px 9px;
}
.preview-img {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid var(--border);
}
.preview-icon {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 1px solid var(--border);
    font-size: 18px;
}
.preview-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.2;
}
.preview-text small {
    color: var(--text-soft);
    font-size: 11px;
}
.btn-remove {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
}
.note {
    font-size: 12px;
    color: var(--text-soft);
    margin-top: 10px;
}
.modal-foot {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 18px;
}
.btn-cancel,
.btn-save {
    border-radius: 8px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 700;
}
.btn-cancel {
    background: #f3f4f6;
    color: var(--text-soft);
}
.btn-save {
    background: var(--brand);
    color: #fff;
}
.btn-save:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

@media (max-width: 760px) {
    .grid.two {
        grid-template-columns: 1fr;
    }
    .item-row {
        grid-template-columns: 1fr;
    }
    .map-canvas {
        height: 220px;
    }
}
</style>
