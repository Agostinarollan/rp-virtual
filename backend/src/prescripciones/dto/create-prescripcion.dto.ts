import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePrescripcionDto {
  @IsInt()
  idPaciente: number;

  // Opcional en el DTO: si quien la crea es un Profesional, el service fuerza
  // su propio idProfesional y descarta cualquier valor recibido acá (RB-04).
  // Si es Administrador, es obligatorio elegir un profesional.
  @IsOptional()
  @IsInt()
  idProfesional?: number;

  // Entidad TipoPractica (tabla tipos_practica): se elige desde un desplegable.
  @IsInt({ message: 'Seleccioná un tipo de práctica.' })
  idTipoPractica: number;

  // Único campo obligatorio de texto libre para el detalle clínico.
  @IsString()
  @IsNotEmpty({ message: 'El diagnóstico es obligatorio.' })
  diagnostico: string;

  // Campo de texto libre y opcional (ej: cantidad de medicamento, indicaciones).
  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
