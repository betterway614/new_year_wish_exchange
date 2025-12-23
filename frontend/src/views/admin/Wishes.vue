<template>
  <div class="wishes-page">
    <div class="header">
      <div class="title-section">
        <h1>Wishes Management</h1>
        <span class="subtitle">Manage and moderate user wishes</span>
      </div>
      <div class="actions">
        <button @click="handleExport" class="btn btn-primary">
          <i class="icon">📥</i> Export CSV
        </button>
        <button @click="handleBatchDelete" class="btn btn-danger" :disabled="selectedIds.length === 0">
          <i class="icon">🗑️</i> Delete Selected
        </button>
      </div>
    </div>
    
    <div class="table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th width="40"><input type="checkbox" @change="toggleAll" :checked="isAllSelected" /></th>
              <th width="80">ID</th>
              <th width="150">Nickname</th>
              <th>Content</th>
              <th width="100">Status</th>
              <th width="160">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id" :class="{ 'row-selected': selectedIds.includes(item.id) }">
              <td><input type="checkbox" :value="item.id" v-model="selectedIds" /></td>
              <td>#{{ item.id }}</td>
              <td class="cell-nickname">{{ item.nickname }}</td>
              <td class="cell-content">
                <div v-if="editingId === item.id" class="edit-wrapper">
                  <input v-model="editContent" class="form-input" @keyup.enter="saveEdit(item.id)" />
                  <div class="edit-actions">
                    <button @click="saveEdit(item.id)" class="btn-icon btn-save" title="Save">✓</button>
                    <button @click="cancelEdit" class="btn-icon btn-cancel" title="Cancel">✕</button>
                  </div>
                </div>
                <div v-else class="content-text" :title="item.content">{{ item.content }}</div>
              </td>
              <td>
                <span class="status-badge" :class="item.status === 1 ? 'status-matched' : 'status-waiting'">
                  {{ item.status === 1 ? 'Matched' : 'Waiting' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="startEdit(item)" class="btn-link">Edit</button>
                  <span class="divider">|</span>
                  <button @click="deleteOne(item.id)" class="btn-link btn-link-danger">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="6" class="empty-state">No data available</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination-bar">
        <span class="page-total">Total: {{ list.length }} items (Demo Limit)</span>
        <div class="pagination-controls">
          <button @click="prevPage" :disabled="page <= 1" class="page-btn">Previous</button>
          <span class="page-current">{{ page }}</span>
          <button @click="nextPage" :disabled="list.length < limit" class="page-btn">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import request from '../../utils/request'

const list = ref([])
const page = ref(1)
const limit = 20
const selectedIds = ref([])
const editingId = ref(null)
const editContent = ref('')

const isAllSelected = computed(() => {
  return list.value.length > 0 && selectedIds.value.length === list.value.length
})

const fetchList = async () => {
  try {
    const res = await request.get('/admin/cards', { params: { page: page.value, limit } })
    if (res.code === 0) {
      list.value = res.data.rows
      // Reset selection on page change
      selectedIds.value = []
    }
  } catch (e) {
    console.error(e)
  }
}

const handleExport = () => {
  request.get('/admin/export', { responseType: 'blob' }).then(blob => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wishes_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  })
}

const deleteOne = async (id) => {
  if (!confirm('Are you sure you want to delete this wish?')) return
  await request.delete(`/admin/card/${id}`)
  fetchList()
}

const handleBatchDelete = async () => {
  if (!confirm(`Are you sure you want to delete ${selectedIds.value.length} items?`)) return
  await request.post('/admin/cards/delete', { ids: selectedIds.value })
  selectedIds.value = []
  fetchList()
}

const startEdit = (item) => {
  editingId.value = item.id
  editContent.value = item.content
}

const cancelEdit = () => {
  editingId.value = null
  editContent.value = ''
}

const saveEdit = async (id) => {
  if (!editContent.value.trim()) return
  await request.put(`/admin/card/${id}`, { content: editContent.value })
  editingId.value = null
  fetchList()
}

const toggleAll = (e) => {
  if (e.target.checked) {
    selectedIds.value = list.value.map(i => i.id)
  } else {
    selectedIds.value = []
  }
}

const prevPage = () => { if(page.value > 1) page.value-- }
const nextPage = () => { if(list.value.length >= limit) page.value++ }

watch(page, fetchList)
onMounted(fetchList)
</script>

<style scoped>
.wishes-page { 
  max-width: 1200px;
  margin: 0 auto;
}

.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 24px; 
}
.title-section h1 { margin: 0; font-size: 24px; color: #1f2d3d; }
.subtitle { color: #8492a6; font-size: 14px; margin-top: 4px; display: block; }

.actions { display: flex; gap: 12px; }

.btn { 
  display: inline-flex;
  align-items: center;
  padding: 8px 16px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
.btn .icon { margin-right: 6px; font-style: normal; }

.btn-primary { background: #1890ff; color: white; box-shadow: 0 2px 0 rgba(24,144,255,0.1); }
.btn-primary:hover { background: #40a9ff; }

.btn-danger { background: #ff4d4f; color: white; box-shadow: 0 2px 0 rgba(255,77,79,0.1); }
.btn-danger:hover { background: #ff7875; }
.btn-danger:disabled { background: #f5f5f5; color: #d9d9d9; cursor: not-allowed; box-shadow: none; border: 1px solid #d9d9d9; }

.table-card { 
  background: white; 
  border-radius: 8px; 
  box-shadow: 0 1px 2px -2px rgba(0,0,0,0.16), 0 3px 6px 0 rgba(0,0,0,0.12), 0 5px 12px 4px rgba(0,0,0,0.09); 
  display: flex;
  flex-direction: column;
}

.table-responsive {
  overflow-x: auto;
}

table { width: 100%; border-collapse: collapse; }

th { 
  background: #fafafa; 
  padding: 16px; 
  border-bottom: 1px solid #f0f0f0; 
  text-align: left; 
  font-weight: 600; 
  color: #1f2d3d;
  white-space: nowrap;
}

td { 
  padding: 16px; 
  border-bottom: 1px solid #f0f0f0; 
  color: #606266;
  font-size: 14px;
  vertical-align: middle;
}

tr:hover { background: #fafafa; }
.row-selected { background: #e6f7ff; }

.cell-content { max-width: 300px; }
.content-text { 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  color: #303133;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-matched { background: #f6ffed; border: 1px solid #b7eb8f; color: #52c41a; }
.status-waiting { background: #fffbe6; border: 1px solid #ffe58f; color: #faad14; }

.action-buttons { display: flex; align-items: center; }
.btn-link { 
  background: none; 
  border: none; 
  color: #1890ff; 
  cursor: pointer; 
  padding: 0; 
  font-size: 14px;
}
.btn-link:hover { text-decoration: underline; }
.btn-link-danger { color: #ff4d4f; }
.divider { margin: 0 8px; color: #e8e8e8; }

.edit-wrapper { display: flex; gap: 8px; align-items: center; }
.form-input { 
  flex: 1; 
  padding: 6px 10px; 
  border: 1px solid #d9d9d9; 
  border-radius: 4px; 
  outline: none;
  font-size: 14px;
}
.form-input:focus { border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,0.2); }

.btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 14px;
}
.btn-save { background: #52c41a; }
.btn-cancel { background: #909399; }

.pagination-bar {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-total { color: #909399; font-size: 14px; }
.pagination-controls { display: flex; align-items: center; gap: 8px; }
.page-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:disabled { background: #f5f5f5; color: #c0c4cc; cursor: not-allowed; }
.page-btn:not(:disabled):hover { border-color: #1890ff; color: #1890ff; }
.page-current { font-weight: 600; padding: 0 8px; color: #1890ff; }

.empty-state { text-align: center; color: #909399; padding: 40px; }
</style>
