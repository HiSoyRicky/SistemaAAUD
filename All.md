# DESARROLLO - Plan maestro AAUD

Documento vivo y fuente principal de referencia: qué se requiere, qué existe, qué se hizo y qué falta.

Actualizado: 2026-11-02. Se conserva el avance local de implementación de vehículos/terrenos indicado más abajo, sin asumir que sus migraciones estén aplicadas. La revisión añadió cabeceras estándar al limitador de login, evita marcar sesión iniciada si no cargan permisos y muestra las columnas de finca/inmueble al filtrar clasificaciones Urbanizados/No urbanizados cuando esos campos existen. Suite backend 26/26 y build frontend correctos; no se probó con cuenta real.

## 1. Requisitos funcionales

**Gobierno del inventario**

- Bienes Patrimoniales administra todos los bienes de la institución.
- Informática administra únicamente los bienes tecnológicos (equipos conocidos por `devices`).

**Almacén y compras**

- Almacén recibe factura, orden de compra, bien y detalles. Si el bien fue directo al departamento, se agrega el recibido conforme.
- Almacén llama al departamento solicitante para retirar lo recibido y envía memo de recepciones a Bienes Patrimoniales.
- Bienes Patrimoniales confirma la llegada y plaquea desde la llegada a Almacén. En urgencias, el plaqueo puede hacerse en el destino.
- Las salidas usan orden de entrega de materiales con cantidad, código y detalle del bien.
- AAUD conserva su propio historial de entradas y salidas; ISTMO imprime una hoja de salida, pero no sustituye ese historial.
- Compras requiere memo/acuse final cuando el proveedor presentó cuentas, y acta de aceptación final entre Almacén y Compras.
- Caja menuda compra artículos sin código.
- Despacho de llantas registra a qué vehículo se destinan. Captación de Datos maneja insumos de llantas, mantenimiento, talleres y flota pesada.

## 2. Arquitectura

Tres mundos separados:

1. **Bienes institucionales (`inventory_items`)**: tabla central de todos los bienes plaqueables. Administrada por Bienes Patrimoniales.
2. **Extensiones 1:1 por tipo de bien**:
   - `inventory_item_devices`: activos tecnológicos (equipo, marca, modelo, serie, IP). Poblada.
   - `inventory_item_vehicles`, `inventory_item_properties`, `inventory_item_real_estate`: creadas, sin datos.
3. **Almacén (`warehouse_*`)**: consumibles por stock y movimientos. No son activos plaqueables.

`devices` sigue siendo catálogo tecnológico y no se convierte en catálogo universal.

**Legacy en transición (no eliminar todavía):** `bd_inventory`, `inventory_devices` y `legacy_inventory_map` (`bd_inventory_id` → `item_id`).

### Alcance por rol

- Con `inventory_assets.manage_all` el alcance es total. Lo tienen el rol Bienes Patrimoniales y Administrador (`*.*`).
- Sin ese permiso el alcance es tecnológico: solo bienes con extensión de dispositivo. Una acción fuera de alcance responde 403 `INVENTORY_OUT_OF_SCOPE` en backend. El listado de traslados aplica el mismo alcance.
- Supuesto a confirmar: "Informática" corresponde a los roles Técnico y Consultor, que no tienen `manage_all`.

### Rol Bienes Patrimoniales (id 8)

21 permisos asignados: `inventory.read`, `inventory.update`, `inventory.update_location`, `inventory.update_department`, `inventory.update_assignee`, `inventory.update_administrative_area`, `inventory.update_condition`, `inventory_assets.manage_all`, `inventory_transfers.read_own`, `inventory_transfers.create`, `inventory_transfers.read_all`, `inventory_transfers.review`, `inventory_classification_rules.read`, `ubications.read`, `departments.read`, `status.read`, `devices.read`, `brands.read`, `models.read`, `admin.panel.read`, `inventory.create`.

`inventory.create` permite dar de alta bienes. El alta es un solo formulario: el tipo de bien se deriva de la regla del equipo seleccionado. Sin `manage_all` solo se pueden dar de alta bienes tecnológicos.

### Vehículos: esquema propuesto (NO IMPLEMENTADO)

