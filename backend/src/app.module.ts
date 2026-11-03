import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProfesionalesModule } from './profesionales/profesionales.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { ObrasSocialesModule } from './obras-sociales/obras-sociales.module';
import { PrescripcionesModule } from './prescripciones/prescripciones.module';
import { FirebaseModule } from './firebase/firebase.module';
import { StorageModule } from './storage/storage.module';
import { FirestoreModule } from './firestore/firestore.module';
import { PlantillasModule } from './plantillas/plantillas.module';
import { HistorialModule } from './historial/historial.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ProfesionalesModule,
    PacientesModule,
    ObrasSocialesModule,
    PrescripcionesModule,
    FirebaseModule,
    StorageModule,
    FirestoreModule,
    PlantillasModule,
    HistorialModule,
  ],
})
export class AppModule {}
