import { NextResponse } from "next/server";
import { marcarEstado } from "@/lib/kv";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const campo = body?.campo;
  const valor = body?.valor;

  if (typeof id !== "string" || (campo !== "vista" && campo !== "postulada") || typeof valor !== "boolean") {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  await marcarEstado(id, campo, valor);
  return NextResponse.json({ ok: true });
}
