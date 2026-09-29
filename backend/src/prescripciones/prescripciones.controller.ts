import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrescripcionesService } from './prescripciones.service';
import { CreatePrescripcionDto } from './dto/create-prescripcion.dto';
import { UpdatePrescripcionDto } from './dto/update-prescripcion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

// RF-08/RF-09 - Emisión y gestión de prescripciones (RP).
// No lleva @Roles() a nivel de clase: Administrador y Profesional acceden
// ambos, pero el service filtra/valida según user.rol (RB-04).
@Controller('prescripciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescripcionesController {
  constructor(private readonly prescripcionesService: PrescripcionesService) {}

  @Post()
  create(@Body() dto: CreatePrescripcionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.prescripcionesService.create(dto, user);
  }

  // Ej: GET /prescripciones?search=Rollan (busca por paciente: DNI, nombre o apellido)
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload, @Query('search') search?: string) {
    return this.prescripcionesService.findAll(user, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.prescripcionesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrescripcionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.prescripcionesService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.prescripcionesService.remove(id, user);
  }
}
