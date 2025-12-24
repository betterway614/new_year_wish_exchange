<template>
  <div class="wish-wall-container">
    
    <div class="cloud-background"></div>
    <div class="cloud-overlay"></div>

    <div class="wall-scaler" :style="scalerStyle">
      
      <div class="decoration lantern" style="top: 10%; left: 10%;"></div>
      <div class="decoration lantern" style="top: 15%; right: 15%;"></div>
      <div class="decoration ingot" style="top: 20%; left: 30%;"></div>
      <div class="decoration ingot" style="top: 25%; right: 25%;"></div>

      <div class="title-decoration">
        <h1 class="main-title">福满乾坤</h1>
        <p class="sub-title">New Year Blessings Wall</p>
      </div>

      <transition-group name="list" tag="div" class="blessing-wall">
        <div 
          v-for="item in blessings" 
          :key="item.id"
          class="blessing-card"
          :class="['card-style-' + item.styleIndex, { pinned: item.isPinned }]"
          :style="!item.isPinned ? { 
            top: item.top + '%', 
            left: item.left + '%', 
            '--rotation': `${item.rotation}deg`,
            zIndex: item.zIndex 
          } : {}"
          @click.stop="togglePin(item)"
          title="点击可以固定/取消固定"
        >
          <div class="card-text">{{ item.text }}</div>
          <div class="card-from">—— {{ item.from }}</div>
        </div>
      </transition-group>
    </div>

    <div class="control-panel">
      <button class="control-btn" @click="toggleGenerator">
        {{ isGenerating ? '暂停生成' : (loadError ? '重试加载' : '继续生成') }}
      </button>
      <div class="status-text">
        <template v-if="isLoading">加载中...</template>
        <template v-else-if="loadError">{{ loadError }}</template>
        <template v-else>屏幕祝福: {{ blessings.length }} 条</template>
      </div>
      <button class="control-btn secondary" @click="clearAll">
        清空
      </button>
      <button class="control-btn secondary" @click="$router.push('/')">
        返回
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import request from '../utils/request'

// === 缩放与布局核心逻辑 ===
const DESIGN_WIDTH = 1200 
const scaleRatio = ref(1)
const windowHeight = ref(800)

const scalerStyle = computed(() => {
  return {
    width: `${DESIGN_WIDTH}px`,
    // 高度反向补偿，确保缩放后正好填满垂直屏幕
    height: `${windowHeight.value / scaleRatio.value}px`,
    
    // 核心修改：居中定位
    position: 'absolute',
    top: '0',
    left: '50%', 
    marginLeft: `-${DESIGN_WIDTH / 2}px`, // 负边距居中法
    
    // 核心修改：从顶部中心开始缩放
    transformOrigin: 'top center',
    transform: `scale(${scaleRatio.value})`
  }
})

const updateScale = () => {
  const w = window.innerWidth
  const h = window.innerHeight
  windowHeight.value = h
  // 计算缩放比：如果屏幕宽 > 设计宽，保持 1 (不放大，留白)；否则缩小适应
  scaleRatio.value = Math.min(w / DESIGN_WIDTH, 1) 
}
// ==========================

const blessings = ref([])
const isGenerating = ref(false)
const isLoading = ref(false)
const loadError = ref('')
const blessingDatabase = ref([])
let generatorTimer = null
let idCounter = 0
let zIndexCounter = 0
let refreshTimer = null

const normalizeStyleIndex = (styleId) => {
  const n = Number(styleId)
  if (Number.isFinite(n)) {
    const v = n + 1
    if (v >= 1 && v <= 3) return v
  }
  return Math.floor(Math.random() * 3) + 1
}

const fetchBlessings = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await request.get(`/card/wall?t=${Date.now()}`)
    if (res.code === 0 && Array.isArray(res.data) && res.data.length > 0) {
      blessingDatabase.value = res.data
    } else {
      blessingDatabase.value = []
      loadError.value = '暂无祝福数据'
    }
  } catch (e) {
    blessingDatabase.value = []
    loadError.value = e?.message || '加载失败'
  } finally {
    isLoading.value = false
  }
}

const createBlessing = () => {
  if (blessingDatabase.value.length === 0) return

  const randomMsg = blessingDatabase.value[Math.floor(Math.random() * blessingDatabase.value.length)]
  const top = Math.floor(Math.random() * 80) + 10 
  const left = Math.floor(Math.random() * 80) + 10
  const rotation = Math.floor(Math.random() * 20) - 10
  const zIndex = ++zIndexCounter

  const newBlessing = {
    id: idCounter++,
    text: randomMsg.content,
    from: randomMsg.nickname,
    top: top,
    left: left,
    rotation: rotation,
    zIndex: zIndex,
    styleIndex: normalizeStyleIndex(randomMsg.style_id),
    isPinned: false,
    timer: null
  }

  blessings.value.push(newBlessing)

  const lifeTimer = setTimeout(() => {
    removeBlessing(newBlessing.id)
  }, 18000)

  newBlessing.timer = lifeTimer
}

