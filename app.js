/* Estación API · lógica de la página
   Todo funciona sin clave: el simulador imita la forma de la Responses API.
   El «modo backend local» llama a api/ (POST http://localhost:3000/api/preguntar). */
"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const miles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function leer(clave, porDefecto) {
  try { const v = localStorage.getItem(`estacion-api:${clave}`); return v === null ? porDefecto : JSON.parse(v); } catch { return porDefecto; }
}
function guardar(clave, valor) {
  try { localStorage.setItem(`estacion-api:${clave}`, JSON.stringify(valor)); } catch { /* sin almacenamiento: la página sigue funcionando */ }
}

let toastId;
function avisar(html) {
  const t = $("#toast");
  t.innerHTML = html;
  t.classList.add("is-on");
  clearTimeout(toastId);
  toastId = setTimeout(() => t.classList.remove("is-on"), 2800);
}

/* ================= XP ================= */
const logros = new Set(leer("logros", []));
function ganar(clave, puntos, mensaje) {
  if (logros.has(clave)) return;
  logros.add(clave);
  guardar("logros", [...logros]);
  pintarXP();
  avisar(`<b>+${puntos} XP</b> · ${esc(mensaje)}`);
}
const PUNTOS = { cp: 50, juego: 20 };
function pintarXP() {
  let total = 0;
  logros.forEach((k) => { total += k.startsWith("cp:") ? PUNTOS.cp : PUNTOS.juego; });
  $("#xpValue").textContent = total;
}

