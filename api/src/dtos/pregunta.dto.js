// DTO: solo deja pasar los campos que esperamos y los limpia.
export const TIPOS_CONSULTA = ["explicar", "funcion", "error"];

export class PreguntaDTO {
  constructor({ pregunta, tipo } = {}) {
    this.pregunta = typeof pregunta === "string" ? pregunta.trim() : pregunta;
    this.tipo = tipo === undefined || tipo === null || tipo === "" ? "explicar" : tipo;
  }
}
