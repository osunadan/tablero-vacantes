import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

const COOKIE = "tablero_auth";

export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  // Sin SITE_PASSWORD (proyecto demo) el gate queda desactivado.
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(COOKIE)?.value;
  if (cookie && cookie === (await hashPassword(password))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/login|api/recolectar|_next/|favicon.ico).*)"],
};
