import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchLandmarks, searchLandmarks } from '../api/landmarks.js'
import mockData from '../api/mockData.js'

export const useLandmarkStore = defineStore('landmarks', () => {
  const landmarks = ref([])
  const loading = ref(false)
  const selectedLandmark = ref(null)
  const useMock = ref(false) // 已联调后端

  // 加载全部地标数据
  async function loadAll() {
    loading.value = true
    try {
      if (useMock.value) {
        landmarks.value = mockData
      } else {
        const res = await fetchLandmarks()
        landmarks.value = res.data || res
      }
    } catch (e) {
      console.warn('API 加载失败，使用 mock 数据', e)
      landmarks.value = mockData
    } finally {
      loading.value = false
    }
  }

  // 模糊搜索
  async function search(keyword) {
    if (!keyword) return landmarks.value
    const kw = keyword.toLowerCase()
    if (useMock.value) {
      return landmarks.value.filter(
        (item) =>
          item.country_name.includes(kw) ||
          item.landmark_name.toLowerCase().includes(kw)
      )
    }
    // 优先使用本地过滤（数据已全部加载）
    return landmarks.value.filter(
      (item) =>
        item.country_name.includes(kw) ||
        item.landmark_name.toLowerCase().includes(kw)
    )
  }

  // 选中某个地标
  function select(landmark) {
    selectedLandmark.value = landmark
  }

  function clearSelection() {
    selectedLandmark.value = null
  }

  return {
    landmarks,
    loading,
    selectedLandmark,
    loadAll,
    search,
    select,
    clearSelection
  }
})
