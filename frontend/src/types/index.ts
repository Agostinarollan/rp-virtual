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
  ENTREGADA = 'ENTREGADA',
  ANULADA = 'ANULADA',
}

export const ESTADO_PRESCRIPCION_COLOR: Record<EstadoPrescripcion, string> = {
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
  firma?: string | null;
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

// Historial de prescripciones (se guarda en Firestore, lo consulta solo el Administrador).
export enum AccionHistorial {
  CREACION = 'CREACION',
  MODIFICACION = 'MODIFICACION',
  ANULACION = 'ANULACION',
}

export const ACCION_HISTORIAL_LABEL: Record<AccionHistorial, string> = {
  [AccionHistorial.CREACION]: 'Creación',
  [AccionHistorial.MODIFICACION]: 'Modificación',
  [AccionHistorial.ANULACION]: 'Anulación',
};

export const ACCION_HISTORIAL_COLOR: Record<AccionHistorial, string> = {
  [AccionHistorial.CREACION]: 'green',
  [AccionHistorial.MODIFICACION]: 'blue',
  [AccionHistorial.ANULACION]: 'red',
};

export interface CambioHistorial {
  campo: 'tipoPractica' | 'diagnostico' | 'observaciones' | 'estado' | 'fecha';
  antes: string | null;
  despues: string | null;
}

export interface RegistroHistorial {
  id: string;
  accion: AccionHistorial;
  fecha: string; // cuándo se hizo la acción
  idPrescripcion: number;
  usuario: { idUsuario: number; nombreUsuario: string; rol: Rol };
  paciente: { idPaciente: number; nombre: string; apellido: string; dni: string };
  profesional: { idProfesional: number; nombre: string; apellido: string; matricula: string };
  tipoPractica: TipoPractica;
  diagnostico: string;
  observaciones?: string | null;
  estado: EstadoPrescripcion;
  fechaPrescripcion: string;
  cambios: CambioHistorial[];
}