/* ================= Cronómetro ================= */
const DURACION = 60 * 60;
let restante = leer("timer", DURACION);
let reloj = null;
function pintarReloj() {
  const m = Math.floor(Math.abs(restante) / 60), s = Math.abs(restante) % 60;
  $("#timerDisplay").textContent = `${restante < 0 ? "-" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  $(".timer").classList.toggle("is-over", restante <= 0);
}
function iniciarReloj() {
  if (reloj) return;
  $(".timer").classList.add("is-running");
  $("#timerToggle").setAttribute("aria-label", "Pausar cronómetro");
  $("#timerToggle").innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>';
  reloj = setInterval(() => { restante -= 1; guardar("timer", restante); pintarReloj(); if (restante === 0) avisar("Se acabó el tiempo de la sesión"); }, 1000);
}
function pausarReloj() {
  clearInterval(reloj); reloj = null;
  $(".timer").classList.remove("is-running");
  $("#timerToggle").setAttribute("aria-label", "Iniciar cronómetro");
  $("#timerToggle").innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>';
}
$("#timerToggle").addEventListener("click", () => (reloj ? pausarReloj() : iniciarReloj()));
$("#timerReset").addEventListener("click", () => { pausarReloj(); restante = DURACION; guardar("timer", restante); pintarReloj(); });
$$("[data-start-lab]").forEach((b) => b.addEventListener("click", () => { iniciarReloj(); $("#fundamentos").scrollIntoView(); }));

$("#focusToggle").addEventListener("click", (e) => {
  const on = document.body.classList.toggle("is-focus");
  e.currentTarget.setAttribute("aria-pressed", String(on));
});

/* ================= Progreso y navegación ================= */
const ESTACIONES = $$("[data-checkpoint]").map((b) => b.dataset.checkpoint);
const hechos = new Set(leer("hechos", []));
function pintarProgreso() {
  const pct = Math.round((hechos.size / ESTACIONES.length) * 100);
  $("#progressLabel").textContent = `${pct}%`;
  $("#progressBar").style.width = `${pct}%`;
  $("#progressMessage").textContent = pct === 100
    ? "Completaste la Estación API. Ya hablas el idioma de los modelos."
    : `${hechos.size} de ${ESTACIONES.length} estaciones. Sigue: tu app ya casi le habla a la IA.`;
  $$("[data-checkpoint]").forEach((b) => b.classList.toggle("is-done", hechos.has(b.dataset.checkpoint)));
  $$("[data-nav]").forEach((a) => a.classList.toggle("is-done", hechos.has(a.dataset.nav)));
}
$$("[data-checkpoint]").forEach((b) => b.addEventListener("click", () => {
  const id = b.dataset.checkpoint;
  if (hechos.has(id)) hechos.delete(id); else { hechos.add(id); ganar(`cp:${id}`, PUNTOS.cp, "Estación completada"); }
  guardar("hechos", [...hechos]);
  pintarProgreso();
}));
$("[data-reset-progress]").addEventListener("click", () => {
  if (!confirm("¿Borrar tu progreso, XP y respuestas guardadas en este navegador?")) return;
  hechos.clear(); logros.clear(); rfHechos.clear();
  guardar("hechos", []); guardar("logros", []); guardar("rf", []);
  pintarProgreso(); pintarXP(); pintarRF();
});

const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    $$("[data-nav]").forEach((a) => {
      const activo = a.dataset.nav === e.target.id;
      a.classList.toggle("is-active", activo);
      if (activo && window.innerWidth <= 920) a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  });
}, { rootMargin: "-35% 0px -60% 0px" });
$$(".station").forEach((s) => observador.observe(s));

/* ================= Videos explicativos (HyperFrames) ================= */
// Tiempos del kit «modo maestro»: portada 0 s, analogía 6,2 s, pizarra desde 15,2 s, idea clave en D − 6,6 s.
const EXPLICADORES = {
  p01: { titulo: "¿Qué es una API?", d: 44, pasos: ["La app pide", "La API recibe", "El sistema procesa", "La respuesta vuelve", "Y con IA…"] },
  p02: { titulo: "API RESTful vs API HTTP", d: 42, pasos: ["Recursos con URL", "Interfaz uniforme", "Sin estado", "Las APIs de IA"] },
  p03: { titulo: "Cliente → backend → proveedor", d: 44, pasos: ["Cliente", "Backend", "Proveedor", "Regreso", "Seguridad"] },
  p04: { titulo: "¿Qué es un endpoint?", d: 44, pasos: ["Protocolo", "Dominio", "Versión", "Recurso", "Otros endpoints"] },
  p05: { titulo: "Los métodos HTTP", d: 44, pasos: ["GET", "POST", "PUT y PATCH", "DELETE", "Para la IA"] },
  p06: { titulo: "Anatomía de una solicitud", d: 44, pasos: ["Método y URL", "Encabezados", "Cuerpo JSON", "Respuesta"] },
  p07: { titulo: "Autenticación con API Key", d: 44, pasos: ["Crear la clave", "Guardarla", "Enviarla", "Protegerla", "Facturación"] },
  p08: { titulo: "JSON: solicitud y respuesta", d: 40, pasos: ["Propiedad y valor", "La solicitud", "La respuesta", "El consumo"] },
  p09: { titulo: "Errores y reintentos", d: 40, pasos: ["Familias", "¿Reintentar?", "Backoff", "200 no basta"] },
  p10: { titulo: "Tokens y costos", d: 40, pasos: ["El token", "Entrada y salida", "El cálculo", "Optimizar"] },
  p11: { titulo: "El flujo en n8n", d: 44, pasos: ["Webhook", "Validar", "HTTP Request", "Extraer", "Responder"] },
};

function capitulos(id) {
  const e = EXPLICADORES[id];
  const inicio = 15.2, fin = e.d - 6.6 - 0.4;
  const dur = (fin - inicio) / e.pasos.length;
  return [
    { t: 0, label: "Pregunta" },
    { t: 6.2, label: "Analogía" },
    ...e.pasos.map((label, i) => ({ t: inicio + i * dur, label, n: i + 1 })),
    { t: e.d - 6.6, label: "Idea clave" },
  ];
}
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

function botonesCapitulos(id, onSeek) {
  return capitulos(id).map((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.t = c.t;
    b.innerHTML = `<i>${c.n ?? (c.label === "Pregunta" ? "?" : c.label === "Analogía" ? "≈" : "★")}</i>${esc(c.label)}`;
    b.title = `Ir a ${fmt(c.t)}`;
    b.addEventListener("click", () => onSeek(c.t));
    return b;
  });
}
function marcarCapitulo(contenedor, t) {
  const bs = $$("button", contenedor);
  let actual = 0;
  bs.forEach((b, i) => { if (t + 0.05 >= Number(b.dataset.t)) actual = i; });
  bs.forEach((b, i) => b.classList.toggle("is-current", i === actual));
}

function montarExplicador(fig) {
  const id = fig.dataset.explainer;
  const e = EXPLICADORES[id];
  const n = Number(id.slice(1));
  fig.innerHTML = `
    <button class="explainer__screen" type="button" style="background-image:url('assets/motion/posters/${id}.jpg')" aria-label="Reproducir video: ${esc(e.titulo)}">
      <span class="explainer__play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 4 14 8-14 8z" /></svg></span>
    </button>
    <div class="explainer__progress"><span></span></div>
    <figcaption class="explainer__meta"><b>Punto ${n} · ${esc(e.titulo)}</b><small>${fmt(e.d)}</small><button class="explainer__expand" type="button">Pantalla grande</button></figcaption>
    <div class="chapters" aria-label="Capítulos del video"></div>`;
  const pantalla = $(".explainer__screen", fig);
  const barra = $(".explainer__progress span", fig);
  const caps = $(".chapters", fig);
  let video = null;
  const asegurarVideo = () => {
    if (video) return video;
    video = document.createElement("video");
    video.src = `assets/motion/${id}.mp4`;
    video.playsInline = true;
    video.preload = "auto";
    video.poster = `assets/motion/posters/${id}.jpg`;
    video.addEventListener("timeupdate", () => { barra.style.width = `${(video.currentTime / (video.duration || e.d)) * 100}%`; marcarCapitulo(caps, video.currentTime); });
    video.addEventListener("ended", () => { pantalla.classList.remove("is-playing"); ganar(`video:${id}`, PUNTOS.juego, `Viste el punto ${n} completo`); });
    video.addEventListener("pause", () => pantalla.classList.remove("is-playing"));
    video.addEventListener("play", () => pantalla.classList.add("is-playing"));
    video.addEventListener("error", () => { pantalla.insertAdjacentHTML("beforeend", '<span class="explainer__missing">El video aún no está renderizado. Ejecuta <code>node motion/explicadores/render-all.mjs</code>.</span>'); });
    pantalla.prepend(video);
    return video;
  };
  pantalla.addEventListener("click", () => { const v = asegurarVideo(); v.paused ? v.play().catch(() => {}) : v.pause(); });
  caps.append(...botonesCapitulos(id, (t) => { const v = asegurarVideo(); v.currentTime = t; v.play().catch(() => {}); }));
  $(".explainer__expand", fig).addEventListener("click", () => { video?.pause(); abrirTeatro(id, video ? video.currentTime : 0); });
}
$$("[data-explainer]").forEach(montarExplicador);

const teatro = $("#theater");
const teatroVideo = $("#theaterVideo");
function abrirTeatro(id, t = 0) {
  teatroVideo.src = `assets/motion/${id}.mp4`;
  teatroVideo.poster = `assets/motion/posters/${id}.jpg`;
  const caps = $("#theaterChapters");
  caps.replaceChildren(...botonesCapitulos(id, (s) => { teatroVideo.currentTime = s; teatroVideo.play().catch(() => {}); }));
  teatroVideo.ontimeupdate = () => marcarCapitulo(caps, teatroVideo.currentTime);
  teatro.showModal();
  teatroVideo.currentTime = t;
  teatroVideo.play().catch(() => {});
}
$("[data-close-theater]").addEventListener("click", () => teatro.close());
teatro.addEventListener("close", () => teatroVideo.pause());
teatro.addEventListener("click", (e) => { if (e.target === teatro) teatro.close(); });

/* ================= 01 · Tarjetas REST y juego cliente/backend/proveedor ================= */
$$(".flip-card").forEach((c) => c.addEventListener("click", () => {
  c.classList.toggle("is-flipped");
  if ($$(".flip-card.is-flipped").length === 4) ganar("juego:rest", PUNTOS.juego, "Conoces los principios de REST");
}));

const TAREAS = [
  ["El usuario escribe su pregunta", "cliente"],
  ["Muestra la respuesta en pantalla", "cliente"],
  ["Guarda la API Key en una variable de entorno", "backend"],
  ["Valida que la pregunta no esté vacía", "backend"],
  ["Limita cuántas preguntas hace cada usuario", "backend"],
  ["Ejecuta el modelo LLM", "proveedor"],
  ["Reporta los tokens consumidos (usage)", "proveedor"],
];
const POR_QUE = {
  cliente: "el cliente es la cara de la app: recibe lo que escribe la persona y le muestra el resultado.",
  backend: "el backend es el intermediario de confianza: valida, protege la clave y controla el uso.",
  proveedor: "el proveedor ejecuta el modelo y te dice cuánto consumió.",
};
let elegido = null;
const chipsZona = $("#sorterChips");
TAREAS.map((t, i) => [t, (i * 5) % TAREAS.length]).sort((a, b) => a[1] - b[1]).forEach(([[texto, destino]]) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.textContent = texto; b.dataset.dest = destino; b.draggable = true;
  b.addEventListener("click", () => { if (b.classList.contains("is-ok")) return; $$(".chip.is-picked").forEach((c) => c.classList.remove("is-picked")); b.classList.add("is-picked"); elegido = b; $$(".bin").forEach((x) => x.classList.add("is-target")); });
  b.addEventListener("dragstart", (ev) => { elegido = b; ev.dataTransfer.setData("text/plain", texto); });
  chipsZona.append(b);
});
function soltar(bin) {
  if (!elegido) return;
  const fb = $("#sorterFeedback");
  $$(".bin").forEach((x) => x.classList.remove("is-target"));
  if (elegido.dataset.dest === bin.dataset.bin) {
    elegido.classList.remove("is-picked"); elegido.classList.add("is-ok"); elegido.draggable = false;
    $(".bin__items", bin).append(elegido);
    fb.className = "feedback is-ok"; fb.textContent = `Correcto: ${POR_QUE[bin.dataset.bin]}`;
    if (!chipsZona.children.length) { fb.textContent = "¡Perfecto! Cada componente tiene su trabajo. Por eso la clave vive en el backend."; ganar("juego:sorter", PUNTOS.juego, "Arquitectura dominada"); }
  } else {
    elegido.classList.add("is-bad"); setTimeout(() => elegido?.classList.remove("is-bad"), 400);
    fb.className = "feedback is-bad";
    fb.textContent = `Todavía no. Pista: ${POR_QUE[elegido.dataset.dest]}`;
  }
  elegido = null;
}
$$(".bin").forEach((bin) => {
  bin.addEventListener("click", () => soltar(bin));
  bin.addEventListener("dragover", (ev) => { ev.preventDefault(); bin.classList.add("is-target"); });
  bin.addEventListener("dragleave", () => bin.classList.remove("is-target"));
  bin.addEventListener("drop", (ev) => { ev.preventDefault(); soltar(bin); });
});

/* ================= 02 · URL y métodos ================= */
const PARTES = {
  protocolo: ["Protocolo · https://", "Establece una comunicación cifrada (TLS). Con http:// cualquiera en la red podría leer tu clave y tus datos."],
  dominio: ["Dominio · api.openai.com", "Identifica el servidor del proveedor. Otro proveedor tendría otro dominio, pero la idea es la misma."],
  version: ["Versión · /v1", "La versión principal de la API. Si un día existe /v2, tu código con /v1 sigue funcionando hasta que decidas migrar."],
  recurso: ["Recurso · /responses", "La operación que usas: crear y gestionar respuestas del modelo. Otros recursos serían /models o /files."],
};
const vistas = new Set();
$$("#urlDissect button").forEach((b) => b.addEventListener("click", () => {
  $$("#urlDissect button").forEach((x) => x.classList.toggle("is-on", x === b));
  const [t, p] = PARTES[b.dataset.part];
  $("#partCard").innerHTML = `<b>${esc(t)}</b><p>${esc(p)}</p>`;
  vistas.add(b.dataset.part);
  if (vistas.size === 4) ganar("juego:url", PUNTOS.juego, "Desarmaste el endpoint");
}));

const ESCENARIOS = [
  ["Pedirle al modelo que explique qué es un embedding", "POST", "Envías datos (tu pregunta) y se crea una respuesta nueva."],
  ["Consultar los detalles de un modelo", "GET", "Solo lees información; no cambias nada."],
  ["Borrar un archivo que subiste a la API", "DELETE", "Eliminas un recurso que existe."],
  ["Cambiar solo el nombre de un recurso", "PATCH", "Modificas una parte, no todo el recurso."],
  ["Reemplazar por completo la configuración de un recurso", "PUT", "Mandas el recurso completo para reemplazarlo."],
];
let aciertosMetodo = 0;
ESCENARIOS.forEach(([texto, correcto, porque]) => {
  const d = document.createElement("div");
  d.className = "mq";
  d.innerHTML = `<p>${esc(texto)}</p><div class="mq__opts">${["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => `<button type="button">${m}</button>`).join("")}</div><small></small>`;
  $$("button", d).forEach((b) => b.addEventListener("click", () => {
    if (d.dataset.ok) return;
    const ok = b.textContent === correcto;
    b.classList.add(ok ? "is-ok" : "is-bad");
    $("small", d).textContent = ok ? `Correcto: ${porque}` : "Intenta otro. ¿Lees, creas, cambias o borras?";
    if (ok) { d.dataset.ok = "1"; aciertosMetodo += 1; if (aciertosMetodo === ESCENARIOS.length) ganar("juego:metodos", PUNTOS.juego, "Métodos HTTP dominados"); }
  }));
  $("#methodQuiz").append(d);
});

/* ================= 03 · Anatomía animada ================= */
const filas = $$(".anatomy__row");
let filaActual = 0;
setInterval(() => { filas.forEach((f, i) => f.classList.toggle("is-lit", i === filaActual)); filaActual = (filaActual + 1) % filas.length; }, 1600);

/* ================= 03 · Simulador de solicitudes ================= */
const RESPUESTAS = [
  [/variable/i, "Una variable es un nombre que guarda un valor para usarlo después. En Python: precio = 25. Luego puedes escribir total = precio * 2 y Python usará 25 en el cálculo."],
  [/ciclo for|bucle|\bfor\b/i, "Un ciclo for repite instrucciones para cada elemento de una colección. Ejemplo: for nombre in [\"Ana\", \"Luis\"]: print(nombre). Imprime cada nombre, uno por vuelta."],
  [/promesa|promise/i, "Una promesa en JavaScript representa un valor que llegará después, como la respuesta de fetch(). Con await esperas a que se cumpla sin bloquear el resto del programa."],
  [/embedding/i, "Un embedding convierte un texto en una lista de números. Textos con significado parecido quedan cerca entre sí, por eso sirven para buscar por significado y no solo por palabras."],
  [/lista|tupla/i, "Una lista se puede modificar (agregar, quitar, cambiar); una tupla no. Lista: [1, 2, 3]. Tupla: (1, 2, 3). Usa tuplas para datos que no deben cambiar, como coordenadas."],
  [/funci[oó]n/i, "Una función es un bloque de código con nombre que puedes reutilizar. En Python: def saludar(nombre): return \"Hola, \" + nombre. Luego llamas saludar(\"Diego\")."],
  [/api/i, "Una API es un conjunto de reglas para que dos programas conversen. Tu app envía una solicitud HTTP y el servicio le contesta, normalmente en JSON."],
  [/json/i, "JSON es un formato de texto para intercambiar datos con propiedades y valores, por ejemplo {\"nombre\": \"Laura\", \"edad\": 22}."],
  [/error|excepci[oó]n|traceback/i, "Lee el mensaje de abajo hacia arriba: la última línea dice el tipo de error y la línea del archivo dónde ocurrió. Corrige eso primero y vuelve a ejecutar."],
];
function textoSimulado(pregunta) {
  const hit = RESPUESTAS.find(([re]) => re.test(pregunta));
  return hit ? hit[1] : `Buena pregunta. En pocas palabras: «${pregunta.slice(0, 80)}» se entiende mejor con un ejemplo pequeño que puedas ejecutar tú. (Respuesta simulada: con una clave real, aquí respondería el modelo.)`;
}
// Fichas aproximadas: palabras cortas = 1, palabras largas se parten en trozos de ~4 letras, signos aparte.
function fichas(texto) {
  const out = [];
  (texto.match(/\s*[\p{L}\p{N}_]+|\s*[^\s\p{L}\p{N}_]|\s+/gu) || []).forEach((p) => {
    const lim = p.trim().length;
    if (lim <= 6) { out.push(p); return; }
    const lead = p.match(/^\s*/)[0];
    const w = p.trim();
    for (let i = 0; i < w.length; i += 4) out.push((i === 0 ? lead : "") + w.slice(i, i + 4));
  });
  return out;
}
const hashCorto = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16).padStart(8, "0"); };

