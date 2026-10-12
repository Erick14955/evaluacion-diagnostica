# Actividad RT-03 — Formularios interactivos

Proyecto en **Next.js (React)** pensado para Vercel, con PostgreSQL de Supabase como base de datos. También incluye Docker para Vercel.

## ¿Por qué Next.js/Vercel?

Para una actividad de aproximadamente 30 minutos con participantes entrando desde celulares, Vercel es una opción más conveniente que un servicio que pueda suspender una instancia por inactividad. La aplicación usa API Routes del servidor y mantiene la conexión a PostgreSQL fuera del navegador.

## Funcionalidad

- Formulario de expectativas.
- Formulario de acuerdos.
- Diagnóstico inicial con 5 criterios y escala 1–5.
- El navegador guarda el UUID del participante en `localStorage`.
- Si existe el UUID, el nombre se carga automáticamente y el textbox queda deshabilitado.
- Si no existe, se solicita el nombre mediante un textbox.
- Las expectativas y acuerdos se pueden actualizar.
- Las respuestas de criterios se guardan por participante y criterio.
- Diseño responsive, especialmente para celular.
- Sin fechas de evaluación en las tablas funcionales.

## 1. Configurar la base de datos

En Supabase abre el SQL Editor y ejecuta:

`db/schema.sql`

## 2. Configurar las variables de entorno

Copia `.env.example` a `.env.local` y coloca tu conexión de PostgreSQL en `DATABASE_URL`.

**Importante:** `.env.local` está incluido en `.gitignore` y no debe subirse a GitHub.

## 3. Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## 4. Vercel

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. En Environment Variables agrega `DATABASE_URL` con tu conexión PostgreSQL.
4. Deploy.

No necesitas Docker para Vercel.

## 5. Vercel con 
El proyecto incluye `` y `.dockerignore`.

En Vercel crea un **Web Service** desde el repositorio y selecciona Docker. Agrega:

- `DATABASE_URL`

Vercel utilizará el `` y ejecutará la aplicación en el puerto definido por `PORT`.

## Estructura principal

```text
app/
  api/
    participant/
    expectativas/
    acuerdos/
    criterios/
  expectativas/
  acuerdos/
  criterios/
  components/
  page.tsx
  globals.css
db/
  schema.sql
lib/
  db.ts
  participant.ts

.env.example
```