El inventario central ya tiene `inventory_item_vehicles` con placa, chasis, motor, tipo de vehículo, combustible y millaje. El primer avance agrega a esa extensión marca, modelo, año de modelo y serie; también agrega número catastral a `inventory_item_real_estate`, que ya guarda dirección, área y ubicación geográfica. El DTO y el detalle del activo ya pueden mostrar esos datos. Las extensiones siguen sin captura/escritura desde el formulario y no hay datos cargados.

| Dato de la hoja                                              | Destino propuesto                                                                      | Nota                                                                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Marbete                                                      | `inventory_items.tag`                                                                  | Texto, conservando ceros iniciales (p. ej. `005001`).                                                                                  |
| Cuenta contable                                              | Campo contable general por definir                                                     | No confundir con clasificación patrimonial. `120403` en la hoja no es la clasificación asignable `12040302` para equipo de transporte. |
| Serie                                                        | Campo de serie de vehículo por definir                                                 | La hoja muestra `NA`; convertir a nulo solo si significa “sin dato”.                                                                   |
| Marca / modelo                                               | `inventory_item_vehicles.make` / `.model`                                              | Texto por ahora, separado de los catálogos tecnológicos ligados a `devices`; evaluar catálogo de automotores luego.                    |
| Año de modelo                                                | `inventory_item_vehicles.model_year`                                                   | Entero opcional; falta validar rango.                                                                                                  |
| Estatus del activo                                           | `inventory_items.id_status` y/o `id_condition`                                         | “Buena/BUENO” parece condición, no estado operativo; confirmar el mapeo con catálogos oficiales.                                       |
| Fecha de adquisición, orden de compra y valor de adquisición | Registro financiero/adquisición común del bien (por diseñar)                           | No son exclusivos de vehículos. Usar decimal monetario, no `Float`.                                                                    |
| Fecha de despacho                                            | Campo patrimonial por definir                                                          | Aclarar si significa entrega inicial o despacho de almacén; no asumir que equivale a `transferdate`.                                   |
| Depreciación, valor en libros, avalúo y revalúo              | Historial financiero/valuaciones común (por diseñar)                                   | Definir periodicidad, fórmula, fecha de corte, fuente y cómo conservar histórico.                                                      |
| Placa, motor y chasis                                        | `inventory_item_vehicles.plate`, `.engine`, `.chassis`                                 | Ya existen en esquema; detalle visual disponible, faltan captura y validación.                                                         |
| Datos del terreno                                            | `inventory_item_real_estate.cadastral_number`, `.address`, `.area_m2`, `.location_geo` | Número catastral agregado; los otros campos ya existían. DTO/detalle disponibles, faltan captura y validación.                         |

**Siguiente tramo:** (1) integrar campos en alta/edición y validación del servidor; (2) resolver clasificación genérica `VEHICLE/VEHICLES/12040302` y `PROPERTY/PROPERTIES` con selección entre las clasificaciones asignables de terreno; (3) extender tabla, filtros, exportación e historial; (4) confirmar significado de cuenta contable, fechas y columnas financieras; (5) diseñar ese historial común; (6) preparar importación idempotente que preserve marbetes y normalice `ND`/`NA`/vacíos con reglas explícitas; (7) validar en copia antes de cargar datos reales.

**Avance 2026-10-20:** migración aditiva pendiente `20261020110000_vehicle_land_details`; Prisma schema y DTO incluyen campos de vehículo/terreno; el modal de detalle muestra datos existentes. No se aplicó la migración ni se añadió captura/escritura.

Cada vehículo seguirá siendo un `inventory_items` con extensión 1:1, ubicación/departamento/estado compartidos y datos de matrícula en `inventory_item_vehicles`. La regla de clasificación deberá usar tipo `VEHICLE`, extensión `VEHICLES` y clasificación `12040302` (equipo de transporte); la cuenta `120403` se guardará por separado.

## 3. Estado por fase

