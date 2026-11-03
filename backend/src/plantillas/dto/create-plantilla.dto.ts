import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoPractica } from '../../common/enums/tipo-practica.enum';

// Plantilla de prescripción (se guarda en Firestore, no en MySQL): diagnóstico
// y observaciones que un profesional usa seguido, para no reescribirlos.
export class CreatePlantillaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la plantilla es obligatorio.' })
  nombre: string;

  @IsEnum(TipoPractica, {
    message: 'El tipo de práctica debe ser MEDICAMENTO, CIRUGIA o INTERNACION.',
  })
  tipoPractica: TipoPractica;

  @IsString()
  @IsNotEmpty({ message: 'El diagnóstico es obligatorio.' })
  diagnostico: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // Mismo criterio que en Prescripciones (RB-04): si la crea un Profesional se
  // fuerza su propio idProfesional; si es Administrador, es obligatorio.
  @IsOptional()
  @IsInt()
  idProfesional?: number;
}
