import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Delega en la estrategia 'jwt' registrada en JwtStrategy.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
