import * as THREE from 'three'

/**
 * 射线检测管理器 - 处理图标点击 + hover 效果
 */
export function createRaycaster(camera, domElement, markerGroup) {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const hoverMouse = new THREE.Vector2()
  let onClick = null
  let hoveredSprite = null

  // hover 提示框
  const tooltip = document.createElement('div')
  tooltip.className = 'marker-tooltip'
  tooltip.style.cssText = `
    position:fixed;pointer-events:none;z-index:200;
    background:rgba(10,14,39,0.9);color:#e0e0e0;
    padding:6px 12px;border-radius:8px;font-size:13px;
    border:1px solid rgba(168,216,234,0.3);
    backdrop-filter:blur(8px);display:none;
    white-space:nowrap;transform:translate(-50%,-120%);
  `
  document.body.appendChild(tooltip)

  function onPointerDown(event) {
    const rect = domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  function onPointerUp(event) {
    const rect = domElement.getBoundingClientRect()
    const upX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const upY = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const dx = Math.abs(upX - mouse.x)
    const dy = Math.abs(upY - mouse.y)
    if (dx > 0.02 || dy > 0.02) return

    raycaster.setFromCamera(new THREE.Vector2(upX, upY), camera)
    const intersects = raycaster.intersectObjects(markerGroup.children, false)

    if (intersects.length > 0) {
      const sprite = intersects[0].object
      if (sprite.material.opacity > 0.3 && onClick) {
        onClick(sprite.userData)
      }
    }
  }

  function onPointerMove(event) {
    const rect = domElement.getBoundingClientRect()
    hoverMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    hoverMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(hoverMouse, camera)
    const intersects = raycaster.intersectObjects(markerGroup.children, false)

    if (intersects.length > 0) {
      const sprite = intersects[0].object
      if (sprite.material.opacity > 0.3) {
        domElement.style.cursor = 'pointer'
        tooltip.textContent = `${sprite.userData.country_name} · ${sprite.userData.landmark_name}`
        tooltip.style.display = 'block'
        tooltip.style.left = event.clientX + 'px'
        tooltip.style.top = event.clientY + 'px'
        hoveredSprite = sprite
        return
      }
    }
    domElement.style.cursor = 'grab'
    tooltip.style.display = 'none'
    hoveredSprite = null
  }

  domElement.addEventListener('pointerdown', onPointerDown)
  domElement.addEventListener('pointerup', onPointerUp)
  domElement.addEventListener('pointermove', onPointerMove)

  function setClickHandler(handler) {
    onClick = handler
  }

  function dispose() {
    domElement.removeEventListener('pointerdown', onPointerDown)
    domElement.removeEventListener('pointerup', onPointerUp)
    domElement.removeEventListener('pointermove', onPointerMove)
    tooltip.remove()
  }

  return { setClickHandler, dispose }
}
