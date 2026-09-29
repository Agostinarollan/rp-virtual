import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePacienteDto) {
    const existente = await this.prisma.paciente.findUnique({ where: { dni: dto.dni } });
    if (existente) {
      throw new ConflictException('Ya existe un paciente registrado con ese DNI.');
    }

    return this.prisma.paciente.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        dni: dto.dni,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        numeroAfiliado: dto.numeroAfiliado,
        celular: dto.celular,
        idObraSocial: dto.idObraSocial,
      },
      include: { obraSocial: true },
    });
  }

  // RF-05: listar y buscar (por DNI o nombre/apellido) en un solo endpoint.
  findAll(search?: string) {
    return this.prisma.paciente.findMany({
      where: search
        ? {
            OR: [
              { dni: { contains: search } },
              { nombre: { contains: search } },
              { apellido: { contains: search } },
            ],
          }
        : undefined,
      include: { obraSocial: true },
      orderBy: { apellido: 'asc' },
    });
  }

  async findOne(id: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { idPaciente: id },
      include: { obraSocial: true },
    });
    if (!paciente) {
      throw new NotFoundException(`No se encontró el paciente con id ${id}.`);
    }
    return paciente;
  }

  async update(id: number, dto: UpdatePacienteDto) {
    await this.findOne(id);

    if (dto.dni) {
      const enUso = await this.prisma.paciente.findFirst({
        where: { dni: dto.dni, NOT: { idPaciente: id } },
      });
      if (enUso) {
        throw new ConflictException('Ya existe un paciente registrado con ese DNI.');
      }
    }

    return this.prisma.paciente.update({
      where: { idPaciente: id },
      data: {
        ...dto,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      },
      include: { obraSocial: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.paciente.update({
      where: { idPaciente: id },
      data: { activo: false },
    });
  }
}
