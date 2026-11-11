# Laboratorio 2 y proyecto integrador · Asistente de programación en Python

**Qué es:** una aplicación de consola que recibe tu pregunta, la envía a un modelo de IA por HTTP POST y muestra la respuesta y los tokens usados.

**Para qué sirve:** ver todas las piezas de una integración real: variable de entorno para la clave, encabezados, cuerpo JSON, tiempo máximo de espera, lectura del JSON de respuesta y errores comprensibles.

## Estructura

```text
asistente-ia-rest/
├── main.py              Interfaz de consola (preguntas en bucle hasta "salir")
├── cliente_ia.py        Comunicación HTTP con el proveedor (separada de la consola)
├── requirements.txt     Dependencia: requests
├── .gitignore           Deja fuera .venv y .env
└── pruebas/
    └── test_validacion.py   12 pruebas sin red
```

## Cómo correrlo

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
python main.py                     # sin clave: modo simulado
export OPENAI_API_KEY="TU_CLAVE_API" && python main.py   # modo real
python -m unittest discover -s pruebas -v                # pruebas
```

## Requerimientos que cumple

| Código | Dónde |
|---|---|
| RF-01 Ingresar pregunta | `main.py` → `input()` |
| RF-02 Validar que no esté vacía | `validar_pregunta()` |
| RF-03 Enviar con HTTP POST | `ClienteIA._enviar()` |
| RF-04 Autenticar con credencial protegida | `Authorization: Bearer` leído de `OPENAI_API_KEY` |
| RF-05 Procesar JSON | `extraer_texto()` |
| RF-06 Mostrar la respuesta | `main.py` |
| RF-07 Gestionar errores | `ErrorIA` con mensajes por código HTTP, red y timeout |
| RF-08 Mostrar tokens | `usage.total_tokens` |
| RF-09 Varias preguntas hasta salir | bucle `while True` |
| Extra: tipo de consulta y contador | `elegir_tipo()`, `solicitudes`, `tokens_totales` |
