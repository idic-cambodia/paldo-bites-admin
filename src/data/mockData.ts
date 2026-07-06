import type { Order, MenuItem, DailyStat } from '@/types'

// ─── Menu ───────────────────────────────────────────────────────────────────
export const menuItems: MenuItem[] = [
  { id:1,  name:'Shawarma',                category:'Ulam',     price:3.00,  icon:'🌯', desc:'Classic wrap with garlic sauce and pickled veggies.',         available:true },
  { id:2,  name:'Shawarma Fries',           category:'Ulam',     price:3.50,  icon:'🍟', desc:'Shawarma filling loaded over crispy golden fries.',           available:true },
  { id:3,  name:'Shawarma Nachos',          category:'Ulam',     price:3.50,  icon:'🧀', desc:'Shawarma over crunchy tortilla chips with creamy sauce.',     available:true },
  { id:4,  name:'Ilocos Empanada Regular',  category:'Ulam',     price:2.00,  icon:'🥟', desc:'Hand-folded, fried golden with longganisa & egg.',            available:true },
  { id:5,  name:'Ilocos Empanada Special',  category:'Ulam',     price:2.50,  icon:'🥟', desc:'Regular with extra longganisa filling.',                      available:true },
  { id:6,  name:'Ilocos Empanada Paldo',    category:'Ulam',     price:3.50,  icon:'🥟', desc:'Premium Paldo-style with all the fixings.',                   available:true },
  { id:7,  name:'Extra Rice',               category:'Merienda', price:0.25,  icon:'🍚', desc:'A side of freshly steamed white rice.',                       available:true },
  { id:8,  name:'Chicken Inasal (no rice)', category:'Merienda', price:4.00,  icon:'🍗', desc:'Citrus-marinated charcoal-grilled chicken.',                  available:true },
  { id:9,  name:'Chicken Inasal with Rice', category:'Merienda', price:4.50,  icon:'🍗', desc:'Charcoal-grilled chicken served with steamed rice.',          available:true },
  { id:10, name:'Lumpiang Shanghai (8 pcs)',category:'Merienda', price:3.00,  icon:'🥢', desc:'Eight crispy pork spring rolls with sweet chili dip.',        available:true },
  { id:11, name:'Lumpiang Shanghai (per pc)',category:'Merienda',price:0.35,  icon:'🥢', desc:'Crispy pork spring roll.',                                     available:true, minQty:5 },
  { id:12, name:'BBQ Set with Rice',        category:'Merienda', price:3.00,  icon:'🍖', desc:'Pork BBQ skewers served with steamed rice.',                  available:true },
  { id:13, name:'BBQ per pc',               category:'Merienda', price:0.875, icon:'🍖', desc:'Juicy pork BBQ skewer.',                                       available:true, minQty:5 },
  { id:14, name:'BBQ per pc (value)',        category:'Merienda', price:0.75,  icon:'🍖', desc:'Value pork BBQ skewer.',                                       available:true, minQty:5 },
]

// ─── Orders ──────────────────────────────────────────────────────────────────
function makeOrder(
  id: string, phone: string, pickupTime: string, remark: string,
  items: { dishId: number; qty: number }[],
  status: Order['status'], minutesAgo: number
): Order {
  const orderItems = items.map(({ dishId, qty }) => {
    const m = menuItems.find(i => i.id === dishId)!
    return { dishId, name: m.name, price: m.price, qty }
  })
  const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0)
  const createdAt = new Date(Date.now() - minutesAgo * 60_000)
  return { id, phone, location: '11.556374, 104.928207',
    mapUrl: 'https://www.google.com/maps?q=11.556374,104.928207',
    pickupTime, remark, items: orderItems, total, status, createdAt }
}

export const seedOrders: Order[] = [
  makeOrder('ORD-001', '+855 96 123 4567', '12:00 PM', 'Extra garlic sauce please',
    [{dishId:1,qty:2},{dishId:2,qty:1},{dishId:7,qty:2}], 'cancelled', 5),
  makeOrder('ORD-002', '+855 77 234 5678', '12:30 PM', '',
    [{dishId:4,qty:3},{dishId:5,qty:1}], 'preparing', 18),
  makeOrder('ORD-003', '+855 12 345 6789', '1:00 PM', 'No onion on the shawarma',
    [{dishId:1,qty:1},{dishId:3,qty:1},{dishId:9,qty:1}], 'preparing', 32),
  makeOrder('ORD-004', '+855 85 456 7890', '1:00 PM', '',
    [{dishId:6,qty:2},{dishId:10,qty:1},{dishId:12,qty:2}], 'ready', 45),
  makeOrder('ORD-005', '+855 96 567 8901', '1:30 PM', 'Please pack separately',
    [{dishId:8,qty:2},{dishId:7,qty:2},{dishId:11,qty:5}], 'ready', 58),
  makeOrder('ORD-006', '+855 11 678 9012', '11:30 AM', '',
    [{dishId:1,qty:3},{dishId:2,qty:2}], 'completed', 92),
  makeOrder('ORD-007', '+855 70 789 0123', '11:30 AM', 'Extra spicy',
    [{dishId:4,qty:4},{dishId:7,qty:4}], 'completed', 105),
  makeOrder('ORD-008', '+855 17 890 1234', '11:00 AM', '',
    [{dishId:9,qty:2},{dishId:13,qty:5}], 'completed', 130),
  makeOrder('ORD-009', '+855 78 901 2345', '2:00 PM', 'Call when ready',
    [{dishId:1,qty:1},{dishId:6,qty:1}], 'cancelled', 15),
  makeOrder('ORD-010', '+855 96 012 3456', '2:30 PM', '',
    [{dishId:12,qty:2},{dishId:14,qty:10},{dishId:7,qty:2}], 'cancelled', 2),
]

// ─── Weekly chart data ────────────────────────────────────────────────────────
export const weeklyStats: DailyStat[] = [
  { label:'Mon', revenue:28.50,  orders:9  },
  { label:'Tue', revenue:34.75,  orders:12 },
  { label:'Wed', revenue:22.00,  orders:7  },
  { label:'Thu', revenue:41.25,  orders:14 },
  { label:'Fri', revenue:55.50,  orders:18 },
  { label:'Sat', revenue:67.00,  orders:22 },
  { label:'Sun', revenue:48.25,  orders:16 },
]
