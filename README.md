Sistema de Incidencias AAUD

Descripción

Sistema web para la gestión de incidencias con autenticación, creación y visualización de incidencias, utilizando React, Express y SQL Server.

Instalación

Clonar el repositorio.

Instalar dependencias: npm install.

Configurar la base de datos ejecutando el script server/Soporte AAUD.sql en SQL Server.

Crear un archivo .env con las variables de entorno (ver .env de ejemplo).

Iniciar el backend: npm run server.

Iniciar el frontend: npm run dev.

Uso

Acceder a http://localhost:5173 para el frontend.

Iniciar sesión con las credenciales de ejemplo (admin/admin123).

Crear y visualizar incidencias en el dashboard.

Tecnologías

Frontend: React, Vite, Tailwind CSS, React Router

Backend: Express, SQL Server

Dependencias: axios, mssql, cors, dotenv
