export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-[var(--space-md)]">
      <p className="mono-label" style={{ color: "var(--color-accent)" }}>
        Tablero de vacantes
      </p>
      <h1 className="mt-[var(--space-3xs)] text-[var(--text-lg)]" style={{ color: "var(--color-ink)" }}>
        Entrar
      </h1>

      <form
        method="POST"
        action="/api/login"
        className="mt-[var(--space-md)] flex flex-col gap-[var(--space-xs)]"
      >
        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="Contraseña"
          className="rounded-[var(--radius-md)] border px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--text-base)]"
          style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }}
        />

        {error && (
          <p className="text-[var(--text-sm)]" style={{ color: "var(--color-accent)" }}>
            Contraseña incorrecta.
          </p>
        )}

        <button
          type="submit"
          className="mono-label rounded-[var(--radius-md)] border px-[var(--space-sm)] py-[var(--space-xs)]"
          style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }}
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
