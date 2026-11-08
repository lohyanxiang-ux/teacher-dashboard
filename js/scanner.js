let strokeColor = '#ef4444';
let isDrawing = false;
let ctx = null;
let currentMode = 'draw';

document.addEventListener('DOMContentLoaded', () => {
  HubState.init();
  setupCanvas();
  renderMath('\\frac{3x^2 - 12x + 9}{3} = 0 \\implies x^2 - 4x + 3 = 0');
});

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
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left + scrollLeft, e.clientY - rect.top + scrollTop);
  };

  canvas.onpointermove = (e) => {
    if (!isDrawing || currentMode !== 'draw') return;
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    ctx.strokeStyle = strokeColor;
    ctx.lineTo(e.clientX - rect.left + scrollLeft, e.clientY - rect.top + scrollTop);
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
    canvas.style.pointerEvents = 'none';
    btnScroll.className = 'btn btn-small btn-primary';
    btnDraw.className = 'btn btn-small btn-secondary';
  } else {
    canvas.style.pointerEvents = 'auto';
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

  output.innerHTML = '<span style="color:#eab308; font-size: 1.4rem; font-weight:600;">⚡ Fast processing...</span>';

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
      const maxDim = 600;

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

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.50);
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
  
  // Model Fallback Pipeline (tries primary, then fallback if 404 occurs)
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite'
  ];

  const payload = {
    contents: [{
      parts: [
        { text: "Output ONLY raw valid LaTeX notation for the math in this image. No markdown, no fences, no text." },
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
          alert("No math equation detected. Snap a clearer picture.");
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
        return; // Successful response received, exit loop
      } else {
        lastError = data.error?.message || `Status ${res.status}`;
        // If not a 404 model availability error (e.g. invalid key), exit immediately
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

  alert(`Model/Connection Error: ${lastError || 'Failed to analyze image.'}`);
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