const ERR = (status, message, type, code, param = null) => ({ status, body: { error: { message, type, param, code } } });

function simular(req) {
  const d = [];
  let url;
  try { url = new URL(req.url); } catch { return { network: "La URL no es válida. Revisa que empiece con https:// y no tenga espacios.", d }; }
  if (url.protocol !== "https:") return { network: "Conexión rechazada: el proveedor solo acepta https://. Sin cifrado, tu clave viajaría a la vista de cualquiera en la red.", d };
  if (url.hostname !== "api.openai.com") return { network: `No se pudo conectar con «${url.hostname}». Revisa el dominio del proveedor.`, d };
  if (req.method !== "POST") return { ...ERR(405, `Method ${req.method} not allowed for ${url.pathname}. Use POST.`, "invalid_request_error", "method_not_allowed"), d: [`Usaste <b>${req.method}</b>. Para crear una respuesta del modelo se envían datos: el método es <b>POST</b>.`] };
  if (url.pathname.replace(/\/$/, "") !== "/v1/responses") return { ...ERR(404, `Invalid URL (POST ${url.pathname})`, "invalid_request_error", "not_found"), d: [`El recurso <code>${esc(url.pathname)}</code> no existe. El endpoint correcto es <code>/v1/responses</code> (versión <code>/v1</code> + recurso <code>/responses</code>).`] };
  if (!req.auth || !req.key.trim()) return { ...ERR(401, "You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth.", "invalid_request_error", "missing_api_key"), d: ["Falta el encabezado <code>Authorization: Bearer …</code>. Sin credencial el proveedor no sabe quién eres. <b>No reintentes</b>: repetir no arregla una clave ausente."] };
  if (!req.type) return { ...ERR(400, "Invalid body: expected Content-Type application/json.", "invalid_request_error", "invalid_content_type"), d: ["Sin <code>Content-Type: application/json</code> el servidor no sabe que el cuerpo es JSON y no puede leerlo."] };
  if (req.model === "modelo-inventado") return { ...ERR(404, "The model `modelo-inventado` does not exist or you do not have access to it.", "invalid_request_error", "model_not_found", "model"), d: ["El identificador de <code>model</code> no existe o tu proyecto no tiene acceso. Revisa la lista de modelos disponibles para tu cuenta."] };
  if (!req.input.trim()) return { ...ERR(400, "Missing required parameter: 'input'.", "invalid_request_error", "missing_required_parameter", "input"), d: ["La pregunta está vacía. Valídala <b>antes</b> de enviarla: te ahorras una solicitud (y su costo)."] };
  if (req.chaos === "429") return { ...ERR(429, "Rate limit reached for requests. Please try again in 2s.", "requests", "rate_limit_exceeded"), headers: { "retry-after": "2" }, d: ["Hiciste demasiadas solicitudes en poco tiempo (o se agotó la cuota). Espera lo que dice <code>Retry-After</code> y reintenta con <b>backoff exponencial</b>."] };
  if (req.chaos === "503") return { ...ERR(503, "The server is overloaded or not ready yet.", "server_error", "service_unavailable"), d: ["Falla temporal del proveedor. Aquí <b>sí</b> conviene reintentar con espera: 1 s, 2 s, 4 s…"] };

  const texto = textoSimulado(req.input);
  const entrada = fichas(`${req.instructions}\n${req.input}`).length + 8;
  const todas = fichas(texto);
  let salida = todas.length;
  let status = "completed";
  let final = texto;
  if (req.chaos === "incomplete" || salida > req.max) {
    status = "incomplete";
    const corte = Math.min(req.chaos === "incomplete" ? Math.max(6, Math.floor(salida / 3)) : req.max, salida);
    final = todas.slice(0, corte).join("");
    salida = corte;
    d.push(`El HTTP fue <b>200</b>, pero <code>status</code> es <code>"incomplete"</code>: el modelo se quedó sin espacio (<code>max_output_tokens</code>). Un 200 no garantiza una buena respuesta: revisa <code>status</code> antes de usar el texto.`);
  }
  const body = {
    id: `resp_${hashCorto(req.input + req.model)}`,
    object: "response",
    created_at: 1762819200,
    status,
    ...(status === "incomplete" ? { incomplete_details: { reason: "max_output_tokens" } } : {}),
    model: req.model,
    output: [
      { id: `rs_${hashCorto(req.input)}`, type: "reasoning", summary: [] },
      { id: `msg_${hashCorto(texto)}`, type: "message", status, role: "assistant", content: [{ type: "output_text", text: final, annotations: [] }] },
    ],
    usage: { input_tokens: entrada, output_tokens: salida, total_tokens: entrada + salida },
  };
  return { status: 200, body, d, texto: final };
}

