import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuirofanoDto } from './dto/create-quirofano.dto';
import { UpdateQuirofanoDto } from './dto/update-quirofano.dto';

@Injectable()
export class QuirofanosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuirofanoDto) {
    const existente = await this.prisma.quirofano.findUnique({ where: { nombre: dto.nombre } });
    if (existente) {
      throw new ConflictException('Ya existe un quirófano con ese nombre.');
    }
    return this.prisma.quirofano.create({ data: dto });
  }

  findAll() {
    return this.prisma.quirofano.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: number) {
    const quirofano = await this.prisma.quirofano.findUnique({ where: { idQuirofano: id } });
    if (!quirofano) {
      throw new NotFoundException(`No se encontró el quirófano con id ${id}.`);
    }
    return quirofano;
  }

  async update(id: number, dto: UpdateQuirofanoDto) {
    await this.findOne(id);
    if (dto.nombre) {
      const enUso = await this.prisma.quirofano.findFirst({
        where: { nombre: dto.nombre, NOT: { idQuirofano: id } },
      });
      if (enUso) {
        throw new ConflictException('Ya existe un quirófano con ese nombre.');
      }
    }
    return this.prisma.quirofano.update({ where: { idQuirofano: id }, data: dto });
  }

  // RB-14: baja lógica (los turnos ya programados se conservan).
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.quirofano.update({
      where: { idQuirofano: id },
      data: { activo: false },
    });
  }
}