| Fase                                    | Estado                                        | Commit / migración                                                                                                                                                                                                                                                                                               | Notas                                                                                                                                             |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Centralización: schema y copia       | COMPLETADA (2026-10-14)                       | `c10c73f`; `f935da4` (SQL sin `BEGIN/COMMIT`); `20261014_create_inventory_items_centralized`                                                                                                                                                                                                                     | 1,972 bienes copiados desde `bd_inventory`; correlaciones a `inventory_item_devices`                                                              |
| II. Backend sobre `inventory_items`     | COMPLETADA (2026-10-14)                       | `795d74b`                                                                                                                                                                                                                                                                                                        | Repositorios, DTO y escrituras sobre `inventory_items`; contratos API sin cambios                                                                 |
| III. Bienes Patrimoniales               | IMPLEMENTADA, SIN COMMIT; navegador pendiente | `20261019120000_fix_inventory_item_correlation`; `20261019130000_inventory_transfers_item_id`; `20261019140000_add_inventory_item_classification`; `20261019150000_drop_inventory_item_classification_id`; `20261019160000_unique_classification_rule_per_device`; `20261020100000_optional_item_technical_data` | Alcance por rol, traslados sobre `inventory_items`, alta y edición con clasificación automática; faltan capturas para extensiones no tecnológicas |
| IV. Validación en PostgreSQL productivo | PENDIENTE                                     | -                                                                                                                                                                                                                                                                                                                | Ver próximos pasos                                                                                                                                |
| V. Retiro de legacy                     | PENDIENTE                                     | -                                                                                                                                                                                                                                                                                                                | Solo después de migrar todos los lectores                                                                                                         |

**Estado de migraciones:** `prisma migrate status` sobre la base local `aaud_system` (2026-10-19) reporta 37 migraciones y esquema al día (2026-10-20). Producción no se ha verificado.

### Fase III: detalle

**Corrección de correlaciones (`20261019120000`).** 236 de 1,972 bienes tenían marca, modelo, equipo o serie de otro registro, porque la migración anterior correlacionó por marbete y `bd_inventory` repite marbetes (p. ej. "DONACIÓN"). La corrección empareja por posición ordinal (`id`) entre `bd_inventory` e `inventory_items`: 1,972 pares y 0 diferencias de marbete. Restaura `created_at` desde `inventory_devices.created_at`, porque `bd_inventory.created_at/updated_at` son `TIMETZ` casi nulos. No borra datos.

**Traslados sobre `inventory_items` (`20261019130000`).** `item_id` NOT NULL con FK e índice, rellenado con el mismo mapeo. `inventory_id` se conserva hasta Fase V.

- **Crear solicitud:** transacción con `SELECT ... FOR UPDATE` sobre `inventory_items`, valida alcance y rechaza una segunda solicitud pendiente del mismo bien con 409.
- **Aprobar:** reclamo condicional `status = PENDING` (409 si ya fue procesada). Dentro de la misma transacción bloquea el bien, valida el área administrativa destino, actualiza `inventory_items`, escribe evento de auditoría y `activity_logs`. Si el departamento destino es Informática, el responsable (`user`) se limpia.
- **Rechazar / solicitar corrección:** reclamo condicional con el mismo guardia 409.

**Clasificación automática por bien (`20261019140000`, `20261019150000`, `20261019160000`).** La categoría patrimonial no la elige el usuario: se deriva del bien (`device_id`) mediante `inventory_asset_classification_rules`. `20261019140000` agregó `inventory_items.classification_id`; `20261019150000` la eliminó tras verificar que no tenía filas con valor y que no había reglas duplicadas por bien. `20261019160000` agrega un índice único sobre `inventory_asset_classification_rules.device_id`: una regla por bien. Un bien sin regla se registra como tecnológico y exige marca y modelo. Un bien cuya regla no es tecnológica puede guardar marca, modelo, serie e IP como datos opcionales en `inventory_item_devices`; la serie solo es obligatoria para bienes tecnológicos. Su nombre sale de la regla. El alcance se decide por la regla (extensión DEVICES o bien sin regla), no por la presencia de datos técnicos. Sin `manage_all` solo se pueden dar de alta o editar bienes tecnológicos (403 `INVENTORY_OUT_OF_SCOPE`). La API rechaza convertir un bien tecnológico en no tecnológico desde edición (400); en un bien no tecnológico, marca y modelo deben ser coherentes con el dispositivo.

**Migración `20261020100000`.** `id_brand`, `id_model` y `serie` de `inventory_item_devices` pasan a opcionales. Sin cambios de datos.

**Corrección de esta revisión.** `findInventoryFilterOptions` fallaba con 500 al listar marcas y modelos, porque los IDs nulos entraban en listas `in`; ahora se excluyen nulos. Se eliminó un ciclo de importación entre `inventory-scope.service.js` y `inventory-classification.service.js`.

