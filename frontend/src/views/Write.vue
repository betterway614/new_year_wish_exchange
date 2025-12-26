<template>
  <div class="write-page">
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>
    
    <div class="pattern-overlay"></div>
    
    <div class="cloud-decoration"></div>

    <div class="nav-bar">
        <div class="nav-back group" @click="back">
            <div class="back-icon-bg">
                <svg class="back-arrow" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </div>
            <div class="nav-title-box">
                <span class="nav-title font-brush">新年悦换</span>
                <p class="nav-subtitle">NEW YEAR EXCHANGE</p>
            </div>
        </div>
    </div>

    <div class="glass-card festive-border no-scrollbar">
        
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>

        <div class="header-section">
            <div class="header-line"></div>
            <h1 class="page-title font-brush">撰写祝福</h1>
            <div class="subtitle-divider">
                <div class="h-px bg-l"></div>
                <p class="page-subtitle font-elegant">墨香寄情 · 福满人间</p>
                <div class="h-px bg-r"></div>
            </div>
        </div>

        <div class="form-section">
            
            <div class="form-group">
                <label class="form-label">
                    <span class="step-badge">1</span>
                    你的昵称
                    <span class="error-tip" v-if="nicknameError">{{ nicknameError }}</span>
                </label>
                <div class="input-wrapper">
                    <input 
                        v-model="nickname"
                        @input="handleInput" 
                        @blur="nicknameTouched=true"
                        type="text" 
                        placeholder="请输入您的昵称"
                        maxlength="10"
                        class="input-deco"
                        :disabled="isSubmitting"
                    >
                    <div class="input-suffix">
                        <div v-if="nickname" class="status-dot"></div>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">
                    <span class="step-badge badge-yellow">2</span>
                    新年寄语
                    <span class="error-tip" v-if="contentError">{{ contentError }}</span>
                </label>
                <div class="input-wrapper">
                    <textarea 
                        v-model="content"
                        @input="handleContentInput" 
                        @blur="contentTouched=true"
                        rows="5" 
                        maxlength="200"
                        placeholder="写下您对有缘人的新年祝愿，字字珠玑，句句真情..."
                        class="input-deco textarea-deco"
                        :disabled="isSubmitting"
                    ></textarea>
                    <div class="char-count" :class="{'text-red': content.length >= 200}">
                        {{ content.length }}/200
                    </div>
                </div>
                
                <div class="tags-wrapper">
                    <span 
                        v-for="tag in tags" 
                        :key="tag" 
                        @click="fillTemplate(tag)"
                        class="seal-tag"
                    >
                        <span class="tag-icon">✦</span> {{ tag }}
                    </span>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">
                    <span class="step-badge badge-purple">3</span>
                    选择祥瑞卡面
                </label>
                <div class="style-grid">
                    <div v-for="t in themeList" :key="t.id" 
                            @click="selectStyle(t.id)"
                            :class="['style-card', styleId === t.id ? 'active' : 'inactive']">
                        
                        <div :class="t.cssClass" class="style-bg"></div>
                        
                        <div class="style-content">
                            <div class="style-icon">{{ t.icon }}</div>
                            <span class="style-name">{{ t.name }}</span>
                        </div>

                        <div v-if="styleId === t.id" class="check-mark">✓</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bottom-bar">
        <button 
            @click="submit"
            :disabled="!canSubmit || isSubmitting"
            class="submit-btn btn-shine"
            :class="{ disabled: !canSubmit || isSubmitting }"
        >
            <span v-if="!isSubmitting">投递祝福</span>
            <span v-else>祈福投递中...</span>
        </button>
        <p class="bottom-tip">✨ 您的祝福将随机匹配一位有缘人</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CARD_THEMES } from '../constants/styles'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import wordFilter from '../utils/wordFilter'

const store = useUserStore()
const router = useRouter()
const nickname = ref('')
const content = ref('')
const styleId = ref(0)
const nicknameTouched = ref(false)
const contentTouched = ref(false)
const isSubmitting = ref(false)
const themeList = Object.values(CARD_THEMES)
const tags = ['万事顺遂', '升职加薪', '平安喜乐', '财源广进', '身体健康', '学业有成', '心想事成', '阖家欢乐'];

