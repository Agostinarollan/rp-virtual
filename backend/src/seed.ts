import 'dotenv/config';
import { PrismaClient, Rol } from './generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';

const url = new URL(process.env.DATABASE_URL ?? '');
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Usuario administrador inicial
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { nombreUsuario: 'admin' },
    update: {},
    create: {
      nombre: 'Admin',
      apellido: 'Sistema',
      nombreUsuario: 'admin',
      contrasena: passwordHash,
      rol: Rol.ADMINISTRADOR,
    },
  });

  console.log('Usuario administrador creado:', admin.nombreUsuario);

  // Obras sociales de ejemplo (seed)
  const obrasSociales = ['Avalian', 'Sancor Salud', 'IAPOS', 'PAMI', 'OSPIL', 'Medifé'];

  for (const nombre of obrasSociales) {
    await prisma.obraSocial.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log('Obras sociales cargadas:', obrasSociales.join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
