import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { nombreUsuario: dto.nombreUsuario },
      include: { profesional: true },
    });

    // Mensaje genérico: no revelamos si falló el usuario o la contraseña (RNF-01).
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const contrasenaValida = await bcrypt.compare(dto.contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const payload = {
      sub: usuario.idUsuario,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol,
      idProfesional: usuario.profesional?.idProfesional ?? null,
      idObraSocial: usuario.idObraSocial,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol,
        idProfesional: usuario.profesional?.idProfesional ?? null,
        idObraSocial: usuario.idObraSocial,
      },
    };
  }
}
