export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: "Ruta no encontrada", metodo: req.method, url: req.originalUrl });
}

export function manejarError(error, req, res, next) {
  // JSON mal formado en el cuerpo de la petición.
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo no es un JSON válido" });
  }
  const status = error.status || error.statusCode || 500;
  if (status >= 500) console.error("[API]", status, error.message);
  res.status(status).json({
    error: status === 500 ? "Error interno del servidor" : error.message,
    ...(error.detalle ? { detalle: error.detalle } : {}),
  });
}