function colorJSON(obj) {
  return esc(JSON.stringify(obj, null, 2))
    .replace(/(&quot;[^&]*?(?:&(?!quot;)[^&]*?)*&quot;)(\s*:)/g, '<span class="c-key">$1</span>$2')
    .replace(/:\s(&quot;.*?&quot;)(,?)$/gm, ': <span class="c-str">$1</span>$2')
    .replace(/:\s(-?\d+(?:\.\d+)?)(,?)$/gm, ': <span class="c-num">$1</span>$2')
    .replace(/:\s(true|false|null)(,?)$/gm, ': <span class="c-bool">$1</span>$2');
}

function leerFormulario() {
  return {
    method: $("#bMethod").value,
    url: $("#bUrl").value.trim(),
    auth: $("#hAuth").checked,
    key: $("#bKey").value,
    type: $("#hType").checked,
    model: $("#bModel").value,
    instructions: $("#bInstructions").value,
    input: $("#bInput").value,
    max: Number($("#bMax").value),
    chaos: $("input[name=chaos]:checked").value,
  };
}
const pareceClaveReal = (k) => /sk-[A-Za-z0-9_-]{12,}/.test(k);
$("#bKey").addEventListener("input", () => { $("#keyWarn").hidden = !pareceClaveReal($("#bKey").value); pintarCodigo(); });
$("#bMax").addEventListener("input", () => { $("#bMaxOut").textContent = $("#bMax").value; pintarCodigo(); });
$$("#builderForm input, #builderForm select, #builderForm textarea").forEach((el) => el.addEventListener("input", pintarCodigo));
$$("[data-preset]").forEach((b) => b.addEventListener("click", () => { $("#bInput").value = b.dataset.preset; pintarCodigo(); $("#bInput").focus(); }));

