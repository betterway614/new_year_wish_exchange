<template>
  <div class="admin-login">
    <div class="login-box">
      <h2>Admin Login</h2>
      <div class="form-group">
        <label>Username</label>
        <input v-model="username" type="text" placeholder="admin" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="password" type="password" placeholder="password" @keyup.enter="handleLogin" />
      </div>
      <button @click="handleLogin" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAdminStore } from '../stores/admin'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const adminStore = useAdminStore()
const router = useRouter()

const handleLogin = async () => {
  if (!username.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    const success = await adminStore.login(username.value, password.value)
    if (success) {
      router.push('/admin/dashboard')
    } else {
      error.value = 'Invalid credentials'
    }
  } catch (e) {
    error.value = e.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f0f2f5;
}
.login-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 300px;
}
.form-group {
  margin-bottom: 1rem;
}
input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 10px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background: #ccc;
}
.error {
  color: red;
  margin-top: 10px;
  font-size: 14px;
}
</style>
