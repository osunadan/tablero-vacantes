"use client";

import { useMemo, useState } from "react";
import type { Vacante } from "@/lib/types";
import { VacancyCard } from "./VacancyCard";

type Filtro = "todas" | "nuevas" | "vistas" | "postuladas";

function StatTile({
  label,
  valor,
  color,
  activo,
  onClick,
}: {
  label: string;
  valor: number;
  color: "ink" | "accent" | "muted" | "success";
  activo: boolean;
  onClick: () => void;
}) {
  const colorMap: Record<typeof color, string> = {
    ink: "var(--color-ink)",
    accent: "var(--color-accent)",
    muted: "var(--color-muted)",
    success: "var(--color-success)",
  };
  const numeroColor = colorMap[color];

  return (
    <button
      type="button"
      role="tab"
      aria-selected={activo}
      onClick={onClick}
      className="flex-1 rounded-[var(--radius-md)] border px-[var(--space-sm)] py-[var(--space-xs)] text-left transition-[border-color,background-color]"
      style={{
        borderColor: activo ? numeroColor : "var(--color-rule)",
        backgroundColor: activo ? "var(--color-paper-2)" : "var(--color-paper)",
        transitionDuration: "var(--dur-fast)",
      }}
    >
      <span
        className="block text-[var(--text-xl)] leading-none font-[var(--font-display)]"
        style={{ color: numeroColor, fontVariantNumeric: "tabular-nums" }}
      >
        {valor}
      </span>
      <span className="mono-label mt-[var(--space-3xs)] block">{label}</span>
    </button>
  );
}

export function VacancyBoard({ vacantesIniciales }: { vacantesIniciales: Vacante[] }) {
  const [vacantes, setVacantes] = useState(vacantesIniciales);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const cambiarEstado = async (id: string, campo: "vista" | "postulada", valor: boolean) => {
    setVacantes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [campo]: valor } : v))
    );

    const res = await fetch("/api/marcar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, campo, valor }),
    });

    if (!res.ok) {
      // Revertir el cambio optimista si no se pudo guardar en KV.
      setVacantes((prev) =>
        prev.map((v) => (v.id === id ? { ...v, [campo]: !valor } : v))
      );
    }
  };

  const nuevas = vacantes.filter((v) => !v.vista && !v.postulada).length;
  const vistas = vacantes.filter((v) => v.vista && !v.postulada).length;
  const postuladas = vacantes.filter((v) => v.postulada).length;

  const filtradas = useMemo(() => {
    switch (filtro) {
      case "nuevas":
        return vacantes.filter((v) => !v.vista && !v.postulada);
      case "vistas":
        return vacantes.filter((v) => v.vista && !v.postulada);
      case "postuladas":
        return vacantes.filter((v) => v.postulada);
      default:
        return vacantes;
    }
  }, [vacantes, filtro]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-[var(--space-2xs)] sm:grid-cols-4" role="tablist" aria-label="Filtrar vacantes">
        <StatTile label="Total" valor={vacantes.length} color="ink" activo={filtro === "todas"} onClick={() => setFiltro("todas")} />
        <StatTile label="Nuevas" valor={nuevas} color="accent" activo={filtro === "nuevas"} onClick={() => setFiltro("nuevas")} />
        <StatTile label="Vistas" valor={vistas} color="muted" activo={filtro === "vistas"} onClick={() => setFiltro("vistas")} />
        <StatTile label="Postuladas" valor={postuladas} color="success" activo={filtro === "postuladas"} onClick={() => setFiltro("postuladas")} />
      </div>

      <div className="mt-[var(--space-md)]">
        {filtradas.length === 0 ? (
          <p
            className="py-[var(--space-xl)] text-center text-[var(--text-base)]"
            style={{ color: "var(--color-muted)" }}
          >
            No hay vacantes en este filtro todavía.
          </p>
        ) : (
          filtradas.map((v) => (
            <VacancyCard key={v.id} vacante={v} onCambiarEstado={cambiarEstado} />
          ))
        )}
      </div>
    </div>
  );
}
