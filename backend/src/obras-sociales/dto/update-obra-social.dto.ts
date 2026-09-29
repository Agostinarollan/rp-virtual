import { PartialType } from '@nestjs/mapped-types';
import { CreateObraSocialDto } from './create-obra-social.dto';

export class UpdateObraSocialDto extends PartialType(CreateObraSocialDto) {}