**Frontend.**

- `/inventario/bienes` reutiliza `InventoryPage` con `scope="bienes"`. Cambian título, descripción y la columna Tipo (Tecnológico / Patrimonial). Los campos vacíos muestran "—". Tabla, filtros, modales y exportación se comparten con `/inventario/equipos`.
- Menú "Bienes patrimoniales" y aterrizaje para usuarios con `inventory_transfers.review` sin módulos de incidencias.
- Administración no tiene pestañas nuevas: las existentes se filtran por permiso.
- Formulario único de alta y edición. No hay selector de tipo de bien, categoría ni opciones avanzadas. Al elegir el bien se resuelve su regla; el bloque "Clasificación patrimonial" la muestra una sola vez, en solo lectura ("Automática"). Marca, modelo e IP aparecen solo si la regla es tecnológica o el bien aún no tiene regla.
- Administración > Reglas de clasificación: "Nueva regla" y "Editar" abren un modal. El selector de bien oculta los bienes que ya tienen regla, excepto el de la regla en edición. El backend responde 409 si se intenta crear otra regla para el mismo bien.
- El listado de reglas incluye búsqueda por nombre de equipo y orden por equipo. El selector de clasificación muestra el catálogo asignable filtrado por tipo y permite crear reglas aunque esa combinación no tenga reglas previas. La API aplica la misma compatibilidad. Código actualizado; pendiente de pruebas y verificación en navegador.
- El inventario ordena primero por marbete y, ante duplicados, por clasificación, tipo, ubicación, departamento y los demás campos; preserva los ceros iniciales. Pendiente comprobar que todas las vistas y páginas mantienen ese orden en navegador.

**Correcciones de esta fase.**

- La API devolvía `serie` siempre nulo; ahora sale de la extensión tecnológica.
- El log de auditoría de permisos fallaba con `Unknown argument module_action` en upserts con clave compuesta; `fetchOldValues` usa `findUnique`.
- Normalización de nombres de departamento (acentos) corregida.
- Pruebas del backend actualizadas al contrato `device_details` / `inventory_items` / `item_id`.

## 4. Verificación

