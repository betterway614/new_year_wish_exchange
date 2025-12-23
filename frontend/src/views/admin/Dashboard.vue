<template>
  <div class="dashboard">
    <div class="header">
      <h1>Dashboard</h1>
      <span class="subtitle">Overview of system status and matching statistics</span>
    </div>

    <div class="stats-grid">
      <div class="card stat-card">
        <h3>Matching Status</h3>
        <div class="switch-container">
           <span class="status-indicator" :class="matchingEnabled ? 'status-on' : 'status-off'">
             <span class="dot"></span>
             {{ matchingEnabled ? 'Active' : 'Stopped' }}
           </span>
           <button @click="toggleMatching" class="btn-toggle" :class="matchingEnabled ? 'btn-stop' : 'btn-start'">
             {{ matchingEnabled ? 'Stop System' : 'Start System' }}
           </button>
        </div>
      </div>
      <div class="card stat-card">
        <h3>Total Wishes</h3>
        <p class="stat-number">{{ stats.count || 0 }}</p>
      </div>
      <div class="card stat-card">
        <h3>Total Matches</h3>
        <p class="stat-number">{{ stats.matches || 0 }}</p>
      </div>
    </div>

    <div class="card chart-card">
      <h3>Matching Trend (Last 7 Days)</h3>
      <div class="chart-container" ref="chartRef"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import request from '../../utils/request'
import * as echarts from 'echarts'

const stats = ref({})
const matchingEnabled = ref(false)
const chartRef = ref(null)
let chartInstance = null

const fetchStats = async () => {
  try {
    const res = await request.get('/admin/stats')
    if (res.code === 0) {
      stats.value = res.data
      matchingEnabled.value = res.data.matchingEnabled
      initChart(res.data.trend || [])
    }
  } catch (e) {
    console.error(e)
  }
}

const toggleMatching = async () => {
  const newState = !matchingEnabled.value
  await request.post('/admin/config', { matching_enabled: newState })
  matchingEnabled.value = newState
}

const initChart = (data) => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  
  // Aggregate data by date
  const counts = {}
  data.forEach(d => {
    const date = new Date(d).toLocaleDateString()
    counts[date] = (counts[date] || 0) + 1
  })
  
  const dates = Object.keys(counts).sort()
  const values = dates.map(d => counts[d])

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: dates,
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [{ 
      data: values, 
      type: 'line', 
      smooth: true,
      symbolSize: 8,
      itemStyle: { color: '#1890ff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(24,144,255,0.3)' },
          { offset: 1, color: 'rgba(24,144,255,0.01)' }
        ])
      }
    }]
  })
  
  window.addEventListener('resize', () => chartInstance && chartInstance.resize())
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard { 
  max-width: 1200px; 
  margin: 0 auto; 
}

.header { margin-bottom: 24px; }
.header h1 { margin: 0; font-size: 24px; color: #1f2d3d; }
.subtitle { color: #8492a6; font-size: 14px; margin-top: 4px; display: block; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px -2px rgba(0,0,0,0.16), 0 3px 6px 0 rgba(0,0,0,0.12), 0 5px 12px 4px rgba(0,0,0,0.09); 
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

.card h3 { margin: 0 0 16px 0; font-size: 16px; color: #909399; font-weight: 500; }
.stat-number { font-size: 36px; font-weight: bold; color: #303133; margin: 0; }

.switch-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}
.dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }

.status-on { color: #52c41a; }
.status-on .dot { background: #52c41a; box-shadow: 0 0 0 4px rgba(82,196,26,0.2); }

.status-off { color: #ff4d4f; }
.status-off .dot { background: #ff4d4f; box-shadow: 0 0 0 4px rgba(255,77,79,0.2); }

.btn-toggle {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
}
.btn-start { background: #1890ff; color: white; }
.btn-start:hover { background: #40a9ff; }
.btn-stop { background: #ff4d4f; color: white; }
.btn-stop:hover { background: #ff7875; }

.chart-card { min-height: 400px; display: flex; flex-direction: column; }
.chart-container { flex: 1; min-height: 300px; }
</style>
