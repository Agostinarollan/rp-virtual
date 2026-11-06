import { IsNotEmpty, IsString } from 'class-validator';

export class CreateQuirofanoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del quirófano es obligatorio.' })
  nombre: string;
}
