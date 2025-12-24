<template>
  <div class="home-page min-h-screen relative flex flex-col items-center justify-between py-8 overflow-hidden text-white">
    
    <!-- 背景层 -->
    <div class="absolute inset-0 pattern-cloud pointer-events-none z-0"></div>
    <div class="absolute inset-0 bg-gradient-overlay pointer-events-none z-0"></div>

    <!-- 动态粒子层 (红包/金元宝/烟花) -->
    <div v-for="p in particles" :key="p.id" 
          class="particle text-2xl filter drop-shadow-md"
          :style="{
              left: p.left + '%',
              animationDuration: p.duration + 's',
              animationDelay: p.delay + 's',
              fontSize: p.size + 'px'
          }">
        {{ p.type }}
    </div>

    <!-- 头部区域 -->
    <div class="z-10 text-center mt-6 relative header-section">
        <!-- 装饰性小灯笼 -->
        <div class="lantern-deco lantern-left">🏮</div>
        <div class="lantern-deco lantern-right">🏮</div>
        
        <div class="logo-icon animate-bounce">🧧</div>
        <h1 class="main-title font-brush glow-text">新年悦换</h1>
        <div class="subtitle-wrapper">
            <div class="line-deco line-left"></div>
            <p class="subtitle font-elegant">2026 NEW YEAR EXCHANGE</p>
            <div class="line-deco line-right"></div>
        </div>
    </div>

    <!-- 计数器区域 -->
    <div class="z-10 counter-box backdrop-blur-md transform transition hover:scale-105 duration-300">
        <div class="live-indicator">
            <span class="ping-dot"></span>
            <span class="live-text">Live</span>
        </div>
        <div class="counter-divider"></div>
        <div class="counter-content">
            <span class="counter-label">现场已集结</span>
            <div class="counter-number-wrapper">
                <strong class="counter-number font-mono">{{ count }}</strong>
                <span class="counter-unit">人</span>
            </div>
        </div>
    </div>

    <!-- 核心视觉区 (灯笼) -->
    <div class="flex-1 flex items-center justify-center w-full z-0 relative lantern-section">
        <!-- 光晕背景 -->
        <div class="glow-bg glow-red"></div>
        <div class="glow-bg glow-gold"></div>
        
        <!-- 中心主灯笼 -->
        <div class="relative z-10 text-center lantern-swing" @click="fireworks">
            <div class="main-lantern">🏮</div>
            <div class="lantern-text">万 事 如 意</div>
        </div>
    </div>

    <!-- 底部按钮区 -->
    <div class="w-full px-8 z-10 mb-8 flex flex-col items-center gap-4 bottom-section">
        <button 
            class="start-btn btn-shine"
            @click="handleMainAction"
        >
            <span class="btn-icon">✍️</span> {{ mainButtonText }}
        </button>
        
        <div class="text-center mt-2 opacity-70">
            <div class="security-tip">
                <span class="shield-icon">🛡️</span>
                <p>需填写昵称参与 | 局域网安全环境</p>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import request from '../utils/request'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useUserStore()
const count = ref(0)
const particles = ref([])
let particleTimer = null

const mainButtonText = computed(() => {
  if (store.match_data) return '查看我的匹配结果'
  if (store.is_submitted) return '查看匹配进度'
  return '开始写祝福'
})

// 粒子系统
const createParticle = () => {
    const types = ['🧧', '🧨', '✨', '🏮', '🎆'];
    const type = types[Math.floor(Math.random() * types.length)];
    particles.value.push({
        id: Date.now() + Math.random(),
        type: type,
        left: Math.random() * 100,
        duration: 5 + Math.random() * 10, // 5-15秒下落时间
        delay: Math.random() * 5,
        size: 14 + Math.random() * 16 // 14-30px大小
    });

    if (particles.value.length > 30) {
        particles.value.shift();
    }
};

const fireworks = () => {
    for(let i=0; i<10; i++) {
        setTimeout(createParticle, i * 100);
    }
};

onMounted(async () => {
  store.ensureUUID()
  
  // 恢复状态检查
  if (store.is_submitted && !store.match_data) {
    try {
      await store.checkMatchStatus()
    } catch {
      // ignore
    }
  }

  // 获取计数
  try {
    const res = await request.get('/stats')
    count.value = res?.data?.count || 0
  } catch {
    count.value = 88 // Fallback for visual effect
  }

  // 启动粒子
  particleTimer = setInterval(createParticle, 800);
  for(let i=0; i<15; i++) createParticle();
})

