<template>
  <div class="result-page" :style="pageBackgroundStyle">
    <!-- 纹理层 -->
    <div class="pattern-overlay"></div>

    <!-- 装饰粒子 (全局背景) -->
    <div class="particles-container">
        <div v-for="i in 20" :key="i" 
             class="css-particle"
             :style="getParticleStyle(i)">
        </div>
    </div>

    <!-- 内容区 -->
    <div class="content-container">
        
        <!-- 信封阶段 -->
        <transition name="fade" mode="out-in">
            <div v-if="stage==='envelope'" class="stage-envelope">
                <Envelope :nickname="targetNickname" @open="onOpen" />
            </div>
            
            <!-- 卡片展示阶段 -->
            <div v-else class="stage-card">
                
                <div class="card-wrapper">
                    <CardBody :styleId="styleId">
                        <template #content>{{ content }}</template>
                        <template #nickname>{{ targetNickname }}</template>
                    </CardBody>
                </div>

                <div class="ops-section">
                    <div class="success-tip-box">
                        <p class="tip-text">
                            <span class="icon">💡</span> 截图屏幕即可永久保存这份缘分
                        </p>
                        <div class="partner-info">
                           <span>来自：{{ targetNickname }}</span>
                           <span class="sep">·</span>
                           <span v-if="deliveredToNickname">你的祝福已送达给：{{ deliveredToNickname }}</span>
                           <span v-else>你的祝福未被人收到</span>
                        </div>
                    </div>
                    
                    <div class="btn-group">
                        <button class="action-btn primary-btn" @click="goHome">
                            返回首页
                        </button>
                        <button class="action-btn secondary-btn" @click="resendWish">
                            重递祝福
                        </button>
                    </div>
                    <!-- 新增查看心愿墙按钮 -->
                    <div class="btn-group" style="margin-top: 12px;">
                        <button class="action-btn outline-btn" @click="goWishWall">
                            查看心愿墙
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Envelope from '../components/Envelope.vue'
import CardBody from '../components/CardBody.vue'
import { useUserStore } from '../stores/user'
import { CARD_THEMES } from '../constants/styles'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import 'vant/es/toast/style'

const router = useRouter()
const store = useUserStore()
const stage = ref('envelope')
const targetNickname = ref('')
const deliveredToNickname = ref('')
const content = ref('')
const styleId = ref(0)

// 页面背景逻辑
const pageBackgroundStyle = computed(() => {
    // 定义不同主题的浅色背景 (更丰富的渐变以支持动画)
    const bgMap = {
        0: 'linear-gradient(-45deg, #fff1f2, #ffe4e6, #fecdd3, #fda4af)', // Red theme -> Pinkish
        1: 'linear-gradient(-45deg, #fffbeb, #fef3c7, #fde68a, #fcd34d)', // Gold theme -> Yellowish
        2: 'linear-gradient(-45deg, #f3f4f6, #e5e7eb, #d1d5db, #9ca3af)'  // Ink theme -> Grayish
    }
    return {
        background: bgMap[styleId.value] || bgMap[0],
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite'
    }
})

// CSS Particles Helper
const currentThemeColor = computed(() => {
    return CARD_THEMES[styleId.value]?.primaryColor || '#d32f2f'
})

const getParticleStyle = (i) => {
    return {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        backgroundColor: currentThemeColor.value,
        opacity: 0.6, // 增加不透明度
        animationDelay: Math.random() * 2 + 's',
        animationDuration: (2 + Math.random() * 2) + 's'
    }
}

onMounted(async () => {
  // 自动查询最新状态
  if (store.uuid) {
      try {
        const newData = await store.checkMatchStatus()
        if (newData) {
            // 如果有新数据，store 已经更新了 match_data
            // 这里可以不做额外操作，因为下面的逻辑会从 store 读取
        }
      } catch (e) {
          console.error('Auto query failed:', e)
      }
  }

  if (!store.match_data) {
    router.replace('/')
    return
  }

  const m = store.match_data.target || {}
  targetNickname.value = m.nickname || '神秘人'
  content.value = m.content || '（这是一封空白的祝福）'
  deliveredToNickname.value = store.match_data.delivery?.receiverNickname || ''
  
  const id = Number(m.style_id)
  styleId.value = Object.prototype.hasOwnProperty.call(CARD_THEMES, id) ? id : 0
})

function onOpen() {
  stage.value = 'card'
}

function goHome() { 
  router.push('/') 
}

function goWishWall() {
    router.push('/wish-wall')
}

function resendWish() {
 
  setTimeout(() => {
    if (confirm('前往编写新的祝福')) {
        store.resetState()
        router.push('/write')
    }
  }, 100)
}
</script>

<style scoped>
.result-page {
    position: relative;
    min-height: 100vh;
    width: 100%; /* Fix: 100vw causes horizontal scrollbar */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow-x: hidden;
    color: #333; /* 字体改为深色 */
    transition: background 0.5s ease;
}

.pattern-overlay {
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.03'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
}

.content-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 420px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* 阶段切换动画 */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

@keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* 信封阶段 */
.stage-envelope {
    /* margin-top: 40px; removed to improve centering */
    animation: float 3s ease-in-out infinite;
}

/* 卡片阶段 */
.stage-card {
    width: 100%;
    position: relative;
}

.card-wrapper {
    position: relative;
    z-index: 20;
}

/* 装饰粒子 */
.particles-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5; /* Lower z-index to stay behind content */
}

.css-particle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: rise 3s ease-in-out infinite;
}

@keyframes rise {
    0% { transform: translateY(0) scale(1); opacity: 0.6; }
    100% { transform: translateY(-60vh) scale(0); opacity: 0; }
}

/* 操作区 */
.ops-section {
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
}

.success-tip-box {
    background: rgba(255, 255, 255, 0.6); /* 浅色半透明背景 */
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.tip-text {
    font-size: 12px;
    color: #4b5563; /* 深灰 */
    margin: 0;
    font-weight: 500;
}

.partner-info {
    font-size: 12px;
    color: #b91c1c; /* 深红强调 */
    margin-top: 4px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding-top: 4px;
    font-weight: bold;
}
.sep {
    margin: 0 6px;
    opacity: 0.7;
}

.btn-group {
    display: flex;
    gap: 12px;
}

.action-btn {
    flex: 1;
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
}

.primary-btn {
    background: linear-gradient(135deg, #d32f2f, #b71c1c);
    color: white;
    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
}
.primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(211, 47, 47, 0.4); }

.secondary-btn {
    background: white;
    color: #333;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.secondary-btn:hover { background: #f9fafb; border-color: rgba(0, 0, 0, 0.2); }

.outline-btn {
    background: transparent;
    border: 2px solid #b71c1c;
    color: #b71c1c;
    box-shadow: none;
}
.outline-btn:hover {
    background: rgba(183, 28, 28, 0.05);
}

@media (max-width: 480px) {
    .content-container { padding: 16px; }
}
</style>