let modo = "sim";
$$("[data-mode]").forEach((b) => b.addEventListener("click", () => {
  modo = b.dataset.mode;
  $$("[data-mode]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  $("#localHint").hidden = modo !== "local";
  $(".builder__group--chaos").hidden = modo === "local";
}));

let pestana = "res";
$$("[data-tab]").forEach((b) => b.addEventListener("click", () => {
  pestana = b.dataset.tab;
  $$("[data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  pintarCodigo();
}));

let ultima = { html: "<code>// Aquí aparecerá la respuesta JSON del servidor.</code>", chip: '<span class="status-chip">Esperando</span><small>Presiona «Enviar solicitud».</small>' };
function cuerpoJS(r) {
  return { model: r.model, instructions: r.instructions, input: r.input, max_output_tokens: r.max };
}
function pintarCodigo() {
  const r = leerFormulario();
  const clave = r.auth ? (pareceClaveReal(r.key) ? "$OPENAI_API_KEY" : r.key || "$OPENAI_API_KEY") : null;
  const cuerpo = JSON.stringify(cuerpoJS(r), null, 2);
  let codigo;
  if (pestana === "res") { $("#resBody").innerHTML = ultima.html; $("#resStatus").innerHTML = ultima.chip; return; }
  if (pestana === "curl") {
    codigo = [`curl --request ${r.method} \\`, `  --url ${r.url} \\`];
    if (clave) codigo.push(`  --header "Authorization: Bearer ${clave}" \\`);
    if (r.type) codigo.push('  --header "Content-Type: application/json" \\');
    codigo.push(`  --data '${cuerpo.replace(/'/g, "'\\''")}'`);
    codigo = codigo.join("\n");
  } else if (pestana === "python") {
    codigo = `import os\nimport requests\n\nAPI_URL = "${r.url}"\nheaders = {\n${clave ? '    "Authorization": f"Bearer {os.getenv(\'OPENAI_API_KEY\')}",\n' : ""}${r.type ? '    "Content-Type": "application/json",\n' : ""}}\npayload = ${cuerpo.replace(/\n/g, "\n")}\n\nrespuesta = requests.${r.method.toLowerCase()}(API_URL, headers=headers, json=payload, timeout=60)\nrespuesta.raise_for_status()\ndata = respuesta.json()\n\nfor item in data.get("output", []):\n    if item.get("type") == "message":\n        for c in item.get("content", []):\n            if c.get("type") == "output_text":\n                print(c.get("text", ""))\nprint("Tokens:", data.get("usage", {}).get("total_tokens"))`;
  } else if (pestana === "js") {
    codigo = `// Node.js 20+ (la clave vive en el servidor, nunca en el navegador)\nconst respuesta = await fetch("${r.url}", {\n  method: "${r.method}",\n  headers: {\n${clave ? "    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,\n" : ""}${r.type ? '    "Content-Type": "application/json",\n' : ""}  },\n  body: JSON.stringify(${cuerpo.replace(/\n/g, "\n  ")}),\n  signal: AbortSignal.timeout(60000),\n});\nif (!respuesta.ok) throw new Error(\`Error HTTP: \${respuesta.status}\`);\nconst data = await respuesta.json();\nconst texto = (data.output ?? [])\n  .filter((item) => item.type === "message")\n  .flatMap((item) => item.content ?? [])\n  .filter((c) => c.type === "output_text")\n  .map((c) => c.text)\n  .join("\\n");\nconsole.log(texto);`;
  } else {
    codigo = `// Nodo HTTP Request · Method: ${r.method} · URL: ${r.url}\n// Authentication: credencial Header Auth (Authorization: Bearer …)\n// Send Body: JSON\n={{\n  {\n    model: ${JSON.stringify(r.model)},\n    instructions: ${JSON.stringify(r.instructions)},\n    input: $json.pregunta,\n    max_output_tokens: ${r.max}\n  }\n}}`;
  }
  $("#resBody").innerHTML = `<code>${esc(codigo).replace(/^(\s*(?:#|\/\/).*)$/gm, '<span class="c-com">$1</span>')}</code>`;
  $("#resStatus").innerHTML = `<span class="status-chip">${pestana === "n8n" ? "n8n" : pestana === "js" ? "JavaScript" : pestana === "python" ? "Python" : "cURL"}</span><small>Generado con lo que armaste a la izquierda.</small>`;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function volar(ok) {
  const [t1, t2] = $$(".flight__track i");
  const nodos = $$(".flight__node");
  nodos.forEach((n) => n.classList.remove("is-hot", "is-err"));
  [t1, t2].forEach((t) => (t.className = "flight__packet"));
  void t1.offsetWidth;
  nodos[0].classList.add("is-hot");
  t1.classList.add("go"); await espera(560);
  nodos[1].classList.add("is-hot");
  if (ok === "red") { nodos[1].classList.add("is-err"); t1.className = "flight__packet fail"; return; }
  t2.classList.add("go"); await espera(560);
  nodos[2].classList.add("is-hot");
  await espera(260);
  t2.className = `flight__packet ${ok ? "back" : "fail"}`;
  if (!ok) nodos[2].classList.add("is-err");
  await espera(560);
  t1.className = `flight__packet ${ok ? "back" : "fail"}`;
  await espera(560);
}
const familia = (s) => (s >= 500 ? "s5" : s >= 400 ? "s4" : "s2");
const NOMBRE = { 200: "OK", 400: "Bad Request", 401: "Unauthorized", 404: "Not Found", 405: "Method Not Allowed", 429: "Too Many Requests", 502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout" };
const resultados = new Set();

$("#sendRequest").addEventListener("click", async () => {
  const boton = $("#sendRequest");
  const r = leerFormulario();
  if (pareceClaveReal(r.key)) { $("#keyWarn").hidden = false; avisar("No se envió: eso parece una clave real. Bórrala de aquí."); return; }
  boton.disabled = true;
  $("[data-tab='res']").click();
  $("#readout").hidden = true;
  $("#diagnosis").hidden = true;
  $("#resStatus").innerHTML = '<span class="status-chip">Enviando…</span><small>La solicitud viaja por la red.</small>';

  let status, cuerpo, diag = [], texto = null, tokens = null, red = null, headers = null;
  if (modo === "local") {
    try {
      const inicio = performance.now();
      const res = await fetch("http://localhost:3000/api/preguntar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pregunta: r.input }), signal: AbortSignal.timeout(65000) });
      status = res.status;
      cuerpo = await res.json().catch(() => ({ error: "La respuesta no era JSON" }));
      if (res.ok) { texto = cuerpo.respuesta; tokens = { input_tokens: cuerpo.tokens?.entrada, output_tokens: cuerpo.tokens?.salida, total_tokens: cuerpo.tokens?.total }; diag.push(`Tu backend respondió en ${Math.round(performance.now() - inicio)} ms${cuerpo.simulado ? " en <b>modo simulado</b> (no tiene OPENAI_API_KEY)" : " usando el proveedor real"}. Fíjate que la página nunca vio la clave.`); }
      else diag.push(`Tu backend devolvió <b>${status}</b>: ${esc(cuerpo.error || "error")}.`);
    } catch {
      red = "No se pudo conectar con http://localhost:3000. ¿Arrancaste el backend? En la carpeta api/: npm install && npm start";
    }
    await volar(red ? "red" : status < 400);
  } else {
    const sim = simular(r);
    await volar(sim.network ? "red" : sim.status < 400);
    if (sim.network) red = sim.network;
    else { status = sim.status; cuerpo = sim.body; diag = sim.d; texto = sim.texto ?? null; tokens = sim.body.usage ?? null; headers = sim.headers; }
  }

  if (red) {
    ultima = { html: `<code><span class="c-com">// Sin respuesta HTTP</span>\n${esc(red)}</code>`, chip: '<span class="status-chip s5">Error de red</span><small>La solicitud no llegó al servidor.</small>' };
    $("#diagnosis").className = "diagnosis is-err"; $("#diagnosis").innerHTML = `<b>Qué pasó:</b> ${esc(red)}`; $("#diagnosis").hidden = false;
    resultados.add("error");
  } else {
    const extra = headers ? Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join(" · ") : "";
    ultima = { html: `<code>${colorJSON(cuerpo)}</code>`, chip: `<span class="status-chip ${familia(status)}">${status} ${NOMBRE[status] || ""}</span><small>${status < 400 ? "El servidor procesó la solicitud." : "El servidor rechazó la solicitud."}${extra ? ` · ${esc(extra)}` : ""}</small>` };
    if (texto !== null && status < 400) {
      $("#readText").textContent = texto;
      $("#readIn").textContent = tokens?.input_tokens ?? "—"; $("#readOut").textContent = tokens?.output_tokens ?? "—"; $("#readTotal").textContent = tokens?.total_tokens ?? "—";
      $("#readout").hidden = false;
    }
    if (diag.length) { $("#diagnosis").className = `diagnosis ${status >= 400 ? "is-err" : ""}`; $("#diagnosis").innerHTML = `<b>${status >= 400 ? "Qué pasó y cómo arreglarlo" : "Nota"}:</b> ${diag.join(" ")}`; $("#diagnosis").hidden = false; }
    resultados.add(status < 400 && cuerpo.status !== "incomplete" ? "ok" : "error");
  }
  pintarCodigo();
  boton.disabled = false;
  if (resultados.has("ok")) ganar("juego:solicitud-ok", PUNTOS.juego, "Primera solicitud exitosa");
  if (resultados.has("ok") && resultados.has("error")) ganar("juego:solicitud-error", PUNTOS.juego, "Provocaste y entendiste un error");
});
pintarCodigo();

$$("[data-copy-target]").forEach((b) => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($(`#${b.dataset.copyTarget}`).innerText); b.textContent = "Copiado"; } catch { b.textContent = "Selecciona y copia"; }
  setTimeout(() => (b.textContent = "Copiar"), 1500);
}));

/* ================= 04 · Inspector del navegador ================= */
const DEVTOOLS = {
  front: `<div class="row sel"><span>POST</span><span>api.openai.com/v1/responses</span></div>
    <div class="row"><span class="k">Request Headers</span></div>
    <div class="row"><span class="k">authorization:</span><span class="leak">Bearer sk-proj-EJEMPLO-ESTO-SE-VE-COMPLETO</span></div>
    <div class="row"><span class="k">content-type:</span><span>application/json</span></div>
    <div class="row"><span class="k">Sources › app.js:</span><span class="leak">const apiKey = "sk-proj-EJEMPLO…"</span></div>
    <div class="devtools__verdict bad">Cualquiera que abra F12 copia tu clave y gasta a tu nombre.</div>`,
  back: `<div class="row sel"><span>POST</span><span>tu-app.com/api/chat</span></div>
    <div class="row"><span class="k">Request Headers</span></div>
    <div class="row"><span class="k">content-type:</span><span>application/json</span></div>
    <div class="row"><span class="k">Request Payload:</span><span class="safe">{"pregunta": "¿Qué es un embedding?"}</span></div>
    <div class="row"><span class="k">Sources › app.js:</span><span class="safe">fetch("/api/chat", …) · sin clave</span></div>
    <div class="devtools__verdict good">El navegador solo habla con tu backend. La clave vive en el servidor, en OPENAI_API_KEY.</div>`,
};
const verLeak = new Set();
$$("[data-leak]").forEach((b) => b.addEventListener("click", () => {
  $$("[data-leak]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  $("#devtoolsBody").innerHTML = DEVTOOLS[b.dataset.leak];
  verLeak.add(b.dataset.leak);
  if (verLeak.size === 2) ganar("juego:leak", PUNTOS.juego, "Sabes por qué la clave no va al navegador");
}));
$("#devtoolsBody").innerHTML = DEVTOOLS.front;
verLeak.add("front");

/* ================= 05 · JSON en vivo y explorador ================= */
const tipoDe = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
const NOMBRE_TIPO = { string: "cadena", number: "número", boolean: "booleano", array: "arreglo", object: "objeto", null: "nulo" };
function revisarJSON() {
  const caja = $("#jsonTypes");
  try {
    const v = JSON.parse($("#jsonEditor").value);
    if (tipoDe(v) !== "object") { caja.innerHTML = `<span class="okmsg">JSON válido (${NOMBRE_TIPO[tipoDe(v)]}). Las APIs suelen esperar un objeto { … }.</span>`; return; }
    caja.innerHTML = '<span class="okmsg">JSON válido</span>' + Object.entries(v).map(([k, x]) => `<span class="t">${esc(k)} <i class="${tipoDe(x)}">${NOMBRE_TIPO[tipoDe(x)]}</i></span>`).join("");
  } catch (e) {
    const pista = /'/.test($("#jsonEditor").value) ? " Pista: JSON usa comillas dobles, no simples." : /,\s*[}\]]/.test($("#jsonEditor").value) ? " Pista: sobra una coma antes de cerrar." : "";
    caja.innerHTML = `<span class="err">JSON inválido: ${esc(e.message)}.${pista}</span>`;
  }
}
$("#jsonEditor").addEventListener("input", revisarJSON);
revisarJSON();

const EJEMPLO = {
  id: "resp_ejemplo",
  object: "response",
  status: "completed",
  model: "gpt-6-luna",
  output: [
    { id: "rs_ejemplo", type: "reasoning", summary: [] },
    { id: "msg_ejemplo", type: "message", role: "assistant", content: [{ type: "output_text", text: "Una variable es un nombre que permite referirse a un valor en un programa." }] },
  ],
  usage: { input_tokens: 45, output_tokens: 22, total_tokens: 67 },
};
const EXPLICA = {
  id: "Identificador único de esta respuesta. Útil para registrar o depurar.",
  object: "Qué tipo de objeto es: una respuesta (response).",
  status: "Estado del procesamiento. Antes de usar el texto, confirma que sea \"completed\".",
  model: "El modelo que procesó la solicitud.",
  type: "Tipo de elemento. Filtra por \"message\" y luego por \"output_text\": no supongas posiciones.",
  role: "Quién habla: assistant es el modelo.",
  text: "¡Este es el texto generado por el modelo!",
  input_tokens: "Tokens que enviaste: instrucciones, contexto y pregunta.",
  output_tokens: "Tokens que generó el modelo.",
  total_tokens: "Consumo total reportado para esta solicitud.",
};
function arbol(valor, ruta, nivel, clave, ultimo) {
  const sangria = "&nbsp;&nbsp;".repeat(nivel);
  const k = clave !== null ? `<span class="k">"${esc(clave)}"</span>: ` : "";
  const coma = ultimo ? "" : ",";
  if (valor !== null && typeof valor === "object") {
    const esArr = Array.isArray(valor);
    const items = esArr ? valor.map((v, i) => [i, v]) : Object.entries(valor);
    if (!items.length) return `<div class="line">${sangria}${k}${esArr ? "[]" : "{}"}${coma}</div>`;
    return `<div class="line">${sangria}${k}${esArr ? "[" : "{"}</div>` +
      items.map(([kk, v], i) => arbol(v, esArr ? `${ruta}[${kk}]` : `${ruta}.${kk}`, nivel + 1, esArr ? null : kk, i === items.length - 1)).join("") +
      `<div class="line">${sangria}${esArr ? "]" : "}"}${coma}</div>`;
  }
  const cls = typeof valor === "string" ? "c-str" : typeof valor === "number" ? "c-num" : "c-bool";
  const txt = typeof valor === "string" ? `"${esc(valor)}"` : esc(String(valor));
  return `<div class="line">${sangria}${k}<span class="val ${cls}" tabindex="0" role="treeitem" data-path="${esc(ruta)}" data-key="${esc(clave ?? "")}">${txt}</span>${coma}</div>`;
}
$("#jsonTree").innerHTML = arbol(EJEMPLO, "", 0, null, true);
function accesos(ruta) {
  const py = "data" + ruta.replace(/\.(\w+)/g, '["$1"]');
  return `jq     -r '${ruta}'\nPython ${py}\nJS     data${ruta}`;
}
function elegirValor(el) {
  $$("#jsonTree .val").forEach((x) => x.classList.remove("is-sel"));
  const ruta = el.dataset.path;
  const clave = el.dataset.key;
  $("#pathValue").textContent = ruta;
  if (clave === "text") {
    el.classList.add("is-win");
    $("#pathExplain").innerHTML = "<b>¡Misión cumplida!</b> Lo encontraste en <code>output[1]</code>, no en <code>output[0]</code> (ese es un elemento de razonamiento). En producción no uses la posición fija: filtra por tipo.";
    $("#pathCode code").textContent = `${accesos(ruta)}\n\n# Forma robusta con jq (filtra por tipo):\njq -r '.output[]? | select(.type == "message")\n  | .content[]? | select(.type == "output_text") | .text'`;
    ganar("juego:json", PUNTOS.juego, "Encontraste el texto generado");
  } else {
    el.classList.add("is-sel");
    $("#pathExplain").textContent = EXPLICA[clave] || (/output\[0\]/.test(ruta) ? "Este elemento es de tipo reasoning: no contiene el texto. Sigue buscando en otro elemento de output." : "Un valor de la respuesta.");
    $("#pathCode code").textContent = accesos(ruta);
  }
}
$$("#jsonTree .val").forEach((el) => {
  el.addEventListener("click", () => elegirValor(el));
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegirValor(el); } });
});

