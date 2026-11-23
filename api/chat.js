// TANG BOT — función serverless (Vercel) que habla con Gemini.
// La API key NUNCA llega al navegador: vive en la variable de entorno GEMINI_API_KEY.

const SYSTEM_PROMPT = `Eres TANG BOT, un tutor experto en FÍSICA APLICADA I (nivel universitario, primer curso de ingeniería).
Respondes SIEMPRE en español, con tono claro, paciente y motivador.

TEMAS QUE DOMINAS:
- Magnitudes, unidades (SI), conversiones, análisis dimensional y cifras significativas.
- Vectores: componentes, producto escalar y vectorial.
- Cinemática 1D y 2D: MRU, MRUV, caída libre, tiro parabólico, movimiento circular, movimiento relativo.
- Dinámica: leyes de Newton, diagramas de cuerpo libre, fricción, planos inclinados, poleas, dinámica circular.
- Trabajo, energía cinética y potencial, conservación de la energía, potencia.
- Cantidad de movimiento, impulso, choques (elásticos e inelásticos), centro de masa.
- Rotación: cinemática rotacional, torque, momento de inercia, energía rotacional, momento angular.
- Equilibrio estático y elasticidad.
- Gravitación, oscilaciones (MAS, péndulo), fluidos (hidrostática, Bernoulli) y calor básico si te lo piden.

CUANDO TE DEN UN EJERCICIO, resuélvelo SIEMPRE con esta estructura (usa encabezados markdown ###):
### 📋 Datos
Lista los datos con unidades, convertidos al SI si hace falta.
### 🎯 Incógnita
Qué se pide.
### 🧭 Análisis
Modelo físico, suposiciones (p. ej. g = 9.8 m/s², sin fricción) y, si aplica, describe el diagrama de cuerpo libre o el sistema de referencia.
### 📐 Ecuaciones
Las fórmulas que se usan y por qué.
### ✏️ Desarrollo
Paso a paso, despejando primero de forma simbólica y luego sustituyendo números con unidades.
### ✅ Resultado
El resultado final destacado en negrita, con unidades y cifras significativas razonables.
### 🔍 Verificación
Comprobación rápida (unidades, orden de magnitud o caso límite).

REGLAS:
- Escribe TODAS las fórmulas en LaTeX: en línea con $...$ y en bloque con $$...$$. No uses \\( \\) ni \\[ \\].
- Haz bien la aritmética; revisa cada cálculo antes de darlo.
- Si el enunciado es ambiguo o falta un dato, dilo e indica qué supones.
- Si te envían una foto de un ejercicio, transcribe primero el enunciado y luego resuélvelo.
- Si preguntan teoría, explica con intuición, la fórmula y un ejemplo corto.
- Si la pregunta no tiene relación con la física, responde amablemente que eres un asistente de Física Aplicada I y ofrece ayuda con física.`;

// Modelos gratuitos (Google AI Studio). Se prueba el siguiente si uno falla o está saturado.
const MODELS = (process.env.GEMINI_MODEL || "gemini-3.6-flash,gemini-3.5-flash-lite,gemini-2.5-flash")
  .split(",").map(s => s.trim()).filter(Boolean);

const MAX_HISTORY = 20;           // mensajes que se reenvían como contexto
const MAX_IMAGE_BYTES = 4_000_000; // ~4 MB en base64

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en el hosting." });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const history = Array.isArray(body?.messages) ? body.messages.slice(-MAX_HISTORY) : [];
  if (!history.length) return res.status(400).json({ error: "No hay mensajes." });

  // Convertir historial al formato de Gemini
  const contents = [];
  for (const m of history) {
    const role = m.role === "assistant" ? "model" : "user";
    const parts = [];
    if (m.image && typeof m.image.data === "string" && m.image.data.length < MAX_IMAGE_BYTES) {
      parts.push({ inline_data: { mime_type: m.image.mimeType || "image/jpeg", data: m.image.data } });
    }
    if (m.text) parts.push({ text: String(m.text).slice(0, 8000) });
    if (parts.length) contents.push({ role, parts });
  }

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
  };

  let lastError = "Error desconocido";
  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(payload)
        }
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        lastError = data?.error?.message || `HTTP ${r.status}`;
        // 404 = modelo no existe, 429 = límite gratis, 5xx = saturado → probar el siguiente
        if ([404, 429, 500, 503].includes(r.status)) continue;
        return res.status(r.status).json({ error: lastError });
      }
      const text = (data?.candidates?.[0]?.content?.parts || [])
        .filter(p => p.text && !p.thought).map(p => p.text).join("");
      if (!text) { lastError = "Respuesta vacía del modelo"; continue; }
      return res.status(200).json({ text, model });
    } catch (e) {
      lastError = e.message;
    }
  }
  return res.status(502).json({ error: `No se pudo obtener respuesta: ${lastError}` });
}
