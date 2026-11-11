# Explicadores "modo maestro" · cómo se escribe cada clip

Cada punto del taller tiene un clip de HyperFrames que **explica el tema como lo haría un maestro**: plantea la pregunta, la aterriza con una analogía, arma el diagrama paso a paso con rótulos y termina con la idea clave. Quien vea solo el clip debe entender de qué trata el punto.

## Estructura de archivos

```
motion/point-explainers/
  shared/teacher.css   marco visual común (fuentes, colores, piezas de pizarra)
  shared/teacher.js    Teacher.setup(): portada, analogía, riel de pasos, subtítulo, Orbit y cierre
  shared/orbit.png     Orbit, el guía de AI Academy
  scenes/<id>/index.html   un proyecto HyperFrames por punto (p01 … p11)
  scenes/<id>/shared   enlace simbólico a ../../shared
  render-all.mjs       renderiza las escenas a assets/motion y genera los pósteres
```

`scenes/p01/index.html` es el ejemplo de referencia: copia su forma.

## La mini clase (tiempos fijos que pone el kit)

| Fase | Tiempo | Qué ve el alumno |
|---|---|---|
| Portada | 0 – 6,2 s | Pregunta del punto + subtítulo + Orbit. Visible desde el cuadro 0: es el póster en la web. |
| Analogía | 6,2 – 14,6 s | "Piénsalo así": un dibujo propio de construcción o de la vida diaria + texto. |
| Pizarra | 14,6 s – (D − 6,6 s) | El diagrama se arma por pasos; el riel superior marca el paso y el subtítulo lo narra. |
| Idea clave | últimos 6,6 s | Una frase para recordar y un apoyo corto. |

`D` es `data-duration` del root: entre **38 y 44 s** según cuántos pasos tenga (3 a 5). Cada paso necesita al menos 4 s.

## Reglas de contenido

- Español neutro, frases cortas, sin emojis. Nada de jerga sin explicar.
- Todo elemento de la pizarra lleva **texto**: título, rótulo o ejemplo concreto. Nunca íconos sueltos.
- El subtítulo de cada paso es la voz del maestro (máx. ~95 caracteres). Usa `<em>` para resaltar 1–3 palabras.
- Usa los **ejemplos del currículo** (`planning/CURRICULUM_SITE.md`): casos ficticios, comandos, tablas. Que el alumno reconozca el ejercicio.
- La analogía usa `analogy.art` con un dibujo propio en HTML/CSS y se anima con `T.slide("@.selector", T.analogyAt(…))`. No uses el ícono por defecto.
- La idea clave cabe en dos líneas de 74 px (≈ 70 caracteres).

## Reglas de diseño

- La pizarra (`#board`) mide 1776 × 600 px. Deja libre la esquina inferior derecha (x > 1500 y y > 540): ahí está Orbit.
- Texto de lectura ≥ 26 px; títulos de tarjeta 34–40 px. Se proyecta en un aula.
- Colores: verde = permitido/correcto, amarillo = revisar, rojo = bloqueado, morado/lavanda = la IA y la estructura. El color de la clase (`--accent`) es para lo que el subtítulo señala.
- Piezas disponibles en `teacher.css`: `.card` (con `.green/.yellow/.red/.cyan/.accent/.solid/.light`, `.row`, `.center`), `.num`, `.tag`, `.note` (`.purple/.green/.red`), `.say`, `.say.big`, `.paper`, `.wires` (SVG con `pathLength="1"`), `.token`, `.okmark`, `.nomark`, `.person`, `.checklist`, `.cursor`, `.switch`, `.frame`.
- Íconos: `<span data-icon="nombre"></span>` (lista en `ICONS` de `teacher.js`).

## Animación

```js
const T = Teacher.setup({ cls, point, title, headTitle, question, analogy: { art, title, text }, steps: [{ label, caption }], takeaway: { title, text } });
const s = T.stepAt;            // s(i, offset) = segundo absoluto del paso i
T.tl.set([...], { opacity: 0 }, 0);   // estado inicial de las piezas
T.pop(sel, t) · T.slide(sel, t, {x, y, stagger}) · T.fadeIn · T.fadeOut · T.draw(".w1", t)
T.to(sel, t, vars) · T.fromTo · T.pulse · T.glow(sel, t, color) · T.check · T.tick · T.click(x, y, t) · T.flip
window.__timelines["<id>"] = T.tl;   // literal: el lint lo exige
```

- Una idea visual por paso, en el orden en que la narra el subtítulo. Lo nuevo aparece; lo anterior se queda (la pizarra se acumula).
- Algo debe moverse al menos cada 3 s. Las notas (`.note`) duran en pantalla ≥ 0,5 s + 0,3 s por palabra.
- Nada de `Math.random`, relojes ni `repeat: -1`.

## Validar y renderizar

```bash
cd scenes/<id>
npx --yes hyperframes@0.8.186 check .
npx --yes hyperframes@0.8.186 snapshot . --at 3,10,<un tiempo por paso>,<D-3> --describe false
```

`check` debe pasar sin errores. Las advertencias aceptadas: `film_silent` (el maestro narra en vivo) y `text_below_floor` en números de insignia.

Renderizar todo y actualizar la web:

```bash
node render-all.mjs            # las 21
node render-all.mjs c2p3 c4p1  # solo algunas
```