/* ================= 06 · Laboratorios (leen los archivos reales del repositorio) ================= */
const LABS = {
  curl: {
    titulo: "Laboratorio 1 · Tu primera solicitud con cURL",
    texto: "<code>curl</code> envía solicitudes HTTP desde la terminal, sin escribir una app. Ideal para entender cada parte antes de programar.",
    pasos: ["Comprueba que tienes cURL: <code>curl --version</code>.", "Configura la clave: <code>export OPENAI_API_KEY=\"TU_CLAVE_API\"</code> y verifícala con <code>verificar-clave.sh</code>.", "Ejecuta <code>bash primera-solicitud.sh</code> y lee el JSON completo.", "Instala jq (<code>brew install jq</code>) y usa <code>extraer-texto.sh</code> para ver solo el texto.", "Experimenta: pide una definición, un fragmento de código y la explicación de un error. Compara tipo y extensión."],
    archivos: ["laboratorios/01-curl/primera-solicitud.sh", "laboratorios/01-curl/extraer-texto.sh"],
  },
  python: {
    titulo: "Laboratorio 2 · Asistente en Python con requests",
    texto: "Usamos <code>requests</code> en vez del SDK para ver claramente cada parte HTTP. Es la base del proyecto integrador.",
    pasos: ["Entra a <code>laboratorios/02-python/asistente-ia-rest</code>.", "Crea el entorno: <code>python3 -m venv .venv</code> y <code>source .venv/bin/activate</code>.", "Instala: <code>python -m pip install -r requirements.txt</code>.", "Ejecuta <code>python main.py</code>. Sin clave funciona en modo simulado; escribe <code>salir</code> para terminar.", "Corre las pruebas: <code>python3 -m unittest discover -s pruebas -v</code>."],
    archivos: ["laboratorios/02-python/asistente-ia-rest/cliente_ia.py", "laboratorios/02-python/asistente-ia-rest/main.py"],
  },
  js: {
    titulo: "Laboratorio 3 · JavaScript y Node.js con fetch",
    texto: "<code>fetch</code>, <code>async/await</code>, <code>AbortSignal.timeout</code> y extracción robusta del texto. Corre en Node.js para que la clave nunca llegue al navegador.",
    pasos: ["Comprueba Node.js 20 o superior: <code>node --version</code>.", "Entra a <code>laboratorios/03-javascript</code>.", "Ejecuta <code>node main.mjs</code> (modo simulado si no hay clave).", "Cambia la pregunta y fuerza errores: deja la pregunta vacía y mira el mensaje."],
    archivos: ["laboratorios/03-javascript/main.mjs"],
  },
  n8n: {
    titulo: "Laboratorio 4 · Flujo en n8n con HTTP Request",
    texto: "Un workflow que recibe una pregunta, la valida, llama a la API con el nodo HTTP Request y responde un JSON sencillo. La clave va en el gestor de credenciales de n8n.",
    pasos: ["En n8n, importa <code>laboratorios/04-n8n/workflow-ia-preguntar.json</code>.", "Crea una credencial <b>Header Auth</b>: nombre <code>Authorization</code>, valor <code>Bearer TU_CLAVE</code>.", "Activa la prueba y envía: <code>curl -X POST http://localhost:5678/webhook-test/ia-preguntar -H \"Content-Type: application/json\" -d '{\"pregunta\": \"Explica qué es un embedding.\"}'</code>.", "Envía una pregunta vacía y comprueba que responde 400."],
    archivos: ["laboratorios/04-n8n/README.md"],
    video: "p11",
    flujo: ["Webhook", "Validación", "HTTP Request", "Code", "Respond to Webhook"],
  },
};
const cacheArchivos = {};
async function leerArchivo(ruta) {
  if (!(ruta in cacheArchivos)) {
    cacheArchivos[ruta] = fetch(ruta).then((r) => (r.ok ? r.text() : Promise.reject())).catch(() => null);
  }
  return cacheArchivos[ruta];
}
async function pintarLab(id) {
  const lab = LABS[id];
  const panel = $("#labPanel");
  panel.innerHTML = `<div class="lab-panel__grid">
      <div><h3>${lab.titulo}</h3><p>${lab.texto}</p>
        ${lab.flujo ? `<div class="flow">${lab.flujo.map((f) => `<span>${f}</span>`).join("")}</div>` : ""}
        <ol class="lab-steps">${lab.pasos.map((p) => `<li>${p}</li>`).join("")}</ol>
        ${lab.video ? `<figure class="explainer" data-lab-video="${lab.video}"></figure>` : ""}
      </div>
      <div class="lab-files">${lab.archivos.map((a, i) => `<div class="lab-file"><div class="lab-file__name"><span>${a}</span></div><button class="copy-button" type="button" data-copy-target="lab-${id}-${i}">Copiar</button><pre class="code" id="lab-${id}-${i}"><code>Cargando…</code></pre></div>`).join("")}</div>
    </div>`;
  if (lab.video) {
    // Reutiliza el reproductor del video del punto 11.
    const fig = $(`[data-lab-video]`, panel);
    fig.dataset.explainer = lab.video;
    montarExplicador(fig);
  }
  $$(".copy-button", panel).forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($(`#${b.dataset.copyTarget}`).innerText); b.textContent = "Copiado"; } catch { b.textContent = "Selecciona y copia"; }
    setTimeout(() => (b.textContent = "Copiar"), 1500);
  }));
  for (const [i, ruta] of lab.archivos.entries()) {
    const txt = await leerArchivo(ruta);
    const destino = $(`#lab-${id}-${i} code`);
    if (destino) destino.textContent = txt ?? `Abre ${ruta} en el repositorio (esta vista necesita un servidor web, por ejemplo GitHub Pages o npx serve).`;
  }
}
$$("[data-lab]").forEach((b) => b.addEventListener("click", () => {
  $$("[data-lab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  pintarLab(b.dataset.lab);
}));

/* ================= 07 · Códigos y backoff ================= */
const CODIGOS = [
  [200, "Solicitud procesada", "Procesa y <b>valida</b> el contenido: revisa status y que exista el texto.", "yes", "Éxito"],
  [400, "Solicitud inválida", "Revisa estructura y parámetros: JSON mal formado, campo faltante, pregunta vacía.", "no", "No reintentes: corrige"],
  [401, "Autenticación inválida o ausente", "Verifica la clave y el encabezado Authorization: Bearer.", "no", "No reintentes"],
  [403, "Acceso denegado", "Tu clave existe pero no tiene permiso para ese recurso o región. Revisa permisos y políticas.", "no", "No reintentes"],
  [404, "Recurso no encontrado", "Revisa el endpoint o el identificador (por ejemplo, el nombre del modelo).", "no", "No reintentes"],
  [429, "Demasiadas solicitudes o cuota", "Revisa la causa: límite por minuto o cuota agotada. Espera Retry-After.", "maybe", "Reintenta con espera (si no es cuota)"],
  [500, "Error interno del servidor", "Registra el fallo y aplica una recuperación controlada.", "maybe", "Reintento limitado"],
  [502, "Puerta de enlace inválida", "Un servidor intermedio recibió una respuesta mala. Suele ser temporal.", "yes", "Reintenta con backoff"],
  [503, "Servicio no disponible", "El proveedor está saturado o en mantenimiento. Considera reintentos con espera.", "yes", "Reintenta con backoff"],
];
const vistosCod = new Set();
CODIGOS.forEach(([c, corto, accion, retry, retryTxt]) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = `f${String(c)[0]}`;
  b.innerHTML = `${c}<small>${esc(corto)}</small>`;
  b.addEventListener("click", () => {
    $$("#codes button").forEach((x) => x.classList.toggle("is-on", x === b));
    $("#codeCard").innerHTML = `<b>${c} · ${esc(corto)}</b><p>${accion}</p><span class="retry ${retry}">${retryTxt}</span>`;
    vistosCod.add(c);
    if (vistosCod.size >= 6) ganar("juego:codigos", PUNTOS.juego, "Lees los códigos HTTP");
  });
  $("#codes").append(b);
});

