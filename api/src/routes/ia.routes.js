import { Router } from "express";
import { validarPregunta } from "../validators/pregunta.validator.js";

export function crearRutasIA({ controlador, limite }) {
  const router = Router();
  // POST /api/preguntar → el frontend envía la pregunta; la clave queda aquí, en el backend.
  router.post("/preguntar", limite, validarPregunta, controlador.preguntar);
  router.get("/consumo", controlador.verConsumo);
  return router;
}
