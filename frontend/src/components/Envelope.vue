<template>
  <div class="envelope" @click="open">
    <div class="seal">{{ sealText }}</div>
    <div class="hint">来自 {{ nickname }} 的祝福</div>
  </div>
</template>

<script setup>
const props = defineProps({
  nickname: { type: String, default: '' }
})
const emits = defineEmits(['open'])
const sealText = '拆开有喜'
function open() {
  emits('open')
}
</script>

<style scoped>
.envelope {
  width: 280px;
  height: 180px;
  background: #D32F2F;
  border-radius: 8px;
  position: relative;
  margin: 60px auto;
  box-shadow: 0 12px 30px rgba(0,0,0,0.35);
  animation: float 2.4s ease-in-out infinite;
  cursor: pointer;
}
.seal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: #FFD700;
  color: #B71C1C;
  font-weight: 700;
  padding: 10px 16px;
  border-radius: 50px;
}
.hint {
  position: absolute;
  width: 100%;
  text-align: center;
  bottom: -28px;
  color: #B71C1C;
  font-size: 14px;
}
@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}
</style>