const BACKOFF = {
  503: { pasos: [503, 503, 200], msg: "Funcionó al tercer intento. Las esperas crecieron 1 s → 2 s: suficiente para que el proveedor se recuperara." },
  429: { pasos: [429, 200], retryAfter: 3, msg: "El servidor pidió esperar 3 s (Retry-After). Respetarlo es mejor que adivinar." },
  401: { pasos: [401], msg: "No se reintenta: una clave inválida no se arregla repitiendo. Corrige la credencial." },
  caido: { pasos: [503, 503, 503, 503], msg: "Después de 4 intentos se rinde y muestra un error claro. Sin límite, tu app quedaría atrapada (y gastando)." },
};
const JITTER = [0.18, 0.07, 0.24, 0.12];
$("#boRun").addEventListener("click", async () => {
  const b = $("#boRun");
  const esc_ = BACKOFF[$("#boScenario").value];
  const carril = $("#boLane");
  b.disabled = true; carril.innerHTML = ""; $("#boFeedback").textContent = "";
  for (let i = 0; i < esc_.pasos.length; i += 1) {
    const s = esc_.pasos[i];
    const li = document.createElement("li");
    li.innerHTML = `<span class="who">Intento ${i + 1}</span><span class="bar"><i></i><span>${i === 0 ? "envío inmediato" : ""}</span></span><span class="res">…</span>`;
    carril.append(li);
    if (i > 0) {
      const base = esc_.retryAfter && i === 1 ? esc_.retryAfter : 2 ** (i - 1);
      const total = esc_.retryAfter && i === 1 ? base : base + JITTER[i - 1];
      $(".bar span", li).textContent = esc_.retryAfter && i === 1 ? `espera ${total} s (Retry-After)` : `espera ${base} s + ${JITTER[i - 1]} s de jitter`;
      const barra = $(".bar i", li);
      barra.style.transition = `width ${total * 0.45}s linear`;
      requestAnimationFrame(() => (barra.style.width = `${Math.min(100, (total / 8.5) * 100)}%`));
      await espera(total * 450);
    }
    await espera(250);
    const r = $(".res", li);
    r.textContent = `${s} ${NOMBRE[s] || ""}`;
    r.className = `res ${familia(s)}`;
    if (s === 401) break;
  }
  const ultimo = esc_.pasos.at(-1);
  $("#boFeedback").className = `feedback ${ultimo === 200 ? "is-ok" : "is-bad"}`;
  $("#boFeedback").textContent = esc_.msg;
  b.disabled = false;
  ganar("juego:backoff", PUNTOS.juego, "Simulaste reintentos con backoff");
});

/* ================= 08 · Tokens y costos ================= */
function pintarFichas() {
  const f = fichas($("#tokText").value);
  $("#tokChips").innerHTML = f.map((x) => `<span>${esc(x)}</span>`).join("");
  const palabras = ($("#tokText").value.match(/[\p{L}\p{N}_]+/gu) || []).length;
  $("#tokCount").textContent = `${f.length} fichas aproximadas para ${palabras} palabras.`;
}
$("#tokText").addEventListener("input", pintarFichas);
pintarFichas();

function calcular() {
  const tin = Number($("#cIn").value), tout = Number($("#cOut").value), n = Number($("#cN").value);
  const pin = Math.max(0, Number($("#cPin").value) || 0), pout = Math.max(0, Number($("#cPout").value) || 0);
  const por = (tin * pin + tout * pout) / 1e6;
  $("#cInLbl").textContent = miles(tin); $("#cOutLbl").textContent = miles(tout); $("#cNLbl").textContent = miles(n);
  $("#cPer").textContent = `US$ ${por.toFixed(6)}`;
  $("#cTotal").textContent = `US$ ${(por * n).toFixed(4)}`;
  $("#cFormula").innerHTML = `(${miles(tin)} × <em>${pin.toFixed(2)}</em> + ${miles(tout)} × <em>${pout.toFixed(2)}</em>) ÷ 1.000.000<br>= US$ ${por.toFixed(6)} por solicitud<br>× ${miles(n)} solicitudes = <em>US$ ${(por * n).toFixed(4)}</em>`;
}
["#cIn", "#cOut", "#cN", "#cPin", "#cPout"].forEach((s) => $(s).addEventListener("input", () => { calcular(); ganar("juego:costos", PUNTOS.juego, "Calculaste costos"); }));
calcular();

/* ================= 09 · Proyecto ================= */
const RF = [
  ["RF-01", "Permitir ingresar una pregunta desde la consola."],
  ["RF-02", "Validar que la pregunta no esté vacía."],
  ["RF-03", "Enviar la solicitud al modelo mediante HTTP POST."],
  ["RF-04", "Autenticar con una credencial protegida."],
  ["RF-05", "Procesar la respuesta JSON."],
  ["RF-06", "Mostrar el contenido generado en consola."],
  ["RF-07", "Gestionar errores HTTP, de comunicación y de entrada."],
  ["RF-08", "Mostrar el consumo de tokens cuando esté disponible."],
  ["RF-09", "Permitir varias preguntas hasta que el usuario decida salir."],
];
const rfHechos = new Set(leer("rf", []));
function pintarRF() {
  $("#rfList").innerHTML = RF.map(([c, t]) => `<li><button type="button" aria-pressed="${rfHechos.has(c)}" data-rf="${c}"><i>✓</i><code>${c}</code><span>${esc(t)}</span></button></li>`).join("");
  $("#rfCount").textContent = `${rfHechos.size} / ${RF.length}`;
  $$("[data-rf]").forEach((b) => b.addEventListener("click", () => {
    const c = b.dataset.rf;
    rfHechos.has(c) ? rfHechos.delete(c) : rfHechos.add(c);
    guardar("rf", [...rfHechos]);
    pintarRF();
    if (rfHechos.size === RF.length) ganar("juego:rf", PUNTOS.juego, "Proyecto con todos sus requerimientos");
  }));
}
pintarRF();

