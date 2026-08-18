@AGENTS.md

# Tablero de Vacantes - Marketing

Tablero web personal que consulta la API de Adzuna para un set fijo de términos de búsqueda y publica los resultados como tarjetas, con dos flags por vacante (`vista`, `postulada`) que se guardan entre visitas. Construido para una sola usuaria (búsqueda de Marketing/Brand Manager en CDMX), pero pensado para replicarse con otro puesto cambiando sólo la config.

Nota del vault con el proyecto completo (fases, tasks, arquitectura, decisiones): `13.14 APP-Tablero-Vacantes-Marketing` en `10 Projects/13 Proyectos Personales/` del vault de Obsidian. La arquitectura vive ahí en `_Docs/Arquitectura - Tablero de Vacantes.md` — léela antes de tocar el flujo de datos.

## Estado actual (2026-08-18)

Fase 2 y Fase 3 completas. `app/page.tsx` lee de Redis vía `obtenerVacantes()`; `VacancyBoard.cambiarEstado` escribe en Redis vía `POST /api/marcar` (con reversión optimista si falla). El proyecto está enlazado a Vercel (`osunadans-projects/tablero-vacantes-marketing`), con Redis (Upstash) conectado por el Marketplace, el cron diario registrado (`/api/recolectar`, `0 8 * * *`, ventana de 7 días), y desplegado en producción: https://tablero-vacantes-marketing.vercel.app. La siembra inicial (ventana de 30 días) ya corrió: 429 vacantes guardadas.

Siguiente fase pendiente: Fase 4 — replicar el tablero para otro tipo de vacante (ver [[Fase 4 - Replicar para otro tipo de vacante]] y el checklist en [[Setup inicial - Tablero de Vacantes con Adzuna + Vercel]]).

## Stack

- Next.js 16 (App Router) + Tailwind v4
- Redis (Upstash, vía Vercel Marketplace) + `@upstash/redis` para persistencia — `@vercel/kv` está deprecado, no usarlo
- Vercel Cron para la recolección automática diaria
- Adzuna API como única fuente por ahora (Jooble queda para después, a propósito)

## Parámetros del estudio (no cambiar sin razón)

- Términos: `Marketing manager`, `Brand manager`, `Gerente de marketing`, `Coordinador de marketing`
- Ubicación: CDMX + Estado de México (zona metro) + remoto. La llamada a Adzuna sigue sin `where` (para no perder remotas sin ciudad), pero ahora se filtra después con `esUbicacionValida()` en `lib/adzuna.ts`, usando `location.area` — no `display_name`
- Ventana: 30 días en la siembra inicial, 7 días en las corridas automáticas (el dedupe por id evita duplicados)
- **Sin `title_only`** — el sondeo real (ver `scripts/sondeo-volumen.mjs` y la nota de investigación en el vault) mostró que `title_only=1` da ~0 resultados para estos términos en México. Buscar también en la descripción es la config correcta aquí, no un descuido.
- Adzuna no separa "requisitos" de "descripción": es un solo campo de texto truncado. No inventar una columna de requisitos que la API no da.

## Variables de entorno

`ADZUNA_APP_ID`, `ADZUNA_APP_KEY` (desde developer.adzuna.com), `KV_REST_API_URL` / `KV_REST_API_TOKEN` (al conectar la integración de Redis desde el Marketplace de Vercel — confirmar el nombre exacto en el dashboard), `CRON_SECRET` (se define a mano, Vercel Cron lo manda solo como header). Van en `.env.local`, nunca en el código ni en un commit.

## Comandos

```bash
npm run dev     # desarrollo local
npm run build   # build de producción — lee de Redis (obtenerVacantes), ya no llama a Adzuna
curl "https://tablero-vacantes-marketing.vercel.app/api/recolectar?siembra=1" -H "Authorization: Bearer $CRON_SECRET"  # forzar una recolección manual (siembra=1 usa ventana de 30 días, si no 7)
vercel --prod   # deploy — acción visible, confirmar antes de correrlo
```
