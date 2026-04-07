<template>
  <div class="search-bar">
    <div class="search-wrapper">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索国家..."
        @input="onInput"
        @focus="showDropdown = true"
      />
      <div v-if="showDropdown && results.length > 0" class="search-dropdown">
        <div
          v-for="item in results"
          :key="item.id"
          class="search-item"
          @click="selectItem(item)"
        >
          <span class="item-country">{{ item.country_name }}</span>
          <span class="item-landmark">{{ item.landmark_name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useLandmarkStore } from '../stores/landmarks.js'

const emit = defineEmits(['fly-to'])
const landmarkStore = useLandmarkStore()

const keyword = ref('')
const results = ref([])
const showDropdown = ref(false)

let debounceTimer = null

function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (keyword.value.trim()) {
      results.value = await landmarkStore.search(keyword.value.trim())
    } else {
      results.value = []
    }
  }, 200)
}

function selectItem(item) {
  keyword.value = item.country_name
  showDropdown.value = false
  results.value = []
  emit('fly-to', item)
}

// 点击外部关闭下拉
function onClickOutside(e) {
  if (!e.target.closest('.search-bar')) {
    showDropdown.value = false
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', onClickOutside)
}
</script>

<style scoped>
.search-bar {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 50;
}

.search-wrapper {
  position: relative;
  width: 320px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid rgba(168, 216, 234, 0.3);
  border-radius: 24px;
  background: rgba(10, 14, 39, 0.8);
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  backdrop-filter: blur(10px);
  transition: border-color 0.3s;
}

.search-input::placeholder {
  color: rgba(168, 216, 234, 0.5);
}

.search-input:focus {
  border-color: rgba(168, 216, 234, 0.6);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: rgba(10, 14, 39, 0.95);
  border: 1px solid rgba(168, 216, 234, 0.2);
  border-radius: 12px;
  max-height: 240px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.search-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.search-item:hover {
  background: rgba(168, 216, 234, 0.1);
}

.search-item:first-child {
  border-radius: 12px 12px 0 0;
}

.search-item:last-child {
  border-radius: 0 0 12px 12px;
}

.item-country {
  color: #e0e0e0;
  font-size: 14px;
}

.item-landmark {
  color: rgba(168, 216, 234, 0.6);
  font-size: 12px;
}
</style>
