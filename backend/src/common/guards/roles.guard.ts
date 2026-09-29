import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Rol } from '../enums/rol.enum';

// Se aplica DESPUÉS de JwtAuthGuard (necesita req.user ya seteado).
// Si el endpoint no tiene @Roles(...), se deja pasar sin restricción de rol.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !rolesPermitidos.includes(user.rol)) {
      throw new ForbiddenException('No tenés permisos para realizar esta acción.');
    }

    return true;
  }
}
