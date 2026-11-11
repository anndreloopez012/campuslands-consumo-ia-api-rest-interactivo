"""Pruebas sin red: validación, extracción, modo simulado y manejo de errores.

Ejecuta desde la carpeta del proyecto:  python -m unittest discover -s pruebas -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cliente_ia import ClienteIA, ErrorIA, extraer_texto, validar_pregunta  # noqa: E402


class RespuestaFalsa:
    def __init__(self, status_code, data=None):
        self.status_code = status_code
        self._data = data or {}

    def json(self):
        return self._data


class SesionFalsa:
    """Imita requests.post y guarda lo que se envió."""

    def __init__(self, respuesta=None, error=None):
        self.respuesta = respuesta
        self.error = error
        self.llamadas = []

    def post(self, url, headers=None, json=None, timeout=None):
        self.llamadas.append({"url": url, "headers": headers, "json": json, "timeout": timeout})
        if self.error:
            raise self.error
        return self.respuesta


def respuesta_ok(texto="Una lista es mutable; una tupla no."):
    return {
        "status": "completed",
        "model": "gpt-6-luna",
        "output": [
            {"type": "reasoning", "summary": []},
            {"type": "message", "content": [{"type": "output_text", "text": texto}]},
        ],
        "usage": {"total_tokens": 40},
    }


class Timeout(Exception):
    """Mismo nombre de clase que requests.exceptions.Timeout."""


class PruebasValidacion(unittest.TestCase):
    def test_pregunta_vacia(self):
        for valor in ["", "   ", None, 42]:
            with self.assertRaises(ValueError):
                validar_pregunta(valor)

    def test_pregunta_muy_larga(self):
        with self.assertRaises(ValueError):
            validar_pregunta("a" * 2001)

    def test_pregunta_valida_se_limpia(self):
        self.assertEqual(validar_pregunta("  ¿Qué es un for?  "), "¿Qué es un for?")


class PruebasExtraccion(unittest.TestCase):
    def test_mensaje_no_es_el_primer_elemento(self):
        self.assertEqual(extraer_texto(respuesta_ok("Hola")), "Hola")

    def test_sin_output(self):
        self.assertEqual(extraer_texto({}), "")


class PruebasCliente(unittest.TestCase):
    def test_modo_simulado_sin_clave(self):
        cliente = ClienteIA(api_key="")
        resultado = cliente.preguntar("¿Qué es una variable?")
        self.assertTrue(cliente.simulado)
        self.assertIn("Modo simulado", resultado["texto"])
        self.assertEqual(cliente.solicitudes, 1)
        self.assertGreater(cliente.tokens_totales, 0)

    def test_envia_bearer_y_json(self):
        sesion = SesionFalsa(RespuestaFalsa(200, respuesta_ok()))
        cliente = ClienteIA(api_key="sk-prueba", sesion=sesion)
        resultado = cliente.preguntar("¿Lista o tupla?", "explicar")
        llamada = sesion.llamadas[0]
        self.assertEqual(llamada["url"], "https://api.openai.com/v1/responses")
        self.assertEqual(llamada["headers"]["Authorization"], "Bearer sk-prueba")
        self.assertEqual(llamada["json"]["input"], "¿Lista o tupla?")
        self.assertEqual(llamada["timeout"], 60)
        self.assertEqual(resultado["tokens"], 40)
        self.assertEqual(cliente.tokens_totales, 40)

    def test_error_401_mensaje_claro(self):
        cliente = ClienteIA(api_key="sk-mala", sesion=SesionFalsa(RespuestaFalsa(401)))
        with self.assertRaisesRegex(ErrorIA, "OPENAI_API_KEY"):
            cliente.preguntar("hola")
        self.assertEqual(cliente.solicitudes, 0)

    def test_error_429(self):
        cliente = ClienteIA(api_key="sk", sesion=SesionFalsa(RespuestaFalsa(429)))
        with self.assertRaisesRegex(ErrorIA, "429"):
            cliente.preguntar("hola")

    def test_status_incompleto(self):
        data = respuesta_ok()
        data["status"] = "incomplete"
        cliente = ClienteIA(api_key="sk", sesion=SesionFalsa(RespuestaFalsa(200, data)))
        with self.assertRaises(ErrorIA):
            cliente.preguntar("hola")

    def test_timeout(self):
        cliente = ClienteIA(api_key="sk", sesion=SesionFalsa(error=Timeout()))
        with self.assertRaisesRegex(ErrorIA, "tardó"):
            cliente.preguntar("hola")

    def test_tipo_invalido(self):
        with self.assertRaises(ValueError):
            ClienteIA(api_key="").preguntar("hola", "poema")


if __name__ == "__main__":
    unittest.main()
