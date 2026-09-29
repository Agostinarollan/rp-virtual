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
import { ObrasSocialesService } from './obras-sociales.service';
import { CreateObraSocialDto } from './dto/create-obra-social.dto';
import { UpdateObraSocialDto } from './dto/update-obra-social.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

// RF-06 - Gestión de obras sociales.
@Controller('obras-sociales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObrasSocialesController {
  constructor(private readonly obrasSocialesService: ObrasSocialesService) {}

  // Alta, modificación y baja: solo Administrador.
  @Post()
  @Roles(Rol.ADMINISTRADOR)
  create(@Body() dto: CreateObraSocialDto) {
    return this.obrasSocialesService.create(dto);
  }

  // Consulta: cualquier usuario autenticado (Administrador o Profesional).
  @Get()
  findAll() {
    return this.obrasSocialesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.obrasSocialesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateObraSocialDto) {
    return this.obrasSocialesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.obrasSocialesService.remove(id);
  }
}
