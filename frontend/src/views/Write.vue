<template>
  <div class="page">
    <div class="nav">
      <button class="back" @click="back">返回</button>
      <div class="title">写新年祝福</div>
    </div>
    <div class="form">
      <label class="label">昵称 *必填（2-10字）</label>
      <input class="input" v-model="nickname" @input="handleInput" @blur="nicknameTouched=true" :disabled="isSubmitting" />
      <div v-if="nicknameError" class="error">{{ nicknameError }}</div>
      
      <label class="label">祝福内容（10-200字）</label>
      <textarea class="textarea" v-model="content" @input="handleContentInput" @blur="contentTouched=true" :disabled="isSubmitting"></textarea>
      <div class="count" :class="{ error: content.length > 200 }">{{ content.length }}/200</div>
      <div v-if="contentError" class="error">{{ contentError }}</div>
    </div>
    
    <div class="preview" ref="previewEl">
      <CardBody :styleId="styleId">
        <template #content>{{ content || '在这里输入你的祝福...' }}</template>
        <template #nickname>{{ nickname || '你的昵称' }}</template>
      </CardBody>
    </div>
    
    <div class="themes">
      <div class="theme-list">
        <div v-for="t in themeList" :key="t.id" class="theme-item" :class="{active: styleId===t.id}" @click="styleId=t.id; persistDraft()">
          <div class="swatch" :style="{ background: t.primaryColor }"></div>
          <div class="name">{{ t.name }}</div>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button class="secondary" @click="preview" :disabled="isSubmitting">预览</button>
      <button class="primary" :disabled="!canSubmit || isSubmitting" @click="submit">
        {{ isSubmitting ? '提交中...' : '提交祝福' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CARD_THEMES } from '../constants/styles'
import CardBody from '../components/CardBody.vue'
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
const previewEl = ref(null)

// 防抖计时器
let debounceTimer = null

onMounted(() => {
  store.ensureUUID()
  store.loadForm()
  nickname.value = store.nickname
  content.value = store.content
  styleId.value = store.style_id
  wordFilter.init() // Initialize filter
})

// 验证逻辑
const nicknameError = computed(() => {
  if (!nicknameTouched.value) return ''
  if (!nickname.value) return '请填写你的昵称'
  
  const check = wordFilter.validate(nickname.value)
  if (!check.valid) return `包含敏感词（${check.word}），阳光向上正能量喔🤞`

  if (nickname.value.length < 2) return '昵称太短了'
  if (nickname.value.length > 10) return '昵称太长了'

  return ''
})

const contentError = computed(() => {
  if (!contentTouched.value) return ''
  if (!content.value) return '请填写祝福内容'
  
  const check = wordFilter.validate(content.value)
  if (!check.valid) return '包含敏感词，阳光向上正能量喔🤞'

  if (content.value.length < 10) return '多写一点祝福吧（至少10字）'
  if (content.value.length > 200) return '祝福太长了，精简一下吧'

  return ''
})

const canSubmit = computed(() => {
  return nickname.value.length >= 2 && 
         nickname.value.length <= 10 && 
         content.value.length >= 10 && 
         content.value.length <= 200 &&
         !nicknameError.value && // Ensure no error
         !contentError.value     // Ensure no error
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
  if (content.value.length > 200) {
    // 允许输入超过，但在提交时拦截或截断，这里仅提示，不强制截断，体验更好
  }
  debouncePersist()
}

function debouncePersist() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    persistDraft()
  }, 500)
}

function preview() {
  if (previewEl.value) {
    previewEl.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

async function submit() {
  nicknameTouched.value = true
  contentTouched.value = true
  
  if (!canSubmit.value) return
  
  // 再次保存以防万一
  persistDraft()
  
  isSubmitting.value = true
  try {
    await store.submitCard()
    router.push('/match')
  } catch(e) {
    console.error(e)
    alert(e.message || '提交失败，请检查网络或稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

function back() { 
  router.push('/')
}
</script>

<style scoped>
.page { padding: 16px; padding-bottom: 40px; }
.nav { display: flex; align-items: center; gap: 8px; }
.back { border: 1px solid #ddd; background: #fff; border-radius: 6px; padding: 4px 8px; cursor: pointer; }
.title { font-weight: 700; color: #B71C1C; }
.form { margin-top: 12px; }
.label { display:block; margin: 8px 0; color: #333; font-weight: 500; }
.input, .textarea { width: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 8px; font-family: inherit; }
.input:focus, .textarea:focus { outline: none; border-color: #D32F2F; }
.textarea { height: 120px; resize: vertical; }
.error { color: #D32F2F; margin-top: 4px; font-size: 12px; }
.count { text-align: right; color: #999; font-size: 12px; margin-top: 6px; }
.count.error { color: #D32F2F; }
.preview { margin: 16px 0; }
.theme-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
.theme-item { min-width: 100px; border: 1px solid #eee; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; }
.theme-item.active { border-color: #D32F2F; background-color: #FFF8F8; }
.swatch { width: 60px; height: 36px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); }
.actions { display: flex; gap: 12px; margin-top: 20px; }
.primary { flex: 1; height: 44px; background: #D32F2F; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
.primary:disabled { background: #E57373; cursor: not-allowed; }
.secondary { flex: 1; height: 44px; background: #FFD700; color: #333; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
.secondary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
