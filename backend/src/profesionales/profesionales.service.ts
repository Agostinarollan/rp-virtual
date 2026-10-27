import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { Rol } from '../common/enums/rol.enum';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

const TIPOS_IMAGEN_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];

@Injectable()
export class ProfesionalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

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

  // RB-04 (mismo criterio que en Prescripciones): el Profesional solo puede
  // subir SU PROPIA firma; el Administrador puede subir la de cualquiera.
  async subirFirma(id: number, file: Express.Multer.File | undefined, user: CurrentUserPayload) {
    if (!file) {
      throw new BadRequestException('Falta el archivo de la firma.');
    }
    if (!TIPOS_IMAGEN_PERMITIDOS.includes(file.mimetype)) {
      throw new BadRequestException('La firma debe ser una imagen (PNG, JPG o WEBP).');
    }
    if (user.rol === Rol.PROFESIONAL && user.idProfesional !== id) {
      throw new ForbiddenException('Solo podés subir tu propia firma.');
    }

    await this.findOne(id); // valida que el profesional exista

    const url = await this.firebaseService.subirFirma(id, file);

    return this.prisma.profesional.update({
      where: { idProfesional: id },
      data: { firma: url },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.profesional.update({
      where: { idProfesional: id },
      data: { activo: false },
    });
  }
}
