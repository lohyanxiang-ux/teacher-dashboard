let strokeColor = '#ef4444';
let isDrawing = false;
let ctx = null;
let currentMode = 'draw';
let zoomScale = 1.0;
let initialPinchDistance = null;
let initialPinchScale = 1.0;

document.addEventListener('DOMContentLoaded', () => {
  HubState.init();
  setupCanvas();
  setupClipboardPaste();
  setupPinchZoom();
  renderMath('\\frac{3x^2 - 12x + 9}{3} = 0 \\implies x^2 - 4x + 3 = 0');
});

// Enable direct clipboard pasting of screenshots (⌘V or iPad paste)
function setupClipboardPaste() {
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const fakeEvent = { target: { files: [file] } };
          handleImageCapture(fakeEvent);
        }
        break;
      }
    }
  });
}

// Pinch-to-zoom gesture handler for iPad touchscreens
function setupPinchZoom() {
  const container = document.getElementById('render-container');
  if (!container) return;

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialPinchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchScale = zoomScale;
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault(); // Prevent full page browser scaling
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const scaleFactor = currentDistance / initialPinchDistance;
      const targetScale = Math.min(Math.max(initialPinchScale * scaleFactor, 0.5), 3.5);
      setZoom(targetScale);
    }
  }, { passive: false });

  container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialPinchDistance = null;
    }
  });
}

function adjustZoom(delta) {
  setZoom(zoomScale + delta);
}

function resetZoom() {
  setZoom(1.0);
}

function setZoom(newScale) {
  zoomScale = Math.min(Math.max(newScale, 0.5), 3.5);
  const wrapper = document.getElementById('zoom-wrapper');
  const label = document.getElementById('zoom-label');

  if (wrapper) {
    wrapper.style.transform = `scale(${zoomScale})`;
  }
  if (label) {
    label.textContent = `${Math.round(zoomScale * 100)}%`;
  }
}

