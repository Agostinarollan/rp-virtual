import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../firestore/firestore.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AccionHistorial } from '../common/enums/accion-historial.enum';

const COLECCION = 'historial_prescripciones';

// Si Firestore no responde (ej: emulador apagado) su cliente reintenta durante
// mucho tiempo: cortamos antes para no dejar colgada la request del usuario.
const TIEMPO_MAXIMO_MS = 5000;

// Datos de la prescripción que se copian en cada registro. Es una "foto" del
// momento: si después se edita la prescripción o el paciente en MySQL, el
// historial conserva cómo estaba cuando se hizo la acción.
interface PrescripcionAuditada {
  idPrescripcion: number;
  tipoPractica: { nombre: string };
  diagnostico: string;
  observaciones: string | null;
  estado: string;
  estadoAuditoria: string | null;
  observacionesAuditoria: string | null;
  fecha: Date;
  paciente: { idPaciente: number; nombre: string; apellido: string; dni: string };
  profesional: { idProfesional: number; nombre: string; apellido: string; matricula: string };
}

// Campos que se comparan para armar la lista de cambios (como texto).
function valoresAuditados(p: PrescripcionAuditada): Record<string, string | null> {
  return {
    tipoPractica: p.tipoPractica.nombre,
    diagnostico: p.diagnostico,
    observaciones: p.observaciones,
    estado: p.estado,
    fecha: p.fecha.toISOString(),
    estadoAuditoria: p.estadoAuditoria,
    observacionesAuditoria: p.observacionesAuditoria,
  };
}

// Historial (auditoría) de prescripciones, guardado en Firestore. Los registros
// solo se agregan: no hay endpoints para editarlos ni borrarlos (RB-14).
@Injectable()
export class HistorialService {
  private readonly logger = new Logger(HistorialService.name);

  constructor(private readonly firestore: FirestoreService) {}

  // "anterior" es la prescripción antes del cambio (solo en modificación/anulación).
  async registrar(
    accion: AccionHistorial,
    prescripcion: PrescripcionAuditada,
    user: CurrentUserPayload,
    anterior?: PrescripcionAuditada,
  ): Promise<void> {
    let temporizador: NodeJS.Timeout | undefined;
    try {
      const escritura = this.firestore.crear(COLECCION, {
        accion,
        fecha: new Date(),
        idPrescripcion: prescripcion.idPrescripcion,
        usuario: { idUsuario: user.idUsuario, nombreUsuario: user.nombreUsuario, rol: user.rol },
        paciente: {
          idPaciente: prescripcion.paciente.idPaciente,
          nombre: prescripcion.paciente.nombre,
          apellido: prescripcion.paciente.apellido,
          dni: prescripcion.paciente.dni,
        },
        profesional: {
          idProfesional: prescripcion.profesional.idProfesional,
          nombre: prescripcion.profesional.nombre,
          apellido: prescripcion.profesional.apellido,
          matricula: prescripcion.profesional.matricula,
        },
        tipoPractica: prescripcion.tipoPractica.nombre,
        diagnostico: prescripcion.diagnostico,
        observaciones: prescripcion.observaciones,
        estado: prescripcion.estado,
        estadoAuditoria: prescripcion.estadoAuditoria,
        observacionesAuditoria: prescripcion.observacionesAuditoria,
        fechaPrescripcion: prescripcion.fecha,
        cambios: anterior ? calcularCambios(anterior, prescripcion) : [],
      });
      const limite = new Promise<never>((_, reject) => {
        temporizador = setTimeout(
          () => reject(new Error(`Firestore no respondió en ${TIEMPO_MAXIMO_MS} ms.`)),
          TIEMPO_MAXIMO_MS,
        );
      });
      await Promise.race([escritura, limite]);
    } catch (error) {
      // La prescripción ya quedó guardada en MySQL: si Firestore falla (ej: el
      // emulador está apagado) lo dejamos logueado en vez de devolverle un error
      // al usuario por una operación que sí se hizo.
      this.logger.error(
        `No se pudo registrar en el historial la ${accion} de la prescripción ${prescripcion.idPrescripcion}.`,
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      clearTimeout(temporizador);
    }
  }

  // Más recientes primero. Se ordena acá (y no con orderBy) por el mismo
  // motivo que en Plantillas: no depender de índices de Firestore.
  async findAll() {
    const registros = await this.firestore.listar(COLECCION);
    return registros.sort(
      (a, b) => new Date(String(b.fecha)).getTime() - new Date(String(a.fecha)).getTime(),
    );
  }
}

function calcularCambios(anterior: PrescripcionAuditada, actual: PrescripcionAuditada) {
  const antes = valoresAuditados(anterior);
  const despues = valoresAuditados(actual);
  return Object.keys(antes)
    .map((campo) => ({ campo, antes: antes[campo], despues: despues[campo] }))
    .filter((cambio) => cambio.antes !== cambio.despues);
}
