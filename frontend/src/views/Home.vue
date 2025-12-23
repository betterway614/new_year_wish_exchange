<template>
  <div class="page">
    <div class="banner">
      <div class="title">2025 新春祝福交换</div>
      <div class="counter" v-if="loading">加载中...</div>
      <div class="counter" v-else>当前参与人数：{{ count }}/100</div>
    </div>
    <div class="guide">
      <div>1. 填昵称 2. 写祝福 3. 收祝福</div>
    </div>
    <div class="actions">
      <button class="primary" @click="handleMainAction">{{ mainButtonText }}</button>
      <div class="admin-entry" v-if="false">管理员入口</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '../utils/request'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useUserStore()
const count = ref(0)
const loading = ref(true)

const mainButtonText = computed(() => {
  if (store.match_data) return '查看我的匹配结果'
  if (store.is_submitted) return '查看匹配进度'
  return '开始写祝福'
})

onMounted(async () => {
  store.ensureUUID()
  // 尝试恢复状态（如果在 match 页面刷新导致 store 重置但 localstorage 有值，store 初始化时已经恢复了）
  // 这里可以再次检查一下后端状态，以防万一
  if (store.is_submitted && !store.match_data) {
    try {
      await store.checkMatchStatus()
    } catch {
      // ignore
    }
  }

  try {
    const res = await request.get('/stats')
    count.value = res?.data?.count || 0
  } catch {
    count.value = 0
  } finally {
    loading.value = false
  }
})

function handleMainAction() {
  if (store.match_data) {
    router.push('/result')
  } else if (store.is_submitted) {
    router.push('/match')
  } else {
    router.push('/write')
  }
}
</script>

<style scoped>
.page { padding: 20px; }
.banner { text-align: center; padding: 24px 0; }
.title { font-size: 22px; color: #B71C1C; font-weight: 700; }
.counter { margin-top: 8px; background: #FFD700; color: #333; display: inline-block; padding: 6px 12px; border-radius: 24px; font-size: 14px;}
.guide { text-align: center; margin: 20px 0; color: #666; }
.actions { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 16px; }
.primary { width: 80%; height: 44px; background: #D32F2F; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; transition: background 0.2s; }
.primary:active { background: #B71C1C; }
.admin-entry { font-size: 12px; color: #999; cursor: pointer; }
</style>
