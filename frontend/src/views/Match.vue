<template>
  <div class="match-page">
    <!-- Canvas 背景 -->
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>
    
    <!-- 纹理层 -->
    <div class="pattern-overlay"></div>
    
    <!-- 云纹装饰 -->
    <div class="cloud-decoration"></div>

    <!-- 装饰性旋转圆环 -->
    <div class="rotate-ring ring-outer"></div>
    <div class="rotate-ring ring-inner"></div>

    <!-- 主体雷达区 -->
    <div class="radar-section">
        
        <!-- 动态波纹层 -->
        <div class="radar-pulse"></div>
        <div class="radar-ring" style="animation-delay: 0s"></div>
        <div class="radar-ring" style="animation-delay: 1.2s"></div>
        <div class="radar-ring" style="animation-delay: 2.4s"></div>

        <!-- 中心信封 -->
        <div class="envelope-float envelope-box">
            <span class="envelope-emoji">✉️</span>
            <!-- 信封阴影 -->
            <div class="envelope-shadow"></div>
        </div>

        <!-- 文本信息 -->
        <div class="text-section">
            <h2 class="match-title font-brush text-shine">寻找有缘人</h2>
            <p class="match-subtitle font-elegant">正在检索祝福池...</p>
        </div>

        <!-- 状态信息卡片 -->
        <div class="status-card">
            <div class="status-row success-text">
                <span class="check-icon">✓</span>
                <span>祝福已寄出</span>
            </div>
            
            <div class="status-divider"></div>
            
            <div class="status-row">
                <span class="label-text">等待时长</span>
                <span class="timer-text font-mono">
                    {{ formatTime(seconds) }}
                </span>
            </div>
        </div>

        <!-- 暂停/系统关闭提示 -->
        <div class="timeout-tip" v-if="isPaused">
             <p class="tip-text paused-text">管理员偷懒中，暂未开启匹配系统，请等候开启</p>
             <div class="btn-group">
                <button class="back-btn" @click="goHome">返回首页</button>
            </div>
        </div>

        <!-- 超时/等待提示 -->
        <div class="timeout-tip" v-else-if="showTimeoutTip">
            <p class="tip-text">当前匹配人数较多或较少，可能需要一点时间。</p>
            <div class="btn-group">
                <button class="back-btn" @click="goHome">先回首页，稍后再看</button>
                <button class="back-btn rewrite-btn" @click="rewrite">重新填写</button>
            </div>
        </div>

        <!-- 装饰性提示 -->
        <div class="loading-tip" v-else>
            <span class="dot-pulse"></span>
            <span>正在为您匹配最佳缘分</span>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const store = useUserStore()
const router = useRouter()
const seconds = ref(0)
const showTimeoutTip = ref(false)
const isPaused = ref(false)
let timer = null
let poller = null
const POLL_INTERVAL = 2000
const TIMEOUT_SECONDS = 30

const bgCanvas = ref(null)
let animationFrameId = null

const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
};

// Canvas Logic (Enhanced with Fireflies)
const initCanvas = () => {
    const canvas = bgCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let width, height, particles = []

    const resize = () => {
        width = canvas.width = window.innerWidth
        height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    class Particle {
        constructor() { this.reset() }
        reset() {
            this.x = Math.random() * width
            this.y = height + Math.random() * 200
            this.speed = 0.3 + Math.random() * 2
            this.size = 1.5 + Math.random() * 5
            this.opacity = 0.1 + Math.random() * 0.5
            
            const rand = Math.random()
            if (rand > 0.85) this.type = 'lantern'
            else if (rand > 0.65) {
                this.type = 'firefly'
                this.speed = 0.5 + Math.random() * 1.5
                this.size = 1 + Math.random() * 2
            } else this.type = 'coin'

            this.angle = Math.random() * Math.PI * 2
            this.spin = (Math.random() - 0.5) * 0.03
            this.wobble = Math.random() * 0.02
        }
        update() {
            this.y -= this.speed
            this.angle += this.spin
            this.x += Math.sin(this.angle * 2) * 0.8 + Math.sin(Date.now() * this.wobble) * 0.5
            if (this.y < -80) this.reset()
        }
        draw() {
            ctx.save()
            ctx.globalAlpha = this.opacity
            ctx.translate(this.x, this.y)
            ctx.rotate(this.angle)

            if (this.type === 'firefly') {
                ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(255, 215, 0, 0.9)'; ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill()
            } else if (this.type === 'coin') {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size)
                gradient.addColorStop(0, '#FFF59D'); gradient.addColorStop(1, '#FF8F00')
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill()
            } else {
                ctx.fillStyle = '#D32F2F'
                ctx.beginPath(); ctx.ellipse(0, 0, this.size * 2, this.size * 1.5, 0, 0, Math.PI * 2); ctx.fill()
            }
            ctx.restore()
        }
    }

    for(let i=0; i<80; i++) particles.push(new Particle())

    const animate = () => {
        ctx.clearRect(0, 0, width, height)
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
        bgGradient.addColorStop(0, '#2c0b0e'); bgGradient.addColorStop(1, '#0f0204')
        ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, width, height)
        particles.forEach(p => { p.update(); p.draw() })
        animationFrameId = requestAnimationFrame(animate)
    }
    animate()
}

