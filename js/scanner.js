let strokeColor = '#ef4444';
let isDrawing = false;
let ctx = null;

document.addEventListener('DOMContentLoaded', () => {
  HubState.init();
  setupCanvas();
  renderMath('3x^2 - 12x + 9 = 0');
});

function setupCanvas() {
  const canvas = document.getElementById('markup-canvas');
  const container = document.getElementById('render-container');
  
  canvas.width = container.clientWidth || 600;
  canvas.height = container.clientHeight || 400;
  
  ctx = canvas.getContext('2d');
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  window.addEventListener('resize', () => {
    const tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.putImageData(tempImage, 0, 0);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  });

  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = strokeColor;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  });

  canvas.addEventListener('pointerup', () => { isDrawing = false; });
  canvas.addEventListener('pointerleave', () => { isDrawing = false; });
}

function setPenColor(color) { 
  strokeColor = color; 
}

function clearCanvas() {
  const canvas = document.getElementById('markup-canvas');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function handleImageCapture(event) {
  const file = event.target.files[0];
  if (!file) return;

  const img = document.getElementById('captured-image');
  const placeholder = document.getElementById('camera-placeholder');
  const output = document.getElementById('katex-output');

  output.innerHTML = '<span style="color:#eab308; font-size: 1.4rem; font-weight:600;">⏳ Fast-processing equation...</span>';

  const reader = new FileReader();
  reader.onload = (e) => {
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = e.target.result;
      img.classList.remove('hidden');
      placeholder.classList.add('hidden');

      // Downscale aggressively (Max 800px) for fast mobile transmission
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

      // Export low-bandwidth compressed JPEG payload
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.70);
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
  
  // Primary model endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [
        { text: "Extract the mathematical equation from this image. Return ONLY raw valid LaTeX notation. Do not include markdown blocks (no ```latex), explanations, or surrounding text." },
        { inline_data: { mime_type: "image/jpeg", data: base64Content } }
      ]
    }]
  };

  // 15-second network timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini API Error Response:", data);
      alert(`API Error (${res.status}): ${data.error?.message || 'Request failed.'}`);
      renderMath('3x^2 - 12x + 9 = 0');
      return;
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      alert("No equation recognized. Please snap a clearer photo of the solution.");
      renderMath('3x^2 - 12x + 9 = 0');
      return;
    }

    // Strip markdown code fences and enclosing brackets
    let cleanedLatex = rawText
      .replace(/```latex/gi, '')
      .replace(/```/g, '')
      .replace(/\\\[|\\\]/g, '')
      .replace(/\\\(|\\\)/g, '')
      .trim();

    renderMath(cleanedLatex);
    clearCanvas();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Scanner Error:", err);
    if (err.name === 'AbortError') {
      alert("Request timed out after 15s. Please check your Wi-Fi signal and try again.");
    } else {
      alert(`Connection Error: ${err.message || 'Failed to reach AI service.'}`);
    }
    renderMath('3x^2 - 12x + 9 = 0');
  }
}

function renderMath(latexString) {
  document.getElementById('latex-input').value = latexString;
  const output = document.getElementById('katex-output');
  try {
    window.katex.render(latexString, output, { displayMode: true, throwOnError: false });
  } catch (e) {
    output.textContent = latexString;
  }
}
