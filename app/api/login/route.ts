import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = form.get("password");
  const origen = new URL(request.url).origin;

  if (typeof password !== "string" || password !== process.env.SITE_PASSWORD) {
    return NextResponse.redirect(`${origen}/login?error=1`, { status: 303 });
  }

  const respuesta = NextResponse.redirect(`${origen}/`, { status: 303 });
  respuesta.cookies.set("tablero_auth", await hashPassword(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return respuesta;
}
