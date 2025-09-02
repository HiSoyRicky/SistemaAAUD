# TODO - Página Web AAUD

## 📌 Pendientes


### 1. Funcionalidades Generales
- [ ] Calendario de salón de reuniones
- [ ] Sistema de manejo de correspondencia
- [ ] Sistema para manejar la numeración de las notas
- [ ] Recordatorio de renovación de licencias con notificaciones por correo
- [ ] Sistema de Inventario de Toners
- [ ] Menú de admin para crear/editar departamentos, ubicaciones y todas las tablas

### 2. Sistema de Incidencias AAUD
- [ ] Notificaciones en tiempo real cuando haya nuevas incidencias
- [ ] Mostrar incidencias sin necesidad de refrescar la página
- [ ] Login automático con usuario de Windows

### 3. Sistema de Carnet AAUD
- [ ] Página principal de usuarios
- [ ] Buscar usuarios por nombre, cédula o número de empleado
- [ ] Poder editar usuarios

## 4. Sistema de Inventario AAUD
- [ ] 006988: Agregar Docking Station de Chanis.
- [ ] Nueva columna: fecha de ingreso de los equipos (Inventario AAUD).


Checklist práctica (para que la uses punto por punto)

Prioridad alta (hacer hoy/esta semana):

 Reescribir queries para que usen parámetros.

 Asegurar hashing de contraseñas y revisar flujo de auth.

 Añadir middleware de validación (express-validator / Joi).

 Añadir helmet y CORS con whitelist.

 Añadir error handler global.

Prioridad media:

 ESLint + Prettier config y script npm run lint.

 Configurar logger (winston/pino).

 Implementar paginación servidor.

 Añadir tests básicos.

Prioridad baja / nice-to-have:

 Docker + docker-compose.

 CI (GitHub Actions): lint, test, build.

 Migrations DB.

 Documentación (README con cómo ejecutar local + screenshots).
