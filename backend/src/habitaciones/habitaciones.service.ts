import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';

@Injectable()
export class HabitacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHabitacionDto) {
    const existente = await this.prisma.habitacion.findUnique({ where: { numero: dto.numero } });
    if (existente) {
      throw new ConflictException('Ya existe una habitación con ese número.');
    }
    return this.prisma.habitacion.create({ data: dto });
  }

  findAll() {
    return this.prisma.habitacion.findMany({ orderBy: { numero: 'asc' } });
  }

  async findOne(id: number) {
    const habitacion = await this.prisma.habitacion.findUnique({ where: { idHabitacion: id } });
    if (!habitacion) {
      throw new NotFoundException(`No se encontró la habitación con id ${id}.`);
    }
    return habitacion;
  }

  async update(id: number, dto: UpdateHabitacionDto) {
    await this.findOne(id);
    if (dto.numero) {
      const enUso = await this.prisma.habitacion.findFirst({
        where: { numero: dto.numero, NOT: { idHabitacion: id } },
      });
      if (enUso) {
        throw new ConflictException('Ya existe una habitación con ese número.');
      }
    }
    return this.prisma.habitacion.update({ where: { idHabitacion: id }, data: dto });
  }

  // RB-14: baja lógica (las prescripciones que ya la tenían asignada la conservan).
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.habitacion.update({
      where: { idHabitacion: id },
      data: { activo: false },
    });
  }
}
