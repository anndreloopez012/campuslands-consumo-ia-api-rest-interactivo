import { ErrorApi } from "../errores.js";
import { PreguntaDTO, TIPOS_CONSULTA } from "../dtos/pregunta.dto.js";

export const MAX_CARACTERES = 2000;

// Valida el cuerpo antes de gastar tokens: una entrada mala nunca llega al proveedor.
export function validarPregunta(req, res, next) {
  const dto = new PreguntaDTO(req.body ?? {});
  if (typeof dto.pregunta !== "string" || !dto.pregunta) {
    return next(new ErrorApi(400, "La pregunta es obligatoria y debe ser texto no vacío"));
  }
  if (dto.pregunta.length > MAX_CARACTERES) {
    return next(new ErrorApi(400, `La pregunta no puede superar ${MAX_CARACTERES} caracteres`));
  }
  if (!TIPOS_CONSULTA.includes(dto.tipo)) {
    return next(new ErrorApi(400, `El tipo debe ser uno de: ${TIPOS_CONSULTA.join(", ")}`));
  }
  req.dto = dto;
  next();
}