| Verificación                                                                                                                                                                                                                                                                                                                      | Resultado                                                                 | Fecha                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm test --workspace apps/backend`                                                                                                                                                                                                                                                                                               | 90/90                                                                     | 2026-10-20                                                           |
| `npm run build --workspace apps/frontend`                                                                                                                                                                                                                                                                                         | Correcto; quedan avisos Rollup preexistentes de comentarios Zod           | 2026-10-19                                                           |
| `prisma migrate status` (base local)                                                                                                                                                                                                                                                                                              | 37 migraciones; esquema al día                                            | 2026-10-20                                                           |
| Resolución de regla por bien (pruebas unitarias): solo regla de equipo, sin respaldo genérico; regla tecnológica por extensión DEVICES                                                                                                                                                                                            | Cubierto en `inventory-classification.service.test.js`                    | 2026-10-20                                                           |
| Reglas nuevas desde catálogo completo, filtrado por compatibilidad de tipo y validación equivalente en API                                                                                                                                                                                                                        | Código actualizado; NO VERIFICADO con pruebas ni navegador                | 2026-10-20                                                           |
| Orden de inventario por marbete y desempates                                                                                                                                                                                                                                                                                      | Comparador de repositorio revisado; NO VERIFICADO en navegador/paginación | 2026-10-20                                                           |
| E2E de alta no tecnológica (modelo anterior con `classification_id`)                                                                                                                                                                                                                                                              | Obsoleto; repetir con el modelo actual en navegador                       | 2026-10-20                                                           |
| Script E2E backend: lectura, alcance, traslado y aprobación con bienes temporales                                                                                                                                                                                                                                                 | 27/27; datos temporales eliminados                                        | Antes de los últimos cambios de pruebas; repetir antes de producción |
| API de bienes (2026-10-20, base local): alta tecnológica sin serie (400) y completa (201); alta no tecnológica sin datos (201), con marca sin modelo (201), con modelo sin marca (400); edición que agrega y limpia datos técnicos (200/400); `filter-options`, listados y traslados de `admin` (200)                             | Verificado; datos de prueba eliminados salvo un registro (ver nota)       | 2026-10-20                                                           |
| Alcance con usuario sin `inventory_assets.manage_all` (API, 2026-10-20): `rvargas` lista 1,972 bienes tecnológicos y no ve el bien 1982; PUT del 1982 → 403 `INVENTORY_OUT_OF_SCOPE`; sus facetas solo muestran tipo "Tecnología". `rgarcia` recibe 403 `MISSING_PERMISSION` al editar porque su rol no tiene `inventory.update*` | Verificado por API; sin navegador                                         | 2026-10-20                                                           |
| Filtros de facetas respetan el texto de búsqueda (`search` en `filter-options`): `search=019999` → tipo "Propiedad" y estatus "Nuevo"; `search=ZZZNOEXISTE` → listas vacías                                                                                                                                                       | Verificado por API                                                        | 2026-10-20                                                           |
| Filtro por Tipo (`asset_type`) en listado y facetas: `asset_type=Propiedad` → 1 bien para `admin`, 0 para técnicos                                                                                                                                                                                                                | Verificado por API; filtro visual sin navegador                           | 2026-10-20                                                           |
| Columna Tipo muestra el nombre de la regla del bien (una silla ejecutiva ya no aparece como "Tecnológico")                                                                                                                                                                                                                        | Verificado en DTO y pruebas; sin navegador                                | 2026-10-20                                                           |
| Limpieza de selecciones obsoletas: al cambiar el texto de búsqueda, un filtro seleccionado que deja de existir en el resultado se limpia y no aparece en los desplegables                                                                                                                                                         | Código revisado; NO VERIFICADO en navegador                               | -                                                                    |
| Navegador (formulario y vistas)                                                                                                                                                                                                                                                                                                   | NO VERIFICADO: omitido a solicitud del usuario                            | -                                                                    |
| Concurrencia real (dos solicitudes / dos aprobaciones)                                                                                                                                                                                                                                                                            | NO VERIFICADO: requiere PostgreSQL aislado                                | -                                                                    |

Los 1,972 bienes actuales son tecnológicos. La separación de alcance solo se probó con bienes temporales.

## 5. Limitaciones conocidas

- **Formulario único sin validar en navegador.** Backend y formulario están implementados. Limitaciones: la clasificación depende de la regla del bien y solo se cambia en Administración; la serie es obligatoria solo para bienes tecnológicos y los datos técnicos son opcionales para cualquier bien; el catálogo de Modelos no tiene modelos para Aire acondicionado ni Silla ejecutiva, así que marca y modelo de esos bienes solo se pueden elegir cuando se cree el catálogo; vehículos, propiedades e inmuebles no tienen captura específica de extensión.
- **Área administrativa fuera del formulario.** La edición ya no la muestra; se toma de la regla del bien. La API la sigue aceptando con `inventory.update_administrative_area`.
- **Bienes sin regla.** Un bien cuyo device no tiene regla específica queda sin regla y se trata como tecnológico (visible y editable por técnicos). En la base local son 750 de 1,974 bienes; se resuelven creando la regla del device en Administración. Al desactivar una regla, sus bienes quedan sin regla.
- **Autoaprobación permitida.** Un usuario con `create` y `review` (p. ej. Bienes Patrimoniales) puede aprobar su propio traslado. Recomendado: exigir aprobador distinto del solicitante.
- **Lectores legacy pendientes de migrar:** `incidentService.js` (~119–132) e `incidents.repository.js` (~156) leen IP de impresoras desde `inventory_devices`; `activity.resolver.js`, `classification-reconciliation.service.js`, `findInventoryClassificationBatch` y `findCurrentInventoryByIds` leen `bd_inventory`. Un cambio de IP hecho en `inventory_items` no se refleja en solicitudes de tóner hasta migrar estos lectores.
- **Auditoría mixta.** Los eventos `BD_INVENTORY` anteriores usan `entity_id` de `bd_inventory`; los nuevos usan `inventory_items.id`. Hay ~1,964 filas que difieren. No se reescriben registros históricos; requiere decisión de normalización.
- **Concurrencia en PostgreSQL** de traslados y de la secuencia de incidencias: solo verificada con dobles de prueba.
- ESLint 9 no encuentra configuración en el repositorio (preexistente).

## 6. Próximos pasos

1. **Prueba pendiente en navegador** con usuario de prueba de Bienes Patrimoniales: aterrizaje, listado, traslado, aprobación y revisión desde Informática. Requiere backend y base de datos de prueba, además de una cuenta no productiva; las credenciales compartidas no se guardan en este documento.
2. **Decidir y aplicar el bloqueo de autoaprobación.**
3. **Formulario único:** validar en navegador con Bienes Patrimoniales (alta tecnológica, alta de bien no tecnológico, edición con clasificación bloqueada y regla por bien desde Administración). Definir e implementar después las extensiones de vehículo, propiedad e inmueble; el esquema de vehículos está en “Vehículos”. Crear el catálogo de modelos para mesas, sillas y aires acondicionados.
4. **Migrar lectores legacy** a `inventory_items` / `inventory_item_devices`, incluida la búsqueda de IP de impresoras para tóner.
5. **Normalizar `entity_id` de auditoría** `BD_INVENTORY` (decisión, sin reescribir histórico).
6. **Fase IV (producción):** respaldo; verificar conteos y pares antes; aplicar en ventana `20261014` (si falta), `20261019120000`, `20261019130000`, `20261019140000`, `20261019150000` y `20261019160000` (antes confirmar 0 pares duplicados en `inventory_asset_classification_rules.device_id`); conceder `inventory.create` al rol Bienes Patrimoniales (ya concedido en la base local); confirmar 0 diferencias de marbete, marca, modelo, equipo y serie. Ejecutar pruebas de concurrencia en PostgreSQL aislado.
7. **Fase V:** dejar de escribir en `bd_inventory` / `inventory_devices`; eliminar después de un período de retención aprobado.
8. **Revisión de deriva de Fase I** (detectada con `migrate diff`, sin corregir): FK e índices con nombres distintos, `NOT NULL` en `created_at`/`updated_at`, y faltan FK `item_id` en `inventory_item_devices`, `inventory_item_vehicles`, `inventory_item_properties` e `inventory_item_real_estate`. La FK faltante de equipos es un hueco de integridad real. Crear migración solo con evidencia y sin NULL.

## 7. Módulo de Almacén (Fase 7): PARCIAL

**Implementado**

- Catálogo `warehouse_items` con 6,288 insumos cargados por código (categorías NULL hasta recibir la lista oficial). No se cargaron stock ni movimientos.
- Stock por ubicación y ledger de movimientos `IN` / `OUT` / `ADJUSTMENT`, en transacción. Las salidas bloquean filas con `FOR UPDATE` y verifican stock; los lotes bloquean insumos en orden ascendente.
- Movimientos en lote: `/api/warehouse/movements/batch` (salidas) y `/batch-in` (entradas), atómicos, con una línea histórica por insumo.
- Idempotencia con UUID: reintento idéntico devuelve el resultado previo; payload distinto con la misma clave responde 409. Migración `20261001130000` aplicada en la base local.
- Reglas vigentes:
  - Entradas: destino automático Almacén / Carrasquilla; receptor = usuario de sesión.
  - Salidas: ubicación y receptor obligatorios (el receptor se escribe, puede no tener cuenta). Cualquier departamento puede solicitar desde cualquier ubicación.
  - Salidas descuentan el stock institucional total del insumo; consumen primero la ubicación seleccionada.
  - Ajustes: motivo obligatorio y destino automático Almacén / Carrasquilla.
- Pantallas: existencias, registro por modal paso a paso, historial en `/almacen/historial`, búsqueda y exportación Excel.
- Permisos actuales: catálogo read/create/update, stock read, movimientos read/create. No hay aprobación ni anulación.

**Pendiente**

- Recepciones, despachos, orden de entrega, documentos y llantas/flota. No se crean modelos ni permisos hasta resolver las decisiones de abajo.
- Decisiones institucionales requeridas: rol que aprueba y cuándo; documentos obligatorios por tipo de entrada; quién anula y cómo se compensa el stock; si el ajuste es saldo final o delta (OBS-011); reglas de despacho; política de reintentos.
- Toners: módulo especializado por impresora/modelo/color. Decidir si se mantiene, migra a `warehouse_items` o se integra como categoría. No eliminar sin migración aprobada.

## 8. Matriz de fases (0 a 16)

| Fase                              | Estado                                  | Pendiente                                                                                                 |
| --------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 0. Base documental y decisiones   | COMPLETADA                              | Mantener vivo                                                                                             |
| 1. Clasificación del bien         | COMPLETADA                              | Sincronización automática al arrancar, al cambiar reglas y al guardar bienes                              |
| 2. Núcleo de inventario           | COMPLETADA (centralizado en Fases I-II) | Retiro de legacy en Fase V                                                                                |
| 3. Bien general                   | COMPLETADA                              | Formulario único sin validar en navegador; decidir si la serie es obligatoria para bienes no tecnológicos |
| 4. Responsable y asignación       | COMPLETADA                              | Responsable patrimonial legal separado de la persona tenedora                                             |
| 5. Extensiones específicas        | PARCIAL                                 | Tablas creadas; falta captura para vehículos, propiedades e inmuebles                                     |
| 6. Catálogo de productos MEF      | PARCIAL                                 | Integrarlo sin confundirlo con clasificación ni stock                                                     |
| 7. Almacén / consumibles          | PARCIAL                                 | Ver sección 7                                                                                             |
| 8. Adquisición                    | PENDIENTE                               | Diseñar después del intake base                                                                           |
| 9. Documentos                     | PENDIENTE                               | Tipos de documento, adjuntos, firmas, recibido conforme                                                   |
| 10. Información patrimonial / MEF | PENDIENTE                               | Campos de plaqueo y responsables con Bienes Patrimoniales                                                 |
| 11. Catálogo contable             | PENDIENTE                               | Requiere fuente documental                                                                                |
| 12. Depreciación                  | PENDIENTE                               | Requiere reglas oficiales                                                                                 |
| 13. Revaluos                      | PENDIENTE                               | Requiere definición funcional                                                                             |
| 14. Traslados y pérdidas          | PARCIAL                                 | Traslados sobre `inventory_items` (Fase III); falta pérdidas y reportes                                   |
| 15. Frontend                      | PARCIAL                                 | Vistas Equipos y Bienes; alta patrimonial implementada; falta navegador verificado                        |
| 16. Eliminación de legacy         | PENDIENTE                               | Solo al final, con migración validada                                                                     |

## 9. Reglas de clasificación (diseño vigente)

Resolución (`resolveClassificationRule`):

1. Con bien (`device_id`): solo la regla de ese bien. No hay respaldo genérico.
2. Sin bien: `asset_type + extension + área`; si no existe, la regla `is_default` de `asset_type + extension`.

- Una regla por bien: índice único en `device_id`; el servicio responde 409 y el formulario de Administración oculta los bienes que ya tienen regla.
- Un bien sin regla se registra como tecnológico y exige marca y modelo.
- Sincronización automática (`classification-sync.service.js`), sin pantalla ni acción manual:
  - Al arrancar el servidor, aplica las reglas vigentes a todos los bienes existentes.
  - Al crear, editar, activar o desactivar una regla, sincroniza los bienes de los devices afectados dentro de la misma transacción.
  - Al dar de alta o editar un bien, su regla se resuelve desde su device. El device siempre queda persistido en `inventory_item_devices`.
  - Si la regla define área administrativa, el área del bien se sobrescribe; si no la define, el área del bien se conserva.
  - Los cambios se auditan con `source: inventory.classification-sync`.

## 10. Backlog priorizado

- **P1 - PostgreSQL aislado:** validar migraciones de Fase III, concurrencia de traslados y secuencia de incidencias, y planes de consulta.
- **P1 - Navegador:** prueba del golden path de Bienes Patrimoniales (sección 6, paso 1).
- **P2 - Autoaprobación de traslados** (sección 5).
- **P2 - Lectores legacy** (sección 5).
- **P2 - Formalizar recepciones y despachos de Almacén** (sección 7).
- **P2 - Historial de auditoría:** búsqueda por nombres resueltos en eventos legacy. Medir con `EXPLAIN (ANALYZE, BUFFERS)` en copia aislada antes de extender la consulta.

## 11. Observaciones de auditoría: estado actual

Origen: auditoría estática de 2026-10-01 y segunda revisión de 2026-10-02. Los estados describen evidencia del repositorio, no incidentes reproducidos en producción.

| ID      | Prio | Tema                                             | Estado actual                                                                         | Pendiente                                                        |
| ------- | ---- | ------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| OBS-001 | P0   | Registro público permite elegir rol              | CORREGIDO EN CÓDIGO (403)                                                             | Política de registro externo                                     |
| OBS-002 | P1   | Incidencias y sockets sin alcance por asignación | PARCIAL: REST y sockets restringidos; emisiones revisadas                             | Paginación del listado global; revocar salas al cambiar permisos |
| OBS-003 | P1   | Formulario público atribuye todo a `id_user=2`   | Flujo público con atribución genérica, estado fijo y límite de 1 envío / 3 min por IP | Identidad legal del reportante; límite en memoria por proceso    |
| OBS-004 | P1   | Deploy puede borrar adjuntos                     | PARCIAL: `rsync --delete` excluye `/uploads` y `/fotos_personal`                      | Ubicación productiva y respaldo de archivos                      |
| OBS-005 | P2   | Colisión de ticket en altas simultáneas          | MEJORADO: sincronización de secuencia al arrancar                                     | Validar SQL, privilegio `setval` y concurrencia en PostgreSQL    |
| OBS-006 | P2   | Traslados pendientes duplicados                  | CORREGIDO EN CÓDIGO sobre `inventory_items`                                           | Concurrencia en PostgreSQL; duplicados históricos                |
| OBS-007 | P2   | Incidencia con departamento ajeno a ubicación    | CORREGIDO EN CÓDIGO                                                                   | -                                                                |
| OBS-008 | P2   | Actualización de incidencia sin validación       | CORREGIDO EN CONTRATO                                                                 | Estados oficiales y transiciones permitidas                      |
| OBS-009 | P2   | Token admin conserva cambio de contraseña        | Política fortalecida; permisos RBAC vigentes                                          | Revocación inmediata de sesiones no garantizada                  |
| OBS-010 | P3   | Adjunto de tóner sin ruta                        | BLOQUEADO por requisito                                                               | Confirmar si los documentos firmados siguen vigentes             |
| OBS-011 | P2   | Ajuste de Almacén no admite saldo cero           | BLOQUEADO por decisión                                                                | Confirmar si el ajuste es saldo final o delta                    |
| OBS-012 | P2   | Migraciones e índices sin medir                  | Migraciones aplicadas en la base local; sin medición de bloqueos                      | Medir duración y locks en copia aislada antes de producción      |
| OBS-013 | P3   | Traslados por lista fija de roles                | CORREGIDO EN CÓDIGO: permisos `inventory_transfers.*`                                 | Asignar grants a roles personalizados                            |
| OBS-014 | P3   | Configuración Docker de Nginx                    | CORREGIDO EN CONFIG                                                                   | Validar DNS en Compose activo                                    |

**Decisiones institucionales pendientes:** responsable patrimonial legal; si marca/modelo será catálogo genérico; si la serie es obligatoria por tipo de bien; extensiones para vehículos, propiedades e inmuebles; si las llantas requieren catálogo de flota; documentos obligatorios por recepción; identidad y política antiabuso del formulario de incidencias (OBS-003); estados y transiciones de incidencias (OBS-008); semántica de ajuste (OBS-011); roles elegibles para traslados (OBS-013); ubicación productiva de adjuntos (OBS-004).

## 12. Estado de control

```text
Actualizado: 2026-11-02
Commits de la centralización: c10c73f (Fase I), 795d74b (Fase II), f935da4 (corrección SQL)
Fase III: cambios sin commit (verificar con git status antes de confirmar)
Pruebas backend: 26/26 archivos de prueba (incluye el nuevo control del rate limit de login)
Build frontend: correcto; quedan advertencias Rollup/Zod y chunk grande existentes
Migraciones en base local aaud_system: 37, al día al último chequeo registrado 2026-10-19; no verificadas en esta revisión
Recorrido navegador Bienes Patrimoniales: pendiente. El arranque manual del backend se detuvo al confirmar conexión a una base de datos no identificada como aislada; el log reportó sincronización patrimonial con 0 filas actualizadas. No se enviaron credenciales.
Producción: sin verificar
Commits realizados en esta fase: 0
```
