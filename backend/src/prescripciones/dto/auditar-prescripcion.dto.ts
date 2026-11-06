import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoAuditoria } from '../../common/enums/estado-auditoria.enum';

// Lo que envía la Obra Social al auditar una prescripción.
export class AuditarPrescripcionDto {
  @IsEnum(EstadoAuditoria, {
    message: 'El estado de auditoría debe ser EN_AUDITORIA, APROBADA o RECHAZADA.',
  })
  estadoAuditoria: EstadoAuditoria;

  @IsOptional()
  @IsString()
  observacionesAuditoria?: string;
}
