# Sistema AAUD

# Descripción

Sistema web para la gestión de incidencias, inventario y de funcionarios de la AAUD.
Permite la autenticación de usuarios, la creación, seguimiento y visualización de incidencias.

# Instalación

1.  Clonar el repositorio
    - git clone https://github.com/HiSoyRicky/SistemaAAUD.git

2.  Instalar dependencias
    - npm install

3.  Configurar la base de datos
    - Importar el script SQL ubicado en:
      - apps/backend/prisma/migrations/20260319_init/migration.sql

4.  Variables de entorno
    Crear un archivo .env en la raíz del proyecto con la siguiente estructura (ejemplo):

        - PORT=3000
        - JWT_SECRET=ce0c6e4b0d7f4a99a66b3ed9f2f3b1b8c1a4f774b9b8b7c3e8f1d2a9c4e7f0a
        - FRONTEND_BASE_URL=http://localhost:5173
        - DATABASE_URL="postgresql://postgres:123456789@localhost:5432/aaud_system?schema=public"
        - MAIL_HOST=smtp.office365.com
        - MAIL_PORT=587
        - MAIL_USER=
        - MAIL_PASS=

5.  Arrancar
    - npm run dev

# Uso

Acceder al frontend en:

👉 http://localhost:5173

    Iniciar sesión con credenciales de prueba:
    - Usuario: admin
    - Contraseña: admin123

Crear, editar y visualizar incidencias en el dashboard, administrar los dispositivos del inventario y los funcionarios de la institución.

# Tecnologías

## Frontend

    -React
    -Vite
    -Tailwind CSS
    -React Router

## Backend

    -Express
    -PostgreSQL

# Autor

Desarrollado por Ricardo Vargas (Ricky)
