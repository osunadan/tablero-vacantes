import type { Vacante } from "@/lib/types";
import { obtenerVacantes } from "@/lib/kv";
import { VacancyBoard } from "@/components/VacancyBoard";
import DemoHome from "./DemoHome";

export const revalidate = 3600;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ puesto?: string; ubicacion?: string }>;
}) {
  if (process.env.DEMO_MODE === "1") {
    return <DemoHome searchParams={await searchParams} />;
  }

  let vacantes: Vacante[] = [];
  let error: string | null = null;

  try {
    vacantes = await obtenerVacantes();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido al leer las vacantes guardadas";
  }

  return (
    <>
      <header style={{ backgroundColor: "var(--color-graphite)" }}>
        <div className="mx-auto max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
          <p className="mono-label" style={{ color: "var(--color-accent)" }}>
            Tablero de vacantes
          </p>
          <h1
            className="mt-[var(--space-3xs)] text-[var(--text-lg)]"
            style={{ color: "var(--color-graphite-ink)" }}
          >
            Marketing Manager · Brand Manager · CDMX y remoto
          </h1>
          <p
            className="mt-[var(--space-2xs)] max-w-[65ch] text-[var(--text-sm)]"
            style={{ color: "var(--color-muted)" }}
          >
            Vacantes publicadas en México, recolectadas de Adzuna todos los días. Marca cada
            una conforme la revises.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-[var(--space-md)] py-[var(--space-lg)]">
        {error ? (
          <p
            className="rounded-[var(--radius-md)] border px-[var(--space-sm)] py-[var(--space-sm)] text-[var(--text-base)]"
            style={{ borderColor: "var(--color-rule)", color: "var(--color-muted)" }}
          >
            No se pudieron leer las vacantes: {error}
          </p>
        ) : (
          <VacancyBoard vacantesIniciales={vacantes} />
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--color-rule)" }}>
        <div className="mx-auto max-w-3xl px-[var(--space-md)] py-[var(--space-sm)]">
          <p className="mono-label">
            Fuente: Adzuna · México · {vacantes.length} vacantes guardadas
          </p>
        </div>
      </footer>
    </>
  );
}
