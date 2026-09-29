import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Representa el payload que dejamos en req.user luego de validar el JWT.
export interface CurrentUserPayload {
  idUsuario: number;
  nombreUsuario: string;
  rol: string;
  idProfesional: number | null; // null si el usuario no tiene perfil profesional asociado
}

// Uso en un controller: @CurrentUser() user: CurrentUserPayload
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
