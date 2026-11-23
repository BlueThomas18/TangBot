# ⚛ TANG BOT — Tutor de Física Aplicada I

Chatbot que resuelve ejercicios de Física Aplicada I paso a paso (datos → ecuaciones → desarrollo → resultado → verificación), con fórmulas en LaTeX, soporte para **fotos de ejercicios** y una interfaz con temática de física.

- **IA:** Google Gemini (API gratuita de Google AI Studio)
- **Hosting:** Vercel (plan gratuito)
- **Costo:** S/ 0

## Estructura

```
tang-bot/
├── index.html      ← interfaz (chat, temas, ejemplos, constantes)
├── api/chat.js     ← función serverless que llama a Gemini (oculta tu API key)
├── package.json
└── .gitignore
```

## 1. Consigue tu API key gratis de Gemini

1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google.
2. Pulsa **Create API key** y cópiala.
3. **No la pegues en `index.html`** ni la subas a GitHub. Va solo en Vercel (paso 3).
4. No vincules una cuenta de facturación al proyecto: si lo haces, dejas el plan gratis y te cobran cada uso.

## 2. Sube el proyecto a GitHub

1. Crea una cuenta en https://github.com y un repositorio nuevo llamado `tang-bot`.
2. Pulsa **Add file → Upload files**, arrastra todos los archivos (incluida la carpeta `api`) y pulsa **Commit changes**.

## 3. Publica gratis en Vercel

1. Entra a https://vercel.com e inicia sesión con GitHub.
2. Pulsa **Add New → Project** y elige el repositorio `tang-bot`.
3. En **Environment Variables** agrega:
   - Name: `GEMINI_API_KEY`
   - Value: *(tu API key)*
4. Pulsa **Deploy**. En ~1 minuto tendrás un link como `https://tang-bot.vercel.app` 🎉

> Si después cambias la API key, ve a *Settings → Environment Variables*, edítala y haz **Redeploy**.

## Opcional: cambiar de modelo

Por defecto se prueba `gemini-3.6-flash`. Si falla o se agota la cuota, se pasa a `gemini-3.5-flash-lite` y luego a `gemini-2.5-flash`.
Para cambiar el orden, agrega en Vercel la variable `GEMINI_MODEL`, por ejemplo:

```
GEMINI_MODEL=gemini-3.8-flash,gemini-3.6-flash
```

Consulta qué modelos son gratis en https://ai.google.dev/gemini-api/docs/pricing

## Probar en tu PC (opcional)

```bash
npm i -g vercel
vercel dev          # te pedirá vincular el proyecto; crea un archivo .env con GEMINI_API_KEY=tu_key
```

Abre http://localhost:3000

## Personalizar

- **Comportamiento del bot / temas del sílabo:** edita `SYSTEM_PROMPT` en `api/chat.js`.
- **Temas, ejemplos y constantes de la barra lateral:** edita `TOPICS`, `EXAMPLES` y la tabla en `index.html`.
- **Colores:** variables `--cyan`, `--amber` y `--pink` al inicio del CSS.

## Errores comunes

| Mensaje | Solución |
|---|---|
| `Falta configurar GEMINI_API_KEY` | Agrega la variable en Vercel y haz Redeploy. |
| `quota` / `429` | Se alcanzó el límite gratis por minuto o por día. Espera y vuelve a intentar. |
| `API key not valid` | Revisa que copiaste la key completa, sin espacios. |
