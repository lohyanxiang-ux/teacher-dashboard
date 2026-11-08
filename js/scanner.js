async function processImageWithAI(base64Data) {
  const apiKey = HubState.getApiKey();
  if (!apiKey) {
    alert("Please enter your Gemini API Key in the Dashboard Settings.");
    return;
  }

  const base64Content = base64Data.split(',')[1];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
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
      alert(`API Error (${res.status}): ${errData.error?.message || 'Check console for details.'}`);
      return;
    }

    const data = await res.json();
    const rawText = data.candidates[0].content.parts[0].text.trim();
    const cleanedLatex = rawText.replace(/```latex|```/g, '').trim();
    
    renderMath(cleanedLatex);
  } catch (err) {
    console.error("Network or Parsing Error:", err);
    alert("Failed to analyze image. Check browser connection or API key.");
  }
}
