import { IsNotEmpty, IsString } from 'class-validator';

export class CreateObraSocialDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la obra social es obligatorio.' })
  nombre: string;
}