onMounted(() => {
  initCanvas()
  
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
  
  checkStatus()
  poller = setInterval(checkStatus, POLL_INTERVAL)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (poller) clearInterval(poller)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

async function checkStatus() {
  try {
    if (!store.uuid) return
    const res = await request.get(`/card/my`, { params: { uuid: store.uuid, t: Date.now() } })
    const data = res?.data
    
    if (data) {
        if (data.status === 'MATCHED') {
            store.setMatched(data)
            router.replace('/result')
        } else if (data.status === 'NOT_FOUND') {
            store.setMatched(null)
            store.setSubmitted(false)
            router.replace('/write')
        } else if (data.status === 'PAUSED') {
            isPaused.value = true
        } else {
            isPaused.value = false
        }
    }
  } catch (e) {
    console.error('Polling error:', e)
  }
}

function goHome() {
  router.push('/')
}

function rewrite() {
    store.resetState()
    router.push('/write')
}
</script>


<style scoped>
.match-page {
    position: relative;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: white;
}

.bg-canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
}

.pattern-overlay {
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f8e5c0' fill-opacity='0.03'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
}

.cloud-decoration {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    background: linear-gradient(to bottom, rgba(211, 47, 47, 0.1), transparent);
    z-index: 2;
    pointer-events: none;
}

/* 旋转圆环 - 使用 vmin 适配 */
.rotate-ring {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    animation: rotate 30s linear infinite;
}
.ring-outer {
    width: 80vmin;
    height: 80vmin;
    max-width: 400px;
    max-height: 400px;
    border: 1px solid rgba(255, 215, 0, 0.1);
}
.ring-inner {
    width: 60vmin;
    height: 60vmin;
    max-width: 300px;
    max-height: 300px;
    border: 1px solid rgba(220, 38, 38, 0.1);
    animation-direction: reverse;
    animation-duration: 20s;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* 雷达区 */
.radar-section {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

/* 雷达波纹 - 使用 vmin 适配 */
.radar-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vmin;
    height: 80vmin;
    max-width: 400px;
    max-height: 400px;
    background: radial-gradient(circle, rgba(211, 47, 47, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    animation: pulse-scale 4s infinite ease-out;
    z-index: 1;
}

.radar-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 28vmin;
    height: 28vmin;
    max-width: 140px;
    max-height: 140px;
    border: 2px solid rgba(255, 215, 0, 0.5);
    border-radius: 50%;
    animation: ripple 4s infinite cubic-bezier(0, 0.2, 0.8, 1);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.25);
    pointer-events: none;
}

@keyframes pulse-scale {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

@keyframes ripple {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; border-width: 3px; }
    100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; border-width: 0px; }
}

/* 信封 - 使用相对单位 */
.envelope-box {
    position: relative;
    z-index: 20;
    width: 25vmin;
    height: 18vmin;
    max-width: 128px;
    max-height: 96px;
    background: linear-gradient(to bottom right, #dc2626, #991b1b);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 4px solid #7f1d1d;
    box-shadow: 
        0 0 60px rgba(211, 47, 47, 0.4),
        0 0 100px rgba(255, 215, 0, 0.2),
        inset 0 0 40px rgba(255, 255, 255, 0.1);
    animation: float 4s ease-in-out infinite, glow-pulse 3s infinite;
}

.envelope-emoji {
    font-size: 12vmin;
    line-height: 1;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
}
@media (min-width: 600px) {
    .envelope-emoji { font-size: 64px; }
}

.envelope-shadow {
    position: absolute;
    bottom: -20px;
    width: 80%;
    height: 10px;
    background: rgba(0,0,0,0.3);
    filter: blur(8px);
    border-radius: 50%;
}

/* 文本 - 调整间距 */
.text-section {
    margin-top: 8vh;
    text-align: center;
    position: relative;
    z-index: 20;
}

.match-title {
    font-size: 6vmin;
    margin-bottom: 8px;
    background: linear-gradient(90deg, #fff, #ffd700, #fff);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: text-shine 3s infinite linear;
}
@media (min-width: 600px) {
    .match-title { font-size: 32px; }
}

@keyframes text-shine {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.match-subtitle {
    color: #9ca3af;
    font-size: 3.5vmin;
    letter-spacing: 2px;
}
@media (min-width: 600px) {
    .match-subtitle { font-size: 14px; }
}

/* 状态卡片 */
.status-card {
    margin-top: 4vh;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 16px;
    padding: 16px 24px;
    width: 80vw;
    max-width: 260px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 20;
}

.status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.success-text {
    color: #4ade80;
    justify-content: flex-start;
    gap: 8px;
    font-size: 14px;
}
.status-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 12px 0;
}
.label-text { color: #d1d5db; font-size: 14px; }
.timer-text { color: #FFD700; font-size: 14px; letter-spacing: 1px; }

/* 提示 */
.loading-tip {
    margin-top: 4vh;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 12px;
    color: #6b7280;
    position: relative;
    z-index: 20;
}
.dot-pulse {
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

.timeout-tip {
    margin-top: 4vh;
    text-align: center;
    animation: fadeIn 0.5s;
    position: relative;
    z-index: 20;
}
.tip-text { font-size: 14px; color: #d1d5db; margin-bottom: 12px; }

.paused-text {
    color: #ff4d4f;
    font-weight: bold;
    font-size: 16px;
    background: rgba(0,0,0,0.6);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #ff4d4f;
}

.back-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #d1d5db;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
}
.back-btn:hover {
    border-color: #FFD700;
    color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
}

.btn-group {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.rewrite-btn {
    border-color: #fca5a5;
    color: #fca5a5;
}
.rewrite-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
}
</style>
