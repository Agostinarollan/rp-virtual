import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TiposPracticaService } from './tipos-practica.service';
import { CreateTipoPracticaDto } from './dto/create-tipo-practica.dto';
import { UpdateTipoPracticaDto } from './dto/update-tipo-practica.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

// Gestión de tipos de práctica (antes era un enum; pedido del docente).
@Controller('tipos-practica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TiposPracticaController {
  constructor(private readonly tiposPracticaService: TiposPracticaService) {}

  // Alta, modificación y baja: solo Administrador.
  @Post()
  @Roles(Rol.ADMINISTRADOR)
  create(@Body() dto: CreateTipoPracticaDto) {
    return this.tiposPracticaService.create(dto);
  }

  // Consulta: cualquier usuario autenticado (se usa en el formulario de prescripción).
  @Get()
  findAll() {
    return this.tiposPracticaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tiposPracticaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTipoPracticaDto) {
    return this.tiposPracticaService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposPracticaService.remove(id);
  }
}
