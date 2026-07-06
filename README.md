# Sistema AAUD

Sistema web desarrollado para la **Autoridad de Aseo Urbano y Domiciliario (AAUD)** que permite gestionar incidencias, el inventario de equipos y los funcionarios de la institución desde una plataforma centralizada.

## Características

- Autenticación y autorización mediante JWT.
- Gestión de incidencias.
  - Crear incidencias.
  - Asignar responsables.
  - Actualizar estados.
  - Seguimiento de incidencias.

- Administración del inventario tecnológico.
- Gestión de funcionarios.
- Dashboard con indicadores y estadísticas.
- Gestión de usuarios y roles.
- Notificaciones por correo electrónico.
- API REST para la comunicación entre frontend y backend.

---

# Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/HiSoyRicky/SistemaAAUD.git
cd SistemaAAUD
```

## 2. Instalar dependencias

```bash
npm install
```

## 3. Configurar la base de datos

Crear una base de datos en PostgreSQL e importar la migración inicial ubicada en:

```text
apps/backend/prisma/migrations/20260319_init/migration.sql
```

También puede ejecutarse mediante Prisma si se encuentra configurado:

```bash
npx prisma migrate deploy
```

---

## 4. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

```env
PORT=3000

JWT_SECRET=tu_clave_secreta

FRONTEND_BASE_URL=http://localhost:5173

DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/aaud_system?schema=public"

MAIL_HOST=smtp.office365.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
```

---

## 5. Ejecutar el proyecto

Modo desarrollo:

```bash
npm run dev
```

---

# Acceso al sistema

Frontend:

```text
http://localhost:5173
```

## Credenciales de prueba

**Usuario**

```text
admin
```

**Contraseña**

```text
admin123
```

---

# Funcionalidades

### Incidencias

- Registro de incidencias.
- Asignación de responsables.
- Seguimiento del estado.
- Historial de cambios.
- Visualización detallada.

### Inventario

- Registro de equipos.
- Administración de dispositivos.
- Consulta del inventario.
- Estado y ubicación de los equipos.

### Usuarios

- Inicio de sesión seguro.
- Gestión de usuarios.
- Control de permisos y roles.

---

# Tecnologías utilizadas

## Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Axios

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JSON Web Token (JWT)
- Nodemailer

---

# Estructura del proyecto

```text
apps/
├── frontend/
│   ├── src/
│   └── public/
│
└── backend/
    ├── prisma/
    └──src/
```

---

# Scripts disponibles

```bash
npm install      # Instalar dependencias
npm run dev      # Ejecutar en modo desarrollo
npm run build    # Compilar el proyecto
npm run start    # Ejecutar en producción
```

---

# Requisitos

- Node.js 20 o superior
- PostgreSQL 15 o superior
- npm 10 o superior

---

# Autor

**Ricardo Vargas**

- GitHub: https://github.com/HiSoyRicky

---

# Licencia

Este proyecto fue desarrollado con fines académicos y para uso interno de la Autoridad de Aseo Urbano y Domiciliario (AAUD).
