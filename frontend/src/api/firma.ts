import { api } from './axios';
import type { Profesional } from '../types';

export async function subirFirma(idProfesional: number, file: File): Promise<Profesional> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<Profesional>(
    `/profesionales/${idProfesional}/firma`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

// Devuelve la URL de la firma actual, o null si el profesional todavía no cargó ninguna (404).
export async function obtenerFirma(idProfesional: number): Promise<string | null> {
  try {
    const { data } = await api.get<{ url: string }>(`/profesionales/${idProfesional}/firma`);
    return data.url;
  } catch {
    return null;
  }
}
