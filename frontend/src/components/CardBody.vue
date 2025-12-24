<template>
  <div class="greeting-card" :class="themeClass">
    <div class="card-body">
      <!-- 纹理装饰 -->
      <div class="card-decoration"></div>
      <div class="cloud-pattern"></div>
      
      <!-- 角落装饰 -->
      <div class="corner-decoration corner-tl"></div>
      <div class="corner-decoration corner-tr"></div>
      <div class="corner-decoration corner-bl"></div>
      <div class="corner-decoration corner-br"></div>

      <!-- 卡片图标 -->
      <div class="card-icon">
        {{ themeConfig.icon }}
      </div>

      <!-- 卡片内容 -->
      <div class="content-wrapper">
        <div class="card-header">
          <span class="icon">✉️</span>
          <h2 class="title font-elegant">To: 有缘人</h2>
        </div>
        
        <div class="divider"></div>
        
        <div class="message-content font-serif">
          <slot name="content"></slot>
        </div>
        
        <div class="card-footer">
          <p class="from-label">From</p>
          <div class="from-info">
            <p class="nickname font-elegant"><slot name="nickname"></slot></p>
            <div class="card-seal font-brush">福</div>
          </div>
        </div>
      </div>

      <!-- 底部装饰线 -->
      <div class="bottom-line"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CARD_THEMES } from '../constants/styles'

const props = defineProps(['styleId'])
const themeConfig = computed(() => CARD_THEMES[props.styleId] || CARD_THEMES[0])
const themeClass = computed(() => themeConfig.value.cssClass)
</script>

<style scoped>
/* 卡片容器与动画 */
.greeting-card {
  position: relative;
  transform-style: preserve-3d;
  animation: card-appear 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  background: #fff; /* Fallback */
}

@keyframes card-appear {
  0% { opacity: 0; transform: scale(0.5) translateY(100px) rotateX(-20deg); }
  100% { opacity: 1; transform: scale(1) translateY(0) rotateX(0deg); }
}

.card-body {
  position: relative;
  padding: 24px 32px;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

/* 纹理装饰 */
.card-decoration {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.03'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

.cloud-pattern {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23f8e5c0' fill-opacity='0.05' d='M50 10c15 0 25 15 25 30s-10 25-25 25-25-15-25-30 10-25 25-30z'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  pointer-events: none;
  z-index: 0;
}

/* 角落装饰 */
.corner-decoration {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px dashed currentColor;
  opacity: 0.3;
  z-index: 1;
}
.corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
.corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
.corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
.corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; }

/* 图标 */
.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  position: absolute;
  top: 24px;
  right: 32px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 2;
}

/* 内容区域 */
.content-wrapper {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.card-header .icon { font-size: 24px; }
.card-header .title {
  font-size: 18px;
  font-weight: bold;
  opacity: 0.8;
  margin: 0;
}

.divider {
  width: 100%;
  height: 1px;
  background: currentColor;
  opacity: 0.2;
  margin: 12px 0;
}

.message-content {
  font-size: 16px;
  line-height: 1.8;
  text-align: justify;
  flex: 1;
  min-height: 120px;
  white-space: pre-wrap;
  word-break: break-all;
}

.card-footer {
  margin-top: 24px;
  text-align: right;
}
.from-label {
  font-size: 12px;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.from-info {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 8px;
}
.nickname {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}
.card-seal {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.bottom-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: currentColor;
  opacity: 0.2;
}
</style>
