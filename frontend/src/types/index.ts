// Estos tipos reflejan exactamente los enums y entidades del backend
// (src/common/enums/*.ts y prisma/schema.prisma) para que el frontend
// y el backend "hablen" el mismo lenguaje.

export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  PROFESIONAL = 'PROFESIONAL',
}

export enum TipoPractica {
  MEDICAMENTO = 'MEDICAMENTO',
  CIRUGIA = 'CIRUGIA',
  INTERNACION = 'INTERNACION',
}

export const TIPO_PRACTICA_LABEL: Record<TipoPractica, string> = {
  [TipoPractica.MEDICAMENTO]: 'Medicamento',
  [TipoPractica.CIRUGIA]: 'Cirugía',
  [TipoPractica.INTERNACION]: 'Internación',
};

export enum EstadoPrescripcion {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  ENTREGADA = 'ENTREGADA',
  ANULADA = 'ANULADA',
}

export const ESTADO_PRESCRIPCION_COLOR: Record<EstadoPrescripcion, string> = {
  [EstadoPrescripcion.PENDIENTE]: 'gold',
  [EstadoPrescripcion.APROBADA]: 'blue',
  [EstadoPrescripcion.ENTREGADA]: 'green',
  [EstadoPrescripcion.ANULADA]: 'red',
};

export interface UsuarioSesion {
  idUsuario: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  rol: Rol;
  idProfesional: number | null;
}

export interface LoginResponse {
  accessToken: string;
  usuario: UsuarioSesion;
}

export interface ObraSocial {
  idObraSocial: number;
  nombre: string;
  activo: boolean;
}

export interface Paciente {
  idPaciente: number;
  nombre: string;
  apellido: string;
  dni: string;
  numeroAfiliado?: string | null;
  celular?: string | null;
  obraSocial?: ObraSocial | null;
}

export interface Profesional {
  idProfesional: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  matricula: string;
}

export interface Prescripcion {
  idPrescripcion: number;
  tipoPractica: TipoPractica;
  diagnostico: string;
  observaciones?: string | null;
  fecha: string;
  estado: EstadoPrescripcion;
  paciente: Paciente;
  profesional: Profesional;
}

// Lo que se envía al crear una prescripción (RF-08).
export interface CreatePrescripcionPayload {
  idPaciente: number;
  idProfesional?: number; // solo lo completa el Administrador (RB-04)
  tipoPractica: TipoPractica;
  diagnostico: string;
  observaciones?: string;
}
