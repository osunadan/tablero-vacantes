// Depura de Vercel KV las vacantes guardadas antes de que existiera el
// filtro de ubicación en lib/adzuna.ts (esUbicacionValida). Solo borra las
// que quedan fuera del alcance (CDMX + Estado de México + remoto) — no toca
// las que sí califican, así que no pierde flags de vista/postulada en esas.
// Reutilizable si se vuelve a colar ruido geográfico más adelante.
import { readFileSync } from "node:fs";
import { Redis } from "@upstash/redis";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim().replace(/^"(.*)"$/, "$1")];
    })
);

const redis = new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN });

const ESTADOS_PERMITIDOS = ["ciudad de mexico", "estado de mexico"];
const PATRON_REMOTO = /\bremot|home office|teletrabajo|trabajo desde casa/;

function normalizar(texto) {
  return texto
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esUbicacionValida(ubicacion, titulo, descripcion) {
  const u = normalizar(ubicacion ?? "");
  if (ESTADOS_PERMITIDOS.some((e) => u.includes(e))) return true;
  return PATRON_REMOTO.test(normalizar(`${titulo ?? ""} ${descripcion ?? ""}`));
}

const ids = await redis.zrange("vacantes_por_fecha", 0, -1);
let eliminadas = 0;
let conservadas = 0;

for (const id of ids) {
  const v = await redis.hgetall(`vacante:${id}`);
  if (!v) continue;

  if (esUbicacionValida(v.ubicacion, v.titulo, v.descripcion)) {
    conservadas += 1;
    continue;
  }

  await redis.del(`vacante:${id}`);
  await redis.srem("ids_conocidos", id);
  await redis.zrem("vacantes_por_fecha", id);
  eliminadas += 1;
  console.log(`✗ ${v.ubicacion} — ${v.titulo}`);
}

console.log(`\nEliminadas: ${eliminadas} · Conservadas: ${conservadas}`);
