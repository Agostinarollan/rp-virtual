import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateProfesionalDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  apellido: string;

  @IsString()
  @IsNotEmpty({ message: 'La especialidad es obligatoria.' })
  especialidad: string;

  // RB-03: cada profesional debe tener una matrícula identificatoria.
  @IsString()
  @IsNotEmpty({ message: 'La matrícula es obligatoria.' })
  matricula: string;

  // La firma no va en este DTO: solo se carga subiendo la imagen a
  // POST /profesionales/:id/firma (en la BD se guarda la ruta de Storage).

  // El profesional se vincula a un usuario con rol PROFESIONAL ya existente.
  @IsInt()
  idUsuario: number;
}
