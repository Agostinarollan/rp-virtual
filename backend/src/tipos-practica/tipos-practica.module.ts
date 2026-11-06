import { Module } from '@nestjs/common';
import { TiposPracticaService } from './tipos-practica.service';
import { TiposPracticaController } from './tipos-practica.controller';

@Module({
  controllers: [TiposPracticaController],
  providers: [TiposPracticaService],
  exports: [TiposPracticaService],
})
export class TiposPracticaModule {}
