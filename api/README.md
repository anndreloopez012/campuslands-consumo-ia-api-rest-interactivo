# Backend propio para consumir un modelo de IA

Este backend es la pieza del medio en la arquitectura recomendada:

```text
Página o app (cliente)  →  POST /api/preguntar  →  este backend  →  POST https://api.openai.com/v1/responses
                                                   (valida y guarda la clave)
```

**¿Por qué existe?** Porque la API Key es secreta. Si la pusiéramos en el JavaScript del navegador, cualquiera podría verla con las herramientas de desarrollo y gastar a nuestro nombre. El backend la guarda en una variable de entorno, valida lo que llega, limita cuántas preguntas se hacen por minuto y traduce los errores del proveedor a mensajes claros.

**Funciona sin clave.** Si no defines `OPENAI_API_KEY`, el backend usa un *proveedor simulado* que devuelve una respuesta con la misma forma que la Responses API. Así puedes practicar todo el flujo sin gastar ni crear cuentas. Cuando tengas una clave, solo la defines y el mismo código llama al proveedor real.

## Cómo correrlo

Necesitas Node.js 20 o superior.

```bash
cd api
npm install
npm start            # modo simulado en http://localhost:3000
npm test             # 18 pruebas automatizadas, sin red
```

Modo real (la clave queda en tu terminal, nunca en el código ni en Git):

```bash
export OPENAI_API_KEY="TU_CLAVE_API"
npm start
```

Variables opcionales: `PORT` (3000), `IA_MODELO` (`gpt-6-luna`), `IA_TIMEOUT_MS` (60000), `LIMITE_POR_MINUTO` (20), `IA_API_URL`.

## Endpoints

| Método | Ruta | Para qué sirve |
|---|---|---|
| GET | `/_health` | Saber si el backend está vivo y en qué modo está (`simulado: true/false`). |
| POST | `/api/preguntar` | Enviar una pregunta y recibir la respuesta del modelo. |
| GET | `/api/consumo` | Ver cuántas solicitudes y tokens se han usado (no guarda preguntas). |

### POST /api/preguntar

Cuerpo:

```json
{ "pregunta": "¿Qué es una variable en Python?", "tipo": "explicar" }
```

`tipo` es opcional: `explicar` (por defecto), `funcion` o `error`. Cambia las instrucciones que se le dan al modelo.

Respuesta 200:

```json
{
  "respuesta": "Una variable es un nombre que guarda un valor…",
  "modelo": "gpt-6-luna",
  "tokens": { "entrada": 32, "salida": 45, "total": 77 },
  "simulado": true
}
```

Errores (siempre `{ "error": "mensaje" }`):

| Código | Cuándo |
|---|---|
| 400 | Pregunta vacía, que no es texto, de más de 2000 caracteres, tipo inválido o JSON mal formado. |
| 429 | Superaste el límite de solicitudes por minuto. Trae el encabezado `Retry-After`. |
| 502 | El proveedor rechazó la solicitud (por ejemplo, clave inválida → 401) o la respuesta no estaba completa. |
| 503 | El proveedor siguió saturado (429/500/502/503) después de 3 reintentos con espera exponencial. |
| 504 | El proveedor no respondió dentro del tiempo máximo (60 s). |

## Pruébalo con cURL

```bash
curl -s http://localhost:3000/_health

curl -s -X POST http://localhost:3000/api/preguntar \
  -H "Content-Type: application/json" \
  -d '{"pregunta": "Explica qué es una promesa en JavaScript", "tipo": "explicar"}'

curl -s -X POST http://localhost:3000/api/preguntar \
  -H "Content-Type: application/json" \
  -d '{"pregunta": ""}'          # → 400

curl -s http://localhost:3000/api/consumo
```

## Cómo está organizado

```text
api/
├── src/
│   ├── server.js                      Arranca el servidor
│   ├── app.js                         Arma Express: CORS, JSON, rutas y errores (fábrica crearApp)
│   ├── config.js                      Lee la configuración del entorno
│   ├── errores.js                     ErrorApi: error con código HTTP
│   ├── routes/ia.routes.js            POST /api/preguntar y GET /api/consumo
│   ├── controllers/ia.controller.js   Usa el cliente de IA y registra el consumo
│   ├── dtos/pregunta.dto.js           Limpia el cuerpo y deja solo pregunta y tipo
│   ├── validators/pregunta.validator.js  Reglas de la pregunta (400 si no se cumplen)
│   ├── services/proveedor-ia.service.js  Llama al proveedor: Bearer, timeout, reintentos, extracción del texto
│   ├── services/consumo.service.js    Contador de solicitudes y tokens
│   └── middlewares/                   Límite por IP y manejo de errores
└── test/api.test.js                   18 pruebas con node:test y un fetch falso
```

## Ideas clave que muestra el código

- **Extracción robusta:** `output` puede traer varios elementos (por ejemplo, uno de razonamiento antes del mensaje). Se filtra por `type === "message"` y luego por `type === "output_text"`; nunca se toma `output[0]` a ciegas.
- **Un 200 no basta:** si `status` no es `completed` o no hay texto, se responde 502.
- **No todo se reintenta:** 400 y 401 fallan de inmediato; 429, 500, 502, 503 y los errores de red se reintentan hasta 3 veces esperando 1 s, 2 s y 4 s (más un poco de azar, el *jitter*), o lo que diga `Retry-After`.
- **Fetch inyectable:** las pruebas pasan un `fetch` falso al servicio, así se prueban 401, 429 o timeouts sin tocar la red ni gastar tokens.
