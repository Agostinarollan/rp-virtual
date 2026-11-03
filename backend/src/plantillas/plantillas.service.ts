import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirestoreService } from '../firestore/firestore.service';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Rol } from '../common/enums/rol.enum';

const COLECCION = 'plantillas';

@Injectable()
export class PlantillasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firestore: FirestoreService,
  ) {}

  // RB-04: si el usuario logueado es PROFESIONAL, siempre trabaja con su
  // propio idProfesional; si es ADMINISTRADOR, puede elegir cualquiera.
  private resolverIdProfesional(user: CurrentUserPayload, idProfesionalSolicitado?: number): number {
    if (user.rol === Rol.PROFESIONAL) {
      if (!user.idProfesional) {
        throw new ForbiddenException('Tu usuario no tiene un perfil de profesional asociado.');
      }
      return user.idProfesional;
    }

    // ADMINISTRADOR
    if (!idProfesionalSolicitado) {
      throw new BadRequestException('Debés seleccionar un profesional para la plantilla.');
    }
    return idProfesionalSolicitado;
  }

  async create(dto: CreatePlantillaDto, user: CurrentUserPayload) {
    const idProfesional = this.resolverIdProfesional(user, dto.idProfesional);

    // El profesional vive en MySQL: validamos que exista antes de guardar en Firestore.
    const profesional = await this.prisma.profesional.findUnique({ where: { idProfesional } });
    if (!profesional) {
      throw new NotFoundException(`No se encontró el profesional con id ${idProfesional}.`);
    }

    const ahora = new Date();
    return this.firestore.crear(COLECCION, {
      idProfesional,
      nombre: dto.nombre,
      tipoPractica: dto.tipoPractica,
      diagnostico: dto.diagnostico,
      observaciones: dto.observaciones,
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
    });
  }

  // El Profesional solo ve sus propias plantillas; el Administrador ve todas.
  async findAll(user: CurrentUserPayload) {
    const plantillas = await this.firestore.listar(
      COLECCION,
      user.rol === Rol.PROFESIONAL
        ? { campo: 'idProfesional', valor: user.idProfesional ?? -1 }
        : undefined,
    );
    // Se ordena acá (y no con orderBy en la query) para no necesitar un
    // índice compuesto de Firestore (where + orderBy) en producción.
    return plantillas.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const plantilla = await this.firestore.obtener(COLECCION, id);
    if (!plantilla) {
      throw new NotFoundException(`No se encontró la plantilla con id ${id}.`);
    }
    if (user.rol === Rol.PROFESIONAL && plantilla.idProfesional !== user.idProfesional) {
      throw new ForbiddenException('No podés acceder a plantillas de otro profesional.');
    }
    return plantilla;
  }

  async update(id: string, dto: UpdatePlantillaDto, user: CurrentUserPayload) {
    await this.findOne(id, user);
    await this.firestore.actualizar(COLECCION, id, {
      nombre: dto.nombre,
      tipoPractica: dto.tipoPractica,
      diagnostico: dto.diagnostico,
      observaciones: dto.observaciones,
      fechaActualizacion: new Date(),
    });
    return this.findOne(id, user);
  }

  // A diferencia de las entidades de MySQL, acá la baja es física: una
  // plantilla no tiene valor clínico ni de trazabilidad.
  async remove(id: string, user: CurrentUserPayload) {
    const plantilla = await this.findOne(id, user);
    await this.firestore.eliminar(COLECCION, id);
    return plantilla;
  }
}
