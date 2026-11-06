import { IsInt, IsOptional } from 'class-validator';

// idHabitacion null (o sin enviar) = quitar la habitación asignada.
export class AsignarHabitacionDto {
  @IsOptional()
  @IsInt()
  idHabitacion?: number | null;
}