const RUBRICA = [["Comprensión de APIs REST y HTTP", 15], ["Construcción de solicitudes y autenticación", 20], ["Implementación del cliente HTTP", 25], ["Procesamiento de respuestas JSON", 15], ["Manejo de errores y seguridad", 15], ["Documentación y sustentación", 10]];
$("#rubric").innerHTML = RUBRICA.map(([t, p]) => `<div class="rb"><span>${t}</span><span class="rb__track"><i data-w="${p * 4}"></i></span><b>${p} %</b></div>`).join("");
new IntersectionObserver((es, obs) => es.forEach((e) => { if (e.isIntersecting) { $$("#rubric i").forEach((i) => (i.style.width = `${i.dataset.w}%`)); obs.disconnect(); } }), { threshold: .4 }).observe($("#rubric"));

/* ================= 10 · Reto final ================= */
const PREGUNTAS = [
  ["¿Para qué sirve una API al integrar un modelo de IA?", ["Para instalar el modelo en tu computadora", "Para que tu app le pida resultados a un servicio que ejecuta el modelo", "Para entrenar el modelo desde cero"], 1, "La API es el canal: no instalas el modelo, le envías solicitudes."],
  ["¿Qué método HTTP se usa para pedirle una respuesta al modelo en /v1/responses?", ["GET", "POST", "DELETE"], 1, "Envías datos (tu pregunta) para crear una respuesta: POST."],
  ["En https://api.openai.com/v1/responses, ¿qué es /v1?", ["El recurso", "El dominio", "La versión de la API"], 2, "/v1 identifica la versión principal; /responses es el recurso."],
  ["¿Dónde debe vivir la API Key en una app web?", ["En el JavaScript del navegador", "En una variable de entorno del backend", "Dentro del prompt"], 1, "El código del navegador se puede inspeccionar. La clave va en el servidor."],
  ["¿Qué encabezado lleva la clave?", ["Content-Type: application/json", "Authorization: Bearer <clave>", "Accept-Language: es"], 1, "Authorization con el esquema Bearer. Content-Type indica el formato del cuerpo."],
  ["Recibiste un 401. ¿Qué haces?", ["Reintento 10 veces", "Reviso la credencial", "Subo max_output_tokens"], 1, "401 es autenticación: repetir no lo arregla."],
  ["¿Cuál error suele resolverse esperando y reintentando?", ["503 Service Unavailable", "400 Bad Request", "404 Not Found"], 0, "Es temporal: reintenta con exponential backoff."],
  ["Llegó un 200, pero status es \"incomplete\". ¿Está todo bien?", ["Sí, 200 siempre es éxito", "No: es un error funcional, revisa el contenido", "Sí, si hay tokens"], 1, "Un 200 no garantiza que la salida sirva. Revisa status y el texto."],
  ["¿Dónde está el texto generado?", ["usage.total_tokens", "output → message → content → output_text → text", "id"], 1, "Filtra por tipo; no supongas que es el primer elemento."],
  ["Con tarifas de USD 0,50 (entrada) y 2,00 (salida) por millón, ¿cuánto cuesta 2.000 de entrada + 500 de salida?", ["US$ 0.002", "US$ 2.00", "US$ 0.20"], 0, "2.000×0,50/1M + 500×2/1M = 0,001 + 0,001 = 0,002."],
];
const respuestasQuiz = new Map();
$("#quiz").innerHTML = PREGUNTAS.map(([q, ops], i) => `<div class="q" data-q="${i}"><h3><b>${String(i + 1).padStart(2, "0")}</b>${esc(q)}</h3><div class="q__opts">${ops.map((o, j) => `<button type="button" data-o="${j}">${esc(o)}</button>`).join("")}</div><p class="q__why" hidden></p></div>`).join("");
$$(".q").forEach((box) => {
  const i = Number(box.dataset.q);
  const [, , ok, porque] = PREGUNTAS[i];
  $$("button", box).forEach((b) => b.addEventListener("click", () => {
    const j = Number(b.dataset.o);
    respuestasQuiz.set(i, j === ok);
    $$("button", box).forEach((x) => { x.disabled = true; if (Number(x.dataset.o) === ok) x.classList.add("is-ok"); });
    if (j !== ok) b.classList.add("is-bad");
    const why = $(".q__why", box); why.hidden = false; why.textContent = (j === ok ? "Correcto. " : "No exactamente. ") + porque;
    if (respuestasQuiz.size === PREGUNTAS.length) {
      const bien = [...respuestasQuiz.values()].filter(Boolean).length;
      const r = $("#quizResult");
      r.hidden = false;
      r.innerHTML = `<b>${bien}/10</b><div><strong>${bien >= 9 ? "¡Excelente! Hablas HTTP con fluidez." : bien >= 7 ? "Muy bien. Repasa los puntos donde fallaste." : "Buen intento. Vuelve a ver los videos de los puntos que fallaste y repite."}</strong><p class="muted">Puedes recargar la página para intentarlo de nuevo.</p></div>`;
      if (bien >= 7) ganar("juego:quiz", PUNTOS.juego, "Reto final superado");
    }
  }));
});

const GLOSARIO = [
  ["API", "Interfaz que permite la comunicación entre sistemas de software."],
  ["REST", "Estilo arquitectónico para sistemas distribuidos con recursos e interfaz uniforme."],
  ["API RESTful", "API que aplica los principios de REST."],
  ["Endpoint", "Dirección (URL) que expone un recurso u operación de una API."],
  ["HTTP", "Protocolo para intercambiar solicitudes y respuestas."],
  ["HTTPS", "HTTP con comunicación cifrada mediante TLS."],
  ["POST", "Método HTTP para enviar información o crear recursos."],
  ["Header", "Encabezado con metadatos de una solicitud o respuesta."],
  ["Body", "Cuerpo de una petición o respuesta HTTP."],
  ["JSON", "Formato de intercambio de datos estructurados con propiedades y valores."],
  ["API Key", "Credencial que identifica o autoriza el acceso a un servicio."],
  ["Bearer Token", "Esquema de autorización para presentar un token al servidor."],
  ["LLM", "Modelo de lenguaje de gran escala que procesa y genera contenido."],
  ["Prompt", "Instrucción que se le da a un modelo de IA."],
  ["Token", "Unidad de contenido que procesa un modelo; no equivale a una palabra."],
  ["Usage", "Metadatos con el consumo de tokens de una solicitud."],
  ["Status code", "Código numérico que indica el resultado HTTP (200, 401, 429…)."],
  ["Rate Limit", "Límite de frecuencia o cantidad de uso de un servicio (error 429)."],
  ["Timeout", "Tiempo máximo que una aplicación espera por una operación."],
  ["Retry", "Nuevo intento después de un fallo."],
  ["Exponential Backoff", "Reintentos con esperas que se duplican: 1 s, 2 s, 4 s…"],
  ["Jitter", "Variación aleatoria pequeña en la espera para no reintentar todos a la vez."],
  ["Retry-After", "Encabezado con el tiempo que el servidor pide esperar."],
  ["SDK", "Herramientas y bibliotecas que facilitan integrarse con una plataforma."],
  ["Webhook", "URL que recibe solicitudes HTTP para iniciar un flujo (por ejemplo en n8n)."],
  ["Variable de entorno", "Valor que el sistema le da al programa al ejecutarse, como OPENAI_API_KEY."],
];
function pintarGlosario() {
  const q = $("#glossSearch").value.trim().toLowerCase();
  const f = GLOSARIO.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
  $("#glossList").innerHTML = f.length ? f.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("") : '<p class="muted">Sin resultados.</p>';
}
$("#glossSearch").addEventListener("input", pintarGlosario);
pintarGlosario();

/* ================= Arranque ================= */
pintarLab("curl");
pintarProgreso();
pintarXP();
pintarReloj();
