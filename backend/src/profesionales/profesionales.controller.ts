import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfesionalesService } from './profesionales.service';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

// RF-04 - Gestión de profesionales: ABM exclusivo de Administrador.
@Controller('profesionales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfesionalesController {
  constructor(private readonly profesionalesService: ProfesionalesService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  create(@Body() dto: CreateProfesionalDto) {
    return this.profesionalesService.create(dto);
  }

  // Consulta habilitada para ambos roles (el Administrador la necesita para
  // seleccionar el profesional al emitir una prescripción - RF-08).
  @Get()
  findAll() {
    return this.profesionalesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profesionalesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProfesionalDto) {
    return this.profesionalesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profesionalesService.remove(id);
  }

  // Sin @Roles: la habilitamos para ambos roles. El service decide si este
  // usuario puede tocar esta firma puntual (RB-04: el Profesional solo la suya).
  @Post(':id/firma')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  subirFirma(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.profesionalesService.subirFirma(id, file, user);
  }
}
