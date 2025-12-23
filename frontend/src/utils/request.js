import axios from 'axios'

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  res => res.data,
  err => {
    let message = '请求失败，请稍后重试'
    if (err.response) {
      // 服务端返回了错误状态码
      const data = err.response.data
      if (data && data.message) {
        message = data.message
      } else if (data && data.error) {
        message = data.error
      }
      
      if (err.response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('admin_token')
        if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('login')) {
          window.location.href = '/admin/login'
        }
      }
    } else if (err.request) {
      // 请求发出但没有收到响应
      message = '网络连接超时或服务器无响应'
    } else {
      // 请求配置出错
      message = err.message
    }
    
    // 构造一个带有友好 message 的错误对象
    const error = new Error(message)
    error.raw = err
    return Promise.reject(error)
  }
)

export default instance
