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
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

// RF-05 - Gestión de pacientes: Administrador y Profesional (ambos habilitados).
@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  create(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(dto);
  }

  // Ej: GET /pacientes?search=Rollan  (busca por DNI, nombre o apellido)
  @Get()
  findAll(@Query('search') search?: string) {
    return this.pacientesService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePacienteDto) {
    return this.pacientesService.update(id, dto);
  }

  // La baja de pacientes queda restringida a Administrador.
  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.remove(id);
  }
}
