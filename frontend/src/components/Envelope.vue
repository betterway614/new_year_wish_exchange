<template>
  <div class="envelope-container">
    <div class="envelope" @click="open">
      <div class="envelope-flap"></div>
      <div class="envelope-content">
        <span class="envelope-icon">🧧</span>
      </div>
      <div class="seal-stamp">
        <span class="seal-text">福</span>
      </div>
    </div>
    
    <div class="hint-container">
      <div class="nickname-badge">
        <p class="nickname-text font-brush">
          来自 {{ nickname || '神秘人' }}
        </p>
      </div>
      <p class="click-hint">
        <span class="dot-pulse"></span>
        点击拆开祝福
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  nickname: { type: String, default: '' }
})
const emits = defineEmits(['open'])

function open() {
  emits('open')
}
</script>

<style scoped>
.envelope-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  perspective: 1000px;
}

.envelope {
  position: relative;
  width: 280px;
  height: 200px;
  background: linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%);
  border-radius: 12px;
  box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.6), /* Increased opacity */
      0 0 60px rgba(211, 47, 47, 0.5), /* Increased opacity */
      inset 0 0 30px rgba(255, 255, 255, 0.1);
  transform-style: preserve-3d;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.envelope::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L20 10L10 20L0 10Z' fill='%23f8e5c0' fill-opacity='0.1'/%3E%3C/svg%3E");
  border-radius: 12px;
  pointer-events: none;
}

.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(135deg, #c62828 0%, #e53935 100%);
  border-radius: 12px 12px 0 0;
  transform-origin: top;
  transform: rotateX(0deg);
  transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 2;
}

.envelope-flap::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L20 10L10 20L0 10Z' fill='%23f8e5c0' fill-opacity='0.15'/%3E%3C/svg%3E");
}

.envelope:hover {
  transform: scale(1.05);
  box-shadow: 
      0 30px 60px -12px rgba(0, 0, 0, 0.6),
      0 0 80px rgba(211, 47, 47, 0.4);
}

.envelope:hover .envelope-flap {
  transform: rotateX(-30deg);
}

/* 信封内容 */
.envelope-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.envelope-icon {
  font-size: 3rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  animation: float 3s ease-in-out infinite;
}

/* 封泥印章 */
.seal-stamp {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, #fbc02d, #f9a825);
  border: 3px solid #f8e5c0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  animation: pulse-glow 2s ease-in-out infinite;
}

.seal-text {
  font-family: "KaiTi", "STKaiti", "楷体", serif;
  color: #b71c1c;
  font-size: 1.2rem;
  transform: rotate(-15deg);
}

/* 提示区 */
.hint-container {
  text-align: center;
}

.nickname-badge {
  background: rgba(255, 255, 255, 0.9); /* Increased opacity for better visibility */
  backdrop-filter: blur(4px);
  padding: 8px 24px;
  border-radius: 50px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
  display: inline-block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Added shadow for depth */
}

.nickname-text {
  color: #b71c1c;
  font-size: 20px;
  letter-spacing: 2px;
  margin: 0;
  font-weight: bold;
}

.click-hint {
  color: #555;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  font-weight: 500;
}

.dot-pulse {
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
