import { ErrorApi } from "../errores.js";

// Instrucciones según el tipo de consulta del asistente de programación.
export const INSTRUCCIONES = {
  explicar: "Eres un tutor de programación. Responde en español, de forma clara y con un ejemplo sencillo.",
  funcion: "Eres un tutor de programación. Escribe una función corta y comentada en español que resuelva lo pedido.",
  error: "Eres un tutor de programación. Analiza el error, explica la causa en español y propone una corrección.",
};

// Códigos que vale la pena reintentar: son fallos temporales.
// 400 o 401 no se corrigen repitiendo la misma petición.
const REINTENTABLES = new Set([429, 500, 502, 503]);

/** Extrae el texto de una respuesta de la Responses API sin suponer que el primer elemento es el mensaje. */
export function extraerTexto(data) {
  return (data?.output ?? [])
    .filter((item) => item?.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((c) => c?.type === "output_text")
    .map((c) => c.text ?? "")
    .join("\n")
    .trim();
}

/** Cuenta aproximada de tokens para el modo simulado (≈ 4 caracteres por token). */
const aproxTokens = (texto) => Math.max(1, Math.ceil(String(texto).length / 4));

/** Respuesta simulada determinista con la MISMA forma que la Responses API. */
export function respuestaSimulada({ modelo, instructions, input }) {
  const texto =
    `[Modo simulado] Recibí tu pregunta: "${input.slice(0, 120)}". ` +
    "Así respondería el modelo real. Configura OPENAI_API_KEY en el backend para obtener una respuesta generada.";
  const entrada = aproxTokens(instructions) + aproxTokens(input);
  const salida = aproxTokens(texto);
  let hash = 0;
  for (const ch of input) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    id: `resp_simulado_${hash.toString(16)}`,
    object: "response",
    status: "completed",
    model: modelo,
    simulado: true,
    output: [
      { type: "reasoning", id: "rs_simulado", summary: [] },
      { type: "message", role: "assistant", content: [{ type: "output_text", text: texto }] },
    ],
    usage: { input_tokens: entrada, output_tokens: salida, total_tokens: entrada + salida },
  };
}

const esperarReal = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Crea el cliente que habla con el proveedor. Todo se puede inyectar para probar sin red:
 * fetch, la espera entre reintentos y el generador aleatorio del jitter.
 */
export function crearClienteIA({
  apiKey = "",
  apiUrl = "https://api.openai.com/v1/responses",
  modelo = "gpt-6-luna",
  timeoutMs = 60_000,
  maxReintentos = 3,
  maxOutputTokens = 500,
  fetch: fetchFn = globalThis.fetch,
  esperar = esperarReal,
  aleatorio = Math.random,
} = {}) {
  const simulado = !apiKey;

  // Espera exponencial: 1 s, 2 s, 4 s… más jitter. Si el servidor manda Retry-After, se respeta.
  function calcularEspera(intento, retryAfter) {
    const segundos = Number(retryAfter);
    if (retryAfter && Number.isFinite(segundos) && segundos >= 0) return Math.min(segundos * 1000, 30_000);
    return 1000 * 2 ** intento + Math.floor(aleatorio() * 250);
  }

  async function llamar(cuerpo) {
    for (let intento = 0; ; intento++) {
      let res;
      try {
        res = await fetchFn(apiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(cuerpo),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        if (error?.name === "TimeoutError" || error?.name === "AbortError") {
          throw new ErrorApi(504, "El proveedor de IA no respondió a tiempo");
        }
        // Error de red: se puede reintentar.
        if (intento < maxReintentos) { await esperar(calcularEspera(intento)); continue; }
        throw new ErrorApi(503, "No fue posible conectar con el proveedor de IA");
      }

      if (res.ok) return res.json();

      if (res.status === 401 || res.status === 403) {
        throw new ErrorApi(502, "El backend no pudo autenticarse con el proveedor de IA: revisa OPENAI_API_KEY");
      }
      if (REINTENTABLES.has(res.status)) {
        if (intento < maxReintentos) {
          await esperar(calcularEspera(intento, res.headers?.get?.("retry-after")));
          continue;
        }
        throw new ErrorApi(503, "El proveedor de IA está saturado o no disponible; intenta más tarde", { statusProveedor: res.status });
      }
      throw new ErrorApi(502, `El proveedor de IA rechazó la solicitud (HTTP ${res.status})`, { statusProveedor: res.status });
    }
  }

  return {
    simulado,
    modelo,
    async preguntar({ pregunta, tipo = "explicar" }) {
      const cuerpo = {
        model: modelo,
        instructions: INSTRUCCIONES[tipo] ?? INSTRUCCIONES.explicar,
        input: pregunta,
        max_output_tokens: maxOutputTokens,
      };
      const data = simulado ? respuestaSimulada({ modelo, instructions: cuerpo.instructions, input: pregunta }) : await llamar(cuerpo);

      // Un HTTP 200 no garantiza una respuesta útil: se valida el contenido.
      if (data?.status !== "completed") {
        throw new ErrorApi(502, `La respuesta del modelo no finalizó correctamente (status: ${data?.status ?? "desconocido"})`);
      }
      const respuesta = extraerTexto(data);
      if (!respuesta) throw new ErrorApi(502, "El modelo no devolvió texto");

      return {
        respuesta,
        modelo: data.model ?? modelo,
        tokens: {
          entrada: data.usage?.input_tokens ?? null,
          salida: data.usage?.output_tokens ?? null,
          total: data.usage?.total_tokens ?? null,
        },
        simulado,
      };
    },
  };
}
