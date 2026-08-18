import { NextResponse } from "next/server";
import { recolectarVacantes } from "@/lib/adzuna";
import { idsConocidos, guardarVacantesNuevas } from "@/lib/kv";

export const maxDuration = 60;

// Vercel Cron llama esta ruta con GET y, si CRON_SECRET está configurado,
// manda el header Authorization automáticamente — ver vercel.json y la
// Arquitectura del proyecto en el vault.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const esSiembra = new URL(request.url).searchParams.get("siembra") === "1";
  const dias = esSiembra ? 30 : 7;

  const recolectadas = await recolectarVacantes(dias);
  const conocidos = await idsConocidos();
  const nuevas = recolectadas.filter((v) => !conocidos.has(v.id));
  const guardadas = await guardarVacantesNuevas(nuevas);

  return NextResponse.json({ evaluadas: recolectadas.length, nuevas: guardadas, dias });
}