const removeBlessing = (id) => {
  const index = blessings.value.findIndex(b => b.id === id)
  if (index !== -1) {
    blessings.value.splice(index, 1)
  }
}

const togglePin = (item) => {
  if (item.isPinned) {
    item.isPinned = false;
    item.timer = setTimeout(() => removeBlessing(item.id), 12000);
  } else {
    item.isPinned = true;
    if (item.timer) clearTimeout(item.timer);
  }
};

const startGenerator = () => {
  if (isGenerating.value) return
  if (blessingDatabase.value.length === 0) return
  createBlessing();
  generatorTimer = setInterval(createBlessing, 500);
  isGenerating.value = true;
};

const stopGenerator = () => {
  if (generatorTimer) {
    clearInterval(generatorTimer);
    generatorTimer = null;
  }
  isGenerating.value = false;
};

const toggleGenerator = () => {
  if (isGenerating.value) {
    stopGenerator();
  } else {
    if (blessingDatabase.value.length > 0) {
      startGenerator();
      return
    }
    fetchBlessings().then(() => {
      startGenerator()
    })
  }
};

const clearAll = () => {
  blessings.value.forEach(b => {
    if (b.timer) clearTimeout(b.timer);
  });
  blessings.value = [];
};

onMounted(async () => {
  updateScale()
  window.addEventListener('resize', updateScale)

  await fetchBlessings()
  startGenerator()

  refreshTimer = setInterval(() => {
    fetchBlessings()
  }, 10000)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
  stopGenerator()
  clearAll()
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
/* ================= 基础变量与重置 ================= */
:root {
  --primary-red: #c41e3a;
  --bg-dark-red: #5e0e1c;
  --gold: #ffd700;
  --paper-light: #fffbf0;
  --paper-red: #fff0f0;
  --shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.wish-wall-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden; 
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", serif;
  z-index: 100;
  background: #5e0e1c; /* 底色 */
}

/* ================= 背景层 (从 Scaler 中移出) ================= */
.cloud-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #5e0e1c, #8b1a2e);
  z-index: -2;
}

.cloud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; /* 始终覆盖全屏 */
  height: 100%;
  background-image: url('https://t1.chatglm.cn/file/694a14f9ea7a889f596cd614.png?expired_at=1766894720&sign=2553a9932868d8b4314c8893be546829&ext=png');
  background-size: 500px 500px; /* 增大尺寸减少重复感 */
  background-repeat: repeat;
  opacity: 0.12;
  /* 改进：确保位移距离与 size 一致以实现无缝循环 */
  animation: cloudLoop 60s linear infinite;
  z-index: -1;
}

@keyframes cloudLoop {
  0% { background-position: 0 0; }
  100% { background-position: 500px -500px; } /* 移动一个完整周期的距离 */
}

/* ================= 祝福卡片样式 ================= */
.blessing-wall {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.blessing-card {
  position: absolute;
  width: 180px;
  padding: 15px;
  background: #fffbf0;
  border: 1px solid #ffd700;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  color: #5e0e1c;
  font-size: 16px;
  line-height: 1.4;
  text-align: center;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  outline: 3px double rgba(196, 30, 58, 0.2);
  outline-offset: -4px;
  animation: cardAppear 0.6s ease-out;
  font-family: "ZCOOL XiaoWei", serif;
  transform: rotate(var(--rotation));
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: rotate(var(--rotation)) scale(0.85);
  }
  to {
    opacity: 1;
    transform: rotate(var(--rotation)) scale(1);
  }
}

.blessing-card:hover {
  z-index: 999 !important;
  transform: rotate(var(--rotation)) scale(1.1) !important;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  background: #fff;
}

/* 固定卡片（弹窗） */
.blessing-card.pinned {
  border-color: #c41e3a;
  background-color: #ffffff !important;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  
  position: absolute !important; 
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important; 
  z-index: 10000 !important;
  isolation: isolate;
  
  /* === 核心修改点开始 === */
  /* 默认情况（针对大屏/电脑）：
     使用固定宽度，模拟信纸感觉，不至于太宽难读 
  */
  width: 600px; 
  max-width: 90%; /* 防止极端情况溢出 */
  
  padding: 40px;
  font-size: 24px; /* 电脑端字号 */
  /* === 核心修改点结束 === */

  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 300px;
  height: auto;
}
/* 针对小屏幕（手机）的特殊处理 */
@media screen and (max-width: 768px) {
  .blessing-card.pinned {
    /* 1. 宽度加大：从 85% 增加到 92%，让卡片更宽，利用率更高 */
    width: 110% !important; 
    
    /* 2. 内边距调整：稍微减小内边距，给文字腾地方 */
    padding: 30px 20px !important;
    
    /* 3. 正文字号大幅增大：
       原理：目标视觉大小 16px / 缩放比例 0.3 ≈ 54px 
    */
    font-size: 54px !important; 
    line-height: 1.6 !important;
  }
  
  /* 4. 针对落款（From）的单独调整 */
 .blessing-card.pinned .card-text,
 .blessing-card.pinned .card-from {
  position: relative !important; /* 必须有 position 才能使用 z-index */
  z-index: 10 !important;        /* 正数，保证在遮罩(负数)之上 */
  text-shadow: none !important;  /* 去除可能导致模糊的阴影 */
}
  
  /* 5. 针对图钉图标的调整 */
  .blessing-card.pinned::after {
    z-index: 10 !important; /* 图钉图标要在最上层 */
    font-size: 60px !important; /* 图标也要跟着变大 */
    top: 20px !important;
    right: 20px !important;
  }
}
  
  .blessing-card.pinned .card-text {
    line-height: 1.5;
  }


