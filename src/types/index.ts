export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type MenuCategory = 'Ulam' | 'Merienda'

export interface OrderItem {
  dishId: number | string
  name:   string
  price:  number
  qty:    number
}

export interface Order {
  apiId?:       string
  id:           string
  phone:        string
  location:     string
  mapUrl:       string
  pickupTime:   string
  remark:       string
  items:        OrderItem[]
  total:        number
  status:       OrderStatus
  createdAt:    Date
  grabTracking?: string
}

export interface MenuItem {
  id:        number | string
  name:      string
  price:     number
  category:  MenuCategory
  icon:      string
  desc:      string
  available: boolean
  minQty?:   number
  img?:      string
}

export interface DailyStat {
  label:   string
  revenue: number
  orders:  number
}
