import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  apellido: string;

  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio.' })
  dni: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  // RB-17 / ObraSocial 1:N Paciente - opcional porque un paciente podría no tener obra social.
  @IsOptional()
  @IsInt()
  idObraSocial?: number;

  @IsOptional()
  @IsString()
  numeroAfiliado?: string;

  @IsOptional()
  @IsString()
  celular?: string;
}
