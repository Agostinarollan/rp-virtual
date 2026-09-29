import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  nombreUsuario: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  contrasena: string;
}
