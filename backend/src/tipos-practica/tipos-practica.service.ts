import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoPracticaDto } from './dto/create-tipo-practica.dto';
import { UpdateTipoPracticaDto } from './dto/update-tipo-practica.dto';

// "Cirugía mayor" -> "CIRUGIA_MAYOR". El código se arma una sola vez al crear
// y después no cambia (aunque se renombre), porque el sistema lo usa para
// reconocer las prácticas de CIRUGIA / INTERNACION.
function generarCodigo(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

@Injectable()
export class TiposPracticaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTipoPracticaDto) {
    const codigo = generarCodigo(dto.nombre);
    const existente = await this.prisma.tipoPractica.findFirst({
      where: { OR: [{ nombre: dto.nombre }, { codigo }] },
    });
    if (existente) {
      throw new ConflictException('Ya existe un tipo de práctica con ese nombre.');
    }
    return this.prisma.tipoPractica.create({ data: { nombre: dto.nombre, codigo } });
  }

  findAll() {
    return this.prisma.tipoPractica.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: number) {
    const tipoPractica = await this.prisma.tipoPractica.findUnique({
      where: { idTipoPractica: id },
    });
    if (!tipoPractica) {
      throw new NotFoundException(`No se encontró el tipo de práctica con id ${id}.`);
    }
    return tipoPractica;
  }

  async update(id: number, dto: UpdateTipoPracticaDto) {
    await this.findOne(id);
    if (dto.nombre) {
      const enUso = await this.prisma.tipoPractica.findFirst({
        where: { nombre: dto.nombre, NOT: { idTipoPractica: id } },
      });
      if (enUso) {
        throw new ConflictException('Ya existe un tipo de práctica con ese nombre.');
      }
    }
    return this.prisma.tipoPractica.update({ where: { idTipoPractica: id }, data: dto });
  }

  // RB-14: baja lógica, las prescripciones ya emitidas conservan su tipo.
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipoPractica.update({
      where: { idTipoPractica: id },
      data: { activo: false },
    });
  }
}
