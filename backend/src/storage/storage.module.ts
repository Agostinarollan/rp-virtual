import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// @Global() igual que PrismaModule/FirebaseModule: lo usan varios módulos.
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
