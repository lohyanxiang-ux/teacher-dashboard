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

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('captured-image');
    img.src = e.target.result;
    img.classList.remove('hidden');
    document.getElementById('camera-placeholder').classList.add('hidden');
    processImageWithAI(e.target.result);
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
  const apiKey = HubState.getApiKey();
  if (!apiKey) {
    alert("Please enter your Gemini API Key in Dashboard Settings (⚙️).");
    return;
  }

  const base64Content = base64Data.split(',')[1];
  
  // Endpoint updated to gemini-3.8-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [
        { text: "Extract the mathematical equations from this image. Return ONLY raw valid LaTeX notation, no markdown code blocks (do not wrap in ```latex), no explanations, and no surrounding text." },
        { inline_data: { mime_type: "image/jpeg", data: base64Content } }
      ]
    }]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Gemini API Error Response:", errData);
      alert(`API Error (${res.status}): ${errData.error?.message || 'Check connection or key.'}`);
      return;
    }

    const data = await res.json();
    const rawText = data.candidates[0].content.parts[0].text.trim();
    const cleanedLatex = rawText.replace(/```latex|```/g, '').trim();
    
    renderMath(cleanedLatex);
    clearCanvas();
  } catch (err) {
    console.error("Network/Parsing Error:", err);
    alert("Failed to analyze image. Please verify internet connection.");
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
