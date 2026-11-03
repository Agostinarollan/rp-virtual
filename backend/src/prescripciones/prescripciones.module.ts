import { Module } from '@nestjs/common';
import { PrescripcionesService } from './prescripciones.service';
import { PrescripcionesController } from './prescripciones.controller';
import { HistorialModule } from '../historial/historial.module';

@Module({
  imports: [HistorialModule],
  controllers: [PrescripcionesController],
  providers: [PrescripcionesService],
  exports: [PrescripcionesService],
})
export class PrescripcionesModule {}
