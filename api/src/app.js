import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { crearClienteIA } from "./services/proveedor-ia.service.js";
import { crearRegistroConsumo } from "./services/consumo.service.js";
import { crearControladorIA } from "./controllers/ia.controller.js";
import { crearRutasIA } from "./routes/ia.routes.js";
import { crearLimitePorIp } from "./middlewares/limite.middleware.js";
import { manejarError, rutaNoEncontrada } from "./middlewares/error.middleware.js";

export const API_VERSION = "1.0.0";

/** Fábrica de la app: en las pruebas se inyecta un cliente de IA falso. */
export function crearApp({ clienteIA, limitePorMinuto = config.limitePorMinuto } = {}) {
  const cliente = clienteIA ?? crearClienteIA(config);
  const consumo = crearRegistroConsumo();
  const app = express();

  // CORS: la página (GitHub Pages o localhost) puede llamar a este backend.
  app.use(cors({ origin: true, methods: ["GET", "POST"] }));
  app.use(express.json({ limit: "16kb" }));
  app.use((req, res, next) => { res.set("X-API-Version", API_VERSION); next(); });

  app.get("/_health", (req, res) => {
    res.status(200).json({ estado: "ok", version: API_VERSION, modelo: cliente.modelo, simulado: cliente.simulado });
  });

  const controlador = crearControladorIA({ clienteIA: cliente, consumo });
  app.use("/api", crearRutasIA({ controlador, limite: crearLimitePorIp({ maximo: limitePorMinuto }) }));

  app.use(rutaNoEncontrada);
  app.use(manejarError);
  return app;
}

export default crearApp;
