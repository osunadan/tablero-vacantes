import type { Vacante } from "@/lib/types";
import { buscarVacantesEnVivo } from "@/lib/adzuna";
import { VacancyBoard } from "@/components/VacancyBoard";

const REPO_URL = "https://github.com/osunadan/tablero-vacantes";

function inputClase() {
  return "rounded-[var(--radius-md)] border px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--text-base)]";
}

function PieAutoHospedaje() {
  return (
    <p className="mt-[var(--space-lg)] text-[var(--text-sm)]" style={{ color: "var(--color-muted)" }}>
      Esta búsqueda es en vivo: no se guarda nada en un servidor, solo en tu navegador. ¿Quieres la
      versión completa, con actualización diaria automática y tus marcas guardadas entre visitas?{" "}
      <a
        href={`${REPO_URL}#personalizar-para-otro-puesto-o-industria`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4"
        style={{ color: "var(--color-accent)" }}
      >
        auto-hospédala con tu propio Redis y cron
      </a>
      .
    </p>
  );
}

function BusquedaForm() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-[var(--space-md)]">
      <p className="mono-label" style={{ color: "var(--color-accent)" }}>
        Tablero de vacantes · demo
      </p>
      <h1 className="mt-[var(--space-3xs)] text-[var(--text-lg)]" style={{ color: "var(--color-ink)" }}>
        Busca tus propias vacantes
      </h1>
      <p className="mt-[var(--space-2xs)] text-[var(--text-sm)]" style={{ color: "var(--color-muted)" }}>
        Escribe un puesto y, si quieres, una ciudad. Se busca en vivo contra Adzuna.
      </p>

      <form method="GET" className="mt-[var(--space-md)] flex flex-col gap-[var(--space-xs)]">
        <input name="puesto" required placeholder="p. ej. Marketing manager" className={inputClase()} style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }} />
        <input name="ubicacion" placeholder="Ciudad (opcional)" className={inputClase()} style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }} />
        <button
          type="submit"
          className="mono-label rounded-[var(--radius-md)] border px-[var(--space-sm)] py-[var(--space-xs)]"
          style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }}
        >
          Buscar vacantes
        </button>
      </form>

      <PieAutoHospedaje />
    </main>
  );
}

function esErrorDeCuota(mensaje: string): boolean {
  return /respondió 403|respondió 429/.test(mensaje);
}

export default async function DemoHome({
  searchParams,
}: {
  searchParams: { puesto?: string; ubicacion?: string };
}) {
  const puesto = searchParams.puesto?.trim();
  const ubicacion = searchParams.ubicacion?.trim() || undefined;

  if (!puesto) return <BusquedaForm />;

  let vacantes: Vacante[] = [];
  let error: string | null = null;

  try {
    const resultados = await buscarVacantesEnVivo(puesto, ubicacion);
    vacantes = resultados.map((v) => ({ ...v, vista: false, postulada: false }));
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido al buscar en Adzuna";
    error = esErrorDeCuota(mensaje)
      ? "Se alcanzó el límite de búsquedas del demo por ahora — vuelve más tarde."
      : mensaje;
  }

  return (
    <>
      <header style={{ backgroundColor: "var(--color-graphite)" }}>
        <div className="mx-auto max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
          <p className="mono-label" style={{ color: "var(--color-accent)" }}>
            Tablero de vacantes · demo
          </p>
          <h1 className="mt-[var(--space-3xs)] text-[var(--text-lg)]" style={{ color: "var(--color-graphite-ink)" }}>
            {puesto}
            {ubicacion ? ` · ${ubicacion}` : ""}
          </h1>
          <p className="mt-[var(--space-2xs)] max-w-[65ch] text-[var(--text-sm)]" style={{ color: "var(--color-muted)" }}>
            Resultados en vivo desde Adzuna. Marca cada una conforme la revises — se guarda solo en
            este navegador.{" "}
            <a href="/" className="underline underline-offset-4" style={{ color: "var(--color-accent)" }}>
              nueva búsqueda
            </a>
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-[var(--space-md)] py-[var(--space-lg)]">
        {error ? (
          <p
            className="rounded-[var(--radius-md)] border px-[var(--space-sm)] py-[var(--space-sm)] text-[var(--text-base)]"
            style={{ borderColor: "var(--color-rule)", color: "var(--color-muted)" }}
          >
            {error}
          </p>
        ) : (
          <VacancyBoard vacantesIniciales={vacantes} modo="local" />
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--color-rule)" }}>
        <div className="mx-auto max-w-3xl px-[var(--space-md)] py-[var(--space-sm)]">
          <p className="mono-label">
            Fuente: Adzuna · búsqueda en vivo · {vacantes.length} vacantes
          </p>
          <PieAutoHospedaje />
        </div>
      </footer>
    </>
  );
}
