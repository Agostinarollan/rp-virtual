# RP Virtual — Frontend

TP Final — Programación IV. Stack: **React + Vite + TypeScript + Ant Design + Zustand + Axios**, siguiendo la Guía 1.

## Instalación

```bash
npm install
cp .env.example .env
```

`VITE_API_URL` debe apuntar a tu backend (por defecto `http://localhost:3000/api`). Con el backend levantado (`npm run start:dev` en la carpeta `backend`), corré:

```bash
npm run dev
```

Se abre en `http://localhost:5173`. Iniciá sesión con `admin` / `admin123` (el usuario que carga el seed del backend).

## Qué hay armado hasta ahora

- **Login** (`/login`) contra `POST /auth/login`, con el JWT guardado en un store de Zustand persistido en `localStorage`.
- **Layout** con navegación que cambia según el rol (`Administrador` ve más secciones que `Profesional`).
- **Listado de prescripciones** (`/prescripciones`), con buscador por paciente/DNI. El backend ya filtra solo las del profesional logueado si el rol es `PROFESIONAL` (RB-04) — el frontend no necesita repetir ese filtro.
- **Formulario de prescripción** (`/prescripciones/nueva`) — el que pediste puntualmente:
  - Si el usuario es **Profesional**, su nombre aparece autocompletado (no se puede elegir otro).
  - Si es **Administrador**, aparece un buscador de profesional (`Select` con búsqueda).
  - Buscador de paciente por DNI o nombre, que al seleccionarlo completa nombre/apellido/DNI/obra social en pantalla.
  - **Tipo de prescripción**: `<Select>` con las 3 opciones (Medicamento / Cirugía / Internación), reemplazando la entidad `Tipo_Practica`.
  - **Diagnóstico** y **Observaciones**: los dos únicos campos de texto libre, tal como se definió (ya no hay buscador de "prácticas/ítems").
- **Detalle de prescripción** (`/prescripciones/:id`), de solo lectura.

## Lo que falta (próxima entrega)

Los ABM de **Pacientes, Profesionales, Obras sociales y Usuarios** (pantallas de Administrador) todavía no están armados — el backend ya tiene todos los endpoints REST listos para consumirlos apenas los necesitemos.
