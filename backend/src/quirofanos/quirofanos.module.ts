import { Module } from '@nestjs/common';
import { QuirofanosService } from './quirofanos.service';
import { QuirofanosController } from './quirofanos.controller';

@Module({
  controllers: [QuirofanosController],
  providers: [QuirofanosService],
  exports: [QuirofanosService],
})
export class QuirofanosModule {}
