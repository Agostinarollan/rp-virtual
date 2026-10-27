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
