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
import { QuirofanosService } from './quirofanos.service';
import { CreateQuirofanoDto } from './dto/create-quirofano.dto';
import { UpdateQuirofanoDto } from './dto/update-quirofano.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';

// Gestión de quirófanos: exclusivo del Administrador.
// (Los turnos se programan en PUT /prescripciones/:id/turno-quirofano.)
@Controller('quirofanos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
export class QuirofanosController {
  constructor(private readonly quirofanosService: QuirofanosService) {}

  @Post()
  create(@Body() dto: CreateQuirofanoDto) {
    return this.quirofanosService.create(dto);
  }

  @Get()
  findAll() {
    return this.quirofanosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quirofanosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuirofanoDto) {
    return this.quirofanosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.quirofanosService.remove(id);
  }
}
