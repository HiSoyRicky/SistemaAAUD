📌 Sistema AAUD

📖 Descripción

Sistema web para la gestión de incidencias, inventario y de funcionarios de la AAUD.
Permite la autenticación de usuarios, la creación, seguimiento y visualización de incidencias.

El sistema está desarrollado en React (frontend) y Express con SQL Server (backend).


⚙️ Instalación

    1. Clonar el repositorio

git clone https://github.com/HiSoyRicky/SistemaAAUD.git

cd SistemaAAUD

    2. Instalar dependencias

npm install

    3. Configurar la base de datos

Importar el script SQL ubicado en:

server/Soporte AAUD.sql


en SQL Server para crear las tablas necesarias.

    4. Variables de entorno

Crear un archivo .env en la raíz del proyecto con la siguiente estructura (ejemplo):

PORT=3000

SQL_USER=tu_usuario_sql

SQL_PASSWORD=tu_password_sql

SQL_DATABASE=Soporte_AAUD

SQL_SERVER=localhost


(Ajustar según tu configuración de SQL Server)

    5. Iniciar el backend

npm run server

    6. Iniciar el frontend

npm run dev


🚀 Uso

Acceder al frontend en:

👉 http://localhost:5173

Iniciar sesión con credenciales de prueba:

Usuario: admin

Contraseña: admin123

Crear, editar y visualizar incidencias en el dashboard, administrar los dispositivos del inventario y los funcionarios de la institución.


🛠️ Tecnologías

 Frontend

-React

-Vite

-Tailwind CSS

-React Router


 Backend

-Express

-SQL Server


 Dependencias principales

-axios

-mssql

-cors

-dotenv


👨‍💻 Autor

Desarrollado por Ricardo Vargas (Ricky)