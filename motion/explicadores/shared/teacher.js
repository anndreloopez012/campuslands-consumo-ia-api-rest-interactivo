/* Kit "modo maestro" para los explicadores de la guía de APIs REST de IA.
   Estructura fija de cada clip, pensada como una mini clase:
     1. Portada: la pregunta del punto (≈4 s).
     2. Analogía de construcción: "Piénsalo así" (≈6 s).
     3. Pizarra: el diagrama se arma paso a paso con rótulos y subtítulo.
     4. Cierre: la idea clave que el alumno debe recordar (≈6 s).
   Cada escena solo escribe su pizarra (#board) y anima sus piezas con
   los ayudantes que devuelve Teacher.setup(). Todo es determinista. */
(function () {
  "use strict";

  const ICONS = {
    spark: '<path d="M50 8l8 29 29 8-29 8-8 29-8-29-29-8 29-8z"/>',
    check: '<path d="M18 52l21 21 44-49"/>',
    x: '<path d="M24 24l52 52M76 24L24 76"/>',
    lock: '<rect x="19" y="42" width="62" height="46" rx="12"/><path d="M32 42V30a18 18 0 0136 0v12M50 60v12"/>',
    globe: '<circle cx="50" cy="50" r="38"/><path d="M12 50h76M50 12c18 18 18 58 0 76M50 12c-18 18-18 58 0 76"/>',
    user: '<circle cx="50" cy="32" r="18"/><path d="M20 86c2-24 14-36 30-36s28 12 30 36"/>',
    users: '<circle cx="36" cy="34" r="14"/><circle cx="68" cy="38" r="12"/><path d="M12 84c2-20 11-30 24-30s22 10 24 30M60 84c1-14 7-24 16-26 8 2 13 12 14 26"/>',
    key: '<circle cx="32" cy="48" r="18"/><path d="M48 48h38M72 48v14M82 48v10"/>',
    sliders: '<path d="M18 25h64M18 50h64M18 75h64"/><circle cx="38" cy="25" r="8"/><circle cx="67" cy="50" r="8"/><circle cx="48" cy="75" r="8"/>',
    shield: '<path d="M50 9l34 14v23c0 22-12 35-34 46C28 81 16 68 16 46V23z"/><path d="M34 49l12 12 22-25"/>',
    target: '<circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="23"/><circle cx="50" cy="50" r="8"/>',
    map: '<path d="M12 24l24-10 28 10 24-10v62L64 86 36 76 12 86zM36 14v62M64 24v62"/>',
    fence: '<path d="M18 88V22M50 88V12M82 88V22M10 44h80M10 70h80"/>',
    grid: '<rect x="12" y="16" width="76" height="68" rx="8"/><path d="M12 40h76M38 16v68M64 16v68"/>',
    eye: '<path d="M9 50s15-27 41-27 41 27 41 27-15 27-41 27S9 50 9 50z"/><circle cx="50" cy="50" r="11"/>',
    wrench: '<path d="M62 16a22 22 0 00-25 29L14 68a10 10 0 0014 14l23-23a22 22 0 0029-25L65 49 51 35z"/>',
    gear: '<circle cx="50" cy="50" r="16"/><path d="M50 9v14M50 77v14M9 50h14M77 50h14M21 21l10 10M69 69l10 10M79 21L69 31M31 69L21 79"/><circle cx="50" cy="50" r="31"/>',
    doc: '<path d="M24 10h38l16 16v64H24zM62 10v18h16M35 48h32M35 62h32M35 76h22"/>',
    table: '<rect x="12" y="17" width="76" height="66" rx="8"/><path d="M12 38h76M38 17v66M64 17v66"/>',
    image: '<rect x="10" y="16" width="80" height="68" rx="10"/><circle cx="66" cy="36" r="9"/><path d="M18 76l23-25 16 17 10-11 17 19"/>',
    search: '<circle cx="43" cy="43" r="29"/><path d="M64 64l24 24"/>',
    question: '<path d="M29 34a22 22 0 1142 10c-5 9-19 10-19 23M50 83h1"/>',
    loop: '<path d="M78 35a34 34 0 00-58 5M22 65a34 34 0 0058-5M13 22l7 18 18-7M87 78l-7-18-18 7"/>',
    box: '<path d="M12 31l38-19 38 19-38 19zM12 31v40l38 19 38-19V31M50 50v40"/>',
    bolt: '<path d="M58 8L23 56h25l-6 36 35-50H52z"/>',
    return: '<path d="M42 24L14 50l28 26M18 50h40c18 0 28 10 28 27"/>',
    hand: '<path d="M30 54V22a8 8 0 0116 0v24M46 42V16a8 8 0 0116 0v28M62 44V22a8 8 0 0116 0v34c0 20-14 32-32 32h-4c-12 0-20-6-27-17L7 60a9 9 0 0114-11l9 9"/>',
    route: '<circle cx="20" cy="20" r="8"/><circle cx="80" cy="80" r="8"/><path d="M20 28v20c0 10 8 18 18 18h24c10 0 18 6 18 14"/>',
    clock: '<circle cx="50" cy="50" r="39"/><path d="M50 27v25l17 10"/>',
    list: '<path d="M32 24h56M32 50h56M32 76h56"/><circle cx="16" cy="24" r="4"/><circle cx="16" cy="50" r="4"/><circle cx="16" cy="76" r="4"/>',
    tag: '<path d="M12 18h38l38 38-32 32-38-38z"/><circle cx="34" cy="34" r="7"/>',
    chat: '<path d="M14 20h72v46H44L24 84V66H14z"/>',
    brain: '<path d="M38 14a14 14 0 00-14 14 14 14 0 00-8 26 14 14 0 0010 24 14 14 0 0024 4V18a12 12 0 00-12-4zM62 14a14 14 0 0114 14 14 14 0 018 26 14 14 0 01-10 24 14 14 0 01-24 4"/>',
    home: '<path d="M12 48L50 16l38 32M22 40v46h56V40M42 86V62h16v24"/>',
    layers: '<path d="M50 12L10 32l40 20 40-20zM10 50l40 20 40-20M10 68l40 20 40-20"/>',
    plug: '<path d="M36 10v22M64 10v22M24 32h52v14a26 26 0 01-52 0zM50 72v18"/>',
    flag: '<path d="M18 90V12M18 14h56l-10 18 10 18H18"/>',
    pencil: '<path d="M66 12l22 22-50 50H16V62zM56 22l22 22"/>',
    stop: '<path d="M34 8h32l24 24v36L66 92H34L10 68V32z"/><path d="M34 50h32"/>',
    play: '<path d="M28 16l52 34-52 34z"/>',
    star: '<path d="M50 10l12 26 28 3-21 19 6 28-25-14-25 14 6-28-21-19 28-3z"/>',
    copy: '<rect x="30" y="30" width="56" height="56" rx="10"/><path d="M70 30V18a6 6 0 00-6-6H20a6 6 0 00-6 6v44a6 6 0 006 6h10"/>',
    folder: '<path d="M10 24a6 6 0 016-6h22l10 12h36a6 6 0 016 6v42a6 6 0 01-6 6H16a6 6 0 01-6-6z"/>',
    filter: '<path d="M10 16h80L58 52v30l-16 8V52z"/>',
    split: '<path d="M50 90V54M50 54L22 22M50 54l28-32M12 30l10-8 8 10M88 30l-10-8-8 10"/>',
    trace: '<path d="M10 74l20-30 18 18 18-34 24 26"/><circle cx="30" cy="44" r="5"/><circle cx="48" cy="62" r="5"/><circle cx="66" cy="28" r="5"/>',
    cube: '<path d="M50 8l38 20v44L50 92 12 72V28zM12 28l38 20 38-20M50 48v44"/>',
    scale: '<path d="M50 12v76M24 88h52M14 30h72M14 30L4 56h20zM86 30l-10 26h20zM50 12l-6 6h12z"/>',
    ruler: '<path d="M12 70L70 12l18 18-58 58zM26 56l8 8M38 44l8 8M50 32l8 8M62 20l8 8"/>',
    door: '<path d="M22 90V12h56v78M14 90h72M62 52h2"/>',
  };

  const svgIcon = (name, cls = "ic") => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`;

  // Convierte [[icon:nombre]] en SVG dentro del HTML de la pizarra.
  function expandIcons(root) {
    root.querySelectorAll("[data-icon]").forEach((el) => {
      const cls = el.getAttribute("data-icon-class") || "ic";
      el.insertAdjacentHTML("afterbegin", svgIcon(el.getAttribute("data-icon"), cls));
    });
  }

  // Bloques de la guía "Consumo de modelos de IA mediante una API RESTful"
  const CLASS_ACCENT = { 1: "#5bdcff", 2: "#45e0a8", 3: "#ffc45a", 4: "#ff7ab6" };
  const CLASS_NAME = { 1: "Fundamentos", 2: "La solicitud", 3: "La respuesta", 4: "Producción" };

  function setup(cfg) {
    const root = document.getElementById("root");
    const D = Number(root.dataset.duration);
    const accent = cfg.accent || CLASS_ACCENT[cfg.cls];
    root.style.setProperty("--accent", accent);
    const orbitSrc = cfg.orbit || "shared/orbit.png";

    const steps = cfg.steps;
    const head = cfg.headTitle || cfg.title.replace(/<[^>]+>/g, "");
    const analogyArt = cfg.analogy.art || `<div class="big-icon">${svgIcon(cfg.analogy.icon || "home")}</div>`;

    root.insertAdjacentHTML("afterbegin", '<div class="t-bg"></div><div class="t-grid"></div>');
    root.insertAdjacentHTML("beforeend", `
      <header class="t-head"><div class="t-badge"><b>${cfg.point}</b>API REST · Punto ${cfg.point}</div><div class="t-head-title">${head}</div></header>
      <div class="t-rail">${steps.map((s, i) => `<div class="t-step" data-step="${i}"><i>${i + 1}</i><span>${s.label}</span></div>`).join("")}</div>
      <div class="t-caption">${steps.map((s, i) => `<div class="t-cap" data-cap="${i}"><small>Paso ${i + 1} · ${s.label}</small><p>${s.caption}</p></div>`).join("")}</div>
      <div class="t-orbit"><img src="${orbitSrc}" alt=""></div>
      <section class="t-intro"><div class="t-halo"></div><div class="t-intro-copy"><span class="t-kicker">Punto ${cfg.point} · ${CLASS_NAME[cfg.cls]}</span><h1>${cfg.title}</h1><p class="t-intro-sub">${cfg.question}</p></div><div class="t-intro-orbit"><img src="${orbitSrc}" alt=""></div></section>
      <section class="t-analogy"><div class="t-analogy-art">${analogyArt}</div><div><span class="t-kicker">Piénsalo así</span><h2>${cfg.analogy.title}</h2><p>${cfg.analogy.text}</p></div></section>
      <section class="t-outro"><div class="t-outro-card"><div class="t-seal">${svgIcon("check", "")}</div><span class="t-kicker">Idea clave</span><h2>${cfg.takeaway.title}</h2>${cfg.takeaway.text ? `<p>${cfg.takeaway.text}</p>` : ""}</div></section>`);
    expandIcons(root);

    const tl = gsap.timeline({ paused: true });

    // ---- Tiempos de cada fase ----
    const INTRO_END = 6.2;
    const ANALOGY_END = 14.6;
    const OUTRO_START = D - 6.6;
    const BOARD_START = ANALOGY_END;
    const stepsStart = BOARD_START + 0.6;
    const stepDur = (OUTRO_START - 0.4 - stepsStart) / steps.length;
    const stepAt = (i, offset = 0) => stepsStart + i * stepDur + offset;

    // Portada: visible desde el cuadro 0 (es el póster del video en la web)
    tl.set([".t-intro", ".t-kicker", ".t-intro h1", ".t-intro-sub", ".t-intro-orbit"], { opacity: 1 }, 0);
    tl.fromTo(".t-intro h1", { scale: 1 }, { scale: 1.025, duration: INTRO_END - .6, ease: "sine.inOut", transformOrigin: "0% 50%" }, 0);
    tl.fromTo(".t-intro-sub", { x: 0 }, { x: 12, duration: INTRO_END - .6, ease: "sine.inOut" }, 0);
    tl.fromTo(".t-halo", { opacity: .6, scale: .9 }, { opacity: 1, scale: 1.05, rotation: 60, duration: INTRO_END, ease: "none" }, 0);
    tl.fromTo(".t-intro-orbit img", { y: 0 }, { y: -18, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: 3 }, .2);
    tl.fromTo(".t-intro-orbit", { rotation: 0 }, { rotation: -3, duration: .5, ease: "sine.inOut", yoyo: true, repeat: 3, transformOrigin: "50% 100%" }, 1.6);
    tl.to(".t-intro", { opacity: 0, y: -40, duration: .45, ease: "power2.in" }, INTRO_END - .45);

    // Analogía
    tl.fromTo(".t-analogy", { opacity: 0 }, { opacity: 1, duration: .35 }, INTRO_END);
    tl.fromTo(".t-analogy-art", { opacity: 0, scale: .9, x: -60 }, { opacity: 1, scale: 1, x: 0, duration: .8, ease: "power3.out" }, INTRO_END + .05);
    tl.fromTo(".t-analogy h2", { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: .7, ease: "power3.out" }, INTRO_END + .35);
    tl.fromTo(".t-analogy p", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: "power3.out" }, INTRO_END + .9);
    tl.to(".t-analogy-art", { scale: 1.035, duration: ANALOGY_END - INTRO_END - 1.2, ease: "sine.inOut" }, INTRO_END + .9);
    if (!cfg.analogy.art) tl.fromTo(".t-analogy-art .big-icon svg", { scale: .7, rotation: -8 }, { scale: 1, rotation: 0, duration: 1.4, ease: "elastic.out(1, .6)" }, INTRO_END + .3);
    tl.to(".t-analogy", { opacity: 0, x: -60, duration: .45, ease: "power2.in" }, ANALOGY_END - .45);

    // Pizarra y marco
    tl.fromTo(".t-head", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: .5, ease: "power3.out" }, BOARD_START);
    tl.fromTo(".t-step", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: .4, stagger: .06, ease: "power2.out" }, BOARD_START + .1);
    tl.set(".t-rail", { opacity: 1 }, BOARD_START);
    tl.set("#board", { opacity: 1 }, BOARD_START);
    tl.fromTo(".t-caption", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .5, ease: "power3.out" }, BOARD_START + .25);
    tl.fromTo(".t-orbit", { opacity: 0, x: 120 }, { opacity: 1, x: 0, duration: .7, ease: "back.out(1.4)" }, BOARD_START + .35);
    const bobs = Math.max(1, Math.floor((OUTRO_START - BOARD_START - 1.2) / 1.6));
    tl.fromTo(".t-orbit img", { y: 0 }, { y: -12, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: bobs - 1 }, BOARD_START + 1.1);

    steps.forEach((_, i) => {
      const t = stepAt(i);
      const chip = `.t-step[data-step="${i}"]`;
      tl.to(chip, { backgroundColor: accent, borderColor: accent, color: "#050507", duration: .3, ease: "power2.out" }, t);
      tl.to(`${chip} i`, { backgroundColor: "#050507", color: accent, duration: .3 }, t);
      if (i > 0) {
        const prev = `.t-step[data-step="${i - 1}"]`;
        tl.to(prev, { backgroundColor: "rgba(69,224,168,.12)", borderColor: "rgba(69,224,168,.6)", color: "#b5ffe2", duration: .3 }, t);
        tl.to(`${prev} i`, { backgroundColor: "#45e0a8", color: "#062418", duration: .3 }, t);
        tl.to(`.t-cap[data-cap="${i - 1}"]`, { opacity: 0, y: -18, duration: .3, ease: "power2.in" }, t - .05);
      }
      tl.fromTo(`.t-cap[data-cap="${i}"]`, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .45, ease: "power3.out" }, t + .2);
      tl.fromTo(".t-orbit", { rotation: 0 }, { rotation: -4, duration: .25, yoyo: true, repeat: 1, ease: "sine.inOut", transformOrigin: "50% 100%" }, t + .1);
    });

    // Cierre: se apaga la pizarra y aparece la idea clave
    tl.to(["#board", ".t-caption", ".t-rail", ".t-head", ".t-orbit"], { opacity: 0, duration: .45, ease: "power2.in" }, OUTRO_START - .45);
    tl.fromTo(".t-outro", { opacity: 0 }, { opacity: 1, duration: .3 }, OUTRO_START);
    tl.fromTo(".t-outro-card", { opacity: 0, scale: .86, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: .8, ease: "back.out(1.5)" }, OUTRO_START + .05);
    tl.fromTo(".t-outro-card .t-kicker", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: .5, ease: "power3.out" }, OUTRO_START + .4);
    tl.fromTo(".t-outro-card h2", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .7, ease: "power3.out" }, OUTRO_START + .55);
    tl.fromTo(".t-outro-card p", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, ease: "power3.out" }, OUTRO_START + 1.1);
    tl.fromTo(".t-seal", { opacity: 0, scale: 2, rotation: -40 }, { opacity: 1, scale: 1, rotation: 0, duration: .6, ease: "back.out(2)" }, OUTRO_START + 1.4);
    tl.to(".t-outro", { opacity: 0, duration: .5, ease: "power1.in" }, D - .5);

    // ---- Ayudantes para animar la pizarra ----
    // Los selectores se buscan dentro de #board; con "@" al inicio se buscan en todo el cuadro
    // (útil para animar el dibujo propio de la analogía: "@.t-analogy-art .ladrillo").
    const B = (sel) => sel.split(",").map((s) => s.trim()).map((s) => s.startsWith("@") ? s.slice(1) : `#board ${s}`).join(",");
    const api = {
      tl, D, accent, stepAt, stepDur, icon: svgIcon,
      /** Inicio de la analogía (para animar un dibujo propio en analogy.art). */
      analogyAt: (offset = 0) => INTRO_END + offset,
      analogyDur: ANALOGY_END - INTRO_END,
      /** Aparece con rebote. */
      pop(sel, t, stagger = .1) { tl.fromTo(B(sel), { opacity: 0, scale: .6, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: .55, stagger, ease: "back.out(1.6)" }, t); return api; },
      /** Aparece suave desde una dirección. */
      slide(sel, t, { x = 0, y = 30, stagger = .1, duration = .6 } = {}) { tl.fromTo(B(sel), { opacity: 0, x, y }, { opacity: 1, x: 0, y: 0, duration, stagger, ease: "power3.out" }, t); return api; },
      fadeIn(sel, t, duration = .5) { tl.fromTo(B(sel), { opacity: 0 }, { opacity: 1, duration, ease: "power1.out" }, t); return api; },
      fadeOut(sel, t, to = 0, duration = .4) { tl.to(B(sel), { opacity: to, duration, ease: "power1.inOut" }, t); return api; },
      /** Dibuja trazos SVG (paths/lines con pathLength="1"). */
      draw(sel, t, duration = .8, stagger = .12) { tl.fromTo(B(sel), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration, stagger, ease: "power2.inOut" }, t); return api; },
      to(sel, t, vars) { tl.to(B(sel), { duration: .6, ease: "power2.inOut", ...vars }, t); return api; },
      fromTo(sel, t, from, to) { tl.fromTo(B(sel), from, { duration: .6, ease: "power2.inOut", ...to }, t); return api; },
      /** Latido para señalar algo mientras el subtítulo lo nombra. */
      pulse(sel, t, scale = 1.1) { tl.to(B(sel), { scale, duration: .22, yoyo: true, repeat: 1, ease: "sine.inOut" }, t); return api; },
      /** Resalta con brillo del color dado. */
      glow(sel, t, color = accent) { tl.to(B(sel), { boxShadow: `0 0 0 4px ${color}, 0 0 60px ${color}`, borderColor: color, duration: .35, ease: "power2.out" }, t); return api; },
      check(sel, t) { tl.fromTo(B(sel), { opacity: 0, scale: .2, rotation: -30 }, { opacity: 1, scale: 1, rotation: 0, duration: .5, ease: "back.out(2)" }, t); return api; },
      /** Marca ítems de .checklist uno a uno. */
      tick(sel, t, stagger = .35, color = "#45e0a8") { tl.to(B(sel), { backgroundColor: color, borderColor: color, color: "#062418", duration: .25, stagger }, t); return api; },
      /** Mueve el cursor y hace clic. */
      click(x, y, t, travel = .7) {
        tl.to(B(".cursor"), { x, y, duration: travel, ease: "power2.inOut" }, t);
        tl.to(B(".cursor"), { scale: .82, duration: .1, yoyo: true, repeat: 1, ease: "power1.inOut" }, t + travel);
        return api;
      },
      /** Prende un interruptor .switch. */
      flip(sel, t, color = "#45e0a8") { tl.to(B(`${sel} i`), { x: 44, backgroundColor: "#fff", duration: .3, ease: "power2.inOut" }, t); tl.to(B(sel), { backgroundColor: color, borderColor: color, duration: .3 }, t); return api; },
    };
    // Estado inicial: todo lo marcado con .hide arranca oculto.
    if (root.querySelector("#board .hide")) tl.set(B(".hide"), { opacity: 0 }, 0);
    // La escena registra: window.__timelines["<id>"] = T.tl;
    return api;
  }

  window.Teacher = { setup, icon: svgIcon };
})();
