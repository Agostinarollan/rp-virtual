import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly app: admin.app.App;

  constructor() {
    // Si ya hay una app inicializada (hot-reload en watch mode), la reutilizamos
    // en vez de llamar initializeApp() de nuevo (tira error si se llama 2 veces).
    this.app = admin.apps.length
      ? (admin.apps[0] as admin.app.App)
      : admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID ?? 'rp-virtual',
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? 'rp-virtual.appspot.com',
        });
    // Nota: cuando FIREBASE_STORAGE_EMULATOR_HOST está seteado en el .env,
    // el SDK de Admin redirige solo (sin hacer nada más acá) todas las
    // llamadas de Storage hacia el emulador en vez de a Firebase real.
  }

  // Sube la imagen de la firma de un profesional y devuelve la URL pública
  // (del emulador en desarrollo, o una signed URL de larga duración en prod).
  async subirFirma(idProfesional: number, file: Express.Multer.File): Promise<string> {
    const bucket = this.app.storage().bucket();
    const extension = file.originalname.split('.').pop() ?? 'png';
    // Timestamp en el nombre para no pisar la firma anterior mientras se sube
    // (y para poder invalidar caché del navegador si se reemplaza).
    const ruta = `firmas/profesional-${idProfesional}-${Date.now()}.${extension}`;
    const archivo = bucket.file(ruta);

    await archivo.save(file.buffer, {
      contentType: file.mimetype,
    });

    const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    if (emulatorHost) {
      // Formato de URL que entiende el emulador de Storage para servir el archivo.
      return `http://${emulatorHost}/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media`;
    }

    // Fuera del emulador (Storage real): signed URL de lectura, larga duración.
    const [url] = await archivo.getSignedUrl({ action: 'read', expires: '03-01-2030' });
    return url;
  }
}
