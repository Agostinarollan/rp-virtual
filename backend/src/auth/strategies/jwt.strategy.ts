import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

// Este payload es el que firmamos en AuthService.login()
interface JwtPayload {
  sub: number; // idUsuario
  nombreUsuario: string;
  rol: string;
  idProfesional: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'secreto-dev',
    });
  }

  // El valor de retorno se inyecta automáticamente en request.user
  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    return {
      idUsuario: payload.sub,
      nombreUsuario: payload.nombreUsuario,
      rol: payload.rol,
      idProfesional: payload.idProfesional,
    };
  }
}
