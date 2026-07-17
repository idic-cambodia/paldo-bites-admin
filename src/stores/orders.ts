import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderStatus } from '@/types'
import { seedOrders } from '@/data/mockData'
import { useAuthStore } from '@/stores/auth'

const ORDERS_ENDPOINT = '/api/admin/orders'
const CREATE_ORDER_ENDPOINT = '/api/admin/orders'

type ApiOrderItem = {
  menuItemId?: string
  name?: string
  price?: number
  qty?: number
}

type ApiOrder = {
  _id?: string
  orderId?: string
  name?: string
  phone?: string
  location?: string
  locationLabel?: string
  mapUrl?: string
  pickupTime?: string
  deliveryTime?: string
  remark?: string
  items?: ApiOrderItem[]
  total?: number
  status?: string
  createdAt?: string
  grabTracking?: string
}

type OrdersResponse = {
  status?: number
  msg?: string
  success?: boolean
  message?: string
  data?: {
    page?: number | null
    limit?: number | null
    total?: number | null
    pages?: number | null
    list?: ApiOrder[]
  } | ApiOrder[]
  pagination?: {
    page?: number | null
    limit?: number | null
    total?: number | null
    pages?: number | null
  }
}

type CreateOrderPayload = {
  phone: string
  location?: string
  mapUrl?: string
  pickupTime: string
  remark?: string
  items: Array<{ menuItemId: string; qty: number }>
}

function asOrderStatus(value: string | undefined): OrderStatus {
  if (value === 'pending' || value === 'preparing' || value === 'ready' || value === 'completed' || value === 'cancelled') {
    return value
  }
  return 'pending'
}

