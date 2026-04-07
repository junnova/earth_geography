<template>
  <Transition name="card">
    <div v-if="landmark" class="info-card-overlay" @click.self="$emit('close')">
      <div class="info-card">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="$emit('close')">&times;</button>

        <!-- 图片区域 -->
        <div class="card-image" v-if="landmark.image_url && !imgError">
          <div v-if="imgLoading" class="img-loading">
            <span class="loading-spinner"></span>
          </div>
          <img
            :src="landmark.image_url"
            :alt="landmark.landmark_name"
            referrerpolicy="no-referrer"
            @load="imgLoading = false"
            @error="onImgError"
          />
        </div>
        <div class="card-image placeholder" v-else>
          <span class="placeholder-icon">🏛️</span>
        </div>

        <!-- 信息区域 -->
        <div class="card-body">
          <div class="card-country">{{ landmark.country_name }}</div>
          <h3 class="card-title">{{ landmark.landmark_name }}</h3>
          <p class="card-desc">{{ landmark.description || '暂无简介' }}</p>
          <div class="card-meta" v-if="landmark.category">
            <span class="tag">{{ landmark.category }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  landmark: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])

const imgLoading = ref(true)
const imgError = ref(false)

function onImgError() {
  imgLoading.value = false
  imgError.value = true
}

// 切换国家时重置图片状态
watch(() => props.landmark, () => {
  imgLoading.value = true
  imgError.value = false
})
</script>

<style scoped>
.info-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}

.info-card {
  position: relative;
  width: 360px;
  max-height: 80vh;
  background: rgba(15, 20, 50, 0.95);
  border: 1px solid rgba(168, 216, 234, 0.25);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.6);
}

.card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 20, 50, 0.6);
  z-index: 1;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(168, 216, 234, 0.2);
  border-top-color: rgba(168, 216, 234, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168, 216, 234, 0.1), rgba(100, 140, 200, 0.1));
}

.placeholder-icon {
  font-size: 64px;
}

.card-body {
  padding: 20px;
}

.card-country {
  color: rgba(168, 216, 234, 0.7);
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.card-title {
  color: #e0e0e0;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.card-desc {
  color: rgba(224, 224, 224, 0.7);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.card-meta {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  background: rgba(168, 216, 234, 0.15);
  border: 1px solid rgba(168, 216, 234, 0.2);
  border-radius: 12px;
  color: rgba(168, 216, 234, 0.8);
  font-size: 12px;
}

/* 过渡动画 */
.card-enter-active {
  transition: all 0.3s ease-out;
}

.card-leave-active {
  transition: all 0.2s ease-in;
}

.card-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
