// Qué se hizo con la prescripción en cada registro del historial (Firestore).
export enum AccionHistorial {
  CREACION = 'CREACION',
  MODIFICACION = 'MODIFICACION',
  ANULACION = 'ANULACION',
  AUDITORIA = 'AUDITORIA', // la obra social aprobó / rechazó / puso en auditoría
}
