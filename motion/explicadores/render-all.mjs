// Renderiza los explicadores "modo maestro" y deja todo listo para la página:
//   assets/motion/<id>.mp4           video del punto
//   assets/motion/posters/<id>.jpg   póster (cuadro de portada con la pregunta)
// Uso: node render-all.mjs            (todas las escenas)
//      node render-all.mjs p01 p04    (solo algunas)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const out = path.join(repo, "assets", "motion");
const posters = path.join(out, "posters");
const HF = "hyperframes@0.8.186";

const all = fs.readdirSync(path.join(here, "scenes")).filter((d) => /^p\d\d$/.test(d)).sort();
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : all;
fs.mkdirSync(posters, { recursive: true });

const failed = [];
for (const id of wanted) {
  const dir = path.join(here, "scenes", id);
  if (!fs.existsSync(path.join(dir, "index.html"))) { console.warn(`· ${id}: sin index.html, se omite`); continue; }
  const mp4 = path.join(out, `${id}.mp4`);
  const started = Date.now();
  try {
    // CRF 24 mantiene el texto nítido y el archivo liviano para GitHub Pages.
    execFileSync("npx", ["--yes", HF, "render", ".", "-o", mp4, "--crf", "24", "--quiet"], { cwd: dir, stdio: ["ignore", "ignore", "pipe"] });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "1.5", "-i", mp4, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4", path.join(posters, `${id}.jpg`)]);
    const mb = (fs.statSync(mp4).size / 1048576).toFixed(1);
    console.log(`✓ ${id} · ${mb} MB · ${Math.round((Date.now() - started) / 1000)} s`);
  } catch (error) {
    failed.push(id);
    console.error(`✗ ${id}: ${error.stderr?.toString().split("\n").slice(-6).join("\n") || error.message}`);
  }
}
if (failed.length) { console.error(`Fallaron: ${failed.join(", ")}`); process.exit(1); }
