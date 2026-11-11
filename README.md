# Campuslands · Consumo de Modelos de IA mediante una API RESTful (Estación API)

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Guía%20interactiva-2463eb)](https://anndreloopez012.github.io/campuslands-consumo-ia-api-rest-interactivo/)
[![HyperFrames](https://img.shields.io/badge/HyperFrames-11%20videos%20explicativos-6b3fe0)](motion/explicadores)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B%20ESM-339933?logo=node.js&logoColor=white)](api)
[![Python](https://img.shields.io/badge/Python-requests-3776AB?logo=python&logoColor=white)](laboratorios/02-python/asistente-ia-rest)
[![n8n](https://img.shields.io/badge/n8n-HTTP%20Request-EA4B71)](laboratorios/04-n8n)

Guía teórico-práctica **interactiva y animada** para aprender a integrar modelos de Inteligencia Artificial generativa en aplicaciones mediante solicitudes HTTP: endpoints, métodos, autenticación con API Key, JSON, respuestas, errores, reintentos, tokens y costos. Se practica con **cURL, Python, JavaScript y n8n**, tomando como referencia la Responses API de OpenAI.

**Guía publicada:** [anndreloopez012.github.io/campuslands-consumo-ia-api-rest-interactivo](https://anndreloopez012.github.io/campuslands-consumo-ia-api-rest-interactivo/)

**Formación en IA Generativa · Integración de servicios inteligentes · Nivel básico–intermedio**

---

## Qué incluye

- **Página interactiva** (`index.html`, `styles.css`, `app.js`): 10 estaciones con progreso, XP, cronómetro de 60 minutos y modo proyector para la clase.
- **11 videos explicativos animados con HyperFrames**, uno por cada concepto, en «modo maestro»: pregunta, analogía, pizarra paso a paso con subtítulos e idea clave. Cada video tiene capítulos para saltar directo a un paso.
- **8 simuladores que funcionan sin clave**:
  - *¿Quién hace qué?*: arrastra tareas a cliente, backend o proveedor.
  - *Desarma la URL*: protocolo, dominio, versión y recurso.
  - *¿Qué método usarías?*: GET, POST, PUT, PATCH y DELETE con escenarios.
  - *Simulador de solicitudes*: arma método, URL, encabezados y cuerpo JSON, envía y mira el viaje del paquete. Provoca 401, 404, 405, 400, 429, 503 o una respuesta `incomplete`, con diagnóstico en español y el código equivalente en cURL, Python, JavaScript y n8n. En **modo backend local** llama a tu propio `api/`.
  - *Inspector del navegador*: por qué la clave nunca va en el frontend.
  - *Explorador JSON*: encuentra el texto generado (no está en `output[0]`) y su ruta en jq, Python y JS.
  - *Reintentos con exponential backoff*: 503, 429 con `Retry-After`, 401 y proveedor caído.
  - *Tokens y costos*: tu texto partido en fichas y el simulador de costos de la guía.
- **Backend propio** en `api/` (Express 5, ESM): protege la clave, valida, reintenta con backoff y cuenta tokens. 18 pruebas.
- **4 laboratorios** en `laboratorios/`: cURL, asistente en Python (proyecto integrador, 12 pruebas), Node.js con `fetch` y workflow importable de n8n.
- Proyecto integrador con requerimientos RF-01 a RF-09, rúbrica de evaluación, reto final de 10 preguntas y glosario con buscador.

> **Sin credenciales por defecto.** Todo se puede practicar sin API Key: el simulador de la página, el backend, Python y JavaScript tienen *modo simulado* que devuelve una respuesta con la misma forma que la Responses API. Con `OPENAI_API_KEY` definida, el backend y los laboratorios usan el proveedor real (esto genera cargos según los tokens; una suscripción a ChatGPT no incluye la API).

---

## Ruta de aprendizaje

| Estación | Tema | Video | Resultado |
|---|---|---|---|
| 00 | Bienvenida | — | Competencia y resultados RA 1–RA 7 |
| 01 | API y REST | P1, P2, P3 | Cliente, backend y proveedor; REST vs API HTTP de inferencia |
| 02 | Endpoints y métodos | P4, P5 | Leer `https://api.openai.com/v1/responses` y elegir el método |
| 03 | Arma tu solicitud | P6 | Método, encabezados, cuerpo JSON y código de estado |
| 04 | API Key y seguridad | P7 | `Authorization: Bearer`, variables de entorno, nunca en el navegador |
| 05 | Leer el JSON | P8 | `output → message → content → output_text → text` y `usage` |
| 06 | Laboratorios | P11 | cURL, Python, JavaScript y n8n |
| 07 | Errores y reintentos | P9 | Códigos HTTP, cuándo reintentar, backoff, 200 ≠ buena respuesta |
| 08 | Tokens y costos | P10 | Entrada, salida, cálculo de costo y cómo optimizar |
| 09 | Proyecto integrador | — | Asistente de programación por consola (RF-01 a RF-09) |
| 10 | Reto final | — | 10 preguntas, glosario y referencias |

---

## Cómo usarlo

### Ver la página en tu computadora

Los videos necesitan un servidor que permita saltar dentro del archivo (Range), así que no basta con abrir el HTML con doble clic:

```bash
npx --yes http-server . -p 8765 -c-1
```

Abre `http://localhost:8765`.

### Backend propio (modo backend local del simulador)

```bash
cd api
npm install
npm start          # http://localhost:3000 · modo simulado si no hay OPENAI_API_KEY
npm test           # 18 pruebas con node:test
```

En la página, en *Arma tu solicitud*, elige **Mi backend local**: la página envía `POST http://localhost:3000/api/preguntar` con `{"pregunta": "…"}` y nunca ve la clave.

### Laboratorios

Instrucciones paso a paso en [`laboratorios/README.md`](laboratorios/README.md).

---

## Videos explicativos (HyperFrames)

Las escenas viven en `motion/explicadores/scenes/p01 … p11`, con un kit común en `motion/explicadores/shared` (portada, analogía, riel de pasos, subtítulos, Orbit y cierre). La guía para escribir o corregir una escena está en [`motion/explicadores/AUTHORING.md`](motion/explicadores/AUTHORING.md).

```bash
cd motion/explicadores/scenes/p04
npx --yes hyperframes@0.8.186 check .        # validar
cd ../..
node render-all.mjs                           # renderizar todo a assets/motion/
node render-all.mjs p04 p09                   # solo algunos
```

Si cambias los pasos de un video, actualiza también `EXPLICADORES` en `app.js` (los capítulos se calculan con la duración y los pasos).

---

## Estructura

```text
campuslands-consumo-ia-api-rest-interactivo/
├── index.html · styles.css · app.js     # la guía interactiva (GitHub Pages)
├── assets/
│   ├── fonts/                           # Bricolage Grotesque, Figtree, JetBrains Mono
│   ├── img/orbit.png                    # Orbit, el guía
│   └── motion/                          # p01…p11.mp4 y pósteres
├── motion/explicadores/                 # fuentes HyperFrames de los 11 videos
├── api/                                 # backend Express que protege la clave (+ pruebas)
└── laboratorios/
    ├── 01-curl/
    ├── 02-python/asistente-ia-rest/     # proyecto integrador
    ├── 03-javascript/
    └── 04-n8n/
```

## Criterios de evaluación

| Criterio | Ponderación |
|---|---|
| Comprensión de APIs REST y HTTP | 15 % |
| Construcción de solicitudes y autenticación | 20 % |
| Implementación del cliente HTTP | 25 % |
| Procesamiento de respuestas JSON | 15 % |
| Manejo de errores y seguridad | 15 % |
| Documentación y sustentación | 10 % |

## Referencias

- [OpenAI API · Guía de inicio](https://platform.openai.com/docs/quickstart)
- [Generación de texto con la Responses API](https://platform.openai.com/docs/guides/text)
- [Buenas prácticas de producción](https://platform.openai.com/docs/guides/production-best-practices)
- [n8n · Nodo HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [MDN · Generalidades de HTTP](https://developer.mozilla.org/es/docs/Web/HTTP/Overview)

Aunque los ejemplos usan OpenAI, los principios de comunicación HTTP, intercambio de JSON y seguridad aplican a otros proveedores. El identificador de modelo `gpt-6-luna` es el de la guía; la disponibilidad depende del acceso de cada cuenta.

---

Hecho con cariño para los Campers de **Campuslands Guatemala**. Licencia MIT.
