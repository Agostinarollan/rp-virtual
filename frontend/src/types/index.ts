// Estos tipos reflejan exactamente los enums y entidades del backend
// (src/common/enums/*.ts y prisma/schema.prisma) para que el frontend
// y el backend "hablen" el mismo lenguaje.

export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  PROFESIONAL = 'PROFESIONAL',
  OBRA_SOCIAL = 'OBRA_SOCIAL',
}

export const ROL_LABEL: Record<Rol, string> = {
  [Rol.ADMINISTRADOR]: 'Administrador',
  [Rol.PROFESIONAL]: 'Profesional',
  [Rol.OBRA_SOCIAL]: 'Obra Social',
};

// Antes era un enum: ahora es una entidad (tabla tipos_practica) con ABM.
// "codigo" es fijo y es el que se usa para reconocer CIRUGIA / INTERNACION.
export interface TipoPractica {
  idTipoPractica: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export const CODIGO_CIRUGIA = 'CIRUGIA';
export const CODIGO_INTERNACION = 'INTERNACION';

export enum EstadoPrescripcion {
  ENTREGADA_PACIENTE = 'ENTREGADA_PACIENTE',
  ENTREGADA_OBRA_SOCIAL = 'ENTREGADA_OBRA_SOCIAL',
  ANULADA = 'ANULADA',
}

export const ESTADO_PRESCRIPCION_LABEL: Record<EstadoPrescripcion, string> = {
  [EstadoPrescripcion.ENTREGADA_PACIENTE]: 'Entregada a Paciente',
  [EstadoPrescripcion.ENTREGADA_OBRA_SOCIAL]: 'Entregada a Obra Social',
  [EstadoPrescripcion.ANULADA]: 'Anulada',
};

export const ESTADO_PRESCRIPCION_COLOR: Record<EstadoPrescripcion, string> = {
  [EstadoPrescripcion.ENTREGADA_PACIENTE]: 'green',
  [EstadoPrescripcion.ENTREGADA_OBRA_SOCIAL]: 'cyan',
  [EstadoPrescripcion.ANULADA]: 'red',
};

// Auditoría que hace la obra social (independiente del estado de entrega).
export enum EstadoAuditoria {
  EN_AUDITORIA = 'EN_AUDITORIA',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

export const ESTADO_AUDITORIA_LABEL: Record<EstadoAuditoria, string> = {
  [EstadoAuditoria.EN_AUDITORIA]: 'En Auditoría',
  [EstadoAuditoria.APROBADA]: 'Aprobada',
  [EstadoAuditoria.RECHAZADA]: 'Rechazada',
};

export const ESTADO_AUDITORIA_COLOR: Record<EstadoAuditoria, string> = {
  [EstadoAuditoria.EN_AUDITORIA]: 'gold',
  [EstadoAuditoria.APROBADA]: 'green',
  [EstadoAuditoria.RECHAZADA]: 'red',
};

export interface Habitacion {
  idHabitacion: number;
  numero: string;
  piso?: string | null;
  activo: boolean;
}

export interface Quirofano {
  idQuirofano: number;
  nombre: string;
  activo: boolean;
}

export interface TurnoQuirofano {
  idTurnoQuirofano: number;
  fechaHora: string;
  quirofano: Quirofano;
}

export interface UsuarioSesion {
  idUsuario: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  rol: Rol;
  idProfesional: number | null;
  idObraSocial: number | null; // solo rol OBRA_SOCIAL
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
  idObraSocial?: number | null;
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
  estadoAuditoria?: EstadoAuditoria | null;
  observacionesAuditoria?: string | null;
  fechaAuditoria?: string | null;
  paciente: Paciente;
  profesional: Profesional;
  habitacion?: Habitacion | null;
  turnoQuirofano?: TurnoQuirofano | null;
}

// Lo que se envía al crear una prescripción (RF-08).
export interface CreatePrescripcionPayload {
  idPaciente: number;
  idProfesional?: number; // solo lo completa el Administrador (RB-04)
  idTipoPractica: number;
  diagnostico: string;
  observaciones?: string;
}

// Historial de prescripciones (se guarda en Firestore, lo consulta solo el Administrador).
export enum AccionHistorial {
  CREACION = 'CREACION',
  MODIFICACION = 'MODIFICACION',
  ANULACION = 'ANULACION',
  AUDITORIA = 'AUDITORIA',
}

export const ACCION_HISTORIAL_LABEL: Record<AccionHistorial, string> = {
  [AccionHistorial.CREACION]: 'Creación',
  [AccionHistorial.MODIFICACION]: 'Modificación',
  [AccionHistorial.ANULACION]: 'Anulación',
  [AccionHistorial.AUDITORIA]: 'Auditoría OS',
};

export const ACCION_HISTORIAL_COLOR: Record<AccionHistorial, string> = {
  [AccionHistorial.CREACION]: 'green',
  [AccionHistorial.MODIFICACION]: 'blue',
  [AccionHistorial.ANULACION]: 'red',
  [AccionHistorial.AUDITORIA]: 'purple',
};

export interface CambioHistorial {
  campo:
    | 'tipoPractica'
    | 'diagnostico'
    | 'observaciones'
    | 'estado'
    | 'fecha'
    | 'estadoAuditoria'
    | 'observacionesAuditoria';
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
  // Nombre del tipo de práctica. Registros anteriores a la entidad guardaban el
  // código del enum viejo (ej: "MEDICAMENTO"), y el estado "ENTREGADA".
  tipoPractica: string;
  diagnostico: string;
  observaciones?: string | null;
  estado: string;
  estadoAuditoria?: EstadoAuditoria | null;
  observacionesAuditoria?: string | null;
  fechaPrescripcion: string;
  cambios: CambioHistorial[];
}
