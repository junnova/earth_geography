import * as THREE from 'three'
import { EARTH_RADIUS } from './earth.js'
import { latLonToVector3, getMarkerScale } from './utils.js'

// 共享发光点纹理（全局只创建一次）
let glowTexture = null

function getGlowTexture() {
  if (glowTexture) return glowTexture

  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // 径向渐变：中心亮黄 → 外圈透明
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255, 230, 80, 1)')
  gradient.addColorStop(0.15, 'rgba(255, 210, 50, 0.9)')
  gradient.addColorStop(0.4, 'rgba(255, 180, 30, 0.4)')
  gradient.addColorStop(0.7, 'rgba(255, 160, 20, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 140, 0, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}

/**
 * 创建图标管理器
 */
export function createMarkerManager(scene, camera) {
  const markerGroup = new THREE.Group()
  markerGroup.name = 'markerGroup'
  scene.add(markerGroup)

  // 共享材质（所有 sprite 使用同一个）
  let sharedMaterial = null

  // 缓存向量，避免每帧分配
  const _cameraDir = new THREE.Vector3()
  const _markerDir = new THREE.Vector3()

  /**
   * 根据 landmarks 数据创建所有光点
   */
  function loadMarkers(landmarks) {
    clearMarkers()

    const texture = getGlowTexture()
    sharedMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 1
    })

    landmarks.forEach((item) => {
      const position = latLonToVector3(item.latitude, item.longitude, EARTH_RADIUS * 1.02)

      const sprite = new THREE.Sprite(sharedMaterial.clone())
      sprite.position.copy(position)
      sprite.scale.set(0.3, 0.3, 1)
      sprite.userData = { ...item }
      markerGroup.add(sprite)
    })
  }

  /**
   * 每帧更新：背面遮挡 + 缩放
   */
  function update() {
    _cameraDir.copy(camera.position).normalize()
    const cameraDistance = camera.position.length()
    const scale = getMarkerScale(cameraDistance, 0.18)

    const children = markerGroup.children
    for (let i = 0, len = children.length; i < len; i++) {
      const sprite = children[i]
      sprite.scale.set(scale, scale, 1)

      // 背面遮挡
      _markerDir.copy(sprite.position).normalize()
      const dot = _markerDir.dot(_cameraDir)

      if (dot < 0.1) {
        sprite.material.opacity = 0
        sprite.visible = false
      } else if (dot < 0.3) {
        sprite.visible = true
        sprite.material.opacity = (dot - 0.1) / 0.2
      } else {
        sprite.visible = true
        sprite.material.opacity = 1
      }
    }
  }

  function clearMarkers() {
    while (markerGroup.children.length > 0) {
      const sprite = markerGroup.children[0]
      sprite.material.dispose()
      markerGroup.remove(sprite)
    }
  }

  function getMarkerGroup() {
    return markerGroup
  }

  function highlightMarker(landmarkId) {
    markerGroup.children.forEach((sprite) => {
      if (sprite.userData.id === landmarkId) {
        sprite.scale.multiplyScalar(2.5)
      }
    })
  }

  function resetHighlight() {
    // 下次 update() 自动恢复
  }

  function dispose() {
    clearMarkers()
    if (glowTexture) {
      glowTexture.dispose()
      glowTexture = null
    }
    scene.remove(markerGroup)
  }

  return { loadMarkers, update, clearMarkers, getMarkerGroup, highlightMarker, resetHighlight, dispose }
}
