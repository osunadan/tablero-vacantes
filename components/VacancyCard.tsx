"use client";

import { useState } from "react";
import type { Vacante } from "@/lib/types";

interface Props {
  vacante: Vacante;
  onCambiarEstado: (id: string, campo: "vista" | "postulada", valor: boolean) => Promise<void>;
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  const dias = Math.floor((Date.now() - fecha.getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function EstadoToggle({
  label,
  activo,
  variante,
  onToggle,
}: {
  label: string;
  activo: boolean;
  variante: "accent" | "success";
  onToggle: () => Promise<void>;
}) {
  const [cargando, setCargando] = useState(false);

  const manejarClic = async () => {
    setCargando(true);
    try {
      await onToggle();
    } finally {
      setCargando(false);
    }
  };

  const colorActivo = variante === "accent" ? "var(--color-accent)" : "var(--color-success)";
  const colorTinte = variante === "accent" ? "var(--color-accent-tint)" : "var(--color-success-tint)";
  return (
    <button
      type="button"
      aria-pressed={activo}
      disabled={cargando}
      onClick={manejarClic}
      className="mono-label inline-flex items-center gap-[var(--space-3xs)] rounded-[var(--radius-sm)] border px-[var(--space-2xs)] py-[var(--space-3xs)] transition-[background-color,border-color,transform,opacity] disabled:opacity-60"
      style={{
        borderColor: activo ? colorActivo : "var(--color-rule)",
        backgroundColor: activo ? colorTinte : "transparent",
        color: activo ? colorActivo : "var(--color-muted)",
        transitionDuration: "var(--dur-fast)",
        transitionTimingFunction: "var(--ease-out)",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {activo && (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5L6.5 12L13 4" stroke={colorActivo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {cargando ? "guardando…" : label}
    </button>
  );
}

export function VacancyCard({ vacante, onCambiarEstado }: Props) {
  const esNueva = !vacante.vista && !vacante.postulada;

  return (
    <article
      className="grid grid-cols-1 gap-[var(--space-xs)] py-[var(--space-md)] first:pt-0"
      style={{
        borderTop: "1px solid var(--color-rule)",
        opacity: vacante.vista && !vacante.postulada ? 0.72 : 1,
        transition: `opacity var(--dur-base) var(--ease-out)`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-2xs)]">
        <div className="flex items-start gap-[var(--space-2xs)]">
          {esNueva && (
            <span
              aria-hidden="true"
              className="mt-[0.5em] block h-[6px] w-[6px] shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
          )}
          <div>
            <h3 className="text-[var(--text-md)] leading-snug">{vacante.titulo}</h3>
            <p className="text-[var(--text-sm)]" style={{ color: "var(--color-muted)" }}>
              {vacante.empresa} · {vacante.ubicacion}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-[var(--space-2xs)]">
          {vacante.postulada && (
            <span className="mono-label" style={{ color: "var(--color-success)" }}>
              postulada
            </span>
          )}
          <span className="mono-label">{formatearFecha(vacante.fecha)}</span>
        </div>
      </div>

      <p
        className="text-[var(--text-base)] leading-relaxed"
        style={{
          color: "var(--color-ink-2)",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {vacante.descripcion}
      </p>

      <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
        <a
          href={vacante.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-sm)] font-medium underline-offset-4 hover:underline focus-visible:underline"
          style={{ color: "var(--color-accent)", textDecorationColor: "var(--color-accent)" }}
        >
          Ver vacante y postularse →
        </a>
        <div className="ml-auto flex items-center gap-[var(--space-2xs)]">
          <EstadoToggle
            label="Ya la vi"
            activo={vacante.vista}
            variante="accent"
            onToggle={() => onCambiarEstado(vacante.id, "vista", !vacante.vista)}
          />
          <EstadoToggle
            label="Ya me postulé"
            activo={vacante.postulada}
            variante="success"
            onToggle={() => onCambiarEstado(vacante.id, "postulada", !vacante.postulada)}
          />
        </div>
      </div>
    </article>
  );
}
