#!/usr/bin/env bash
# Laboratorio 1 · Extraer solo el texto de la respuesta con jq.
# Uso: ./extraer-texto.sh "Define qué es una función en Python."
set -euo pipefail
: "${OPENAI_API_KEY:?Falta OPENAI_API_KEY. Ejecuta primero: export OPENAI_API_KEY=\"TU_CLAVE_API\"}"
command -v jq >/dev/null || { echo "Instala jq: brew install jq (macOS) o sudo apt install jq (Ubuntu)"; exit 1; }
PREGUNTA="${1:-Define qué es una función en Python.}"
MODELO="${IA_MODELO:-gpt-6-luna}"

# jq -n arma el JSON y escapa bien las comillas de la pregunta.
CUERPO=$(jq -n --arg m "$MODELO" --arg p "$PREGUNTA" '{model: $m, input: $p}')

curl -sS https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$CUERPO" |
jq -r '
  if .error then "Error de la API: \(.error.message)"
  else
    .output[]?
    | select(.type == "message")
    | .content[]?
    | select(.type == "output_text")
    | .text
  end
'
