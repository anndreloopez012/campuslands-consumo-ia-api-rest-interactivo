# Laboratorio 1 · cURL

**Qué es:** cURL es un programa de la terminal que envía solicitudes HTTP. Aquí lo usamos para hablar con el modelo sin escribir una aplicación.

**Para qué sirve:** ver "a mano" las piezas de una solicitud: método (`POST`), endpoint (`/v1/responses`), encabezados (`Authorization`, `Content-Type`) y cuerpo JSON (`model`, `instructions`, `input`).

## Pasos

```bash
chmod +x *.sh
export OPENAI_API_KEY="TU_CLAVE_API"   # solo en tu terminal
./verificar-clave.sh                   # dice si está configurada, sin mostrarla
./primera-solicitud.sh                 # imprime el JSON completo de la respuesta
./extraer-texto.sh "Explica qué es un error de sintaxis"   # solo el texto (necesita jq)
```

## Sin clave

Puedes practicar el filtro de `jq` con la respuesta de ejemplo (es ilustrativa):

```bash
jq -r '.output[] | select(.type=="message") | .content[] | select(.type=="output_text") | .text' respuesta-ejemplo.json
jq '.usage' respuesta-ejemplo.json
```

Fíjate que el primer elemento de `output` es de tipo `reasoning`: por eso filtramos por `type` en vez de tomar `output[0]`.

**Seguridad:** no pegues la clave en archivos, capturas ni repositorios.
