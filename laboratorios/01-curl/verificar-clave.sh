#!/usr/bin/env bash
# Comprueba que la clave está configurada SIN mostrar su valor.
if [ -n "$OPENAI_API_KEY" ]; then
  echo "Clave configurada"
else
  echo "Falta configurar la clave. Usa: export OPENAI_API_KEY=\"TU_CLAVE_API\""
  exit 1
fi