onUnmounted(() => {
    if (particleTimer) clearInterval(particleTimer);
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
/* 页面容器 */
.home-page {
    background: linear-gradient(135deg, #B71C1C 0%, #880E4F 100%);
    min-height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    color: white;
}

/* 祥云背景 */
.pattern-cloud {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f8e5c0' fill-opacity='0.1'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 60px 60px;
    opacity: 0.3;
}

.bg-gradient-overlay {
    background: linear-gradient(to top, rgba(0,0,0,0.4), transparent, rgba(0,0,0,0.2));
}

/* 粒子 */
.particle {
    position: absolute;
    top: -50px;
    z-index: 5;
    pointer-events: none;
    animation: rain linear infinite;
}

@keyframes rain {
    0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
}

/* 头部 */
.header-section {
    position: relative;
    z-index: 10;
    margin-top: 40px;
    text-align: center;
}

.lantern-deco {
    position: absolute;
    top: -16px;
    font-size: 32px;
    opacity: 0.8;
    animation: swing 3s ease-in-out infinite;
    transform-origin: top center;
}
.lantern-left { left: -40px; }
.lantern-right { right: -40px; animation-delay: 1.5s; }

.logo-icon {
    font-size: 64px;
    margin-bottom: 8px;
    display: inline-block;
}

.main-title {
    font-size: 48px;
    font-weight: bold;
    color: #FFD700;
    letter-spacing: 0.2em;
    margin: 8px 0;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.6), 0 0 20px rgba(255, 0, 0, 0.8);
}

.subtitle-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 8px;
}

.line-deco {
    height: 1px;
    width: 40px;
    background: rgba(255, 215, 0, 0.5);
}
.line-left { background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.5)); }
.line-right { background: linear-gradient(to left, transparent, rgba(255, 215, 0, 0.5)); }

.subtitle {
    color: rgba(255, 249, 196, 0.9);
    font-size: 14px;
    letter-spacing: 0.3em;
    margin: 0;
}

/* 计数器 */
.counter-box {
    margin-top: 24px;
    background: rgba(139, 0, 0, 0.4);
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 16px;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: inset 0 0 15px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.1);
}

.live-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.ping-dot {
    width: 12px;
    height: 12px;
    background: #4ade80;
    border-radius: 50%;
    position: relative;
    box-shadow: 0 0 8px #4ade80;
}
.ping-dot::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: #4ade80;
    opacity: 0.4;
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ping {
    75%, 100% { transform: scale(2); opacity: 0; }
}

.live-text {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    margin-top: 4px;
}

.counter-divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 215, 0, 0.2);
}

.counter-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.counter-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 1px;
}

.counter-number-wrapper {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.counter-number {
    font-size: 24px;
    color: #FFD700;
    font-weight: bold;
}

.counter-unit {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
}

/* 灯笼区 */
.lantern-section {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
}

.glow-bg {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
}
.glow-red { width: 300px; height: 300px; background: rgba(220, 38, 38, 0.3); animation: pulse-glow 4s infinite; }
.glow-gold { width: 200px; height: 200px; background: rgba(255, 215, 0, 0.2); }

.lantern-swing {
    animation: swing 3s ease-in-out infinite;
    transform-origin: top center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.main-lantern {
    font-size: 160px;
    line-height: 1;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
    transition: transform 0.2s;
}
.main-lantern:active { transform: scale(0.95); }

.lantern-text {
    color: #FFD700;
    font-size: 14px;
    letter-spacing: 0.5em;
    font-weight: bold;
    margin-top: -20px;
    opacity: 0.8;
    animation: pulse-glow 2s infinite;
}

/* 底部按钮 */
.bottom-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40px;
}

.start-btn {
    width: 80%;
    max-width: 320px;
    height: 64px;
    background: linear-gradient(135deg, #FFD700 0%, #F57F17 100%);
    border: 2px solid #FFF9C4;
    border-radius: 32px;
    color: #880E4F;
    font-size: 24px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 8px 20px rgba(245, 127, 23, 0.4);
    transition: all 0.3s;
    cursor: pointer;
}
.start-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(245, 127, 23, 0.6);
}
.start-btn:active { transform: translateY(0); }

.btn-icon { font-size: 24px; }

.security-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
}
.security-tip p {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
}
</style>
