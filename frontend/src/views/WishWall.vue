<template>
  <div class="wish-wall-container">
    <!-- Background Layers -->
    <div class="cloud-background"></div>
    <div class="cloud-overlay"></div>
    
    <!-- Decorations -->
    <div class="decoration lantern" style="top: 10%; left: 10%;"></div>
    <div class="decoration lantern" style="top: 15%; right: 15%;"></div>
    <div class="decoration ingot" style="top: 20%; left: 30%;"></div>
    <div class="decoration ingot" style="top: 25%; right: 25%;"></div>

    <!-- Title -->
    <div class="title-decoration">
      <h1 class="main-title">福满乾坤</h1>
      <p class="sub-title">New Year Blessings Wall</p>
    </div>

    <!-- Blessings Container -->
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

    <!-- Control Panel -->
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
        清空屏幕
      </button>
      <button class="control-btn secondary" @click="$router.push('/')">
        返回首页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import request from '../utils/request'

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
  const top = Math.floor(Math.random() * 80) + 5
  const left = Math.floor(Math.random() * 85) + 5
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

  // Auto remove after 12 seconds (as per requirement)
  const lifeTimer = setTimeout(() => {
    removeBlessing(newBlessing.id)
  }, 12000)

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
  generatorTimer = setInterval(createBlessing, 800);
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
  await fetchBlessings()
  startGenerator()

  refreshTimer = setInterval(() => {
    fetchBlessings()
  }, 10000)
})

onUnmounted(() => {
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
  position: fixed; /* Changed to fixed to cover everything */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: "Ma Shan Zheng", "ZCOOL XiaoWei", serif;
  z-index: 100; /* Ensure it's on top */
  background: #5e0e1c;
}

/* ================= 背景层 ================= */
/* 动态云纹背景 */
.cloud-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #5e0e1c, #8b1a2e);
  z-index: -2;
}

/* 云纹动画层 */
.cloud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://t1.chatglm.cn/file/694a14f9ea7a889f596cd614.png?expired_at=1766894720&sign=2553a9932868d8b4314c8893be546829&ext=png');
  background-size: 300px 300px;
  background-repeat: repeat;
  opacity: 0.15;
  animation: cloudFloat 30s linear infinite;
  z-index: -1;
}

/* 云纹飘动动画 */
@keyframes cloudFloat {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(100px, -100px) rotate(5deg); }
}

/* ================= 祝福卡片样式 ================= */
.blessing-wall {
  position: relative;
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

/* 卡片出现动画 */
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
  background-color: #fff;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  /* 覆盖绝对定位，改为居中弹窗 */
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 10000 !important;
  
  /* 自适应尺寸 */
  width: 90vw;
  max-width: 500px;
  height: auto;
  min-height: 200px;
  padding: 30px;
  
  /* 可读性优化 */
  font-size: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 小屏适配 */
@media (max-width: 600px) {
    .blessing-card.pinned {
        width: 95vw;
        padding: 20px;
        font-size: 20px;
    }
}

.blessing-card.pinned .card-text {
    margin-bottom: 20px;
    line-height: 1.6;
}

.blessing-card.pinned .card-from {
    font-size: 18px;
    align-self: flex-end;
}

.blessing-card.pinned::after {
  content: "📌";
  position: absolute;
  top: 10px;
  right: 10px;
  left: auto;
  transform: none;
  font-size: 24px;
}

/* 固定卡片遮罩层 */
.blessing-card.pinned::before {
    content: '';
    position: fixed;
    top: -50vh;
    left: -50vw;
    width: 200vw;
    height: 200vh;
    background: rgba(0,0,0,0.5);
    z-index: -1;
    pointer-events: auto;
}

.card-text { margin-bottom: 8px; font-weight: bold; }
.card-from { font-size: 14px; color: #888; font-style: italic; }

/* 不同颜色的卡片变体 */
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
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 30px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.4);
  display: flex;
  gap: 15px;
  z-index: 1000;
  align-items: center;
}

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
}

.control-btn:hover { background: #a01830; transform: translateY(-2px); }
.control-btn.secondary { background: #666; }
.control-btn.secondary:hover { background: #444; }

.status-text {
  color: #333;
  font-size: 14px;
  min-width: 100px;
  text-align: center;
}

/* ================= 标题装饰 ================= */
.title-decoration {
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  z-index: 10001; /* 标题“福满乾坤”始终置顶 */
  pointer-events: none;
  text-align: center;
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
