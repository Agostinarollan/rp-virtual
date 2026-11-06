import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { HistorialService } from '../historial/historial.service';
import { CreatePrescripcionDto } from './dto/create-prescripcion.dto';
import { UpdatePrescripcionDto } from './dto/update-prescripcion.dto';
import { AuditarPrescripcionDto } from './dto/auditar-prescripcion.dto';
import { AsignarHabitacionDto } from './dto/asignar-habitacion.dto';
import { ProgramarTurnoDto } from './dto/programar-turno.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Rol } from '../common/enums/rol.enum';
import { AccionHistorial } from '../common/enums/accion-historial.enum';
import { EstadoPrescripcion } from '../common/enums/estado-prescripcion.enum';

const includeCompleto = {
  paciente: { include: { obraSocial: true } },
  profesional: {
    select: {
      idProfesional: true,
      nombre: true,
      apellido: true,
      matricula: true,
      especialidad: true,
      firma: true,
    },
  },
  tipoPractica: true,
  habitacion: true,
  turnoQuirofano: { include: { quirofano: true } },
};

// Códigos fijos de tipos_practica que usan las vistas de Habitaciones y Quirófano.
const CODIGO_CIRUGIA = 'CIRUGIA';
const CODIGOS_CON_HABITACION = ['CIRUGIA', 'INTERNACION'];

