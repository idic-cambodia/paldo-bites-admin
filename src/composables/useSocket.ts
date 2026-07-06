/**
 * useSocket.ts — Socket.io composable for Vue 3
 *
 * Copy this file into:
 *   • paldo-bites-kh/src/composables/useSocket.ts   (user site)
 *   • paldo-admin/src/composables/useSocket.ts       (admin dashboard)
 *
 * Install in both projects:
 *   npm install socket.io-client
 */
import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://192.168.4.32:4000'

// ── Shared event names (mirror of server SOCKET_EVENTS) ────────────────────
export const SOCKET_EVENTS = {
  ORDER_NEW:           'order:new',
  ORDER_STATUS_UPDATE: 'order:status_update',
  DASHBOARD_STATS:     'dashboard:stats',
  USER_ORDER_UPDATE:   'user:order_update',
  JOIN_ORDER_ROOM:     'join:order_room',
  JOIN_ADMIN_ROOM:     'join:admin_room',
} as const

// ── Singleton socket ─────────────────────────────────────────────────────────
let _socket: Socket | null = null

function getSocket(): Socket {
  if (!_socket) {
    _socket = io(API_URL, { transports: ['websocket', 'polling'], autoConnect: false })
  }
  return _socket
}

// ── USER composable — track own order status ──────────────────────────────────
export function useOrderTracking(orderId: string) {
  const status     = ref<string>('pending')
  const connected  = ref(false)
  const socket     = getSocket()

  function connect() {
    socket.connect()
    socket.emit(SOCKET_EVENTS.JOIN_ORDER_ROOM, orderId)
    connected.value = true

    socket.on(SOCKET_EVENTS.USER_ORDER_UPDATE, (payload: { orderId: string; status: string }) => {
      if (payload.orderId === orderId) status.value = payload.status
    })
  }

  function disconnect() { socket.disconnect(); connected.value = false }

  onUnmounted(disconnect)
  connect()

  return { status, connected }
}

// ── Type for incoming order from socket ──────────────────────────────────────
interface SocketOrderPayload {
  orderId: string
  phone: string
  pickupTime: string
  total: number
  itemCount: number
  createdAt: string
}

// ── ADMIN composable — listen for new orders & status changes ──────────────
export function useAdminSocket(ordersStore?: any) {
  const connected = ref(false)
  const socket = getSocket()

  function connect() {
    socket.connect()
    socket.emit(SOCKET_EVENTS.JOIN_ADMIN_ROOM)
    connected.value = true

    socket.on(SOCKET_EVENTS.ORDER_NEW, (payload: SocketOrderPayload) => {
      console.log('[socket] new order:', payload)
      if (ordersStore) {
        // Add new order to store (will be prepended to the list)
        ordersStore.addNewOrder(payload)
      }
    })

    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATE, (payload: { orderId: string; status: string }) => {
      console.log('[socket] order status update:', payload)
      if (ordersStore) {
        ordersStore.updateOrderStatus(payload.orderId, payload.status)
      }
    })
  }

  function disconnect() { socket.disconnect(); connected.value = false }

  onUnmounted(disconnect)
  connect()

  return { connected }
}
