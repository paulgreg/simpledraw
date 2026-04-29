const throttle = (func, delay) => {
  let timeoutId = null
  let lastArgs = null

  return function (...args) {
    lastArgs = args
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func.apply(this, lastArgs)
        timeoutId = null
        lastArgs = null
      }, delay)
    }
  }
}

const hexToRgb = (hex) => {
  hex = hex.replace('#', '')

  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)

  return `rgb(${r}, ${g}, ${b})`
}

const createColorPalette = () => {
  const palette = document.getElementById('colorPalette')
  const colors = [
    '#000000',
    '#333333',
    '#666666',
    '#CCCCCC',
    '#FFFFFF',
    '#FF0000',
    '#FF6600',
    '#FF9900',
    '#FFFF00',
    '#00FF00',
    '#00FF66',
    '#00FF99',
    '#00FFFF',
    '#0033FF',
    '#0066FF',
    '#0099FF',
    '#6600FF',
    '#9900FF',
    '#CC00FF',
    '#FF00FF',
  ]

  colors.forEach((color) => {
    const swatch = document.createElement('div')
    swatch.className = 'color-swatch'
    swatch.style.backgroundColor = color
    swatch.addEventListener('click', () => selectColor(color))
    palette.appendChild(swatch)
  })

  // Select initial color from settings if available, otherwise use default (black)
  if (globalThis?.appSettings?.currentColor) {
    selectColor(globalThis.appSettings.currentColor)
  } else {
    selectColor(colors[0])
  }
}

const selectColor = (color) => {
  ctx.strokeStyle = color

  const rgbColor = hexToRgb(color)
  const swatches = document.querySelectorAll('.color-swatch')
  for (let swatch of swatches) {
    swatch.classList.remove('selected')
    if (swatch.style.backgroundColor === rgbColor) {
      swatch.classList.add('selected')
    }
  }

  if (color !== globalThis.appSettings.currentColor) {
    globalThis.appSettings.currentColor = color
    saveSettings()
  }
}

const setupBrushControls = () => {
  const brushSizeSelect = document.getElementById('brushSize')

  if (globalThis?.appSettings?.brushSize) {
    globalThis.brushSize = globalThis.appSettings.brushSize
    brushSizeSelect.value = brushSize.toString()
  }

  brushSizeSelect.addEventListener('change', (e) => {
    const newSize = Number.parseInt(e.target.value)
    ctx.lineWidth = globalThis.appSettings.brushSize = newSize
    globalThis.saveSettings()
  })
}
