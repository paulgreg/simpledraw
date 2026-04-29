const storageKey = 'SimpleDrawContent'

const MIN_DRAW_INTERVAL = 16 // ~60fps

let canvas, ctx
let isDrawing = false
let isDrawingOptimized = false
let hasChanged = false

let lastX = 0
let lastY = 0

let lastDrawTime = 0

const saveContent = (canvas) => {
  if (!hasChanged) return
  try {
    const data = {
      dataUrl: canvas.toDataURL('image/png'),
    }
    console.debug('saveContent', data)
    localStorage.setItem(storageKey, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error.message)
  }
}

const throttledSaveContent = throttle((canvas) => {
  saveContent(canvas)
}, 2000)

const resizeCanvas = () => {
  const dpr = window.devicePixelRatio || 1

  canvas.width = canvas.offsetWidth * dpr
  canvas.height = canvas.offsetHeight * dpr

  ctx.scale(dpr, dpr)

  ctx.strokeStyle = currentColor
  ctx.lineWidth = brushSize
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const setupCanvas = () => {
  canvas = document.getElementById('drawCanvas')
  ctx = canvas.getContext('2d')

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  canvas.addEventListener('mousedown', startDrawing)
  canvas.addEventListener('mousemove', draw)
  canvas.addEventListener('mouseup', stopDrawing)
  canvas.addEventListener('mouseout', stopDrawing)

  canvas.addEventListener('touchstart', startDrawing)
  canvas.addEventListener('touchmove', draw)
  canvas.addEventListener('touchend', stopDrawing)
}

const startDrawing = (e) => {
  e.preventDefault()
  hasChanged = true
  isDrawing = true
  isDrawingOptimized = true

  const rect = canvas.getBoundingClientRect()
  lastX = (e.clientX || e.touches[0].clientX) - rect.left
  lastY = (e.clientY || e.touches[0].clientY) - rect.top

  ctx.beginPath()
  ctx.moveTo(lastX, lastY)

  requestAnimationFrame(drawOptimized)
}

const draw = (e) => {
  if (!isDrawing) return
  e.preventDefault()

  const rect = canvas.getBoundingClientRect()
  lastX = (e.clientX || e.touches[0].clientX) - rect.left
  lastY = (e.clientY || e.touches[0].clientY) - rect.top
}

const drawOptimized = () => {
  if (!isDrawingOptimized) return

  const now = performance.now()
  if (now - lastDrawTime >= MIN_DRAW_INTERVAL) {
    ctx.lineTo(lastX, lastY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    lastDrawTime = now
  }

  requestAnimationFrame(drawOptimized)
}

const stopDrawing = () => {
  isDrawing = false
  isDrawingOptimized = false
  ctx.beginPath()

  throttledSaveContent(canvas)
}

const setupFileControls = () => {
  document.getElementById('clearBtn').addEventListener('click', clearImage)
  document.getElementById('saveBtn').addEventListener('click', saveImage)
  document.getElementById('loadBtn').addEventListener('click', loadImage)
}

const clearImage = () => {
  if (confirm('clear ?')) {
    localStorage.clear()
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

const saveImage = () => {
  const link = document.createElement('a')
  link.download = 'drawing.png'

  // Create temporary canvas at CSS resolution for export
  const exportCanvas = document.createElement('canvas')
  const exportCtx = exportCanvas.getContext('2d')

  // Set export canvas to CSS dimensions (not device pixels)
  exportCanvas.width = canvas.offsetWidth
  exportCanvas.height = canvas.offsetHeight

  // Draw current canvas content, scaled down from device pixels to CSS pixels
  exportCtx.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
  )

  link.href = exportCanvas.toDataURL('image/png')
  link.click()
}

const loadImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, img.width, img.height)

          throttledSaveContent(canvas)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  })
  input.click()
}

const restoreCanvas = () => {
  try {
    const savedData = localStorage.getItem(storageKey)
    if (savedData) {
      const data = JSON.parse(savedData)

      if (!data.dataUrl || data.dataUrl === 'data:,') {
        console.debug('No valid image data to restore')
        return
      }

      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const dpr = window.devicePixelRatio || 1
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          0,
          0,
          img.width / dpr,
          img.height / dpr
        )
        console.debug('restore canvas')
      }
      img.onerror = (error) => {
        console.warn('Failed to load saved image:', error.message)
      }
      img.src = data.dataUrl
    }
  } catch (error) {
    console.warn('Failed to restore canvas from localStorage:', error.message)
  }
}

const throttledResize = throttle(() => {
  resizeCanvas()
  restoreCanvas()
}, 100)

document.addEventListener('DOMContentLoaded', function () {
  setupCanvas()
  createColorPalette()
  setupBrushControls()
  setupFileControls()

  resizeCanvas()
  restoreCanvas()

  window.addEventListener('beforeunload', () => {
    saveContent(canvas)
  })

  window.addEventListener('resize', () => {
    throttledResize()
  })
})
