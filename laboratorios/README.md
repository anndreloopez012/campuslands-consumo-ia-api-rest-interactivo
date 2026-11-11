# Laboratorios · Consumir un modelo de IA mediante una API RESTful

Cuatro formas de hacer **lo mismo**: enviar una pregunta a un modelo de IA con una solicitud HTTP `POST` y leer el JSON que vuelve. Cambia la herramienta, no la idea:

| Pieza | Qué es | Ejemplo |
|---|---|---|
| Endpoint | La dirección del servicio | `https://api.openai.com/v1/responses` |
| Método | Qué operación pedimos | `POST` |
| Encabezados | Datos sobre la solicitud | `Authorization: Bearer …`, `Content-Type: application/json` |
| Cuerpo | Lo que enviamos | `{ "model", "instructions", "input" }` |
| Respuesta | Lo que vuelve | `output → message → output_text → text` y `usage` |

> **Sin clave también se practica.** Python, JavaScript y el backend (`../api`) funcionan en *modo simulado* si no defines `OPENAI_API_KEY`: devuelven una respuesta con la misma forma, sin red ni costo. Usar la API real genera cargos según los tokens; una suscripción a ChatGPT no incluye la API.

## Los laboratorios

| # | Carpeta | Qué aprendes | Cómo correrlo |
|---|---|---|---|
| 1 | [`01-curl`](01-curl) | Las piezas de una solicitud, a mano, desde la terminal. Filtrar el texto con `jq`. | `./verificar-clave.sh` y `./primera-solicitud.sh` |
| 2 | [`02-python/asistente-ia-rest`](02-python/asistente-ia-rest) | Proyecto integrador: asistente de programación por consola con `requests`, errores, tokens y pruebas. | `python main.py` · pruebas: `python -m unittest discover -s pruebas -v` |
| 3 | [`03-javascript`](03-javascript) | `fetch`, `async/await`, `response.ok` y `AbortSignal.timeout` en Node.js. | `node main.mjs "tu pregunta"` |
| 4 | [`04-n8n`](04-n8n) | El mismo flujo con nodos: Webhook → Validación → HTTP Request → Code → Respond to Webhook. | Importar `workflow-ia-preguntar.json` |

Y el backend completo que protege la clave está en [`../api`](../api) (`npm start`, `npm test`).

## Reglas de seguridad para todos

1. La clave va en una variable de entorno (`export OPENAI_API_KEY="…"`), nunca en el código, en Git ni en capturas.
2. Nunca pongas la clave en JavaScript que corre en el navegador: la página llama a **tu** backend y el backend llama al proveedor.
3. Valida la pregunta antes de enviarla (no vacía, máximo 2000 caracteres).
4. Pon un tiempo máximo de espera y maneja los errores: 401 (clave), 429 (límite), 5xx (proveedor).
5. Un `200` no garantiza una buena respuesta: revisa `status` y que haya texto.
