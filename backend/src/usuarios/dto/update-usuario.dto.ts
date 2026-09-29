import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

// La contraseña no se actualiza por acá (se podría agregar un endpoint
// específico de cambio de contraseña más adelante si el TP lo requiere).
export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ['contrasena'] as const),
) {}
