# Laboratorio 3 · JavaScript con Node.js

**Qué es:** un programa de Node.js que usa `fetch` para enviar la pregunta al modelo y procesar el JSON de vuelta.

**Para qué sirve:** practicar `async`/`await`, encabezados HTTP, `JSON.stringify`, `response.ok` y `AbortSignal.timeout`.

**Por qué en Node.js y no en el navegador:** el código del navegador lo puede leer cualquiera. Si la clave estuviera ahí, quedaría expuesta. En Node.js la clave vive en `process.env` del servidor.

## Cómo correrlo (Node.js 20 o superior)

```bash
node main.mjs                                   # modo simulado, sin clave
node main.mjs "¿Qué diferencia hay entre let y const?"
export OPENAI_API_KEY="TU_CLAVE_API" && node main.mjs   # modo real
```

| Concepto | Dónde aparece |
|---|---|
| `fetch()` | Hace la solicitud HTTP POST. |
| `async` / `await` | Esperan la respuesta sin bloquear el programa. |
| `JSON.stringify()` | Convierte el objeto en texto JSON para el cuerpo. |
| `response.ok` | `true` si el código está entre 200 y 299. |
| `AbortSignal.timeout(60000)` | Corta la espera a los 60 segundos. |
| `extraerTexto()` | Filtra `message` → `output_text` sin suponer el orden de `output`. |
