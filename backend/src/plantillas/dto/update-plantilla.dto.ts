import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePlantillaDto } from './create-plantilla.dto';

// El profesional dueño de la plantilla no se reasigna en una edición.
export class UpdatePlantillaDto extends PartialType(
  OmitType(CreatePlantillaDto, ['idProfesional'] as const),
) {}
