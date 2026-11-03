import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { Rol } from '../common/enums/rol.enum';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

const TIPOS_IMAGEN_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];

// La extensión sale del mimetype ya validado (no del nombre que manda el cliente).
const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

@Injectable()
export class ProfesionalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
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

  // En la BD "firma" guarda la ruta del archivo en Storage; hacia afuera se
  // devuelve la URL, así el frontend la puede usar directo como src de la imagen.
  private async conUrlFirma<T extends { firma: string | null }>(profesional: T): Promise<T> {
    return { ...profesional, firma: await this.storageService.resolverUrl(profesional.firma) };
  }

  async findAll() {
    const profesionales = await this.prisma.profesional.findMany({
      where: { activo: true },
      include: { usuario: { select: { nombreUsuario: true } } },
      orderBy: { apellido: 'asc' },
    });
    return Promise.all(profesionales.map((profesional) => this.conUrlFirma(profesional)));
  }

  async findOne(id: number) {
    const profesional = await this.prisma.profesional.findUnique({
      where: { idProfesional: id },
      include: { usuario: { select: { nombreUsuario: true } } },
    });
    if (!profesional) {
      throw new NotFoundException(`No se encontró el profesional con id ${id}.`);
    }
    return this.conUrlFirma(profesional);
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

    const profesional = await this.prisma.profesional.update({
      where: { idProfesional: id },
      data: dto,
    });
    return this.conUrlFirma(profesional);
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

    const profesional = await this.prisma.profesional.findUnique({ where: { idProfesional: id } });
    if (!profesional) {
      throw new NotFoundException(`No se encontró el profesional con id ${id}.`);
    }

    // Timestamp en el nombre para no pisar la firma anterior mientras se sube
    // (y para poder invalidar caché del navegador si se reemplaza).
    const ruta = `firmas/profesional-${id}-${Date.now()}.${EXTENSION_POR_TIPO[file.mimetype]}`;
    await this.storageService.subirArchivo(ruta, file);

    const actualizado = await this.prisma.profesional.update({
      where: { idProfesional: id },
      data: { firma: ruta },
    });

    // Recién con la nueva ya guardada borramos la anterior, para no dejar
    // archivos huérfanos en el bucket (las URLs viejas guardadas completas no
    // son rutas de Storage, esas se dejan como están).
    if (profesional.firma && !profesional.firma.startsWith('http')) {
      await this.storageService.eliminarArchivo(profesional.firma);
    }

    return this.conUrlFirma(actualizado);
  }

  async obtenerFirma(id: number) {
    const profesional = await this.findOne(id);
    if (!profesional.firma) {
      throw new NotFoundException('El profesional todavía no cargó su firma.');
    }
    return { url: profesional.firma };
  }

  async remove(id: number) {
    await this.findOne(id);
    const profesional = await this.prisma.profesional.update({
      where: { idProfesional: id },
      data: { activo: false },
    });
    return this.conUrlFirma(profesional);
  }
}
