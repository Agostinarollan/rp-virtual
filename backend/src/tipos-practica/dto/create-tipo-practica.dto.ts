import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTipoPracticaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del tipo de práctica es obligatorio.' })
  nombre: string;
}
