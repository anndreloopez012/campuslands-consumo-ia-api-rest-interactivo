// Laboratorio 3 · Consumir un modelo de IA desde Node.js con fetch.
// Ejecuta: node main.mjs "tu pregunta"
// Sin OPENAI_API_KEY funciona en modo simulado (misma forma de respuesta, sin red ni costo).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const API_URL = "https://api.openai.com/v1/responses";
const MODELO = process.env.IA_MODELO || "gpt-6-luna";

/** Respuesta simulada con la forma de la Responses API, para practicar sin clave. */
function respuestaSimulada(pregunta) {
  const texto = `[Modo simulado] El modelo respondería aquí a: "${pregunta}". Define OPENAI_API_KEY para una respuesta real.`;
  return {
    id: "resp_simulado",
    object: "response",
    status: "completed",
    model: MODELO,
    output: [
      { type: "reasoning", summary: [] },
      { type: "message", role: "assistant", content: [{ type: "output_text", text: texto }] },
    ],
    usage: { input_tokens: 30, output_tokens: 28, total_tokens: 58 },
  };
}

/** Busca todos los textos de tipo output_text dentro de los mensajes. */
export function extraerTexto(data) {
  return (data?.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();
}

export async function preguntarModelo(pregunta) {
  if (typeof pregunta !== "string" || !pregunta.trim()) {
    throw new Error("La pregunta no puede estar vacía");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  let data;

  if (!apiKey) {
    data = respuestaSimulada(pregunta.trim());
  } else {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO,
        instructions: "Eres un tutor de JavaScript. Responde en español.",
        input: pregunta.trim(),
        max_output_tokens: 500,
      }),
      signal: AbortSignal.timeout(60_000), // no esperar para siempre
    });

    if (!response.ok) {
      const mensajes = {
        400: "solicitud inválida: revisa el JSON y los parámetros",
        401: "clave inválida o ausente: revisa OPENAI_API_KEY",
        429: "demasiadas solicitudes o cuota agotada: espera e intenta de nuevo",
      };
      throw new Error(`Error HTTP ${response.status}: ${mensajes[response.status] ?? "fallo del proveedor"}`);
    }
    data = await response.json();
  }

  // Un 200 no garantiza que la respuesta esté completa.
  if (data.status !== "completed") {
    throw new Error("La respuesta no finalizó correctamente");
  }

  const resultado = extraerTexto(data);
  if (!resultado) throw new Error("El modelo no devolvió texto");

  return { texto: resultado, tokens: data.usage?.total_tokens ?? null, simulado: !apiKey };
}

// Solo se ejecuta al correr el archivo directamente (no al importarlo).
const esPrincipal = process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);
if (esPrincipal) {
  const pregunta = process.argv.slice(2).join(" ") || "Explica qué es una promesa en JavaScript.";
  try {
    const { texto, tokens, simulado } = await preguntarModelo(pregunta);
    console.log(texto);
    console.log(`\nTokens totales: ${tokens ?? "no disponible"}${simulado ? " (simulado)" : ""}`);
  } catch (error) {
    const motivo = error.name === "TimeoutError" ? "el proveedor tardó demasiado" : error.message;
    console.error("No fue posible obtener la respuesta:", motivo);
    process.exitCode = 1;
  }
}
