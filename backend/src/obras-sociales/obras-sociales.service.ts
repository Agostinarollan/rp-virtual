import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObraSocialDto } from './dto/create-obra-social.dto';
import { UpdateObraSocialDto } from './dto/update-obra-social.dto';

@Injectable()
export class ObrasSocialesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateObraSocialDto) {
    const existente = await this.prisma.obraSocial.findUnique({ where: { nombre: dto.nombre } });
    if (existente) {
      throw new ConflictException('Ya existe una obra social con ese nombre.');
    }
    return this.prisma.obraSocial.create({ data: dto });
  }

  findAll() {
    return this.prisma.obraSocial.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: number) {
    const obraSocial = await this.prisma.obraSocial.findUnique({ where: { idObraSocial: id } });
    if (!obraSocial) {
      throw new NotFoundException(`No se encontró la obra social con id ${id}.`);
    }
    return obraSocial;
  }

  async update(id: number, dto: UpdateObraSocialDto) {
    await this.findOne(id);
    return this.prisma.obraSocial.update({ where: { idObraSocial: id }, data: dto });
  }

  // RB-14: baja lógica para conservar trazabilidad con pacientes/prescripciones.
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.obraSocial.update({
      where: { idObraSocial: id },
      data: { activo: false },
    });
  }
}
