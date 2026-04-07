<template>
  <div class="earth-page" :class="{ 'is-ready': sceneReady }">
    <!-- 3D 地球容器 -->
    <div ref="containerRef" class="earth-container"></div>

    <!-- 搜索栏 -->
    <SearchBar @fly-to="handleFlyTo" />

    <!-- 信息卡片 -->
    <InfoCard
      v-if="landmarkStore.selectedLandmark"
      :landmark="landmarkStore.selectedLandmark"
      @close="landmarkStore.clearSelection()"
    />

    <!-- 加载遮罩 -->
    <Transition name="fade">
      <div v-if="!sceneReady" class="loading-overlay">
        <div class="loading-center">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在加载地球...</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useLandmarkStore } from '../stores/landmarks.js'
import { createScene } from '../three/scene.js'
import { createEarth } from '../three/earth.js'
import { createControls } from '../three/controls.js'
import { createMarkerManager } from '../three/markers.js'
import { createRaycaster } from '../three/raycaster.js'
import { flyTo } from '../three/animation.js'
import SearchBar from './SearchBar.vue'
import InfoCard from './InfoCard.vue'

const containerRef = ref(null)
const landmarkStore = useLandmarkStore()
const sceneReady = ref(false)

let sceneCtx = null
let controlsCtx = null
let markerManager = null
let raycasterCtx = null
let animationId = null

onMounted(async () => {
  // 加载数据
  await landmarkStore.loadAll()

  // 初始化场景
  const container = containerRef.value
  sceneCtx = createScene(container)
  const { scene, camera, renderer } = sceneCtx

  // 创建地球
  createEarth(scene)

  // 创建控制器
  controlsCtx = createControls(camera, renderer.domElement)

  // 创建图标
  markerManager = createMarkerManager(scene, camera)
  markerManager.loadMarkers(landmarkStore.landmarks)

  // 创建射线检测
  raycasterCtx = createRaycaster(camera, renderer.domElement, markerManager.getMarkerGroup())
  raycasterCtx.setClickHandler((data) => {
    landmarkStore.select(data)
  })

  // 首帧渲染后标记就绪，淡出 loading
  renderer.render(scene, camera)
  requestAnimationFrame(() => {
    sceneReady.value = true
  })

  // 渲染循环
  function animate() {
    animationId = requestAnimationFrame(animate)
    controlsCtx.update()
    markerManager.update()
    renderer.render(scene, camera)
  }
  animate()
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (controlsCtx) controlsCtx.dispose()
  if (markerManager) markerManager.dispose()
  if (raycasterCtx) raycasterCtx.dispose()
  if (sceneCtx) {
    window.removeEventListener('resize', sceneCtx.onResize)
    sceneCtx.renderer.dispose()
  }
})

function handleFlyTo(landmark) {
  if (!sceneCtx || !controlsCtx) return
  flyTo(sceneCtx.camera, controlsCtx.controls, landmark.latitude, landmark.longitude)
  markerManager.highlightMarker(landmark.id)
}
</script>

<style scoped>
.earth-page {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #0a0e27 0%, #000000 100%);
}

.earth-container {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #0a0e27 0%, #000000 100%);
  z-index: 100;
}

.loading-center {
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(168, 216, 234, 0.2);
  border-top-color: rgba(168, 216, 234, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #a8d8ea;
  font-size: 16px;
  letter-spacing: 2px;
}

/* 淡出过渡 */
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>
