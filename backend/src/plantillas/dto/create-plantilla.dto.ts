import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Plantilla de prescripción (se guarda en Firestore, no en MySQL): diagnóstico
// y observaciones que un profesional usa seguido, para no reescribirlos.
export class CreatePlantillaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la plantilla es obligatorio.' })
  nombre: string;

  // Id de la entidad TipoPractica (tabla tipos_practica en MySQL).
  @IsInt({ message: 'Seleccioná un tipo de práctica.' })
  idTipoPractica: number;

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
