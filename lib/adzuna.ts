import type { Vacante } from "./types";

const TERMINOS = [
  "Marketing manager",
  "Brand manager",
  "Gerente de marketing",
  "Coordinador de marketing",
] as const;

const PAIS = "mx";
const RESULTADOS_POR_PAGINA = 50;

interface AdzunaResultado {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  description: string;
  created: string;
  redirect_url: string;
}

interface AdzunaRespuesta {
  count: number;
  results: AdzunaResultado[];
}

async function pedirPagina(
  termino: string,
  pagina: number,
  diasMax: number
): Promise<AdzunaRespuesta> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("Faltan ADZUNA_APP_ID / ADZUNA_APP_KEY en las variables de entorno");
  }

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${PAIS}/search/${pagina}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(RESULTADOS_POR_PAGINA));
  url.searchParams.set("what", termino);
  // Sin title_only: el sondeo de volumen (2026-08-17) mostró que con title_only=1
  // estos 4 términos devuelven casi 0 resultados en México (nadie titula su
  // vacante literalmente "Marketing Manager" en inglés). Sin la restricción,
  // el volumen es sano (~600 antes de dedupe). El costo es algo de ruido
  // (vacantes que solo mencionan marketing en la descripción) — se filtra
  // en la Fase de codificación, no aquí.
  url.searchParams.set("max_days_old", String(diasMax));
  url.searchParams.set("content-type", "application/json");

  // revalidate: 1h — evita quemar la cuota mensual (1,000 llamadas) en cada
  // recarga mientras se prueba en local; Fase 2 mueve esto al cron diario.
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Adzuna respondió ${res.status} para "${termino}" página ${pagina}`);
  }
  return res.json();
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// La huella (empresa + título normalizados) atrapa el mismo puesto republicado
// con otro id — el id solo no basta, ver la sección de dedupe en la nota del método.
function huella(empresa: string, titulo: string): string {
  return `${normalizar(empresa)}::${normalizar(titulo)}`;
}

// Alcance geográfico del estudio (confirmado con Dan 2026-08-18): CDMX +
// Estado de México (zona metro pegada a CDMX — Naucalpan, Interlomas,
// Atizapán, Cuautitlán Izcalli, etc., donde vive buena parte de las
// vacantes corporativas de la zona) + cualquier vacante remota. Todo lo
// demás (León, Monterrey, Guadalajara...) se descarta aquí, en la fuente,
// no como ruido a filtrar después en la UI.
const ESTADOS_PERMITIDOS = ["ciudad de mexico", "estado de mexico"];
const PATRON_REMOTO = /\bremot|home office|teletrabajo|trabajo desde casa/;

// area[1] es el estado en la jerarquía de Adzuna (["México", "Ciudad de
// México", "Miguel Hidalgo"]) — más confiable que parsear display_name.
// Si Adzuna no trae estado (vacantes sin ciudad asignada), sólo se acepta
// si el propio texto de la vacante se declara remota.
function esUbicacionValida(area: string[] | undefined, titulo: string, descripcion: string): boolean {
  const estado = area?.[1] ? normalizar(area[1]) : undefined;
  if (estado && ESTADOS_PERMITIDOS.includes(estado)) return true;

  return PATRON_REMOTO.test(normalizar(`${titulo} ${descripcion}`));
}

export async function recolectarVacantes(
  diasMax: number,
  topeRegistros = 800
): Promise<Omit<Vacante, "vista" | "postulada">[]> {
  const idsVistos = new Set<string>();
  const huellasVistas = new Set<string>();
  const vacantes: Omit<Vacante, "vista" | "postulada">[] = [];

  for (const termino of TERMINOS) {
    let pagina = 1;

    while (vacantes.length < topeRegistros) {
      const datos = await pedirPagina(termino, pagina, diasMax);
      if (!datos.results?.length) break;

      for (const r of datos.results) {
        if (idsVistos.has(r.id)) continue;
        if (!esUbicacionValida(r.location?.area, r.title, r.description)) continue;
        const h = huella(r.company?.display_name ?? "", r.title);
        if (huellasVistas.has(h)) continue;

        idsVistos.add(r.id);
        huellasVistas.add(h);
        vacantes.push({
          id: r.id,
          titulo: r.title,
          empresa: r.company?.display_name ?? "Empresa no especificada",
          ubicacion: r.location?.display_name ?? "México",
          descripcion: r.description,
          fecha: r.created,
          url: r.redirect_url,
          fuente: "Adzuna",
        });
      }

      if (datos.results.length < RESULTADOS_POR_PAGINA) break;
      pagina += 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return vacantes;
}
