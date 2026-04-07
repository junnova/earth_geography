import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * 初始化 OrbitControls + idle 检测
 */
export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement)

  // 惯性阻尼 - 让旋转更丝滑
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // 缩放范围限制
  controls.minDistance = 8
  controls.maxDistance = 40

  // 旋转速度
  controls.rotateSpeed = 0.5

  // 禁用平移（地球不需要平移）
  controls.enablePan = false

  // 自动旋转配置
  controls.autoRotate = false
  controls.autoRotateSpeed = 0.5

  // Idle 检测
  let lastInteractionTime = Date.now()
  let isIdle = false
  const IDLE_TIMEOUT = 3000 // 3秒

  const onInteraction = () => {
    lastInteractionTime = Date.now()
    if (isIdle) {
      isIdle = false
      controls.autoRotate = false
    }
  }

  domElement.addEventListener('pointerdown', onInteraction)
  domElement.addEventListener('wheel', onInteraction)

  /**
   * 每帧调用：更新 controls + idle 检测
   */
  function update() {
    const now = Date.now()
    if (!isIdle && now - lastInteractionTime > IDLE_TIMEOUT) {
      isIdle = true
      controls.autoRotate = true
    }
    controls.update()
  }

  function dispose() {
    domElement.removeEventListener('pointerdown', onInteraction)
    domElement.removeEventListener('wheel', onInteraction)
    controls.dispose()
  }

  return { controls, update, dispose, isIdle: () => isIdle }
}
