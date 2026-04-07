import gsap from 'gsap'
import { latLonToVector3 } from './utils.js'
import { EARTH_RADIUS } from './earth.js'

/**
 * 相机飞行动画 - 平滑旋转到目标经纬度
 */
export function flyTo(camera, controls, lat, lon, duration = 1) {
  // 计算目标点在球面上的位置
  const targetPoint = latLonToVector3(lat, lon, EARTH_RADIUS)

  // 相机从目标点方向看过去，保持当前距离
  const distance = camera.position.length()
  const targetCameraPos = targetPoint.clone().normalize().multiplyScalar(distance)

  // 暂停自转
  controls.autoRotate = false

  return gsap.to(camera.position, {
    x: targetCameraPos.x,
    y: targetCameraPos.y,
    z: targetCameraPos.z,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.lookAt(0, 0, 0)
      controls.update()
    }
  })
}
