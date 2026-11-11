import { ErrorApi } from "../errores.js";

// Límite simple por IP en memoria (ventana fija de 1 minuto).
// Protege el consumo del plan: nadie puede gastar tokens sin control.
export function crearLimitePorIp({ maximo = 20, ventanaMs = 60_000, ahora = Date.now } = {}) {
  const registro = new Map();
  return (req, res, next) => {
    const ip = req.ip || "desconocida";
    const t = ahora();
    const actual = registro.get(ip);
    if (!actual || t - actual.inicio >= ventanaMs) {
      registro.set(ip, { inicio: t, cuenta: 1 });
      return next();
    }
    actual.cuenta += 1;
    if (actual.cuenta > maximo) {
      res.set("Retry-After", String(Math.ceil((ventanaMs - (t - actual.inicio)) / 1000)));
      return next(new ErrorApi(429, "Demasiadas solicitudes: espera un momento antes de volver a preguntar"));
    }
    next();
  };
}
