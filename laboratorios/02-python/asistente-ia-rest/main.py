"""Asistente de programación por consola (proyecto integrador).

Ejecuta: python main.py
Escribe "salir" para terminar.
"""
from cliente_ia import ClienteIA, ErrorIA

TIPOS = {"1": ("explicar", "Explicación de código o concepto"), "2": ("funcion", "Generar una función"), "3": ("error", "Analizar un error")}


def elegir_tipo():
    print("\n¿Qué tipo de consulta?")
    for clave, (_, nombre) in TIPOS.items():
        print(f"  {clave}. {nombre}")
    opcion = input("Opción (Enter = 1): ").strip() or "1"
    return TIPOS.get(opcion, TIPOS["1"])[0]


def main():
    cliente = ClienteIA()
    try:
        conversar(cliente)
    except (KeyboardInterrupt, EOFError):
        print()
    print(f"\nResumen: {cliente.solicitudes} solicitudes · {cliente.tokens_totales} tokens en total. Hasta pronto.")


def conversar(cliente):
    modo = "simulado (sin OPENAI_API_KEY)" if cliente.simulado else f"real ({cliente.modelo})"
    print(f"Asistente de programación · modo {modo}")
    print('Escribe "salir" para terminar.')

    while True:  # RF-09: varias preguntas hasta que la persona decida salir
        pregunta = input("\nEscribe tu pregunta:\n> ")  # RF-01
        if pregunta.strip().lower() == "salir":
            break
        if not pregunta.strip():  # RF-02: se avisa antes de pedir el tipo
            print("Entrada no válida: la pregunta no puede estar vacía")
            continue
        tipo = elegir_tipo()
        try:
            resultado = cliente.preguntar(pregunta, tipo)
        except ValueError as error:  # entrada inválida
            print(f"Entrada no válida: {error}")
            continue
        except ErrorIA as error:  # errores HTTP, de red o de contenido
            print(f"No fue posible obtener la respuesta: {error}")
            continue

        print("\nRespuesta del modelo:")  # RF-06
        print(resultado["texto"])
        tokens = resultado["tokens"]
        print(f"\nTokens de esta solicitud: {tokens if tokens is not None else 'no disponible'}")  # RF-08


if __name__ == "__main__":
    main()
