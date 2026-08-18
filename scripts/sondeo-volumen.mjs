// Sondeo de volumen — llamadas baratas (results_per_page=1) que solo leen el
// campo "count" de Adzuna, sin descargar vacantes. Ver la sección 6 de
// "Muestreo estadístico con APIs públicas" en el vault: útil para confirmar
// que hay volumen antes de comprometerse a recolectar en serio, y para
// replicar este chequeo con otros términos en el futuro.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim()];
    })
);

const TERMINOS = [
  "Marketing manager",
  "Brand manager",
  "Gerente de marketing",
  "Coordinador de marketing",
];

const DIAS = Number(process.argv[2] ?? 30);

for (const termino of TERMINOS) {
  const url = new URL("https://api.adzuna.com/v1/api/jobs/mx/search/1");
  url.searchParams.set("app_id", env.ADZUNA_APP_ID);
  url.searchParams.set("app_key", env.ADZUNA_APP_KEY);
  url.searchParams.set("results_per_page", "1");
  url.searchParams.set("what", termino);
  url.searchParams.set("title_only", "1");
  url.searchParams.set("max_days_old", String(DIAS));
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.log(`${termino.padEnd(28)} → error HTTP ${res.status}`);
    continue;
  }
  const datos = await res.json();
  console.log(`${termino.padEnd(28)} → ${datos.count} coincidencias (últimos ${DIAS} días)`);
}
