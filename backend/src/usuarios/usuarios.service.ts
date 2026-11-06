import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Rol } from '../common/enums/rol.enum';

// Campos seguros para devolver al cliente (nunca la contraseña).
const usuarioSeguroSelect = {
  idUsuario: true,
  nombre: true,
  apellido: true,
  nombreUsuario: true,
  rol: true,
  idObraSocial: true,
  obraSocial: { select: { nombre: true } },
  activo: true,
  fechaCreacion: true,
  fechaActualizacion: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  // Un usuario OBRA_SOCIAL tiene que estar vinculado a una obra social activa;
  // los demás roles no llevan obra social. Devuelve el idObraSocial a guardar.
  private async resolverObraSocial(rol: Rol, idObraSocial?: number | null): Promise<number | null> {
    if (rol !== Rol.OBRA_SOCIAL) {
      return null;
    }
    if (!idObraSocial) {
      throw new BadRequestException('Un usuario con rol OBRA_SOCIAL debe tener una obra social asociada.');
    }
    const obraSocial = await this.prisma.obraSocial.findUnique({ where: { idObraSocial } });
    if (!obraSocial || !obraSocial.activo) {
      throw new NotFoundException(`No se encontró una obra social activa con id ${idObraSocial}.`);
    }
    return idObraSocial;
  }

  async create(dto: CreateUsuarioDto) {
    // RB-02: nombre de usuario único.
    const existente = await this.prisma.usuario.findUnique({
      where: { nombreUsuario: dto.nombreUsuario },
    });
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese nombre de usuario.');
    }

    const idObraSocial = await this.resolverObraSocial(dto.rol, dto.idObraSocial);
    const contrasenaHasheada = await bcrypt.hash(dto.contrasena, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        nombreUsuario: dto.nombreUsuario,
        contrasena: contrasenaHasheada,
        rol: dto.rol,
        idObraSocial,
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
    const usuario = await this.findOne(id);

    if (dto.nombreUsuario) {
      const enUso = await this.prisma.usuario.findFirst({
        where: { nombreUsuario: dto.nombreUsuario, NOT: { idUsuario: id } },
      });
      if (enUso) {
        throw new ConflictException('Ya existe un usuario con ese nombre de usuario.');
      }
    }

    // Se recalcula con el rol final (el nuevo o el que ya tenía).
    const idObraSocial = await this.resolverObraSocial(
      dto.rol ?? (usuario.rol as Rol),
      dto.idObraSocial ?? usuario.idObraSocial,
    );

    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: { ...dto, idObraSocial },
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
