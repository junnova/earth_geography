import * as THREE from 'three'

const EARTH_RADIUS = 5

// 大气层顶点着色器
const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// 大气层片元着色器 - 梦幻光晕效果
const atmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(0.35, 0.55, 1.0, 0.8) * intensity;
  }
`

/**
 * 创建地球球体 + 大气层
 * 加载真实地球纹理 → Canvas 后处理为手绘水彩风格
 */
export function createEarth(scene) {
  // 地球主体
  const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64)
  const earthMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.9,
    metalness: 0.05,
    color: 0x88bbdd // 初始蓝色，加载完纹理后替换
  })

  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial)
  scene.add(earthMesh)

  // 大气层光晕
  const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.04, 64, 64)
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  scene.add(atmosphere)

  // 加载真实地球纹理并后处理为手绘风格
  loadAndProcessTextures(earthMaterial)

  return { earthMesh, atmosphere }
}

/**
 * 加载真实地球纹理，通过 Canvas 后处理为手绘水彩风格
 */
function loadAndProcessTextures(material) {
  const loader = new THREE.TextureLoader()
  const textures = {}
  let loaded = 0
  const total = 2

  function onAllLoaded() {
    const handDrawnTexture = createHandDrawnFromReal(textures.base, textures.topo)
    material.map = handDrawnTexture
    material.needsUpdate = true
    console.log('手绘水彩风格地球纹理加载完成')
  }

  function onLoad(key) {
    return (texture) => {
      textures[key] = texture
      loaded++
      if (loaded >= total) onAllLoaded()
    }
  }

  function onError(name) {
    return () => {
      console.warn(`纹理加载失败: ${name}，使用备用颜色`)
      loaded++
      if (loaded >= total && textures.base) onAllLoaded()
    }
  }

  // 加载高清 Blue Marble 底图
  loader.load('/textures/earth-base-hd.jpg', onLoad('base'), undefined, () => {
    // HD 加载失败则回退到标清
    loader.load('/textures/earth-base.jpg', onLoad('base'), undefined, onError('earth-base'))
  })
  // 加载拓扑/边界图
  loader.load('/textures/earth-topo-hd.png', onLoad('topo'), undefined, () => {
    loader.load('/textures/earth-topology.png', onLoad('topo'), undefined, onError('earth-topology'))
  })
}

/**
 * 将真实地球纹理转换为手绘水彩风格
 * 步骤：
 *   1. 绘制 base 底图到 Canvas
 *   2. 色调调整 → 柔和暖色调
 *   3. 降低饱和度 + 提亮 → 水彩感
 *   4. 简单边缘检测 → 描边轮廓线
 *   5. 叠加拓扑/边界图 → 国家轮廓
 *   6. 添加纸质纹理噪点
 */
function createHandDrawnFromReal(baseTexture, topoTexture) {
  const W = 4096
  const H = 2048
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  // 1. 绘制底图
  if (baseTexture && baseTexture.image) {
    ctx.drawImage(baseTexture.image, 0, 0, W, H)
  }

  // 2. 轻微水彩色调（保持清晰度）
  applyWatercolorTone(ctx, W, H)

  // 3. 叠加拓扑/国家边界（增强可见度）
  if (topoTexture && topoTexture.image) {
    ctx.save()
    ctx.globalAlpha = 0.15
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(topoTexture.image, 0, 0, W, H)
    ctx.restore()
  }

  // 4. 轻微边缘描边（大陆轮廓线）
  applyEdgeOutline(ctx, W, H)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  return texture
}

/**
 * 水彩色调处理：降低饱和度、偏暖色调、提亮
 */
function applyWatercolorTone(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2]

    // RGB → HSL
    const max = Math.max(r, g, b) / 255
    const min = Math.min(r, g, b) / 255
    let l = (max + min) / 2
    let s = 0
    if (max !== min) {
      s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
    }

    // 轻微降低饱和度 15%，保持色彩鲜明
    s *= 0.85

    // 轻微提亮 5%
    l = Math.min(1, l * 1.05 + 0.02)

    // 计算色相
    let h2 = 0
    if (max !== min) {
      const delta = max - min
      if (max === r / 255) h2 = ((g / 255 - b / 255) / delta) % 6
      else if (max === g / 255) h2 = (b / 255 - r / 255) / delta + 2
      else h2 = (r / 255 - g / 255) / delta + 4
      h2 *= 60
      if (h2 < 0) h2 += 360
    }

    // 暖色偏移：给蓝色区域加一点绿，整体偏暖
    // 海洋区域（蓝色 h=180-260）→ 偏向青绿色
    if (h2 > 180 && h2 < 260) {
      h2 = h2 * 0.95 + 180 * 0.05 // 微微偏向青色
    }

    // HSL → RGB
    const rgb = hslToRgb(h2 / 360, s, l)
    d[i] = rgb[0]
    d[i + 1] = rgb[1]
    d[i + 2] = rgb[2]
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * 简单边缘检测 + 描边，给大陆加上手绘轮廓线
 * 使用 Sobel 近似，检测颜色突变处
 */
function applyEdgeOutline(ctx, w, h) {
  // 先拿原图数据做边缘检测
  const src = ctx.getImageData(0, 0, w, h)
  const sd = src.data

  // 创建边缘图层
  const edgeCanvas = document.createElement('canvas')
  edgeCanvas.width = w
  edgeCanvas.height = h
  const ectx = edgeCanvas.getContext('2d')
  const edgeData = ectx.createImageData(w, h)
  const ed = edgeData.data

  // 采样步长（性能优化，不逐像素检测）
  const step = 2

  for (let y = step; y < h - step; y++) {
    for (let x = step; x < w - step; x++) {
      const idx = (y * w + x) * 4

      // 水平梯度
      const leftIdx = (y * w + (x - step)) * 4
      const rightIdx = (y * w + (x + step)) * 4
      const gx = Math.abs(sd[leftIdx] - sd[rightIdx]) +
                  Math.abs(sd[leftIdx + 1] - sd[rightIdx + 1]) +
                  Math.abs(sd[leftIdx + 2] - sd[rightIdx + 2])

      // 垂直梯度
      const topIdx = ((y - step) * w + x) * 4
      const bottomIdx = ((y + step) * w + x) * 4
      const gy = Math.abs(sd[topIdx] - sd[bottomIdx]) +
                  Math.abs(sd[topIdx + 1] - sd[bottomIdx + 1]) +
                  Math.abs(sd[topIdx + 2] - sd[bottomIdx + 2])

      const edge = Math.sqrt(gx * gx + gy * gy)

      // 阈值检测
      if (edge > 80) {
        ed[idx] = 60       // 深灰色描边
        ed[idx + 1] = 50
        ed[idx + 2] = 40
        ed[idx + 3] = Math.min(255, edge * 0.8) // 边缘越强越不透明
      } else {
        ed[idx + 3] = 0
      }
    }
  }

  ectx.putImageData(edgeData, 0, 0)

  // 轻微模糊边缘线
  ctx.save()
  ctx.filter = 'blur(0.8px)'
  ctx.globalAlpha = 0.3
  ctx.drawImage(edgeCanvas, 0, 0)
  ctx.restore()
}

/**
 * 更真实的纸质纹理噪点
 */
function applyPaperNoise(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  for (let i = 0; i < d.length; i += 4) {
    // 纸质纹理：小范围明暗变化
    const noise = (Math.random() - 0.5) * 12
    d[i] = clamp(d[i] + noise)
    d[i + 1] = clamp(d[i + 1] + noise)
    d[i + 2] = clamp(d[i + 2] + noise)
  }

  ctx.putImageData(imageData, 0, 0)
}

function clamp(v) {
  return Math.max(0, Math.min(255, v))
}

/**
 * HSL → RGB
 */
function hslToRgb(h, s, l) {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export { EARTH_RADIUS }
