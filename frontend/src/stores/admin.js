import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('admin_user') || '{}'))
  const router = useRouter()

  function setToken(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('admin_token', newToken)
    localStorage.setItem('admin_user', JSON.stringify(newUser))
  }

  function logout() {
    token.value = ''
    user.value = {}
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
  }

  async function login(username, password) {
    // request helper already adds /api/v1 prefix
    const res = await request.post('/admin/login', { username, password })
    if (res.code === 0) {
      setToken(res.data.token, { username: res.data.username, role: res.data.role })
      return true
    }
    return false
  }

  return { token, user, login, logout }
})
