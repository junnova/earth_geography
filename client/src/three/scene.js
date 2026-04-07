import * as THREE from 'three'

/**
 * 初始化 Three.js 场景、相机、渲染器
 */
export function createScene(container) {
  // 场景
  const scene = new THREE.Scene()

  // 相机
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 15)

  // 渲染器
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 平行光（模拟太阳）
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 3, 5)
  scene.add(directionalLight)

  // 星空背景
  createStars(scene)

  // 窗口 resize
  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', onResize)

  return { scene, camera, renderer, onResize }
}

function createStars(scene) {
  const starsGeometry = new THREE.BufferGeometry()
  const starCount = 3000
  const positions = new Float32Array(starCount * 3)

  for (let i = 0; i < starCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 600
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
  })

  const stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)
}
