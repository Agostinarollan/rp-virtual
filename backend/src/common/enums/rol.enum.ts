// Reemplaza la entidad Rol. Se usa el mismo enum que expone Prisma,
// re-exportado acá para que el resto de la app no dependa directamente
// del cliente de Prisma en las capas de guards/decorators.
export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  PROFESIONAL = 'PROFESIONAL',
}
