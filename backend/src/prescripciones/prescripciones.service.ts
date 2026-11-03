import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { HistorialService } from '../historial/historial.service';
import { CreatePrescripcionDto } from './dto/create-prescripcion.dto';
import { UpdatePrescripcionDto } from './dto/update-prescripcion.dto';
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
};

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

    const prescripcion = await this.prisma.prescripcion.create({
      data: {
        idPaciente: dto.idPaciente,
        idProfesional,
        tipoPractica: dto.tipoPractica,
        diagnostico: dto.diagnostico,
        observaciones: dto.observaciones,
        // Estado explícito: toda prescripción nueva nace ENTREGADA.
        estado: 'ENTREGADA',
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
      },
      include: includeCompleto,
    });
    await this.historialService.registrar(AccionHistorial.CREACION, prescripcion, user);
    return this.conUrlFirma(prescripcion);
  }

  // RF-08/RF-09: el Profesional solo ve sus propias prescripciones;
  // el Administrador ve todas.
  async findAll(user: CurrentUserPayload, search?: string) {
    const prescripciones = await this.prisma.prescripcion.findMany({
      where: {
        activo: true,
        idProfesional: user.rol === Rol.PROFESIONAL ? (user.idProfesional ?? -1) : undefined,
        paciente: search
          ? {
              OR: [
                { dni: { contains: search } },
                { nombre: { contains: search } },
                { apellido: { contains: search } },
              ],
            }
          : undefined,
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

    const actualizada = await this.prisma.prescripcion.update({
      where: { idPrescripcion: prescripcion.idPrescripcion },
      data: {
        tipoPractica: dto.tipoPractica,
        diagnostico: dto.diagnostico,
        observaciones: dto.observaciones,
        estado: dto.estado,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      },
      include: includeCompleto,
    });

    // Si en la edición se pasó a ANULADA, en el historial cuenta como anulación.
    const accion =
      actualizada.estado === EstadoPrescripcion.ANULADA &&
      prescripcion.estado !== EstadoPrescripcion.ANULADA
        ? AccionHistorial.ANULACION
        : AccionHistorial.MODIFICACION;
    await this.historialService.registrar(accion, actualizada, user, prescripcion);

    return this.conUrlFirma(actualizada);
  }

  // Baja lógica (RB-14): se conserva la prescripción para trazabilidad clínica.
  async remove(id: number, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);
    const anulada = await this.prisma.prescripcion.update({
      where: { idPrescripcion: prescripcion.idPrescripcion },
      data: { activo: false, estado: 'ANULADA' },
    });
    await this.historialService.registrar(
      AccionHistorial.ANULACION,
      { ...prescripcion, estado: anulada.estado },
      user,
      prescripcion,
    );
    return anulada;
  }

  private verificarPermisoSobrePrescripcion(
    prescripcion: { idProfesional: number },
    user: CurrentUserPayload,
  ) {
    if (user.rol === Rol.PROFESIONAL && prescripcion.idProfesional !== user.idProfesional) {
      throw new ForbiddenException('No podés acceder a prescripciones de otro profesional.');
    }
  }
}
