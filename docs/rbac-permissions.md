# RBAC por módulos

## Estructura

- `permissions`: catálogo (`module`, `action`)
- `role_permissions`: relación muchos-a-muchos entre roles y permisos
- Código de permiso: `module.action`

Ejemplos:
- `inventory.read`
- `inventory.create`
- `inventory.update`

## Middleware

Se usa `requirePermission('module.action')` en rutas protegidas.

También soporta wildcard:
- `*.*` (todo)
- `module.*` (todas las acciones del módulo)
- `*.action` (misma acción para todos los módulos)

## Endpoints de administración

Base: `/api/permissions`

- `GET /api/permissions`
  - Requiere `permissions.read`
  - Devuelve catálogo + roles con sus permisos

- `GET /api/permissions/roles/:idRole`
  - Requiere `permissions.read`
  - Devuelve permisos del rol

- `PUT /api/permissions/roles/:idRole`
  - Requiere `permissions.assign`
  - Body:

```json
{
  "permissions": [
    "inventory.read",
    "inventory.update"
  ]
}
```

- `GET /api/permissions/users/:idUser`
  - Requiere `permissions.read`
  - Devuelve:
    - permisos heredados del rol,
    - overrides de usuario (`grants` y `denies`),
    - permisos efectivos finales.

- `PUT /api/permissions/users/:idUser`
  - Requiere `permissions.assign`
  - Body:

```json
{
  "grants": [
    "inventory.update"
  ],
  "denies": [
    "toners.delete"
  ]
}
```

`grants` permite explícitamente y `denies` deniega explícitamente para ese usuario.
Si un permiso no está en ninguno, hereda del rol.

## Bootstrap inicial

1. Ejecuta migraciones Prisma (si aún no se aplicaron).
2. Ejecuta seed de permisos:

```bash
npm run prisma:seed:permissions
```

Esto:
- crea/actualiza catálogo de permisos,
- asigna permisos base por rol conocido (`admin`, `tecnico`, `consultor`, etc.).

## Login y JWT

Al hacer login, el backend incluye `permissions` en:
- payload del token JWT,
- objeto `usuario` de la respuesta.

El backend usa esos permisos desde `req.user.permissions` y, si no existen, los resuelve por rol desde base de datos.
