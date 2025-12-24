import { defineStore } from 'pinia'
import request from '../utils/request'

function genUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()
}

export const useUserStore = defineStore('user', {
  state: () => ({
    uuid: localStorage.getItem('uuid') || '',
    nickname: '',
    content: '',
    style_id: 0,
    match_data: JSON.parse(localStorage.getItem('match_data') || 'null'),
    is_submitted: localStorage.getItem('is_submitted') === 'true'
  }),
  actions: {
    ensureUUID() {
      if (!this.uuid) {
        this.uuid = genUUID()
        localStorage.setItem('uuid', this.uuid)
      }
    },
    setForm({ nickname, content, style_id }) {
      this.nickname = nickname
      this.content = content
      this.style_id = style_id
      localStorage.setItem('form_nickname', nickname || '')
      localStorage.setItem('form_content', content || '')
      localStorage.setItem('form_style_id', String(style_id ?? 0))
    },
    loadForm() {
      this.nickname = localStorage.getItem('form_nickname') || ''
      this.content = localStorage.getItem('form_content') || ''
      this.style_id = Number(localStorage.getItem('form_style_id') || 0)
    },
    setSubmitted(status) {
      this.is_submitted = status
      localStorage.setItem('is_submitted', String(status))
    },
    setMatched(data) {
      this.match_data = data
      if (data) {
        localStorage.setItem('match_data', JSON.stringify(data))
      } else {
        localStorage.removeItem('match_data')
      }
    },
    resetState() {
      this.nickname = ''
      this.content = ''
      this.style_id = 0
      this.match_data = null
      this.is_submitted = false
      this.uuid = '' // Clear UUID to allow new identity
      
      localStorage.removeItem('form_nickname')
      localStorage.removeItem('form_content')
      localStorage.removeItem('form_style_id')
      localStorage.removeItem('match_data')
      localStorage.removeItem('is_submitted')
      localStorage.removeItem('uuid')
    },
    async submitCard() {
      if (!this.uuid) this.ensureUUID()
      const res = await request.post('/card', {
        uuid: this.uuid,
        nickname: this.nickname,
        content: this.content,
        style_id: this.style_id
      })
      this.setSubmitted(true)
      return res
    },
    async checkMatchStatus() {
      if (!this.uuid) return null
      // Add timestamp to prevent caching
      const res = await request.get(`/card/my`, { params: { uuid: this.uuid, t: Date.now() } })
      const data = res?.data
      if (data?.status === 'NOT_FOUND') {
        this.setMatched(null)
        this.setSubmitted(false)
        return null
      }
      if (data?.status === 'MATCHED') {
        this.setMatched(data)
        return data
      }
      return null
    }
  }
})