// Canvas Animation
const bgCanvas = ref(null)
let animationFrameId = null
let canvasResizeHandler = null

// Canvas Logic
const initCanvas = () => {
    const canvas = bgCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let width, height, particles = []

    const resize = () => {
        const vv = window.visualViewport
        const nextW = Math.round(vv?.width || document.documentElement.clientWidth || window.innerWidth)
        const nextH = Math.round(vv?.height || document.documentElement.clientHeight || window.innerHeight)
        width = canvas.width = nextW
        height = canvas.height = nextH
    }
    canvasResizeHandler = resize
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    resize()

    class Particle {
        constructor() { this.reset() }
        reset() {
            this.x = Math.random() * width
            this.y = height + Math.random() * 150
            this.speed = 0.3 + Math.random() * 2
            this.size = 1.5 + Math.random() * 5
            this.opacity = 0.1 + Math.random() * 0.5
            this.type = Math.random() > 0.85 ? 'lantern' : 'coin'
            this.angle = Math.random() * Math.PI * 2
            this.spin = (Math.random() - 0.5) * 0.03
            this.wobble = Math.random() * 0.02
        }
        update() {
            this.y -= this.speed
            this.angle += this.spin
            this.x += Math.sin(this.angle * 2) * 0.8 + Math.sin(Date.now() * this.wobble) * 0.5
            if (this.y < -60) this.reset()
        }
        draw() {
            ctx.save()
            ctx.globalAlpha = this.opacity
            ctx.translate(this.x, this.y)
            ctx.rotate(this.angle)
            
            if (this.type === 'coin') {
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

    for(let i=0; i<60; i++) particles.push(new Particle())

    const animate = () => {
        ctx.clearRect(0, 0, width, height)
        // Bg Gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
        bgGradient.addColorStop(0, '#2c0b0e'); bgGradient.addColorStop(1, '#0f0204')
        ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, width, height)

        particles.forEach(p => { p.update(); p.draw() })
        animationFrameId = requestAnimationFrame(animate)
    }
    animate()
}

// 防抖计时器
let debounceTimer = null

onMounted(() => {
  store.ensureUUID()
  store.loadForm()
  nickname.value = store.nickname
  content.value = store.content
  styleId.value = store.style_id
  wordFilter.init()
  initCanvas()
})

onUnmounted(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    if (canvasResizeHandler) {
        window.removeEventListener('resize', canvasResizeHandler)
        window.visualViewport?.removeEventListener('resize', canvasResizeHandler)
        canvasResizeHandler = null
    }
})

// 验证逻辑
const nicknameError = computed(() => {
  if (!nicknameTouched.value) return ''
  if (!nickname.value) return '请填写昵称'
  const check = wordFilter.validate(nickname.value)
  if (!check.valid) return `包含敏感词（${check.word || '未知'}），阳光向上正能量喔☀️`
  if (nickname.value.length < 2) return '至少2字'
  if (nickname.value.length > 10) return '最多10字'
  return ''
})

const contentError = computed(() => {
  if (!contentTouched.value) return ''
  if (!content.value) return '请填写祝福'
  const check = wordFilter.validate(content.value)
  if (!check.valid) return `包含敏感词（${check.word || '未知'}），阳光向上正能量喔☀️`
  if (content.value.length < 4) return '至少4字'
  if (content.value.length > 200) return '最多200字'
  return ''
})

const canSubmit = computed(() => {
  return nickname.value.length >= 2 && 
         nickname.value.length <= 10 && 
         content.value.length >= 4 && 
         content.value.length <= 200 &&
         !nicknameError.value && 
         !contentError.value
})

function persistDraft() {
  store.setForm({ nickname: nickname.value, content: content.value, style_id: styleId.value })
}

function handleInput() {
  nicknameTouched.value = true
  debouncePersist()
}

function handleContentInput() {
  contentTouched.value = true
  debouncePersist()
}

function selectStyle(id) {
    styleId.value = id
    persistDraft()
}

function fillTemplate(text) {
    content.value = content.value ? content.value + "，" + text : text;
    contentTouched.value = true;
    debouncePersist();
}

function debouncePersist() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    persistDraft()
  }, 500)
}

