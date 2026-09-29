import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Rol } from '../../common/enums/rol.enum';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  apellido: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  nombreUsuario: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  contrasena: string;

  // RB-02: cada usuario tiene un rol (reemplaza a la entidad Rol).
  @IsEnum(Rol, { message: 'El rol debe ser ADMINISTRADOR o PROFESIONAL.' })
  rol: Rol;
}
