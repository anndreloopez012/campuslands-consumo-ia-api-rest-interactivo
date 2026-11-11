// Configuración leída del entorno. La clave NUNCA se escribe en el código:
// vive en la variable OPENAI_API_KEY del servidor (backend).
export const config = {
  puerto: Number(process.env.PORT) || 3000,
  apiUrl: process.env.IA_API_URL || "https://api.openai.com/v1/responses",
  apiKey: process.env.OPENAI_API_KEY || "",
  modelo: process.env.IA_MODELO || "gpt-6-luna",
  timeoutMs: Number(process.env.IA_TIMEOUT_MS) || 60_000,
  maxReintentos: 3,
  maxOutputTokens: 500,
  limitePorMinuto: Number(process.env.LIMITE_POR_MINUTO) || 20,
};