function mapApiOrder(order: ApiOrder, fallbackIndex = 0): Order {
  return {
    apiId: order._id || order.orderId || `N/A-${fallbackIndex}`,
    id: order.orderId || order._id || `N/A-${fallbackIndex}`,
    name: order.name || '-',
    phone: order.phone || '-',
    location: order.location || '-',
    locationLabel: order.locationLabel || '-',
    mapUrl: order.mapUrl || '#',
    pickupTime: order.pickupTime || '-',
    deliveryTime: order.deliveryTime || '-',
    remark: order.remark || '',
    items: (order.items ?? []).map((item, index) => ({
      dishId: item.menuItemId || `${index}`,
      name: item.name || 'Unknown item',
      price: Number(item.price ?? 0),
      qty: Number(item.qty ?? 0),
    })),
    total: Number(order.total ?? 0),
    status: asOrderStatus(order.status),
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    grabTracking: order.grabTracking || undefined,
  }
}

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([...seedOrders])
  const loading = ref(false)
  const error = ref('')
  const pagination = ref({ page: 1, limit: 20, total: 0, pages: 1 })

  const pending   = computed(() => orders.value.filter(o => o.status === 'pending'))
  const preparing = computed(() => orders.value.filter(o => o.status === 'preparing'))
  const ready     = computed(() => orders.value.filter(o => o.status === 'ready'))
  const completed = computed(() => orders.value.filter(o => o.status === 'completed'))

  const todayRevenue = computed(() =>
    orders.value.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0)
  )
  const todayOrders  = computed(() => orders.value.filter(o => o.status !== 'cancelled').length)
  const todayItemsSold = computed(() =>
    orders.value.filter(o => o.status === 'completed')
      .flatMap(o => o.items).reduce((s, i) => s + i.qty, 0)
  )

  async function updateStatus(id: string, status: OrderStatus, grabTracking?: string) {
    const auth = useAuthStore()
    const order = orders.value.find(o => o.id === id)
    if (!order) return
    if (!auth.token) {
      error.value = 'Not authenticated.'
      return
    }

    const targetId = order.id
    const authorization = auth.token.startsWith('Bearer ') ? auth.token : `Bearer ${auth.token}`

    try {
      const body = { status } as any
      if (grabTracking !== undefined) {
        body.grabTracking = grabTracking
      }

      const response = await fetch(`${ORDERS_ENDPOINT}/${encodeURIComponent(targetId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        body: JSON.stringify(body),
      })

      const responseBody = (await response.json().catch(() => ({}))) as { status?: number; msg?: string; success?: boolean; message?: string }
      if (!response.ok || responseBody.success === false) {
        throw new Error(responseBody.msg || responseBody.message || 'Failed to update order status.')
      }

      order.status = status
      if (grabTracking !== undefined) {
        order.grabTracking = grabTracking
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update order status.'
    }
  }

  function addOrder(order: Order) {
    orders.value.unshift(order)
  }

  function addNewOrder(payload: { orderId: string; name: string; phone: string; pickupTime: string; total: number; itemCount: number; createdAt: string }) {
    const newOrder: Order = {
      apiId: payload.orderId,
      name: payload.name || '-',
      id: payload.orderId,
      phone: payload.phone,
      location: '-',
      locationLabel: '-',
      mapUrl: '#',
      pickupTime: payload.pickupTime,
      deliveryTime: '',
      remark: '',
      items: Array(payload.itemCount).fill(null).map((_, i) => ({
        dishId: `${i}`,
        name: 'Item',
        price: 0,
        qty: 1,
      })),
      total: payload.total,
      status: 'pending',
      createdAt: new Date(payload.createdAt),
      grabTracking: undefined,
    }
    orders.value.unshift(newOrder)
  }

  function updateOrderStatus(orderId: string, status: string) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = asOrderStatus(status)
    }
  }

  async function fetchOrders(params?: { page?: number; limit?: number; status?: OrderStatus }) {
    const auth = useAuthStore()
    if (!auth.token) {
      orders.value = []
      return
    }

    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.status) query.set('status', params.status)

    const authorization = auth.token.startsWith('Bearer ') ? auth.token : `Bearer ${auth.token}`

    loading.value = true
    error.value = ''
    try {
      const url = query.toString() ? `${ORDERS_ENDPOINT}?${query.toString()}` : ORDERS_ENDPOINT
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: authorization },
      })

      const body = (await response.json().catch(() => ({}))) as OrdersResponse
      if (!response.ok || body.success === false) {
        throw new Error(body.msg || body.message || 'Failed to load orders.')
      }

      const result = Array.isArray(body.data) ? { list: body.data } : body.data
      orders.value = (result?.list ?? []).map((order, index) => mapApiOrder(order, index))

      pagination.value = {
        page: Number(result?.page ?? body.pagination?.page ?? params?.page ?? 1),
        limit: Number(result?.limit ?? body.pagination?.limit ?? params?.limit ?? 20),
        total: Number(result?.total ?? body.pagination?.total ?? orders.value.length),
        pages: Number(result?.pages ?? body.pagination?.pages ?? 1),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders.'
      error.value = message
      orders.value = []
    } finally {
      loading.value = false
    }
  }

  async function createOrder(payload: CreateOrderPayload) {
    const auth = useAuthStore()
    if (!auth.token) {
      error.value = 'Not authenticated.'
      return false
    }

    const authorization = auth.token.startsWith('Bearer ') ? auth.token : `Bearer ${auth.token}`

    loading.value = true
    error.value = ''
    try {
      const response = await fetch(CREATE_ORDER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => ({}))) as {
        status?: number
        msg?: string
        success?: boolean
        message?: string
        data?: ApiOrder
      }

      if (!response.ok || body.success === false) {
        throw new Error(body.msg || body.message || 'Failed to create order.')
      }

      if (body.data) {
        orders.value.unshift(mapApiOrder(body.data, orders.value.length))
      } else {
        await fetchOrders({ page: 1, limit: pagination.value.limit })
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create order.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { orders, pending, preparing, ready, completed,
    todayRevenue, todayOrders, todayItemsSold,
    loading, error, pagination,
    updateStatus, addOrder, addNewOrder, updateOrderStatus, fetchOrders, createOrder }
})
