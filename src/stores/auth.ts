import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'paldo_admin_token'
const ADMIN_NAME_KEY = 'paldo_admin_name'
const LOGIN_ENDPOINT = 'http://192.168.4.32:4000/api/admin/auth/login'
const VERIFY_ENDPOINT = 'http://192.168.4.32:4000/api/admin/auth/verify'

type LoginPayload = {
  identifier: string
  password: string
}

type LoginResponse = {
  success?: boolean
  message?: string
  token?: string
  accessToken?: string
  access_token?: string
  data?: {
    token?: string
    username?: string
    role?: string
    accessToken?: string
    access_token?: string
    admin?: {
      name?: string
      email?: string
      username?: string
    }
  }
  admin?: {
    name?: string
    email?: string
    username?: string
  }
}

type VerifyResponse = {
  success?: boolean
  message?: string
}

function readStorage(key: string): string {
  return typeof window !== 'undefined' ? window.localStorage.getItem(key) ?? '' : ''
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readStorage(TOKEN_KEY))
  const adminName = ref(readStorage(ADMIN_NAME_KEY) || 'Admin')
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))

  function persistAuth(nextToken: string, nextAdminName?: string) {
    token.value = nextToken
    adminName.value = nextAdminName || adminName.value || 'Admin'

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, nextToken)
      window.localStorage.setItem(ADMIN_NAME_KEY, adminName.value)
    }
  }

  function clearAuth() {
    token.value = ''
    adminName.value = 'Admin'

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(ADMIN_NAME_KEY)
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: payload.identifier,
          password: payload.password,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as LoginResponse
      if (!response.ok || body.success === false) {
        throw new Error(body.message || 'Login failed. Please check your credentials.')
      }

      const nextToken =
        body.token ||
        body.accessToken ||
        body.access_token ||
        body.data?.token ||
        body.data?.accessToken ||
        body.data?.access_token ||
        ''

      if (!nextToken) {
        throw new Error('Login succeeded but token was missing in API response.')
      }

      const admin = body.admin || body.data?.admin
      const nextAdminName = body.data?.username || admin?.name || admin?.email || admin?.username || 'Admin'
      persistAuth(nextToken, nextAdminName)
    } finally {
      loading.value = false
    }
  }

  async function verifyToken() {
    if (!token.value) return false

    const authorization = token.value.startsWith('Bearer ') ? token.value : `Bearer ${token.value}`

    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'GET',
      headers: {
        Authorization: authorization,
      },
    })

    const body = (await response.json().catch(() => ({}))) as VerifyResponse
    const isValid = response.ok && body.success === true

    if (!isValid) {
      clearAuth()
      return false
    }

    return true
  }

  function logout() {
    clearAuth()
  }

  return {
    token,
    adminName,
    loading,
    isAuthenticated,
    login,
    verifyToken,
    logout,
  }
})