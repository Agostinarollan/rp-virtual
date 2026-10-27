import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescripcionDto } from './dto/create-prescripcion.dto';
import { UpdatePrescripcionDto } from './dto/update-prescripcion.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Rol } from '../common/enums/rol.enum';

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
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.prescripcion.create({
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
  }

  // RF-08/RF-09: el Profesional solo ve sus propias prescripciones;
  // el Administrador ve todas.
  findAll(user: CurrentUserPayload, search?: string) {
    return this.prisma.prescripcion.findMany({
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
    return prescripcion;
  }

  async update(id: number, dto: UpdatePrescripcionDto, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);

    return this.prisma.prescripcion.update({
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
  }

  // Baja lógica (RB-14): se conserva la prescripción para trazabilidad clínica.
  async remove(id: number, user: CurrentUserPayload) {
    const prescripcion = await this.findOne(id, user);
    return this.prisma.prescripcion.update({
      where: { idPrescripcion: prescripcion.idPrescripcion },
      data: { activo: false, estado: 'ANULADA' },
    });
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