.blessing-card.pinned .card-text {
    margin-bottom: 20px;
    line-height: 1.6;
}

.blessing-card.pinned .card-text,
.blessing-card.pinned .card-from {
    position: relative;
    z-index: 1;
}

.blessing-card.pinned .card-from {
    font-size: 22px;
    align-self: flex-end;
}

.blessing-card.pinned::after {
  content: "📌";
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 32px;
  z-index: 2;
}

/* 遮罩层：扩大范围以覆盖可能的宽屏区域 */
/* 固定卡片（弹窗）的背景遮罩层优化 */
.blessing-card.pinned::before {
    content: '';
    position: absolute;
    /* 覆盖范围保持不变，确保足够大 */
    top: -200%;
    left: -200%;
    width: 500%;
    height: 500%;
    
    /* === 核心修改开始 === */
    
    /* 1. 颜色减淡：从 0.6 降至 0.2，减少"黑压压"的感觉 */
    background: rgba(0, 0, 0, 0.1); 
    
    /* 2. 增加磨砂质感：模糊背景，营造景深，聚焦前景 */
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px); /* 兼容 Safari / iOS */
    
    /* 3. (可选) 如果想要更喜庆，可以用极淡的深红色代替黑色
       background: rgba(50, 0, 0, 0.3); 
    */
    
    /* === 核心修改结束 === */
    
    z-index: 0 !important;
    pointer-events: auto;
    
    /* 增加一个渐变过渡，让遮罩出现得更柔和 */
    pointer-events: auto; /* 允许点击遮罩关闭 */
    transition: all 0.3s ease;
}

.card-text { margin-bottom: 8px; font-weight: bold; }
.card-from { font-size: 14px; color: #888; font-style: italic; }

.card-style-1 { background: #fff; }
.card-style-2 { background: #fffbf0; border-color: #daa520; }
.card-style-3 { background: #fff0f5; border-color: #db7093; color: #8b0a50; }

/* ================= 装饰元素 ================= */
.decoration {
  position: absolute;
  opacity: 0.2;
  pointer-events: none;
  z-index: -1;
}

.lantern {
  position: absolute;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, #ff6b6b, #c41e3a);
  border-radius: 50%;
  box-shadow: 0 0 20px #ff6b6b;
  animation: lanternGlow 3s ease-in-out infinite;
}

@keyframes lanternGlow {
  0%, 100% { box-shadow: 0 0 20px #ff6b6b; }
  50% { box-shadow: 0 0 30px #ff6b6b, 0 0 40px #ff6b6b; }
}

.ingot {
  position: absolute;
  width: 60px;
  height: 30px;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  border-radius: 5px;
  transform: rotate(45deg);
  animation: ingotShine 4s ease-in-out infinite;
}

@keyframes ingotShine {
  0%, 100% { transform: rotate(45deg) scale(1); }
  50% { transform: rotate(45deg) scale(1.1); }
}

/* ================= Vue 动画 ================= */
.list-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.list-leave-active {
  transition: all 0.6s ease-in;
}
.list-enter-from {
  opacity: 0;
  transform: rotate(var(--rotation)) scale(0.85);
}
.list-leave-to {
  opacity: 0;
  transform: rotate(var(--rotation)) scale(0.92);
}

/* ================= 底部控制面板 ================= */
.control-panel {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 20px;
  border-radius: 30px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.4);
  display: flex;
  gap: 12px;
  z-index: 1000;
  align-items: center;
  white-space: nowrap; 
  max-width: 95vw;
  overflow-x: auto;
}

.control-panel::-webkit-scrollbar { display: none; }

.control-btn {
  border: none;
  background: #c41e3a;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  font-size: 14px;
  flex-shrink: 0;
}

.control-btn:hover { background: #a01830; transform: translateY(-2px); }
.control-btn.secondary { background: #666; }
.control-btn.secondary:hover { background: #444; }

.status-text {
  color: #333;
  font-size: 14px;
  text-align: center;
  flex-shrink: 0;
}

/* ================= 标题装饰 ================= */
.title-decoration {
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  z-index: 10001; 
  pointer-events: none;
  text-align: center;
  width: 100%;
}

.main-title {
  font-size: 4rem;
  margin-bottom: 0.5rem;
  letter-spacing: 0.2rem;
  font-weight: bold;
  animation: titleGlow 3s ease-in-out infinite;
  font-family: "Ma Shan Zheng", serif;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
  50% { text-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4); }
}

.sub-title {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  font-family: "ZCOOL XiaoWei", serif;
}
</style>
