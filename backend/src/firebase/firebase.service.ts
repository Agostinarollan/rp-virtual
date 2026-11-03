import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

// Único lugar donde se inicializa firebase-admin. StorageService y
// FirestoreService reutilizan esta misma app (no inicializan la suya).
@Injectable()
export class FirebaseService {
  readonly app: admin.app.App;

  constructor() {
    // Si ya hay una app inicializada (hot-reload en watch mode), la reutilizamos
    // en vez de llamar initializeApp() de nuevo (tira error si se llama 2 veces).
    this.app = admin.apps.length
      ? (admin.apps[0] as admin.app.App)
      : admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-rp-virtual',
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? 'demo-rp-virtual.appspot.com',
        });
    // Nota: cuando FIREBASE_STORAGE_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST
    // están seteadas en el .env, el SDK de Admin redirige solo (sin hacer nada
    // más acá) las llamadas hacia los emuladores. En producción, sin esas
    // variables, toma las credenciales de GOOGLE_APPLICATION_CREDENTIALS.
  }
}