@Injectable()
export class PrescripcionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly historialService: HistorialService,
  ) {}

  // En la BD profesional.firma es la ruta en Storage; hacia afuera va la URL
  // (la usan el detalle y el PDF de la prescripción como src de la imagen).
  private async conUrlFirma<T extends { profesional: { firma: string | null } }>(
    prescripcion: T,
  ): Promise<T> {
    return {
      ...prescripcion,
      profesional: {
        ...prescripcion.profesional,
        firma: await this.storageService.resolverUrl(prescripcion.profesional.firma),
      },
    };
  }

  // RB-04: si el usuario logueado es PROFESIONAL, siempre trabaja con su
  // propio idProfesional; si es ADMINISTRADOR, puede elegir cualquiera.
  private async resolverIdProfesional(
    user: CurrentUserPayload,
    idProfesionalSolicitado?: number,
  ): Promise<number> {
    if (user.rol === Rol.PROFESIONAL) {
      if (!user.idProfesional) {
        throw new ForbiddenException('Tu usuario no tiene un perfil de profesional asociado.');
      }
      return user.idProfesional;
    }

    // ADMINISTRADOR
    if (!idProfesionalSolicitado) {
      throw new BadRequestException('Debés seleccionar un profesional para la prescripción.');
    }
    return idProfesionalSolicitado;
  }

  private async validarTipoPractica(idTipoPractica: number) {
    const tipoPractica = await this.prisma.tipoPractica.findUnique({ where: { idTipoPractica } });
    if (!tipoPractica || !tipoPractica.activo) {
      throw new NotFoundException(`No se encontró un tipo de práctica activo con id ${idTipoPractica}.`);
    }
  }

  async create(dto: CreatePrescripcionDto, user: CurrentUserPayload) {
    const idProfesional = await this.resolverIdProfesional(user, dto.idProfesional);

    const [paciente, profesional] = await Promise.all([
      this.prisma.paciente.findUnique({ where: { idPaciente: dto.idPaciente } }),
      this.prisma.profesional.findUnique({ where: { idProfesional } }),
    ]);

    if (!paciente) {
      throw new NotFoundException(`No se encontró el paciente con id ${dto.idPaciente}.`);
    }
    if (!profesional) {
      throw new NotFoundException(`No se encontró el profesional con id ${idProfesional}.`);
    }
    // Bajas lógicas: no se puede prescribir a/por alguien dado de baja.
    if (!paciente.activo) {
      throw new BadRequestException('El paciente está dado de baja.');
    }
    if (!profesional.activo) {
      throw new BadRequestException('El profesional está dado de baja.');
    }
    await this.validarTipoPractica(dto.idTipoPractica);

    const prescripcion = await this.prisma.prescripcion.create({
      data: {
        idPaciente: dto.idPaciente,
        idProfesional,
        idTipoPractica: dto.idTipoPractica,
        diagnostico: dto.diagnostico,
        observaciones: dto.observaciones,
        // Estado explícito: toda prescripción nueva nace ENTREGADA_PACIENTE.
        estado: EstadoPrescripcion.ENTREGADA_PACIENTE,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
      },
      include: includeCompleto,
    });
    await this.historialService.registrar(AccionHistorial.CREACION, prescripcion, user);
    return this.conUrlFirma(prescripcion);
  }

  // RF-08/RF-09: el Profesional solo ve sus propias prescripciones; la Obra
  // Social solo las de sus afiliados ya entregadas a la obra social; el
  // Administrador ve todas. "tipos" filtra por código de tipo de práctica
  // (lo usan las vistas de Habitaciones y Turnero de Quirófano).
  async findAll(user: CurrentUserPayload, search?: string, tipos?: string[]) {
    const esObraSocial = user.rol === Rol.OBRA_SOCIAL;
    const filtroPaciente = {
      ...(search
        ? {
            OR: [
              { dni: { contains: search } },
              { nombre: { contains: search } },
              { apellido: { contains: search } },
            ],
          }
        : {}),
      ...(esObraSocial ? { idObraSocial: user.idObraSocial ?? -1 } : {}),
    };

    const prescripciones = await this.prisma.prescripcion.findMany({
      where: {
        activo: true,
        idProfesional: user.rol === Rol.PROFESIONAL ? (user.idProfesional ?? -1) : undefined,
        estado: esObraSocial ? EstadoPrescripcion.ENTREGADA_OBRA_SOCIAL : undefined,
        tipoPractica: tipos?.length ? { codigo: { in: tipos } } : undefined,
        paciente: Object.keys(filtroPaciente).length ? filtroPaciente : undefined,
      },
      include: includeCompleto,
      orderBy: { fecha: 'desc' },
    });
    return Promise.all(prescripciones.map((prescripcion) => this.conUrlFirma(prescripcion)));
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const prescripcion = await this.prisma.prescripcion.findUnique({
      where: { idPrescripcion: id },
      include: includeCompleto,
    });
    if (!prescripcion) {
      throw new NotFoundException(`No se encontró la prescripción con id ${id}.`);
    }
    this.verificarPermisoSobrePrescripcion(prescripcion, user);
    return this.conUrlFirma(prescripcion);
  }

  async update(id: number, dto: UpdatePrescripcionDto, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);
    if (dto.idTipoPractica) {
      await this.validarTipoPractica(dto.idTipoPractica);
    }

    const actualizada = await this.prisma.prescripcion.update({
      where: { idPrescripcion: prescripcion.idPrescripcion },
      data: {
        idTipoPractica: dto.idTipoPractica,
        diagnostico: dto.diagnostico,
        observaciones: dto.observaciones,
        estado: dto.estado,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      },
      include: includeCompleto,
    });

    // Si en la edición se pasó a ANULADA, en el historial cuenta como anulación.
    const seAnulo =
      actualizada.estado === EstadoPrescripcion.ANULADA &&
      prescripcion.estado !== EstadoPrescripcion.ANULADA;
    if (seAnulo) {
      await this.liberarTurnoQuirofano(id);
    }
    await this.historialService.registrar(
      seAnulo ? AccionHistorial.ANULACION : AccionHistorial.MODIFICACION,
      actualizada,
      user,
      prescripcion,
    );

    return this.findOne(id, user);
  }

  // Baja lógica (RB-14): se conserva la prescripción para trazabilidad clínica.
  async remove(id: number, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);
    const anulada = await this.prisma.prescripcion.update({
      where: { idPrescripcion: prescripcion.idPrescripcion },
      data: { activo: false, estado: EstadoPrescripcion.ANULADA },
    });
    await this.liberarTurnoQuirofano(id);
    await this.historialService.registrar(
      AccionHistorial.ANULACION,
      { ...prescripcion, estado: anulada.estado },
      user,
      prescripcion,
    );
    return anulada;
  }

  // Auditoría de la Obra Social: Aprobada / Rechazada / En Auditoría + observaciones.
  // findOne ya garantiza que sea de un afiliado suyo y esté entregada a la obra social.
  async auditar(id: number, dto: AuditarPrescripcionDto, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);

    const auditada = await this.prisma.prescripcion.update({
      where: { idPrescripcion: id },
      data: {
        estadoAuditoria: dto.estadoAuditoria,
        observacionesAuditoria: dto.observacionesAuditoria?.trim() || null,
        fechaAuditoria: new Date(),
      },
      include: includeCompleto,
    });
    await this.historialService.registrar(AccionHistorial.AUDITORIA, auditada, user, prescripcion);
    return this.conUrlFirma(auditada);
  }

  // Habitaciones: solo prescripciones de internación o cirugía.
  async asignarHabitacion(id: number, dto: AsignarHabitacionDto, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);
    if (!CODIGOS_CON_HABITACION.includes(prescripcion.tipoPractica.codigo)) {
      throw new BadRequestException(
        'Solo se puede asignar habitación a prescripciones de internación o cirugía.',
      );
    }
    if (prescripcion.estado === EstadoPrescripcion.ANULADA) {
      throw new BadRequestException('La prescripción está anulada.');
    }

    const idHabitacion = dto.idHabitacion ?? null;
    if (idHabitacion) {
      const habitacion = await this.prisma.habitacion.findUnique({ where: { idHabitacion } });
      if (!habitacion || !habitacion.activo) {
        throw new NotFoundException(`No se encontró una habitación activa con id ${idHabitacion}.`);
      }
    }

    await this.prisma.prescripcion.update({ where: { idPrescripcion: id }, data: { idHabitacion } });
    return this.findOne(id, user);
  }

  // Turnero de quirófano: solo prescripciones de cirugía. Un turno por
  // prescripción (si ya tenía, se reprograma) y un quirófano no puede tener
  // dos turnos a la misma fecha y hora.
  async programarTurno(id: number, dto: ProgramarTurnoDto, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);
    if (prescripcion.tipoPractica.codigo !== CODIGO_CIRUGIA) {
      throw new BadRequestException('Solo se pueden programar turnos para prescripciones de cirugía.');
    }
    if (prescripcion.estado === EstadoPrescripcion.ANULADA) {
      throw new BadRequestException('La prescripción está anulada.');
    }

    const fechaHora = new Date(dto.fechaHora);
    if (fechaHora.getMinutes() !== 0 || fechaHora.getSeconds() !== 0) {
      throw new BadRequestException('Los turnos de quirófano son por hora exacta (ej: 10:00).');
    }
    if (fechaHora <= new Date()) {
      throw new BadRequestException('El turno tiene que ser en una fecha y hora futura.');
    }

    const quirofano = await this.prisma.quirofano.findUnique({
      where: { idQuirofano: dto.idQuirofano },
    });
    if (!quirofano || !quirofano.activo) {
      throw new NotFoundException(`No se encontró un quirófano activo con id ${dto.idQuirofano}.`);
    }

    const ocupado = await this.prisma.turnoQuirofano.findFirst({
      where: { idQuirofano: dto.idQuirofano, fechaHora, NOT: { idPrescripcion: id } },
    });
    if (ocupado) {
      throw new ConflictException(
        `El ${quirofano.nombre} ya tiene un turno programado para esa fecha y hora.`,
      );
    }

    await this.prisma.turnoQuirofano.upsert({
      where: { idPrescripcion: id },
      create: { idPrescripcion: id, idQuirofano: dto.idQuirofano, fechaHora },
      update: { idQuirofano: dto.idQuirofano, fechaHora },
    });
    return this.findOne(id, user);
  }

  async cancelarTurno(id: number, user: CurrentUserPayload) {
    await this.findOne(id, user);
    await this.liberarTurnoQuirofano(id);
    return this.findOne(id, user);
  }

  // Al anular una prescripción se libera su turno, para no bloquear el quirófano.
  private async liberarTurnoQuirofano(idPrescripcion: number) {
    await this.prisma.turnoQuirofano.deleteMany({ where: { idPrescripcion } });
  }

  private verificarPermisoSobrePrescripcion(
    prescripcion: {
      idProfesional: number;
      estado: string;
      paciente: { idObraSocial: number | null };
    },
    user: CurrentUserPayload,
  ) {
    if (user.rol === Rol.PROFESIONAL && prescripcion.idProfesional !== user.idProfesional) {
      throw new ForbiddenException('No podés acceder a prescripciones de otro profesional.');
    }
    if (
      user.rol === Rol.OBRA_SOCIAL &&
      (prescripcion.paciente.idObraSocial !== user.idObraSocial ||
        prescripcion.estado !== EstadoPrescripcion.ENTREGADA_OBRA_SOCIAL)
    ) {
      throw new ForbiddenException('No podés acceder a esta prescripción.');
    }
  }
}
