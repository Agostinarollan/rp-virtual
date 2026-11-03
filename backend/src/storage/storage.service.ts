import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FirebaseService } from '../firebase/firebase.service';

// Cloud Storage para Firebase. En desarrollo apunta al emulador
// (FIREBASE_STORAGE_EMULATOR_HOST) y en producción a Firebase real.
// En la base de datos se guarda solo la RUTA del archivo (ej:
// "firmas/profesional-1-123.png"); la URL se arma cada vez que se pide, así
// no queda atada al host/puerto del emulador.
@Injectable()
export class StorageService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private get bucket() {
    return this.firebaseService.app.storage().bucket();
  }

  async subirArchivo(ruta: string, file: Express.Multer.File): Promise<void> {
    await this.bucket.file(ruta).save(file.buffer, {
      contentType: file.mimetype,
      // "Download token": es lo que usan las URLs de Firebase Storage para
      // permitir la lectura sin pasar por storage.rules. Funciona igual en el
      // emulador y en producción (no hace falta una cuenta de servicio para firmar URLs).
      metadata: { metadata: { firebaseStorageDownloadTokens: randomUUID() } },
    });
  }

  async obtenerUrl(ruta: string): Promise<string> {
    const [metadata] = await this.bucket.file(ruta).getMetadata();
    const token = String(metadata.metadata?.firebaseStorageDownloadTokens ?? '').split(',')[0];

    const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    const base = emulatorHost ? `http://${emulatorHost}` : 'https://firebasestorage.googleapis.com';
    return `${base}/v0/b/${this.bucket.name}/o/${encodeURIComponent(ruta)}?alt=media&token=${token}`;
  }

  // Para devolver en las respuestas de la API: convierte la ruta guardada en la
  // BD en una URL. Si el archivo ya no existe (ej: se borraron los datos del
  // emulador) devuelve null en vez de romper todo el listado.
  async resolverUrl(ruta: string | null): Promise<string | null> {
    if (!ruta) {
      return null;
    }
    // Registros viejos que guardaban la URL completa: se devuelven tal cual.
    if (ruta.startsWith('http')) {
      return ruta;
    }
    try {
      return await this.obtenerUrl(ruta);
    } catch {
      return null;
    }
  }

  async eliminarArchivo(ruta: string): Promise<void> {
    await this.bucket.file(ruta).delete({ ignoreNotFound: true });
  }
}
