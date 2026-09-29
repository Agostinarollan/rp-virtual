import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { Rol } from '../common/enums/rol.enum';

@Injectable()
export class ProfesionalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProfesionalDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { idUsuario: dto.idUsuario } });
    if (!usuario) {
      throw new NotFoundException(`No se encontró el usuario con id ${dto.idUsuario}.`);
    }
    // RB-01: solo un usuario con rol PROFESIONAL puede tener perfil de profesional.
    if (usuario.rol !== Rol.PROFESIONAL) {
      throw new BadRequestException('El usuario indicado no tiene rol PROFESIONAL.');
    }

    const matriculaEnUso = await this.prisma.profesional.findUnique({
      where: { matricula: dto.matricula },
    });
    if (matriculaEnUso) {
      throw new ConflictException('Ya existe un profesional con esa matrícula.');
    }

    const usuarioYaVinculado = await this.prisma.profesional.findUnique({
      where: { idUsuario: dto.idUsuario },
    });
    if (usuarioYaVinculado) {
      throw new ConflictException('Ese usuario ya tiene un perfil de profesional asociado.');
    }

    return this.prisma.profesional.create({
      data: dto,
      include: { usuario: { select: { nombreUsuario: true, rol: true } } },
    });
  }

  findAll() {
    return this.prisma.profesional.findMany({
      where: { activo: true },
      include: { usuario: { select: { nombreUsuario: true } } },
      orderBy: { apellido: 'asc' },
    });
  }

  async findOne(id: number) {
    const profesional = await this.prisma.profesional.findUnique({
      where: { idProfesional: id },
      include: { usuario: { select: { nombreUsuario: true } } },
    });
    if (!profesional) {
      throw new NotFoundException(`No se encontró el profesional con id ${id}.`);
    }
    return profesional;
  }

  async update(id: number, dto: UpdateProfesionalDto) {
    await this.findOne(id);

    if (dto.matricula) {
      const enUso = await this.prisma.profesional.findFirst({
        where: { matricula: dto.matricula, NOT: { idProfesional: id } },
      });
      if (enUso) {
        throw new ConflictException('Ya existe un profesional con esa matrícula.');
      }
    }

    return this.prisma.profesional.update({ where: { idProfesional: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.profesional.update({
      where: { idProfesional: id },
      data: { activo: false },
    });
  }
}
