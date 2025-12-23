<template>
  <div class="card-container" :class="themeClass">
    <div class="card-header">
      <h2 class="card-title">{{ themeConfig.headerText }}</h2>
    </div>
    <div class="card-body">
      <div class="card-content">
        <slot name="content"></slot>
      </div>
      <div class="card-foot">
        <span class="from-label">From</span>
        <div class="nickname"><slot name="nickname"></slot></div>
      </div>
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
.card-container {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.card-header {
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #B71C1C;
}
.card-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #fff;
}
.card-body {
  padding: 16px;
  min-height: 300px;
}
.card-content {
  font-size: 16px;
  line-height: 1.8;
  text-align: justify;
  max-height: 60vh;
  overflow-y: auto;
}
.card-foot {
  text-align: right;
  margin-top: 16px;
}
.from-label {
  font-size: 12px;
  opacity: 0.6;
  margin-right: 4px;
}
.nickname {
  font-size: 18px;
  font-weight: 700;
}
</style>

