// El hash nunca guarda la contraseña en la cookie, solo su huella — mismo
// valor recalculado tanto al hacer login como en cada request del middleware.
export async function hashPassword(password: string): Promise<string> {
  const datos = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
