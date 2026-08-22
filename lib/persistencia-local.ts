// Persistencia del modo demo: las marcas de vista/postulada viven solo en el
// navegador de quien visita, nunca en el Redis real. Cada visitante tiene su
// propio localStorage, así que no hay estado compartido entre desconocidos.
const CLAVE = "tablero-demo-estados";

type Estados = Record<string, { vista?: boolean; postulada?: boolean }>;

function leer(): Estados {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CLAVE) ?? "{}");
  } catch {
    return {};
  }
}

export function leerEstadosLocales(): Estados {
  return leer();
}

export async function persistirEnLocalStorage(
  id: string,
  campo: "vista" | "postulada",
  valor: boolean
): Promise<boolean> {
  const estados = leer();
  estados[id] = { ...estados[id], [campo]: valor };
  window.localStorage.setItem(CLAVE, JSON.stringify(estados));
  return true;
}
