import { Module } from '@nestjs/common';
import { ProfesionalesService } from './profesionales.service';
import { ProfesionalesController } from './profesionales.controller';

@Module({
  controllers: [ProfesionalesController],
  providers: [ProfesionalesService],
  exports: [ProfesionalesService],
})
export class ProfesionalesModule {}
