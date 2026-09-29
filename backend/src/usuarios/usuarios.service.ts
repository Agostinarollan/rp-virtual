import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

// Campos seguros para devolver al cliente (nunca la contraseña).
const usuarioSeguroSelect = {
  idUsuario: true,
  nombre: true,
  apellido: true,
  nombreUsuario: true,
  rol: true,
  activo: true,
  fechaCreacion: true,
  fechaActualizacion: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto) {
    // RB-02: nombre de usuario único.
    const existente = await this.prisma.usuario.findUnique({
      where: { nombreUsuario: dto.nombreUsuario },
    });
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese nombre de usuario.');
    }

    const contrasenaHasheada = await bcrypt.hash(dto.contrasena, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        nombreUsuario: dto.nombreUsuario,
        contrasena: contrasenaHasheada,
        rol: dto.rol,
      },
      select: usuarioSeguroSelect,
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      select: usuarioSeguroSelect,
      orderBy: { idUsuario: 'desc' },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario: id },
      select: usuarioSeguroSelect,
    });
    if (!usuario) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}.`);
    }
    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    if (dto.nombreUsuario) {
      const enUso = await this.prisma.usuario.findFirst({
        where: { nombreUsuario: dto.nombreUsuario, NOT: { idUsuario: id } },
      });
      if (enUso) {
        throw new ConflictException('Ya existe un usuario con ese nombre de usuario.');
      }
    }

    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: dto,
      select: usuarioSeguroSelect,
    });
  }

  // RF-02: baja de usuario -> baja lógica (RB-14 aplica al espíritu del sistema).
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: { activo: false },
      select: usuarioSeguroSelect,
    });
  }
}
