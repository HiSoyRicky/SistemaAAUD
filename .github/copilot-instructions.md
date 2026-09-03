# Sistema AAUD - Instrucciones para Copilot

## Versionado

El proyecto utiliza Semantic Versioning:

MAJOR.MINOR.PATCH

La versión oficial del proyecto está determinada por el último Git tag válido.

Formato oficial de tags:

vMAJOR.MINOR.PATCH

Ejemplo:

v1.2.1
v1.3.0
v2.0.0

El campo `version` del `package.json` raíz debe mantenerse sincronizado con la versión del último release.

## Tipos de cambio

### PATCH

Usar PATCH para:

- correcciones de bugs
- ajustes visuales
- correcciones de validaciones
- optimizaciones internas sin cambio funcional
- cambios de documentación
- refactors internos sin cambios funcionales

Ejemplo:

v1.2.1 → v1.2.2

### MINOR

Usar MINOR para:

- nuevas funcionalidades compatibles
- nuevos endpoints compatibles
- nuevos módulos
- nuevos filtros
- nuevas capacidades de inventario
- ampliaciones compatibles del modelo de datos

Ejemplo:

v1.2.1 → v1.3.0

### MAJOR

Usar MAJOR para:

- cambios incompatibles de API
- cambios incompatibles de base de datos
- eliminación de funcionalidades existentes
- cambios arquitectónicos incompatibles
- cambios que requieran migraciones incompatibles con versiones anteriores

Ejemplo:

v1.3.0 → v2.0.0

## Reglas de Release

La versión actual debe obtenerse del último Git tag.

Antes de crear un release:

1. El código debe estar integrado en `main`.
2. El working tree debe estar limpio.
3. Deben existir commits posteriores al último tag.
4. Debe ejecutarse:

```bash
npm run release:check
```
