import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderStatus } from '@/types'
import { seedOrders } from '@/data/mockData'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([...seedOrders])

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

  function updateStatus(id: string, status: OrderStatus) {
    const order = orders.value.find(o => o.id === id)
    if (order) order.status = status
  }

  function addOrder(order: Order) {
    orders.value.unshift(order)
  }

  return { orders, pending, preparing, ready, completed,
    todayRevenue, todayOrders, todayItemsSold,
    updateStatus, addOrder }
})
