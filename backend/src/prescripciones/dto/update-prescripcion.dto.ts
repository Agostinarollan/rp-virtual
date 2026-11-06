import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePrescripcionDto } from './create-prescripcion.dto';
import { EstadoPrescripcion } from '../../common/enums/estado-prescripcion.enum';

export class UpdatePrescripcionDto extends PartialType(
  OmitType(CreatePrescripcionDto, ['idPaciente', 'idProfesional'] as const),
) {
  // El paciente y el profesional de una prescripción no se reasignan en una
  // edición; para eso se anula y se crea una nueva (mantiene trazabilidad).
  @IsOptional()
  @IsEnum(EstadoPrescripcion, {
    message: 'El estado debe ser ENTREGADA_PACIENTE, ENTREGADA_OBRA_SOCIAL o ANULADA.',
  })
  estado?: EstadoPrescripcion;
}
