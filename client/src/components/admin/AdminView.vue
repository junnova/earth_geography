<template>
  <div class="admin-view">
    <!-- 顶栏 -->
    <div class="admin-header">
      <h2>Earth Culture 后台管理</h2>
      <router-link to="/" class="back-link">← 返回地球</router-link>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchText"
        placeholder="搜索国家或地标…"
        clearable
        style="width: 280px"
        @input="handleSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新增地标
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      border
      max-height="calc(100vh - 200px)"
      style="width: 100%"
      @sort-change="handleSort"
    >
      <el-table-column prop="id" label="ID" width="60" sortable="custom" />
      <el-table-column prop="country_name" label="国家" width="120" sortable="custom" />
      <el-table-column prop="country_code" label="代码" width="70" />
      <el-table-column prop="landmark_name" label="地标名称" min-width="150" sortable="custom" />
      <el-table-column prop="category" label="分类" width="100">
        <template #default="{ row }">
          <el-tag :type="categoryTag(row.category)" size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="latitude" label="纬度" width="90" />
      <el-table-column prop="longitude" label="经度" width="90" />
      <el-table-column label="图片" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.image_url"
            :src="row.image_url"
            :preview-src-list="[row.image_url]"
            style="width:40px;height:40px"
            fit="cover"
          />
          <span v-else style="color:#ccc">无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="applyView"
        @current-change="applyView"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑地标' : '新增地标'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="国家" prop="country_name">
          <el-input v-model="form.country_name" />
        </el-form-item>
        <el-form-item label="国家代码" prop="country_code">
          <el-input v-model="form.country_code" maxlength="3" style="width:120px" />
        </el-form-item>
        <el-form-item label="地标名称" prop="landmark_name">
          <el-input v-model="form.landmark_name" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input-number v-model="form.latitude" :precision="2" :min="-90" :max="90" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input-number v-model="form.longitude" :precision="2" :min="-180" :max="180" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" style="width:160px">
            <el-option label="建筑" value="建筑" />
            <el-option label="景点" value="景点" />
            <el-option label="文化符号" value="文化符号" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            :action="'/api/upload'"
            :show-file-list="false"
            :on-success="onUploadSuccess"
            :before-upload="beforeUpload"
            accept=".jpg,.jpeg,.png,.webp,.svg"
          >
            <el-button size="small" type="primary">上传图片</el-button>
          </el-upload>
          <div v-if="form.image_url" style="margin-top:8px">
            <el-image :src="form.image_url" style="width:120px;height:80px" fit="cover" />
            <el-button size="small" text type="danger" @click="form.image_url = ''">移除</el-button>
          </div>
          <el-input v-model="form.image_url" placeholder="或直接输入图片URL" style="margin-top:8px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchLandmarks,
  createLandmark,
  updateLandmark,
  deleteLandmark,
  searchLandmarks
} from '@/api/landmarks'

const loading = ref(false)
const allData = ref([])
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const sortProp = ref('')
const sortOrder = ref('')

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  country_name: '',
  country_code: '',
  landmark_name: '',
  latitude: 0,
  longitude: 0,
  category: '景点',
  description: '',
  icon_url: '',
  image_url: ''
})
const form = reactive(defaultForm())

const rules = {
  country_name: [{ required: true, message: '请输入国家名称', trigger: 'blur' }],
  country_code: [{ required: true, message: '请输入国家代码', trigger: 'blur' }],
  landmark_name: [{ required: true, message: '请输入地标名称', trigger: 'blur' }]
}

function categoryTag(cat) {
  const map = { '建筑': 'primary', '景点': 'success', '文化符号': 'warning' }
  return map[cat] || 'info'
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    let data
    if (searchText.value.trim()) {
      data = await searchLandmarks(searchText.value.trim())
    } else {
      data = await fetchLandmarks()
    }
    allData.value = Array.isArray(data) ? data : (data.data || [])
    applyView()
  } catch (e) {
    ElMessage.error('加载数据失败: ' + (e.message || e))
  } finally {
    loading.value = false
  }
}

// 排序 + 分页（纯前端，不重新请求）
function applyView() {
  let list = [...allData.value]

  // 客户端排序
  if (sortProp.value && sortOrder.value) {
    const prop = sortProp.value
    const asc = sortOrder.value === 'ascending'
    list.sort((a, b) => {
      const va = a[prop], vb = b[prop]
      if (va == null) return 1
      if (vb == null) return -1
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'zh')
      return asc ? cmp : -cmp
    })
  }

  total.value = list.length
  const start = (page.value - 1) * pageSize.value
  tableData.value = list.slice(start, start + pageSize.value)
}

let searchTimer = null
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadData()
  }, 300)
}

function handleSort({ prop, order }) {
  sortProp.value = prop
  sortOrder.value = order
  applyView()
}

// 新增
function openCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

// 编辑
function openEdit(row) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    country_name: row.country_name,
    country_code: row.country_code,
    landmark_name: row.landmark_name,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category || '景点',
    description: row.description || '',
    icon_url: row.icon_url || '',
    image_url: row.image_url || ''
  })
  dialogVisible.value = true
}

// 提交
async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch { return }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateLandmark(editingId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await createLandmark({ ...form })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败: ' + (e.message || e))
  } finally {
    submitting.value = false
  }
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.landmark_name}」？`, '提示', {
      type: 'warning'
    })
  } catch { return }

  try {
    await deleteLandmark(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    ElMessage.error('删除失败: ' + (e.message || e))
  }
}

// 上传
function beforeUpload(file) {
  const isOk = file.size / 1024 / 1024 < 2
  if (!isOk) ElMessage.error('图片不能超过2MB')
  return isOk
}
function onUploadSuccess(res) {
  if (res.url) {
    form.image_url = res.url
    ElMessage.success('上传成功')
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-view {
  padding: 24px;
  color: #333;
  background: #f5f7fa;
  min-height: 100vh;
}
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.admin-header h2 {
  margin: 0;
  font-size: 22px;
}
.back-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
