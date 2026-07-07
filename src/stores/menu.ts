import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuItem } from '@/types'
import { menuItems as seed } from '@/data/mockData'
import { useAuthStore } from '@/stores/auth'

const MENU_ENDPOINT = '/api/admin/menu'

type ApiMenuItem = {
  _id?: string
  name?: string
  price?: number
  category?: string
  icon?: string
  desc?: string
  available?: boolean
  minQty?: number
  img?: string
}

type MenuResponse = {
  success?: boolean
  message?: string
  data?: ApiMenuItem[]
}

type CreateMenuPayload = {
  name: string
  price: number
  category: MenuItem['category']
  desc: string
  available: boolean
  minQty?: number
  imageFile?: File
}

type UpdateMenuPayload = Partial<Pick<MenuItem, 'name' | 'price' | 'category' | 'desc' | 'available' | 'minQty'>> & { imageFile?: File }

function asCategory(value: string | undefined): MenuItem['category'] {
  return value === 'Merienda' ? 'Merienda' : 'Ulam'
}

export const useMenuStore = defineStore('menu', () => {
  const items = ref<MenuItem[]>(seed.map(i => ({ ...i })))
  const loading = ref(false)
  const error = ref('')

  function toggleAvailable(id: MenuItem['id']) {
    const item = items.value.find(i => i.id === id)
    if (!item) return

    const nextAvailable = !item.available
    item.available = nextAvailable
    patchMenu(id, { available: nextAvailable }).then((ok) => {
      if (!ok) item.available = !nextAvailable
    })
  }

  function updateItem(id: MenuItem['id'], patch: Partial<Pick<MenuItem, 'name' | 'price' | 'desc'>>) {
    const item = items.value.find(i => i.id === id)
    if (item) Object.assign(item, patch)
  }

  async function fetchMenu() {
    const auth = useAuthStore()
    if (!auth.token) {
      items.value = []
      return
    }

    const authorization = auth.token.startsWith('Bearer ') ? auth.token : `Bearer ${auth.token}`

    loading.value = true
    error.value = ''
    try {
      const response = await fetch(MENU_ENDPOINT, {
        method: 'GET',
        headers: { Authorization: authorization },
      })

      const body = (await response.json().catch(() => ({}))) as MenuResponse
      if (!response.ok || body.success === false) {
        throw new Error(body.message || 'Failed to load menu items.')
      }

      items.value = (body.data ?? []).map((item, index) => ({
        id: item._id || `${index}`,
        name: item.name || 'Unnamed item',
        price: Number(item.price ?? 0),
        category: asCategory(item.category),
        icon: item.icon || '🍽️',
        desc: item.desc || '',
        available: Boolean(item.available),
        minQty: item.minQty,
        img: item.img ? item.img.replace(/^https?:\/\/[^/]+/, '') : undefined,
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load menu items.'
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function createMenu(payload: CreateMenuPayload) {
    const auth = useAuthStore()
    if (!auth.token) {
      error.value = 'Not authenticated.'
      return false
    }

    const authorization = auth.token.startsWith('Bearer ') ? auth.token : `Bearer ${auth.token}`

    loading.value = true
    error.value = ''
    try {
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('price', String(payload.price))
      formData.append('category', payload.category)
      formData.append('desc', payload.desc)
      formData.append('available', String(payload.available))

      if (typeof payload.minQty === 'number') {
        formData.append('minQty', String(payload.minQty))
      }

      if (payload.imageFile) {
        formData.append('picture', payload.imageFile)
      }

      const response = await fetch(MENU_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: authorization,
        },
        body: formData,
      })

      const body = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!response.ok || body.success === false) {
        throw new Error(body.message || 'Failed to create menu item.')
      }

      await fetchMenu()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create menu item.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function patchMenu(id: MenuItem['id'], payload: UpdateMenuPayload) {
    const auth = useAuthStore()
    if (!auth.token) {
      error.value = 'Not authenticated.'
      return false
    }

    const authorization = auth.token.startsWith('Bearer ') ? auth.token : `Bearer ${auth.token}`

    loading.value = true
    error.value = ''
    try {
      const formData = new FormData()
      if (payload.name !== undefined) formData.append('name', payload.name)
      if (payload.price !== undefined) formData.append('price', String(payload.price))
      if (payload.category !== undefined) formData.append('category', payload.category)
      if (payload.desc !== undefined) formData.append('desc', payload.desc)
      if (payload.available !== undefined) formData.append('available', String(payload.available))
      if (payload.minQty !== undefined) formData.append('minQty', String(payload.minQty))
      if (payload.imageFile) formData.append('picture', payload.imageFile)

      const response = await fetch(`${MENU_ENDPOINT}/${encodeURIComponent(String(id))}`, {
        method: 'PATCH',
        headers: {
          Authorization: authorization,
        },
        body: formData,
      })

      const body = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!response.ok || body.success === false) {
        throw new Error(body.message || 'Failed to update menu item.')
      }

      await fetchMenu()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update menu item.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteMenu(id: MenuItem['id']) {
    const auth = useAuthStore()
    if (!auth.token) {
      error.value = 'Not authenticated.'
      return false
    }

    const authorization = auth.token.startsWith('Bearer ') ? auth.token : `Bearer ${auth.token}`

    loading.value = true
    error.value = ''
    try {
      const response = await fetch(`${MENU_ENDPOINT}/${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
        headers: {
          Authorization: authorization,
        },
      })

      const body = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!response.ok || body.success === false) {
        throw new Error(body.message || 'Failed to delete menu item.')
      }

      await fetchMenu()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete menu item.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, toggleAvailable, updateItem, fetchMenu, createMenu, patchMenu, deleteMenu }
})
