import { crearApp } from "./app.js";
import { config } from "./config.js";

const app = crearApp();
app.listen(config.puerto, () => {
  const modo = config.apiKey ? `real (${config.modelo})` : "simulado (sin OPENAI_API_KEY)";
  console.log(`Backend de IA listo en http://localhost:${config.puerto} · modo ${modo}`);
});
