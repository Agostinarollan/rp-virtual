import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHabitacionDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de habitación es obligatorio.' })
  numero: string;

  @IsOptional()
  @IsString()
  piso?: string;
}
