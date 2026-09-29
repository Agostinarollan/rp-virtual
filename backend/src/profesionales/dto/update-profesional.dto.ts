import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProfesionalDto } from './create-profesional.dto';

// El vínculo con el usuario no se reasigna desde acá una vez creado.
export class UpdateProfesionalDto extends PartialType(
  OmitType(CreateProfesionalDto, ['idUsuario'] as const),
) {}
