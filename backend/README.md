# RP Virtual — Backend

TP Final — Programación IV. Stack alineado con la Guía 1: **NestJS + Prisma ORM 7 + MySQL**.

## 1. Instalación

```bash
npm install
cp .env.example .env
# editar .env con los datos reales de tu MySQL
```

> Nota sobre npm: desde npm 12, los scripts de instalación (`postinstall`) de paquetes como Prisma quedan bloqueados por default. No es necesario aprobarlos: el paso 2 de abajo genera el cliente a mano igual.

## 2. Generar el cliente y la base de datos

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

El seed crea:
- Usuario administrador: `admin` / `admin123`
- Obras sociales de ejemplo: Avalian, Sancor Salud, IAPOS, PAMI, OSPIL, Medifé

## 3. Levantar el servidor

```bash
npm run start:dev
```

La API queda disponible en `http://localhost:3000/api`.

## 4. Estructura de módulos

| Módulo | Ruta base | Descripción |
|---|---|---|
| auth | `/api/auth` | Login (JWT) |
| usuarios | `/api/usuarios` | ABM de usuarios (solo Administrador) |
| profesionales | `/api/profesionales` | ABM de profesionales |
| pacientes | `/api/pacientes` | ABM de pacientes |
| obras-sociales | `/api/obras-sociales` | ABM de obras sociales |
| prescripciones | `/api/prescripciones` | Emisión y gestión de prescripciones (RP) |

## 5. Notas sobre Prisma ORM 7

Esta versión (la misma que usaron en la Guía 1) cambia varias cosas respecto a versiones anteriores de Prisma:

- El generator usa `provider = "prisma-client"` (no `"prisma-client-js"`) y un `output` **obligatorio** (acá: `src/generated/prisma`). El cliente ya no se genera dentro de `node_modules`.
- La URL de conexión **ya no va en `schema.prisma`** — se configura en `prisma.config.ts`, en la raíz del proyecto.
- `PrismaClient` **exige un driver adapter**. Para MySQL/MariaDB usamos `@prisma/adapter-mariadb` (paquete `mariadb` por debajo). Por eso `PrismaService` y `prisma/seed.ts` arman el adapter a partir de `DATABASE_URL` antes de instanciar el cliente.
- El cliente generado se importa desde la ruta relativa `../generated/prisma/client`, no desde `'@prisma/client'` directamente.
- Cada vez que cambies `schema.prisma`, corré `npx prisma generate` de nuevo (no hace falta reinstalar nada).

## 6. Decisiones de diseño (según lo acordado)

- **Rol**: no es una entidad — es el `enum Rol { ADMINISTRADOR, PROFESIONAL }` dentro de `Usuario`.
- **Tipo de práctica**: no es una entidad — es el `enum TipoPractica { MEDICAMENTO, CIRUGIA, INTERNACION }` dentro de `Prescripcion`, mostrado como desplegable en el formulario.
- **Prescripción**: solo tiene dos campos de texto libre: `diagnostico` (obligatorio) y `observaciones` (opcional, ahí se anota por ejemplo la cantidad de medicamento).
- **RB-04**: si el usuario logueado tiene rol `PROFESIONAL`, el backend fuerza que la prescripción se cree/edite/consulte con su propio `idProfesional` (no puede operar sobre las de otro profesional). Si es `ADMINISTRADOR`, puede buscar y elegir cualquier profesional.
- Todas las bajas son **lógicas** (`activo: false`), para no perder trazabilidad histórica.

## 7. Firma del profesional (Firebase Storage)

La firma se sube como imagen a **Cloud Storage para Firebase**, usando el **Emulator Suite** (igual que en la Guía 1), y la URL resultante se guarda en `Profesional.firma`.

### Instalar y levantar el emulador (una sola vez)

```bash
npm install -g firebase-tools   # si no lo tenés de la Guía 1
firebase login                  # si no lo hiciste antes
```

Parado en la carpeta `backend` (donde ya está `firebase.json` y `storage.rules`):

```bash
firebase emulators:start --only storage --import=./firebase-data --export-on-exit=./firebase-data
```

- `--import=./firebase-data`: al arrancar, carga lo que haya guardado de una sesión anterior (así no perdés las firmas subidas al cerrar el emulador).
- `--export-on-exit=./firebase-data`: al cerrar el emulador (Ctrl+C), guarda el estado actual en esa carpeta.
- La UI del emulador queda en `http://localhost:4000` (ahí podés ver los archivos subidos en la pestaña Storage).
- Agregá `firebase-data/` a tu `.gitignore` si no querés versionar esos datos binarios.

El backend (`PrismaService`/`FirebaseService`) se conecta solo al emulador gracias a la variable `FIREBASE_STORAGE_EMULATOR_HOST` del `.env` — no hace falta ninguna credencial real de Firebase mientras trabajás en local.

### Cómo se sube la firma

`POST /api/profesionales/:id/firma` (multipart/form-data, campo `file`). La puede llamar:
- El **Administrador**, para cualquier profesional.
- El propio **Profesional**, solo para su propio `idProfesional` (si intenta subir la de otro, el backend responde 403).

## 8. Próximos pasos (Guía 2 / Frontend)

Con este backend levantado, el frontend (React + Vite + AntDesign + Zustand + Axios, según la Guía 1) puede consumir estos endpoints. Cuando quieran armamos ese proyecto en un chat/entrega aparte.
