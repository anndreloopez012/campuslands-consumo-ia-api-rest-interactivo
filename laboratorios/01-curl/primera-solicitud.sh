#!/usr/bin/env bash
# Laboratorio 1 · Primera solicitud HTTP a un modelo de IA con cURL.
# La clave se lee de la variable de entorno; nunca la escribas en este archivo.
set -euo pipefail
: "${OPENAI_API_KEY:?Falta OPENAI_API_KEY. Ejecuta primero: export OPENAI_API_KEY=\"TU_CLAVE_API\"}"
MODELO="${IA_MODELO:-gpt-6-luna}"

curl --request POST \
  --url https://api.openai.com/v1/responses \
  --header "Authorization: Bearer $OPENAI_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "'"$MODELO"'",
    "instructions": "Eres un tutor de programación. Responde en español con ejemplos sencillos.",
    "input": "Explica qué es una variable en Python en máximo 80 palabras."
  }'
echo
