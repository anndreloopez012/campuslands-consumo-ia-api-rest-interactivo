// Registro sencillo del consumo: cuántas solicitudes y cuántos tokens.
// No guarda preguntas ni respuestas (pueden contener datos sensibles).
export function crearRegistroConsumo() {
  const estado = { solicitudes: 0, exitosas: 0, fallidas: 0, tokensEntrada: 0, tokensSalida: 0, tokensTotales: 0 };
  return {
    registrarExito(tokens) {
      estado.solicitudes += 1;
      estado.exitosas += 1;
      estado.tokensEntrada += tokens?.entrada ?? 0;
      estado.tokensSalida += tokens?.salida ?? 0;
      estado.tokensTotales += tokens?.total ?? 0;
    },
    registrarFallo() {
      estado.solicitudes += 1;
      estado.fallidas += 1;
    },
    resumen() {
      return { ...estado };
    },
  };
}
