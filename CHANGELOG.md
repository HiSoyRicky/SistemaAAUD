# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2026-10-27

### Fixed

- fix: generar UUID de almacén en HTTP



## [1.6.0] - 2026-10-27

### Added

- feat: mejorar interfaz responsive y gestión de incidencias
- feat: actualizar inventario, catálogos y movimientos de almacén
- feat(prisma): Implementación de Almacén y Bienes Patrimoniales
- feat: Fase II centralización inventario - Adaptar backend a inventory_items
- feat: crear modelo centralizado inventory_items - Fase I (2026-10-14)
- feat: Filtro en el módulo de administración

### Changed

- docs: actualizar All.md - Fase I centralización completada (2026-10-14)
- docs: actualizar All.md con estado de centralización de inventario (2026-10-14)

### Fixed

- fix: Test de clasificación de inventario
- fix: Corregir migración SQL - Remover BEGIN/COMMIT explícitos y castear timestamps
- fix: redirigir usuarios al primer módulo al que tienen acceso



## [1.5.0] - 2026-10-02

### Added

- feat(prisma): Actualziación masvida de archivos
- feat: Actualziación de paquetes y frontend de la fecha de asignación
- feat: Nueva función de tiempo de actividad en la sesión
- feat(prisma): Se agrego la fecha de asignación y mejora en la intefaz de incidencias
- feat: Creación de incidencias público
- feat(prisma): Actualización de funciones y de interfaz de almacén y permisos de usuarios

### Maintenance

- chore: modernizar runtime y dependencias seguras



## [1.4.0] - 2026-09-07

### Added

- feat(incidents): add incident assignment permission
- feat: Actualización completa de funcionalidades de almacén y la interfaz de usuario
- feat: Cargas a producción



## [1.3.0] - 2026-09-03

### Added

- feat(prisma): Modulo de Almacén
- feat(prisma): add inventory product catalog and device separation
- feat(inventory): add general asset fields
- feat: separate inventory device data

### Changed

- refactor(inventory): separate technology data

### Fixed

- fix(release): handle null execSync output
- fix(release): make release process atomic

### Maintenance

- chore(prisma): remove completed inventory catalog seeds


