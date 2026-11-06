import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PlantillasService } from './plantillas.service';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '../common/enums/rol.enum';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

// CRUD de ejemplo sobre Firestore. Igual que Prescripciones: ambos roles
// acceden y el service filtra/valida según user.rol (RB-04).
// El :id es el id de documento que genera Firestore (string), no un número.
@Controller('plantillas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR, Rol.PROFESIONAL)
export class PlantillasController {
  constructor(private readonly plantillasService: PlantillasService) {}

  @Post()
  create(@Body() dto: CreatePlantillaDto, @CurrentUser() user: CurrentUserPayload) {
    return this.plantillasService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.plantillasService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.plantillasService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlantillaDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.plantillasService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.plantillasService.remove(id, user);
  }
}
