import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuItem } from '@/types'
import { menuItems as seed } from '@/data/mockData'

export const useMenuStore = defineStore('menu', () => {
  const items = ref<MenuItem[]>(seed.map(i => ({ ...i })))

  function toggleAvailable(id: number) {
    const item = items.value.find(i => i.id === id)
    if (item) item.available = !item.available
  }

  function updateItem(id: number, patch: Partial<Pick<MenuItem, 'name' | 'price' | 'desc'>>) {
    const item = items.value.find(i => i.id === id)
    if (item) Object.assign(item, patch)
  }

  return { items, toggleAvailable, updateItem }
})
