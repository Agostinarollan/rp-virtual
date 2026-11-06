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

  // Tipos de práctica (la migración ya los crea; el upsert no duplica).
  const tiposPractica = [
    { codigo: 'MEDICAMENTO', nombre: 'Medicamento' },
    { codigo: 'CIRUGIA', nombre: 'Cirugía' },
    { codigo: 'INTERNACION', nombre: 'Internación' },
  ];
  for (const tipo of tiposPractica) {
    await prisma.tipoPractica.upsert({ where: { codigo: tipo.codigo }, update: {}, create: tipo });
  }
  console.log('Tipos de práctica cargados:', tiposPractica.map((t) => t.nombre).join(', '));

  // Habitaciones y quirófanos de ejemplo
  const habitaciones = [
    { numero: '101', piso: '1' },
    { numero: '102', piso: '1' },
    { numero: '201', piso: '2' },
    { numero: '202', piso: '2' },
  ];
  for (const habitacion of habitaciones) {
    await prisma.habitacion.upsert({ where: { numero: habitacion.numero }, update: {}, create: habitacion });
  }
  console.log('Habitaciones cargadas:', habitaciones.map((h) => h.numero).join(', '));

  const quirofanos = ['Quirófano 1', 'Quirófano 2', 'Quirófano 3'];
  for (const nombre of quirofanos) {
    await prisma.quirofano.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  console.log('Quirófanos cargados:', quirofanos.join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
