import { Redis } from "@upstash/redis";
import type { Vacante } from "./types";

// Nombres de env var documentados en Arquitectura - Tablero de Vacantes (vault).
// Vercel Marketplace → Upstash Redis los expone así por compatibilidad con el
// antiguo @vercel/kv (deprecado) — confirmar en el dashboard tras conectar la
// integración, por si el nombre cambia.
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const IDS_KEY = "ids_conocidos";
const ORDEN_KEY = "vacantes_por_fecha";

function claveVacante(id: string) {
  return `vacante:${id}`;
}

export async function idsConocidos(): Promise<Set<string>> {
  const ids = await redis.smembers(IDS_KEY);
  return new Set(ids);
}

export async function guardarVacantesNuevas(
  vacantes: Omit<Vacante, "vista" | "postulada">[]
): Promise<number> {
  if (vacantes.length === 0) return 0;

  const pipeline = redis.pipeline();
  for (const v of vacantes) {
    pipeline.hset(claveVacante(v.id), { ...v, vista: false, postulada: false });
    pipeline.sadd(IDS_KEY, v.id);
    pipeline.zadd(ORDEN_KEY, { score: new Date(v.fecha).getTime(), member: v.id });
  }
  await pipeline.exec();
  return vacantes.length;
}

export async function obtenerVacantes(): Promise<Vacante[]> {
  const ids = await redis.zrange<string[]>(ORDEN_KEY, 0, -1, { rev: true });
  if (ids.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.hgetall(claveVacante(id));
  const resultados = await pipeline.exec<Record<string, unknown>[]>();

  return resultados
    .filter((r): r is Record<string, unknown> => !!r)
    .map((r) => ({
      id: String(r.id),
      titulo: String(r.titulo),
      empresa: String(r.empresa),
      ubicacion: String(r.ubicacion),
      descripcion: String(r.descripcion),
      fecha: String(r.fecha),
      url: String(r.url),
      fuente: String(r.fuente),
      vista: r.vista === true || r.vista === "true",
      postulada: r.postulada === true || r.postulada === "true",
    }));
}

export async function marcarEstado(
  id: string,
  campo: "vista" | "postulada",
  valor: boolean
): Promise<void> {
  await redis.hset(claveVacante(id), { [campo]: valor });
}