function setupCanvas() {
  const canvas = document.getElementById('markup-canvas');
  const container = document.getElementById('render-container');
  if (!canvas || !container) return;

  const targetWidth = Math.max(container.clientWidth, container.scrollWidth, 600);
  const targetHeight = Math.max(container.clientHeight, container.scrollHeight, 400);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx = canvas.getContext('2d');
  resetCtxStyle();

  window.removeEventListener('resize', syncCanvasSize);
  window.addEventListener('resize', syncCanvasSize);

  canvas.onpointerdown = (e) => {
    if (currentMode !== 'draw') return;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    // Scale touch coordinates proportionally to match current zoom scale
    const x = (e.clientX - rect.left + scrollLeft) / zoomScale;
    const y = (e.clientY - rect.top + scrollTop) / zoomScale;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  canvas.onpointermove = (e) => {
    if (!isDrawing || currentMode !== 'draw') return;
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    const x = (e.clientX - rect.left + scrollLeft) / zoomScale;
    const y = (e.clientY - rect.top + scrollTop) / zoomScale;

    ctx.strokeStyle = strokeColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  canvas.onpointerup = () => { isDrawing = false; };
  canvas.onpointerleave = () => { isDrawing = false; };
}

function resetCtxStyle() {
  if (!ctx) return;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function syncCanvasSize() {
  const canvas = document.getElementById('markup-canvas');
  const container = document.getElementById('render-container');
  if (!canvas || !container || !ctx) return;

  const tempImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const targetWidth = Math.max(container.clientWidth, container.scrollWidth);
  const targetHeight = Math.max(container.clientHeight, container.scrollHeight);

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.putImageData(tempImageData, 0, 0);
  resetCtxStyle();
}

function setInteractionMode(mode) {
  currentMode = mode;
  const canvas = document.getElementById('markup-canvas');
  const btnDraw = document.getElementById('btn-mode-draw');
  const btnScroll = document.getElementById('btn-mode-scroll');

  if (mode === 'scroll') {
    canvas.style.pointerEvents = 'none'; // Disables drawing to allow scrolling & pinch-to-zoom
    btnScroll.className = 'btn btn-small btn-primary';
    btnDraw.className = 'btn btn-small btn-secondary';
  } else {
    canvas.style.pointerEvents = 'auto'; // Enables stylus & finger drawing
    btnDraw.className = 'btn btn-small btn-primary';
    btnScroll.className = 'btn btn-small btn-secondary';
  }
}

function toggleImagePanel() {
  const layout = document.querySelector('.scanner-layout');
  const btn = document.getElementById('toggle-panel-btn');
  const isHidden = layout.classList.toggle('hide-image');

  btn.textContent = isHidden ? '👁️ Show Image' : '◀ Hide Image';

  setTimeout(() => {
    syncCanvasSize();
  }, 200);
}

function setPenColor(color) { 
  strokeColor = color; 
}

function clearCanvas() {
  const canvas = document.getElementById('markup-canvas');
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function handleImageCapture(event) {
  const file = event.target.files[0];
  if (!file) return;

  const img = document.getElementById('captured-image');
  const placeholder = document.getElementById('camera-placeholder');
  const output = document.getElementById('katex-output');

  output.innerHTML = '<span style="color:#eab308; font-size: 1.4rem; font-weight:600;">⚡ Processing image...</span>';

  const reader = new FileReader();
  reader.onload = (e) => {
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = e.target.result;
      img.classList.remove('hidden');
      placeholder.classList.add('hidden');

      const canvas = document.createElement('canvas');
      let width = tempImg.width;
      let height = tempImg.height;
      const maxDim = 800;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctxTemp = canvas.getContext('2d');
      ctxTemp.drawImage(tempImg, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
      processImageWithAI(compressedDataUrl);
    };
    tempImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function loadDemoImage() {
  document.getElementById('camera-placeholder').classList.add('hidden');
  const img = document.getElementById('captured-image');
  img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="100%" height="100%" fill="%23334155"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="22">Handwritten Demo Solution</text></svg>';
  img.classList.remove('hidden');
  
  renderMath('\\frac{3x^2 - 12x + 9}{3} = 0 \\implies x^2 - 4x + 3 = 0');
}

async function processImageWithAI(base64Data) {
  const rawKey = HubState.getApiKey();
  const apiKey = rawKey ? rawKey.trim() : '';

  if (!apiKey) {
    alert("Please enter your Gemini API Key in Dashboard Settings (⚙️).");
    renderMath('3x^2 - 12x + 9 = 0');
    return;
  }

  const base64Content = base64Data.split(',')[1];
  
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite'
  ];

  const payload = {
    contents: [{
      parts: [
        { text: "Extract the mathematical equation from this image or screenshot. Ignore application toolbars, surrounding menus, or margin text. Output ONLY raw valid LaTeX notation. No markdown code blocks, no explanations." },
        { inline_data: { mime_type: "image/jpeg", data: base64Content } }
      ]
    }],
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 256
    }
  };

  let lastError = null;

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!rawText) {
          alert("No math equation detected in screenshot.");
          renderMath('3x^2 - 12x + 9 = 0');
          return;
        }

        let cleanedLatex = rawText
          .replace(/```latex/gi, '')
          .replace(/```/g, '')
          .replace(/\\\[|\\\]/g, '')
          .replace(/\\\(|\\\)/g, '')
          .trim();

        renderMath(cleanedLatex);
        clearCanvas();
        return;
      } else {
        lastError = data.error?.message || `Status ${res.status}`;
        if (res.status !== 404) {
          alert(`API Error (${res.status}): ${lastError}`);
          renderMath('3x^2 - 12x + 9 = 0');
          return;
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err.message;
    }
  }

  alert(`Model/Connection Error: ${lastError || 'Failed to analyze screenshot.'}`);
  renderMath('3x^2 - 12x + 9 = 0');
}

function renderMath(latexString) {
  document.getElementById('latex-input').value = latexString;
  const output = document.getElementById('katex-output');
  try {
    window.katex.render(latexString, output, { displayMode: true, throwOnError: false });
  } catch (e) {
    output.textContent = latexString;
  }
  syncCanvasSize();
}
