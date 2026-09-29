import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

// Desde Prisma ORM 7, PrismaClient ya no trae un motor por default:
// hay que pasarle un "driver adapter". Para MySQL/MariaDB se usa
// @prisma/adapter-mariadb, que pide los datos de conexión sueltos
// (no una connection string), así que parseamos DATABASE_URL acá.
function crearAdapter(): PrismaMariaDb {
  const url = new URL(process.env.DATABASE_URL ?? '');
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: crearAdapter() });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
