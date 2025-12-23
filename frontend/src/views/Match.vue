<template>
  <div class="page dark">
    <div class="radar"></div>
    <div class="text">祝福已寄出，正在寻找有缘人...</div>
    <div class="text small">请勿关闭页面 (已等待 {{ seconds }}s)</div>
    
    <div class="timeout-tip" v-if="showTimeoutTip">
      <p>当前匹配人数较多或较少，可能需要一点时间。</p>
      <button class="back-btn" @click="goHome">先回首页，稍后再看</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const store = useUserStore()
const router = useRouter()
const seconds = ref(0)
const showTimeoutTip = ref(false)
let timer = null
let poller = null
const POLL_INTERVAL = 2000
const TIMEOUT_SECONDS = 30

onMounted(() => {
  if (store.match_data) {
    router.replace('/result')
    return
  }

  timer = setInterval(() => {
    seconds.value++
    if (seconds.value > TIMEOUT_SECONDS) {
      showTimeoutTip.value = true
    }
  }, 1000)
  
  // 立即检查一次
  checkStatus()
  poller = setInterval(checkStatus, POLL_INTERVAL)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (poller) clearInterval(poller)
})

async function checkStatus() {
  try {
    const data = await store.checkMatchStatus()
    if (data && data.status === 'MATCHED') {
      router.replace('/result')
    }
  } catch (e) {
    console.error('Polling error:', e)
    // 错误处理：如果是 404 等不用管，网络错误可以忽略，等待下次轮询
  }
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.page.dark {
  min-height: 100vh;
  background: #111;
  color: #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}
.radar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.01) 100%);
  box-shadow: 0 0 40px rgba(0,255,0,0.2);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 1 }
  50% { transform: scale(1.05); opacity: 0.8 }
  100% { transform: scale(1); opacity: 1 }
}
.text { margin-top: 18px; }
.text.small { font-size: 12px; opacity: 0.7; margin-top: 8px; }
.timeout-tip {
  margin-top: 30px;
  animation: fadeIn 1s;
}
.back-btn {
  margin-top: 10px;
  background: transparent;
  border: 1px solid #666;
  color: #ccc;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.back-btn:hover {
  border-color: #999;
  color: #fff;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
