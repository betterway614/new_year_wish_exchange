<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">🧧</span> Best Wish Admin
      </div>
      <nav>
        <router-link to="/admin/dashboard" active-class="active">
          <i class="icon">📊</i> Dashboard
        </router-link>
        <router-link to="/admin/wishes" active-class="active">
          <i class="icon">📜</i> Wishes Management
        </router-link>
      </nav>
      <div class="user-info">
        <div class="avatar">{{ adminStore.user.username?.charAt(0).toUpperCase() }}</div>
        <div class="user-details">
          <span class="username">{{ adminStore.user.username }}</span>
          <span class="role">{{ adminStore.user.role || 'Admin' }}</span>
        </div>
        <button @click="adminStore.logout" class="logout-btn" title="Logout">🚪</button>
      </div>
    </aside>
    <main class="content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { useAdminStore } from '../stores/admin'
const adminStore = useAdminStore()
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.sidebar {
  width: 260px;
  background: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  z-index: 10;
  transition: all 0.3s;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  background: #002140;
  letter-spacing: 1px;
}
.logo-icon { margin-right: 8px; font-size: 24px; }

nav {
  flex: 1;
  padding: 16px 0;
}

nav a {
  display: flex;
  align-items: center;
  color: #a6adb4;
  padding: 14px 24px;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 14px;
  border-left: 3px solid transparent;
}
nav a .icon { margin-right: 10px; font-style: normal; }

nav a:hover {
  color: #fff;
  background: rgba(255,255,255,0.05);
}

nav a.active {
  color: #fff;
  background: #1890ff;
  border-left-color: #fff;
}

.user-info {
  padding: 16px 24px;
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  background: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.username { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.role { font-size: 11px; color: #a6adb4; }

.logout-btn {
  background: transparent;
  border: none;
  color: #a6adb4;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: color 0.3s;
}
.logout-btn:hover { color: #ff4d4f; }

.content {
  flex: 1;
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
  position: relative;
}
</style>
