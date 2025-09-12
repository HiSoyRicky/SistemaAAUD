# TODO - Página Web AAUD

src/services/api.js: Llamadas API desde frontend; para ver manejo de errores y auth headers.
src/context/AuthContext.jsx: Estado de auth; común tener leaks o re-renders innecesarios.
server/db/migrations/create_tables.sql: Estructura DB; para sugerir indexes o constraints.


Nativefier: Convierte aplicaciones web en aplicaciones de escritorio nativas. 
Komodo IDE: IDE con soporte para desarrollo remoto, incluyendo FTP y SFTP. 
Bootstrap Studio: Herramienta de diseño visual para crear sitios web con Bootstrap. 

## 📌 Pendientes

### 1. Funcionalidades Generales
- Que el menú desplegable De gestión de departamentos sea los departamentos ya existentes y no agregarlo manualmente.
- En la secciondde admin los modelos no aparece la marca que le corresponde dicho modelo.
- No funciona el cambio de contraseñas de los usuarios.
- Calendario de salón de reuniones.
- Botón de exportar a excel de incidencias no funciona.
- Sistema de manejo de correspondencia.
- Arreglar los post en el frontend de incidencias
- Sistema de Inventario de Toners.
- Sistema para manejar la numeración de las notas, memos, etc.
- Recordatorio de renovación de licencias con notificaciones por correo
- Login automático con usuario de Windows de quien ingreso en el sistema en su propia de columna ejemplo windows_login
- Si el usuario no esta registrado en el dominio osea una maquina fuera del dominio, no le permita entrar en el sistema de la AAUD

### 2. Sistema de Incidencias AAUD
- Notificaciones en tiempo real cuando haya nuevas incidencias

### 3. Sistema de Carnet AAUD
- Página principal de usuarios
- Buscar usuarios por nombre, cédula o número de empleado
- Poder editar usuarios

## 4. Sistema de Inventario AAUD
- Nueva columna: fecha de ingreso de los equipos (Inventario AAUD).

