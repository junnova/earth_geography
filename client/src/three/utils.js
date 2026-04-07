/**
 * 经纬度转 Three.js 3D 坐标
 * @param {number} lat - 纬度 (-90 ~ 90)
 * @param {number} lon - 经度 (-180 ~ 180)
 * @param {number} radius - 球体半径
 * @returns {THREE.Vector3}
 */
import * as THREE from 'three'

export function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
}

/**
 * 根据相机距离计算图标缩放比例
 */
export function getMarkerScale(cameraDistance, baseScale = 0.35) {
  const scale = baseScale * (cameraDistance / 15)
  return Math.max(0.2, Math.min(scale, 0.8))
}
