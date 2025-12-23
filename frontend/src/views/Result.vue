<template>
  <div class="page">
    <div v-if="stage==='envelope'" class="stage-envelope">
      <Envelope :nickname="targetNickname" @open="onOpen" />
    </div>
    <div v-else class="stage-card">
      <div class="success-tip">🎉 恭喜！你收到了来自远方的祝福</div>
      <div v-if="matchPartner" class="match-info">
        你的祝福已送达给：{{ matchPartner }}
      </div>
      <CardBody :styleId="styleId">
        <template #content>{{ content }}</template>
        <template #nickname>{{ targetNickname }}</template>
      </CardBody>
      <div class="ops">
        <button class="primary" @click="goHome">返回首页</button>
        <button class="secondary" @click="restart">再玩一次</button>
        <div class="tip">截图屏幕即可永久保存这份缘分</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Envelope from '../components/Envelope.vue'
import CardBody from '../components/CardBody.vue'
import { useUserStore } from '../stores/user'
import { CARD_THEMES } from '../constants/styles'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useUserStore()
const stage = ref('envelope')
const targetNickname = ref('')
const matchPartner = ref('')
const content = ref('')
const styleId = ref(0)

onMounted(() => {
  // 双重保险，虽然路由守卫已处理
  if (!store.match_data) {
    router.replace('/')
    return
  }

  const m = store.match_data.target || {}
  targetNickname.value = m.nickname || '神秘人'
  matchPartner.value = m.match_partner || store.match_data.self?.match_partner || '' // Fallback to check self if not in target
  content.value = m.content || '（这是一封空白的祝福）'
  
  const id = Number(m.style_id)
  styleId.value = Object.prototype.hasOwnProperty.call(CARD_THEMES, id) ? id : 0
})

function onOpen() {
  stage.value = 'card'
}

function goHome() { 
  // 保留状态，返回首页
  router.push('/') 
}

function restart() {
  if (confirm('确定要重新开始吗？当前的祝福记录将被清除。')) {
    store.resetState()
    router.push('/write')
  }
}
</script>

<style scoped>
.page { padding: 20px; min-height: 100vh; background-color: #f9f9f9; }
.stage-envelope { margin-top: 40px; }
.stage-card { margin-top: 10px; animation: fadeIn 0.5s ease-out; }
.success-tip { text-align: center; color: #D32F2F; font-weight: bold; margin-bottom: 8px; font-size: 18px; }
.match-info { text-align: center; color: #666; font-size: 14px; margin-bottom: 16px; }
.ops { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 24px; padding-bottom: 20px; }
.primary { width: 80%; height: 44px; background: #D32F2F; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
.secondary { width: 80%; height: 44px; background: #fff; border: 1px solid #D32F2F; color: #D32F2F; border-radius: 8px; font-size: 16px; cursor: pointer; }
.tip { font-size: 12px; color: #999; margin-top: 8px; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
