import { PartialType } from '@nestjs/mapped-types';
import { CreateQuirofanoDto } from './create-quirofano.dto';

export class UpdateQuirofanoDto extends PartialType(CreateQuirofanoDto) {}
