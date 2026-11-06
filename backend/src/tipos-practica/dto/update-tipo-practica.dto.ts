import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoPracticaDto } from './create-tipo-practica.dto';

export class UpdateTipoPracticaDto extends PartialType(CreateTipoPracticaDto) {}
