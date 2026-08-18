export interface Vacante {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  descripcion: string;
  fecha: string; // ISO 8601
  url: string;
  fuente: string;
  vista: boolean;
  postulada: boolean;
}
