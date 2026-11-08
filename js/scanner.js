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
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  ctx = canvas.getContext('2d');
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    ctx.strokeStyle = strokeColor;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  canvas.addEventListener('pointerup', () => isDrawing = false);
}

function setPenColor(color) { strokeColor = color; }

function clearCanvas() {
  const canvas = document.getElementById('markup-canvas');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function triggerCamera() {
  document.getElementById('camera-input').click();
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
  img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="100%" height="100%" fill="%23334155"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20">Demo Handwriting Image</text></svg>';
  img.classList.remove('hidden');
  
  renderMath('\\frac{3x^2 - 12x + 9}{3} = 0 \\implies x^2 - 4x + 3 = 0');
}

async function processImageWithAI(base64Data) {
  const apiKey = HubState.getApiKey();
  if (!apiKey) {
    alert("Please enter a Gemini API Key in the Dashboard Settings to process images.");
    return;
  }

  const base64Content = base64Data.split(',')[1];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: "Extract the mathematical equations from this image. Return ONLY raw valid LaTeX notation, no markdown blocks or surrounding text." },
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
    const data = await res.json();
    const latex = data.candidates[0].content.parts[0].text.trim();
    renderMath(latex);
  } catch (err) {
    console.error(err);
    alert("Failed to analyze image. Check API key or connection.");
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
