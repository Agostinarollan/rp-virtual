import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoPractica } from '../../common/enums/tipo-practica.enum';

export class CreatePrescripcionDto {
  @IsInt()
  idPaciente: number;

  // Opcional en el DTO: si quien la crea es un Profesional, el service fuerza
  // su propio idProfesional y descarta cualquier valor recibido acá (RB-04).
  // Si es Administrador, es obligatorio elegir un profesional.
  @IsOptional()
  @IsInt()
  idProfesional?: number;

  // Reemplaza a la entidad Tipo_Practica: se elige desde un desplegable en el
  // formulario (MEDICAMENTO | CIRUGIA | INTERNACION).
  @IsEnum(TipoPractica, {
    message: 'El tipo de práctica debe ser MEDICAMENTO, CIRUGIA o INTERNACION.',
  })
  tipoPractica: TipoPractica;

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
