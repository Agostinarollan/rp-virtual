import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';

// Documento leído de Firestore: sus campos + el id generado por Firestore.
export type DocumentoFirestore = { id: string } & Record<string, unknown>;

// Operaciones CRUD genéricas sobre una colección de Firestore. Reutiliza la
// app de firebase-admin de FirebaseService; en desarrollo va al emulador
// gracias a FIRESTORE_EMULATOR_HOST.
@Injectable()
export class FirestoreService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private coleccion(nombre: string) {
    return this.firebaseService.app.firestore().collection(nombre);
  }

  async crear(coleccion: string, datos: Record<string, unknown>): Promise<DocumentoFirestore> {
    const ref = await this.coleccion(coleccion).add(sinUndefined(datos));
    return { id: ref.id, ...datos };
  }

  // Si se pasa un filtro, trae solo los documentos con campo == valor.
  async listar(
    coleccion: string,
    filtro?: { campo: string; valor: unknown },
  ): Promise<DocumentoFirestore[]> {
    const query = filtro
      ? this.coleccion(coleccion).where(filtro.campo, '==', filtro.valor)
      : this.coleccion(coleccion);
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => aDocumento(doc.id, doc.data()));
  }

  async obtener(coleccion: string, id: string): Promise<DocumentoFirestore | null> {
    const doc = await this.coleccion(coleccion).doc(id).get();
    return doc.exists ? aDocumento(doc.id, doc.data() ?? {}) : null;
  }

  async actualizar(coleccion: string, id: string, datos: Record<string, unknown>): Promise<void> {
    await this.coleccion(coleccion).doc(id).update(sinUndefined(datos));
  }

  async eliminar(coleccion: string, id: string): Promise<void> {
    await this.coleccion(coleccion).doc(id).delete();
  }
}

// Firestore rechaza campos con valor undefined (ej: opcionales de un DTO que no vinieron).
function sinUndefined(datos: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(datos).filter(([, valor]) => valor !== undefined));
}

// Firestore devuelve las fechas como Timestamp: las pasamos a Date para que
// la API las serialice como string ISO (igual que las fechas de Prisma).
function aDocumento(id: string, datos: admin.firestore.DocumentData): DocumentoFirestore {
  const campos = Object.fromEntries(
    Object.entries(datos).map(([campo, valor]) => [
      campo,
      valor instanceof admin.firestore.Timestamp ? valor.toDate() : valor,
    ]),
  );
  return { id, ...campos };
}
