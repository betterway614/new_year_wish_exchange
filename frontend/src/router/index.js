import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Home from '../views/Home.vue'
import Write from '../views/Write.vue'
import Match from '../views/Match.vue'
import Result from '../views/Result.vue'

// Admin Views
const AdminLogin = () => import('../views/AdminLogin.vue')
const AdminLayout = () => import('../views/AdminLayout.vue')
const AdminDashboard = () => import('../views/admin/Dashboard.vue')
const AdminWishes = () => import('../views/admin/Wishes.vue')

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/write', name: 'write', component: Write },
  { 
    path: '/match', 
    name: 'match', 
    component: Match,
    meta: { requiresSubmitted: true }
  },
  { 
    path: '/result', 
    name: 'result', 
    component: Result,
    meta: { requiresMatched: true }
  },
  { path: '/admin/login', name: 'adminLogin', component: AdminLogin },
  { 
    path: '/admin', 
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: 'dashboard', name: 'adminDashboard', component: AdminDashboard },
      { path: 'wishes', name: 'adminWishes', component: AdminWishes },
      { path: '', redirect: '/admin/dashboard' }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAdmin) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      return next('/admin/login')
    }
    return next()
  }

  const store = useUserStore()
  
  // 确保 store 初始化（特别是从 localStorage 读取数据）
  if (!store.uuid) store.ensureUUID()

  if (to.meta.requiresMatched) {
    if (!store.match_data) {
      // 如果没有匹配数据，尝试检查一下状态（可能是刷新了页面）
      // 但这里为了简化，如果本地没有 match_data，先跳转回 match 页（如果已提交）或者首页
      if (store.is_submitted) {
        return next('/match')
      } else {
        return next('/')
      }
    }
  }

  if (to.meta.requiresSubmitted) {
    if (!store.is_submitted) {
      return next('/write')
    }
  }

  next()
})

export default router
