"""Cliente HTTP para consumir un modelo de IA mediante la Responses API.

Separa la lógica de comunicación de la interfaz de consola (main.py).
Sin OPENAI_API_KEY trabaja en modo simulado: misma forma de respuesta, sin red ni costo.
"""
import os

API_URL = "https://api.openai.com/v1/responses"
MODELO = os.getenv("IA_MODELO", "gpt-6-luna")
MAX_CARACTERES = 2000
TIMEOUT_SEGUNDOS = 60

# Instrucciones según el tipo de consulta (ejercicio complementario 11.5).
INSTRUCCIONES = {
    "explicar": "Eres un tutor de programación. Explica en español, de forma clara y con un ejemplo.",
    "funcion": "Eres un tutor de programación. Escribe una función corta y comentada en español.",
    "error": "Eres un tutor de programación. Analiza el error, explica la causa y propone una corrección.",
}


class ErrorIA(Exception):
    """Error con un mensaje comprensible para la persona usuaria."""


def validar_pregunta(pregunta):
    """RF-02: la pregunta debe ser texto, no vacía y de longitud razonable. Devuelve el texto limpio."""
    if not isinstance(pregunta, str) or not pregunta.strip():
        raise ValueError("La pregunta no puede estar vacía")
    pregunta = pregunta.strip()
    if len(pregunta) > MAX_CARACTERES:
        raise ValueError(f"La pregunta no puede superar {MAX_CARACTERES} caracteres")
    return pregunta


def extraer_texto(data):
    """RF-05: busca los textos output_text dentro de los mensajes, sin suponer que output[0] es el mensaje."""
    textos = []
    for item in data.get("output", []) or []:
        if item.get("type") == "message":
            for content in item.get("content", []) or []:
                if content.get("type") == "output_text":
                    textos.append(content.get("text", ""))
    return "\n".join(textos).strip()


def respuesta_simulada(pregunta):
    """Respuesta con la forma de la Responses API para practicar sin clave."""
    texto = f'[Modo simulado] El modelo respondería aquí a: "{pregunta[:120]}". Define OPENAI_API_KEY para una respuesta real.'
    entrada = max(1, len(pregunta) // 4)
    salida = max(1, len(texto) // 4)
    return {
        "id": "resp_simulado",
        "object": "response",
        "status": "completed",
        "model": MODELO,
        "output": [
            {"type": "reasoning", "summary": []},
            {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": texto}]},
        ],
        "usage": {"input_tokens": entrada, "output_tokens": salida, "total_tokens": entrada + salida},
    }


MENSAJES_HTTP = {
    400: "La solicitud no es válida: revisa la estructura y los parámetros.",
    401: "La clave no es válida o falta: revisa OPENAI_API_KEY.",
    403: "Acceso denegado: revisa los permisos del proyecto.",
    404: "No se encontró el recurso: revisa el endpoint o el modelo.",
    429: "Demasiadas solicitudes o cuota agotada: espera un momento.",
}


class ClienteIA:
    """RF-03, RF-04, RF-07, RF-08: envía la pregunta, autentica y controla errores y consumo."""

    def __init__(self, api_key=None, sesion=None, modelo=MODELO):
        self.api_key = api_key if api_key is not None else os.getenv("OPENAI_API_KEY", "")
        self.modelo = modelo
        self.simulado = not self.api_key
        self._sesion = sesion  # se puede inyectar una sesión falsa en las pruebas
        self.solicitudes = 0
        self.tokens_totales = 0

    def _http(self):
        if self._sesion is None:
            import requests  # se importa aquí para que el modo simulado no lo necesite
            self._sesion = requests
        return self._sesion

    def preguntar(self, pregunta, tipo="explicar"):
        pregunta = validar_pregunta(pregunta)
        if tipo not in INSTRUCCIONES:
            raise ValueError(f"Tipo de consulta inválido: {tipo}")

        if self.simulado:
            data = respuesta_simulada(pregunta)
        else:
            data = self._enviar(pregunta, tipo)

        if data.get("status") != "completed":
            raise ErrorIA("La respuesta del modelo no finalizó correctamente")
        texto = extraer_texto(data)
        if not texto:
            raise ErrorIA("El modelo no devolvió texto")

        tokens = (data.get("usage") or {}).get("total_tokens")
        self.solicitudes += 1
        self.tokens_totales += tokens or 0
        return {"texto": texto, "tokens": tokens, "modelo": data.get("model", self.modelo)}

    def _enviar(self, pregunta, tipo):
        http = self._http()
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.modelo,
            "instructions": INSTRUCCIONES[tipo],
            "input": pregunta,
            "max_output_tokens": 500,
        }
        try:
            response = http.post(API_URL, headers=headers, json=payload, timeout=TIMEOUT_SEGUNDOS)
        except Exception as error:  # timeout o red caída
            nombre = type(error).__name__
            if "Timeout" in nombre:
                raise ErrorIA("El proveedor tardó demasiado en responder") from error
            raise ErrorIA("No fue posible conectar con el proveedor") from error

        if response.status_code >= 400:
            mensaje = MENSAJES_HTTP.get(response.status_code, "El proveedor tuvo un problema; intenta más tarde.")
            raise ErrorIA(f"Error HTTP {response.status_code}: {mensaje}")
        return response.json()
