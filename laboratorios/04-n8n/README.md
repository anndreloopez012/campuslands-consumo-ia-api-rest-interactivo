# Laboratorio 4 · n8n

**Qué es:** n8n es una herramienta para armar automatizaciones con nodos. Aquí construimos un flujo que recibe una pregunta por HTTP, la envía al modelo con el nodo **HTTP Request** y devuelve un JSON sencillo.

**Para qué sirve:** ver el consumo de una API sin escribir una aplicación completa, y entender que n8n hace lo mismo que cURL, Python o Node.js: método, URL, encabezados y cuerpo.

```text
Webhook → Validación → ¿Pregunta válida? ─sí→ HTTP Request → Transformar respuesta → Respond to Webhook (200)
                                          └no→ Responder 400
```

## Pasos

1. En n8n: **Workflows → Import from File** y elige `workflow-ia-preguntar.json`.
2. Crea la credencial: **Credentials → New → Header Auth**, con nombre `OpenAI Header Auth`.
   - Name: `Authorization`
   - Value: `Bearer TU_CLAVE_API`
   La clave queda guardada y cifrada en el gestor de credenciales de n8n, no escrita en el flujo.
3. Abre el nodo **HTTP Request** y selecciona esa credencial.
4. Pulsa **Execute workflow** (modo prueba) y, en otra terminal:

```bash
curl -X POST http://localhost:5678/webhook-test/ia-preguntar \
  -H "Content-Type: application/json" \
  -d '{"pregunta": "Explica qué es un embedding."}'
```

Respuesta esperada (texto y tokens ilustrativos):

```json
{ "respuesta": "Un embedding es…", "modelo": "gpt-6-luna", "tokens": 125 }
```

Prueba el camino de error:

```bash
curl -X POST http://localhost:5678/webhook-test/ia-preguntar \
  -H "Content-Type: application/json" -d '{"pregunta": ""}'     # → 400
```

## Para practicar sin clave

Cambia la URL del nodo **HTTP Request** por la del backend del repo (`http://localhost:3000/api/preguntar`, con `npm start` en `api/`) y el cuerpo por `={{ { pregunta: $json.pregunta } }}`. Quita la autenticación y conecta el HTTP Request directo a Respond to Webhook (ese backend ya devuelve `respuesta`, `modelo` y `tokens`, así que no hace falta transformar). Responde en modo simulado.

**Importante:** este ejemplo no protege el webhook. Si lo publicas en internet, activa la autenticación del Webhook y un límite de uso.
