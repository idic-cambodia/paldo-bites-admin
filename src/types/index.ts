export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type MenuCategory = 'Ulam' | 'Merienda'

export interface OrderItem {
  dishId: number
  name:   string
  price:  number
  qty:    number
}

export interface Order {
  id:         string
  phone:      string
  location:   string
  mapUrl:     string
  pickupTime: string
  remark:     string
  items:      OrderItem[]
  total:      number
  status:     OrderStatus
  createdAt:  Date
}

export interface MenuItem {
  id:        number
  name:      string
  price:     number
  category:  MenuCategory
  icon:      string
  desc:      string
  available: boolean
  minQty?:   number
}

export interface DailyStat {
  label:   string
  revenue: number
  orders:  number
}