async function submit() {
  console.log('[Write] Submit button clicked')
  nicknameTouched.value = true
  contentTouched.value = true
  
  if (!canSubmit.value) {
    console.warn('[Write] Validation failed:', {
        nick: nicknameError.value,
        content: contentError.value
    })
    return
  }
  
  persistDraft()
  isSubmitting.value = true
  try {
    console.log('[Write] Sending request...')
    await store.submitCard()
    console.log('[Write] Submit success')
    router.push('/match')
  } catch(e) {
    console.error('[Write] Submit error:', e)
    alert(e.message || '提交失败')
  } finally {
    isSubmitting.value = false
  }
}

function back() { 
  router.push('/')
}
</script>

<style scoped>
/* 页面基础 */
.write-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: #333;
    /* 移除 padding-bottom，因为卡片和底部栏现在是独立定位的 */
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

/* 导航 */
.nav-bar {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 200; /* 确保在卡片之上 */
    padding: 12px 16px;
    display: flex;
    align-items: center;
}

.nav-back {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.back-icon-bg {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}
.nav-back:hover .back-icon-bg {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.back-arrow { color: white; width: 20px; height: 20px; }

.nav-title {
    color: white;
    font-size: 20px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.nav-subtitle {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 2px;
    margin: 0;
}

/* 核心修改：玻璃卡片适配
  使用 fixed 定位，但通过 inset 留出上下空间，避免遮挡
*/
.glass-card {
    position: fixed;
    
    /* 上部留出导航栏高度，下部留出底部按钮高度，两侧留出边距 */
    top: 68px;
    bottom: 120px; /* 这个高度确保卡片底部不会被按钮遮挡 */
    left: 20px;
    right: 20px;
    
    margin: auto; /* 在上述限制区域内垂直水平居中 */
    
    /* 尺寸限制 */
    width: 100%;
    max-width: 600px;
    height: fit-content; /* 根据内容自适应高度 */
    
    /* 关键：防止小屏幕下内容溢出，且不遮挡上下区域 */
    max-height: calc(100vh - 188px); /* 视口减去(top+bottom)的安全距离 */
    overflow-y: auto; /* 内容过多时内部滚动 */
    
    /* 视觉样式 */
    z-index: 50; /* 比导航和底部栏低 */
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.85) 100%);
    backdrop-filter: blur(16px);
    border: 2px solid rgba(255, 215, 0, 0.4);
    border-radius: 24px;
    padding: 32px 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
    box-sizing: border-box;
}

.decoration-circle {
    position: absolute;
    border-radius: 50%;
    border: 2px dashed rgba(255, 215, 0, 0.3);
    animation: spin-slow 20s linear infinite;
    pointer-events: none;
}
.circle-1 { width: 300px; height: 300px; top: -150px; left: -150px; opacity: 0.2; }
.circle-2 { width: 200px; height: 200px; bottom: -100px; right: -100px; opacity: 0.15; animation-direction: reverse; }

/* 标题 */
.header-section {
    text-align: center;
    margin-bottom: 32px;
}
.page-title {
    font-size: 36px;
    background: linear-gradient(to right, #b91c1c, #d97706);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 8px 0;
}
.subtitle-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}
.h-px { flex: 1; height: 1px; max-width: 60px; }
.bg-l { background: linear-gradient(to right, transparent, #fca5a5); }
.bg-r { background: linear-gradient(to left, transparent, #fca5a5); }
.page-subtitle { font-size: 14px; color: #666; margin: 0; }

/* 表单 */
.form-group { margin-bottom: 24px; }

.form-label {
    display: flex;
    align-items: center;
    font-weight: bold;
    color: #333;
    margin-bottom: 12px;
}
.step-badge {
    width: 24px;
    height: 24px;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    margin-right: 8px;
}
.badge-yellow { background: #fef3c7; color: #d97706; }
.badge-purple { background: #f3e8ff; color: #7e22ce; }

.error-tip {
    margin-left: auto;
    font-size: 12px;
    color: #dc2626;
    font-weight: normal;
}

.input-wrapper { position: relative; }

.input-deco {
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
    border: 2px solid transparent;
    background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6));
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.3s;
    outline: none;
}
.input-deco:focus {
    border-color: rgba(211, 47, 47, 0.5);
    background: white;
    box-shadow: 0 8px 30px rgba(211, 47, 47, 0.15);
}

.input-suffix {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
}
.status-dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 8px #22c55e;
}

.textarea-deco { resize: none; }
.char-count {
    position: absolute;
    bottom: 12px;
    right: 12px;
    font-size: 12px;
    color: #999;
}
.text-red { color: #dc2626; }

/* 标签 */
.tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}
.seal-tag {
    padding: 6px 12px;
    background: linear-gradient(135deg, #B71C1C 0%, #D32F2F 100%);
    color: white;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #FFD700;
    transition: transform 0.2s;
}
.seal-tag:hover { transform: scale(1.05); }
.tag-icon { color: #FFD700; margin-right: 4px; }

/* 风格选择 */
.style-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}
.style-card {
    position: relative;
    height: 100px;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
}
.style-card.active {
    transform: scale(1.05);
    border-color: #FFD700;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
.style-card.inactive {
    opacity: 0.7;
    filter: grayscale(0.5);
}
.style-bg {
    position: absolute;
    inset: 0;
}
.theme-red { background: linear-gradient(to bottom right, #dc2626, #7f1d1d); }
.theme-gold { background: linear-gradient(to bottom right, #d97706, #78350f); }
.theme-ink { background: linear-gradient(to bottom right, #4b5563, #111827); }

.style-content {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
}
.style-icon { font-size: 24px; margin-bottom: 4px; }
.style-name { font-size: 12px; font-weight: bold; }

.check-mark {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 16px;
    height: 16px;
    background: #FFD700;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #B71C1C;
    z-index: 2;
}

/* 底部按钮 */
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
    background: linear-gradient(to top, rgba(26, 5, 7, 0.95), transparent);
    z-index: 200; /* 确保最高层级 */
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
}

.submit-btn {
    width: 100%;
    max-width: 400px;
    height: 56px;
    border-radius: 28px;
    border: none;
    background: linear-gradient(to right, #b91c1c, #d97706);
    color: white;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(185, 28, 28, 0.4);
    transition: all 0.3s;
}
.submit-btn:not(.disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(185, 28, 28, 0.5);
}
.submit-btn.disabled {
    background: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
}

.bottom-tip {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 12px;
    text-align: center;
    line-height: 1.3;
    max-width: 420px;
}

@media (max-width: 640px) {
    .nav-bar { padding: 10px 12px; }
    .back-icon-bg { width: 36px; height: 36px; }
    .nav-title { font-size: 18px; }
    .cloud-decoration { height: 88px; }

    /* 移动端适配 */
    .glass-card {
        top: 60px;
        bottom: 110px; /* 移动端底部按钮区域较紧凑，留足空间 */
        left: 16px;
        right: 16px;
        width: auto; /* 重置固定宽度，跟随 inset */
        padding: 22px 14px;
        border-radius: 20px;
        max-height: calc(100vh - 170px);
    }

    .header-section { margin-bottom: 22px; }
    .page-title { font-size: 28px; }
    .page-subtitle { font-size: 13px; }
    .form-group { margin-bottom: 18px; }
    .input-deco { padding: 14px; }
    .style-grid { gap: 8px; }
    .style-card { height: 90px; }

    .bottom-bar { padding: 12px 12px calc(12px + env(safe-area-inset-bottom)); }
    .submit-btn { height: 52px; font-size: 16px; border-radius: 26px; }
    .bottom-tip { margin-top: 10px; }
}
</style>