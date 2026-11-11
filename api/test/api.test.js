import test from "node:test";
import assert from "node:assert/strict";
import { crearApp } from "../src/app.js";
import { crearClienteIA, extraerTexto } from "../src/services/proveedor-ia.service.js";

// Levanta la app en un puerto libre, ejecuta la prueba y la apaga.
async function conServidor(app, ejecutar) {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  try {
    await ejecutar(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const post = (url, cuerpo) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo) });

// Respuesta falsa del proveedor con la forma de la Responses API.
const respuestaProveedor = (texto = "Una variable guarda un valor.", extra = {}) => ({
  id: "resp_1", object: "response", status: "completed", model: "gpt-6-luna",
  output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: texto }] }],
  usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
  ...extra,
});

const jsonRes = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

// Fetch falso que devuelve las respuestas en orden y cuenta las llamadas.
function fetchFalso(...respuestas) {
  const llamadas = [];
  const fn = async (url, opciones) => {
    llamadas.push({ url, opciones });
    const r = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)];
    if (r instanceof Error) throw r;
    return typeof r === "function" ? r() : r;
  };
  fn.llamadas = llamadas;
  return fn;
}

const sinEspera = { esperar: async () => {}, aleatorio: () => 0 };

test("01. GET /_health responde 200 y declara el modo simulado sin clave", async () => {
  await conServidor(crearApp({ clienteIA: crearClienteIA({ apiKey: "" }) }), async (base) => {
    const res = await fetch(`${base}/_health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.estado, "ok");
    assert.equal(body.simulado, true);
    assert.equal(res.headers.get("x-api-version"), "1.0.0");
  });
});

test("02. POST /api/preguntar sin pregunta responde 400", async () => {
  await conServidor(crearApp(), async (base) => {
    const res = await post(`${base}/api/preguntar`, {});
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /obligatoria/);
  });
});

test("03. Pregunta vacía, no-texto o de más de 2000 caracteres responde 400", async () => {
  await conServidor(crearApp(), async (base) => {
    for (const pregunta of ["   ", 42, "a".repeat(2001)]) {
      const res = await post(`${base}/api/preguntar`, { pregunta });
      assert.equal(res.status, 400, `pregunta ${String(pregunta).slice(0, 10)}`);
    }
    const tipoMalo = await post(`${base}/api/preguntar`, { pregunta: "hola", tipo: "poema" });
    assert.equal(tipoMalo.status, 400);
  });
});

test("04. JSON mal formado responde 400 con mensaje claro", async () => {
  await conServidor(crearApp(), async (base) => {
    const res = await post(`${base}/api/preguntar`, "{pregunta: sin comillas}");
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /JSON/);
  });
});

test("05. Modo simulado: responde 200 con la forma acordada y sin llamar a la red", async () => {
  const fetch0 = fetchFalso(new Error("no debería llamarse"));
  await conServidor(crearApp({ clienteIA: crearClienteIA({ apiKey: "", fetch: fetch0 }) }), async (base) => {
    const res = await post(`${base}/api/preguntar`, { pregunta: "¿Qué es una variable en Python?" });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(body).sort(), ["modelo", "respuesta", "simulado", "tokens"]);
    assert.equal(body.simulado, true);
    assert.equal(body.modelo, "gpt-6-luna");
    assert.match(body.respuesta, /Modo simulado/);
    assert.equal(body.tokens.total, body.tokens.entrada + body.tokens.salida);
    assert.equal(fetch0.llamadas.length, 0);
  });
});

test("06. extraerTexto busca el mensaje aunque no sea el primer elemento de output", () => {
  const data = {
    output: [
      { type: "reasoning", summary: [] },
      { type: "message", content: [{ type: "refusal", refusal: "x" }, { type: "output_text", text: "Hola" }] },
      { type: "message", content: [{ type: "output_text", text: "mundo" }] },
    ],
  };
  assert.equal(extraerTexto(data), "Hola\nmundo");
  assert.equal(extraerTexto({}), "");
});

test("07. Con clave envía POST con Bearer, Content-Type y el cuerpo esperado", async () => {
  const f = fetchFalso(jsonRes(200, respuestaProveedor()));
  const cliente = crearClienteIA({ apiKey: "sk-prueba", fetch: f, ...sinEspera });
  const r = await cliente.preguntar({ pregunta: "¿Qué es un for?", tipo: "funcion" });
  const { url, opciones } = f.llamadas[0];
  const cuerpo = JSON.parse(opciones.body);
  assert.equal(url, "https://api.openai.com/v1/responses");
  assert.equal(opciones.method, "POST");
  assert.equal(opciones.headers.Authorization, "Bearer sk-prueba");
  assert.equal(opciones.headers["Content-Type"], "application/json");
  assert.equal(cuerpo.model, "gpt-6-luna");
  assert.equal(cuerpo.input, "¿Qué es un for?");
  assert.match(cuerpo.instructions, /función/);
  assert.ok(opciones.signal instanceof AbortSignal);
  assert.deepEqual(r, { respuesta: "Una variable guarda un valor.", modelo: "gpt-6-luna", tokens: { entrada: 10, salida: 5, total: 15 }, simulado: false });
});

test("08. Un 200 con status distinto de completed se trata como error 502", async () => {
  const f = fetchFalso(jsonRes(200, respuestaProveedor("parcial", { status: "incomplete" })));
  const cliente = crearClienteIA({ apiKey: "sk", fetch: f, ...sinEspera });
  await assert.rejects(cliente.preguntar({ pregunta: "hola" }), (e) => e.status === 502 && /incomplete/.test(e.message));
});

test("09. 401 del proveedor se traduce a 502 sin reintentar", async () => {
  const f = fetchFalso(jsonRes(401, { error: { message: "Incorrect API key" } }));
  await conServidor(crearApp({ clienteIA: crearClienteIA({ apiKey: "sk-mala", fetch: f, ...sinEspera }) }), async (base) => {
    const res = await post(`${base}/api/preguntar`, { pregunta: "hola" });
    assert.equal(res.status, 502);
    assert.match((await res.json()).error, /OPENAI_API_KEY/);
    assert.equal(f.llamadas.length, 1);
  });
});

test("10. 400 del proveedor no se reintenta", async () => {
  const f = fetchFalso(jsonRes(400, { error: { message: "bad" } }));
  const cliente = crearClienteIA({ apiKey: "sk", fetch: f, ...sinEspera });
  await assert.rejects(cliente.preguntar({ pregunta: "hola" }), (e) => e.status === 502);
  assert.equal(f.llamadas.length, 1);
});

test("11. 429 se reintenta con espera exponencial y luego tiene éxito", async () => {
  const esperas = [];
  const f = fetchFalso(jsonRes(429, {}), jsonRes(503, {}), jsonRes(200, respuestaProveedor("Listo")));
  const cliente = crearClienteIA({ apiKey: "sk", fetch: f, esperar: async (ms) => esperas.push(ms), aleatorio: () => 0 });
  const r = await cliente.preguntar({ pregunta: "hola" });
  assert.equal(r.respuesta, "Listo");
  assert.equal(f.llamadas.length, 3);
  assert.deepEqual(esperas, [1000, 2000]);
});

test("12. Se respeta Retry-After del servidor", async () => {
  const esperas = [];
  const f = fetchFalso(jsonRes(429, {}, { "Retry-After": "7" }), jsonRes(200, respuestaProveedor()));
  const cliente = crearClienteIA({ apiKey: "sk", fetch: f, esperar: async (ms) => esperas.push(ms), aleatorio: () => 0 });
  await cliente.preguntar({ pregunta: "hola" });
  assert.deepEqual(esperas, [7000]);
});

test("13. Tras 3 reintentos fallidos responde 503 (4 intentos en total)", async () => {
  const f = fetchFalso(() => jsonRes(503, {}));
  await conServidor(crearApp({ clienteIA: crearClienteIA({ apiKey: "sk", fetch: f, ...sinEspera }) }), async (base) => {
    const res = await post(`${base}/api/preguntar`, { pregunta: "hola" });
    assert.equal(res.status, 503);
    assert.equal(f.llamadas.length, 4);
  });
});

test("14. Error de red se reintenta y termina en éxito", async () => {
  const f = fetchFalso(new TypeError("fetch failed"), jsonRes(200, respuestaProveedor("Recuperado")));
  const cliente = crearClienteIA({ apiKey: "sk", fetch: f, ...sinEspera });
  assert.equal((await cliente.preguntar({ pregunta: "hola" })).respuesta, "Recuperado");
});

test("15. Timeout real con AbortSignal.timeout responde 504", async () => {
  // fetch falso que solo termina cuando la señal se cancela.
  const lento = (url, { signal }) => new Promise((_, rechazar) => signal.addEventListener("abort", () => rechazar(signal.reason)));
  const cliente = crearClienteIA({ apiKey: "sk", fetch: lento, timeoutMs: 30, ...sinEspera });
  // AbortSignal.timeout no mantiene vivo el proceso: este temporizador sí, mientras dura la prueba.
  const vivo = setInterval(() => {}, 10);
  try {
    await assert.rejects(cliente.preguntar({ pregunta: "hola" }), (e) => e.status === 504);
  } finally {
    clearInterval(vivo);
  }
});

test("16. GET /api/consumo suma solicitudes y tokens sin guardar preguntas", async () => {
  await conServidor(crearApp({ clienteIA: crearClienteIA({ apiKey: "" }) }), async (base) => {
    const a = await (await post(`${base}/api/preguntar`, { pregunta: "Pregunta secreta uno" })).json();
    const b = await (await post(`${base}/api/preguntar`, { pregunta: "Pregunta secreta dos" })).json();
    const consumo = await (await fetch(`${base}/api/consumo`)).json();
    assert.equal(consumo.solicitudes, 2);
    assert.equal(consumo.exitosas, 2);
    assert.equal(consumo.tokensTotales, a.tokens.total + b.tokens.total);
    assert.doesNotMatch(JSON.stringify(consumo), /secreta/);
  });
});

test("17. El límite por IP responde 429 con Retry-After", async () => {
  await conServidor(crearApp({ limitePorMinuto: 2 }), async (base) => {
    await post(`${base}/api/preguntar`, { pregunta: "1" });
    await post(`${base}/api/preguntar`, { pregunta: "2" });
    const res = await post(`${base}/api/preguntar`, { pregunta: "3" });
    assert.equal(res.status, 429);
    assert.ok(Number(res.headers.get("retry-after")) > 0);
  });
});

test("18. CORS permite que la página llame al backend", async () => {
  await conServidor(crearApp(), async (base) => {
    const res = await fetch(`${base}/api/preguntar`, {
      method: "OPTIONS",
      headers: { Origin: "https://anndreloopez012.github.io", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
    });
    assert.equal(res.headers.get("access-control-allow-origin"), "https://anndreloopez012.github.io");
  });
});
