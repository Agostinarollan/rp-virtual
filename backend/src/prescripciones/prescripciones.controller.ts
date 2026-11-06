import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrescripcionesService } from './prescripciones.service';
import { CreatePrescripcionDto } from './dto/create-prescripcion.dto';
import { UpdatePrescripcionDto } from './dto/update-prescripcion.dto';
import { AuditarPrescripcionDto } from './dto/auditar-prescripcion.dto';
import { AsignarHabitacionDto } from './dto/asignar-habitacion.dto';
import { ProgramarTurnoDto } from './dto/programar-turno.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

// RF-08/RF-09 - Emisión y gestión de prescripciones (RP).
// Consulta: los 3 roles (el service filtra según user.rol - RB-04 / obra social).
// Alta, edición y baja: Administrador y Profesional (la Obra Social solo audita).
@Controller('prescripciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescripcionesController {
  constructor(private readonly prescripcionesService: PrescripcionesService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.PROFESIONAL)
  create(@Body() dto: CreatePrescripcionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.prescripcionesService.create(dto, user);
  }

  // Ej: GET /prescripciones?search=Rollan (busca por paciente: DNI, nombre o apellido)
  //     GET /prescripciones?tipos=CIRUGIA,INTERNACION (filtra por código de tipo de práctica)
  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('tipos') tipos?: string,
  ) {
    return this.prescripcionesService.findAll(user, search, tipos?.split(',').filter(Boolean));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.prescripcionesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.PROFESIONAL)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrescripcionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.prescripcionesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.PROFESIONAL)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.prescripcionesService.remove(id, user);
  }

  // Auditoría: solo la Obra Social (Aprobada / Rechazada / En Auditoría + observaciones).
  @Patch(':id/auditoria')
  @Roles(Rol.OBRA_SOCIAL)
  auditar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AuditarPrescripcionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.prescripcionesService.auditar(id, dto, user);
  }

  // Vista Habitaciones (solo Administrador).
  @Patch(':id/habitacion')
  @Roles(Rol.ADMINISTRADOR)
  asignarHabitacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarHabitacionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.prescripcionesService.asignarHabitacion(id, dto, user);
  }

  // Turnero de Quirófano (solo Administrador).
  @Put(':id/turno-quirofano')
  @Roles(Rol.ADMINISTRADOR)
  programarTurno(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProgramarTurnoDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.prescripcionesService.programarTurno(id, dto, user);
  }

  @Delete(':id/turno-quirofano')
  @Roles(Rol.ADMINISTRADOR)
  cancelarTurno(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.prescripcionesService.cancelarTurno(id, user);
  }
}
