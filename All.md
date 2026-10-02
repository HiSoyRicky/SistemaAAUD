# DESARROLLO

Este archivo es el plan maestro vivo del sistema AAUD. Debe mantenerse como fuente principal de referencia para saber que se quiere, que existe, que ya se hizo y que falta.

Actualizado: 2026-10-01.

## Datos funcionales recolectados

- Almacen recibe factura, orden de compra, el bien y sus detalles.
- Si el bien fue directo al departamento, debe agregarse el recibido conforme.
- Almacen debe llamar al departamento solicitante para retirar lo recibido.
- Almacen envia memo de recepciones a Bienes Patrimoniales.
- Bienes Patrimoniales consulta/confirma si el bien llego y debe plaquear desde la llegada a Almacen.
- En urgencias, el plaqueado puede hacerse en el lugar de destino.
- Para salidas, Almacen usa orden de entrega de materiales con cantidad, codigo y detalle del bien.
- El sistema ISTMO imprime una hoja de salida; AAUD necesita conservar historial propio de entradas y salidas.
- Almacen necesita inventario en vivo de consumibles fisicos.
- Compras requiere memo/acuse final cuando el proveedor presento cuentas.
- Debe existir acta de aceptacion final entre Almacen y Compras para proveedores, ordenes de compra y montos.
- Caja menuda compra articulos por fuera y puede no traer codigo.
- Despacho de llantas registra a que vehiculo se destinan las llantas.
- Captacion de Datos maneja insumos de llantas, mantenimiento, talleres y flota pesada.

## Principio arquitectonico actual

El sistema debe separar tres mundos que hoy conviven:

1. Inventario tecnologico actual: computadoras, laptops, torres, monitores, routers, switches, impresoras, proyectores y equipos conocidos por `devices`.
2. Inventario patrimonial general: bienes institucionales plaqueables como mesas, sillas, aires acondicionados, terrenos, herramientas, vehiculos y otros bienes.
3. Almacen/stock consumible: aguas, papel higienico, papel de imprimir, llantas por medida, utensilios de aseo, toners y otros insumos con entradas, salidas y existencias.

`devices` no debe convertirse en catalogo universal. Debe seguir representando equipos tecnologicos. La evolucion recomendada es introducir `inventory_item_types` como tipo generico de bien patrimonial, y un modulo separado de Almacen para consumibles.

## Fase actual real

**FASE 7 - Almacen / Intake / Consumibles: PARCIALMENTE IMPLEMENTADA**
| 7. Almacen / Intake / Consumibles | PARCIAL | `warehouse_items`, `warehouse_stock`, `warehouse_movements`, API protegida, permisos por departamento y pantalla propia de Almacén | Implementar recepciones, despachos, orden de entrega, llantas/flota y actas; documentos/escaneos quedan para fase posterior |

- Pantalla frontend `/almacen` con catálogo básico, existencias, entradas/salidas/ajustes y movimientos recientes.
- Usuarios asignados al departamento Almacén reciben el alcance de sus módulos desde backend; las acciones siguen separadas por permisos.
- La vista `/inventario/equipos` puede consultarse como bienes institucionales globales por usuarios con `inventory.read` o `warehouse_stock.read`.

**AUDITORIA DE HISTORIAL DE EQUIPOS: EN PROGRESO (2026-10-01)**

| Hallazgo | Evidencia / causa | Cambio y estado | Verificacion pendiente |
| -------- | ----------------- | --------------- | ---------------------- |
| AUD-01 | `activityLogger.js` obtenia snapshots y escribia con el cliente Prisma global; sus errores se ignoraban. Las transacciones criticas podian dejar logs fuera de la transaccion. | Alta, edicion, reconciliacion y aprobacion de traslados suprimen el logger tecnico para sus modelos y escriben auditoria explicita con el cliente `tx`. Evento de negocio falla junto con la transaccion si no se puede guardar. PARCIALMENTE IMPLEMENTADO. | Pruebas reales contra PostgreSQL para rollback, concurrencia y fallo de insercion. |
| AUD-02 | Una operacion tecnologica podia registrar por separado `bd_inventory` e `inventory_devices`; traslado aprobado tambien tenia logging automatico y manual. | Las escrituras nuevas cubiertas generan un snapshot consolidado por equipo; la aprobacion reclama condicionalmente una solicitud `PENDING`. IMPLEMENTADO EN CODIGO. Suite backend completa: 57/57. | Verificar con PostgreSQL que una operacion multitabla persiste un solo movimiento y que dos aprobaciones concurrentes solo producen una. |
| AUD-03 | Los registros antiguos no tienen identificador de operacion; no se pueden correlacionar sin heuristicas por fecha/usuario ni alterar su evidencia. | No se ocultaron ni eliminaron filas historicas. LEGACY PENDIENTE DE CORRELACION CONFIABLE; no se inventa backfill. | Definir una estrategia institucional para conservar y presentar logs antiguos. |
| AUD-04 | El recorrido previo cargaba logs y filtraba/paginaba en memoria, con orden solo por fecha. | Consulta nueva parametrizada con filtros por activo/accion/fechas/actor y busqueda JSON, `COUNT`/`LIMIT`/`OFFSET` en PostgreSQL, `RepeatableRead`, orden `created_at DESC, id DESC` y `LAG` para conservar duracion. UI general agrega filtro por actor. El modal de activo ahora tambien recorre paginas de 10 registros en vez de truncar a los primeros 100. Implementado y cubierto por pruebas unitarias/backend y compilacion frontend. | Prueba de consulta/plan SQL real bloqueada hasta disponer de PostgreSQL de pruebas aislado. Busqueda queda limitada a texto presente en snapshots/actor; no reconstruye nombres actuales de catalogos para buscar eventos legacy. La paginacion individual no se ha ejercitado con API real. |
| AUD-05 | La vista previa convertia un error de API en estado vacio indistinguible de “sin historial”. | El modal muestra error separado del estado sin movimientos y ahora permite reintentar sin cerrar el detalle. IMPLEMENTADO; `npm run build --workspace apps/frontend` paso. | Interaccion visual con una respuesta API fallida no verificada; frontend no tiene harness de pruebas de componentes. |
| AUD-06 | `inventory_devices.id` ya es PK propia, pero `id_inventory` es obligatorio, unico y FK `ON DELETE CASCADE`; el alta depende de `bd_inventory`. | Mapa de consumidores completado y propuesta de transicion documentada abajo. Sin cambio de esquema. DISENO LISTO PARA REVISION; migracion bloqueada hasta validacion y aprobacion. | Aprobar que `inventory_devices.id` sea identidad fisica estable y validar el plan aditivo antes de alterar FK/nullabilidad. |

**Archivos del avance:** `.gitignore`, `activityLogger.js`, `inventory-audit.service.js`, `inventory.repository.js`, `inventory.service.js`, `inventory-update.service.js`, `inventoryTransferRequests.service.js`, `classification-reconciliation.service.js`, `InventoryDetailModal.jsx`, `InventoryMovementsPage.jsx`, Almacen (`warehouse.service.js`, `warehouse.repository.js`, `warehouse.validator.js`, `WarehouseMovementModal.jsx`, `WarehousePage.jsx`, `schema.prisma`) y pruebas de auditoria, historial SQL e idempotencia/movimientos de Almacen.

**Estado de validacion al corte:** `npm test --workspace apps/backend` 70/70; 4 pruebas nuevas del historial SQL y 8 de filtros/idempotencia/metadatos de Almacen. `npm run prisma:validate` valido; `npm run prisma:generate` exitoso; `npm run build` exitoso (avisos Rollup en comentarios de Zod, sin fallo); `git diff --check` limpio. `prisma migrate status` anteriormente informo 28 migraciones al dia en `localhost:5432/aaud_system`. El archivo `.env` confirma esa base local y no existen `.env.test` ni `.env.integration`; no se pudo confirmar aislamiento, por lo que las pruebas de integracion siguen BLOQUEADAS y no se hicieron escrituras PostgreSQL. Las migraciones de indices/idempotencia son aditivas y estan pendientes, no aplicadas. No se modificaron datos ni se ejecuto reconcile.

**Siguiente paso concreto:** proporcionar una URL de PostgreSQL efimera/aislada y credenciales con permisos limitados para validar rollback y concurrencia; luego implementar AUD-04. Fase 7 formal sigue bloqueada por decisiones de negocio detalladas abajo.

### Continuacion tecnica - 2026-10-01

#### Etapa A - atomicidad/concurrencia: BLOQUEADA

- Entorno observado: `.env` apunta a `localhost:5432/aaud_system`; `.env.test`, `.env.integration` y sus variantes bajo `apps/backend` no existen. El estado Prisma es 28 migraciones al dia, pero no demuestra aislamiento frente a usuarios o servicios locales.
- No ejecutar INSERT/UPDATE/DELETE ni pruebas de integracion sobre esa base. Falta una base descartable con nombre/host verificables, usuario exclusivo de pruebas y permiso para crear/eliminar un schema aislado; alternativamente, una instancia PostgreSQL efimera administrada por CI.
- La auditoria de codigo muestra transacciones Prisma por defecto (PostgreSQL READ COMMITTED), `SELECT ... FOR UPDATE` en equipo/stock y actualizacion condicional `status = PENDING` para aprobar solicitudes. Esto es evidencia del codigo, no prueba del comportamiento concurrente real.
- Pruebas unitarias del snapshot y politica de fallo no simulan ni demuestran rollback transaccional. Rollback, cambios parciales, dos ediciones/aprobaciones concurrentes y errores HTTP siguen sin verificar en PostgreSQL.

#### Etapa B - historial: PARCIAL

- `GET /api/inventory/history` exige `inventory.read`; pagina/limita mediante parser, pero el repositorio omite `skip/take`, no consulta `count` y devuelve todos los logs de dos entidades. El servicio resuelve nombres, consulta estado actual, filtra busqueda y pagina en memoria. El orden es `created_at DESC` sin desempate por `id`.
- Filtra activo, accion y fechas. El texto libre incluye nombres de actor/responsable y valores resueltos, pero no hay filtro estructurado por usuario/actor. Limite individual fijo de 100 en el modal; sin paginacion de historial individual.
- Seis consultas batched de catalogos mas lectura del estado actual se realizan por conjunto de IDs, no N+1 por fila, pero todo el costo crece con el historial completo. Para migrar busqueda a SQL debe conservarse la busqueda historica por campos JSON y catalogos; validar semantica y planes antes de indice/migracion.
- Los logs antiguos de `BD_INVENTORY` y `INVENTORY_DEVICES` guardan `entity_id` con convenciones distintas/compatibles por `id_inventory`; carecen de `operation_id`. No hay evidencia suficiente para reconciliarlos. No fusionar ni ocultar. Los eventos nuevos cubiertos usan un snapshot `BD_INVENTORY` consolidado.
- No se agrego indice. Candidato para evaluar con `EXPLAIN`: `(entity_type, entity_id, created_at DESC, id DESC)` para vista individual con orden estable; para general, el filtro por `entity_type` y orden temporal puede requerir otro indice. No crear hasta medir cardinalidad, solapamiento con indices existentes y plan real.

**Actualizacion AUD-04 (2026-10-01):** los dos primeros puntos anteriores describen el estado anterior y quedan reemplazados por el cambio implementado en `inventory.repository.js` / `inventory-history.service.js`: `findInventoryMovementLogs` calcula total y filas paginadas en una transaccion repeatable-read; filtra activo, accion, fechas, actor y snapshot; ordena por fecha e ID; `LAG` mantiene el tiempo entre eventos sin cargar filas anteriores. `InventoryMovementsPage.jsx` envia el filtro actor. Pruebas nuevas `inventory-history-query.test.js`: 4/4; suite backend 62/62; build frontend exitoso.

Indices anteriores observados: `(entity_type, entity_id)`, `(user_id)` y `(created_at)`. La consulta individual filtra por tipo+entidad y ordena por fecha+ID; la general filtra por tipo y ordena por fecha+ID. Se agregaron solo estos indices aditivos, pendientes de aplicar: `(entity_type, entity_id, created_at DESC, id DESC)` y `(entity_type, created_at DESC, id DESC)`, mediante `20261001123000_add_inventory_history_pagination_indexes`. No se midio `EXPLAIN` ni se aplico migration por falta de una base aislada.

#### Etapa C - identidad tecnologica: DISENO DOCUMENTADO, MIGRACION BLOQUEADA

Dependencias confirmadas:

| Area | Dependencia actual |
| ---- | ------------------ |
| Prisma/DB | `inventory_devices.id` es PK propia; `id_inventory` es NOT NULL + UNIQUE, FK a `bd_inventory` con `ON DELETE CASCADE`. Conserva FK requeridas a `devices`, `brands` y `models`; `bd_inventory` mantiene columnas tecnologicas duplicadas obligatorias. |
| CRUD/clasificacion | `inventory.repository`, `inventory.service`, `inventory-update.service`, DTO y reglas usan la relacion para leer/escribir tecnologia, decidir tipo/clasificacion y proyectar inventario. |
| Consumidores secundarios | Conteos en repositorios de `devices`, `brands` y `models`; transferencias cargan la extension a traves de `bd_inventory`; incidentes incluyen datos tecnologicos del activo. |
| Historial/permisos | `activityLogger` traduce `inventory_devices` a `INVENTORY_DEVICES` y usa `id_inventory` como `entity_id`; `activity.resolver` resuelve ambas entidades. API/control de acceso vive hoy bajo `inventory.read/update`, no hay alcance independiente de equipo. |
| Frontend | Formulario, tabla, detalle e historial seleccionan activos por ID de `bd_inventory`; API de transferencias tambien recibe `inventory_id`. |

Propuesta compatible para revision: conservar `inventory_devices.id` como identidad estable del equipo fisico; separar su vida de la asociacion patrimonial haciendo esta ultima opcional y no-cascading solo tras migrar consumidores. Usar eventos auditables con referencia explicita a `inventory_devices.id` (sin reinterpretar logs legacy); distinguir en esos eventos la asociacion patrimonial opcional. La ubicacion/asignacion patrimonial pertenece a la asociacion, no a la identidad fisica. Mantener `devices` como catalogo tecnologico, y clasificacion patrimonial en su dominio actual.

Fases propuestas: (1) inventario read-only de relaciones/filas inconsistentes y contrato API; (2) agregar referencia explicita de equipo a eventos y campos de asociacion opcional sin quitar legacy; (3) backfill por `id_inventory` con conteos, unicidad, consistencia de device/brand/model y dry-run revisable; (4) doble lectura/escritura transaccional compatible y migracion de filtros, transferencias, clasificacion, reportes, permisos y frontend; (5) probar alta sin activo patrimonial, vinculacion, desvinculacion, historial estable, concurrencia y rollback en PostgreSQL aislado; (6) cambiar FK a `ON DELETE SET NULL`, conservar UNIQUE para asociaciones uno-a-uno, verificar `EXPLAIN`/indices y retirar legacy solo en release posterior aprobado. Reversion: conservar columnas/valores legacy durante todas las fases; no borrar identidad/eventos ni ejecutar backfill destructivo.

#### Etapa D - Fase 7 Almacen: REVISION PARCIAL, IMPLEMENTACION FORMAL BLOQUEADA

- Existe catalogo, stock y ledger de movimientos; API permite listar con paginacion/filtros, movimientos simples y batches IN/OUT. Stock y movimientos se actualizan en una transaccion; salidas bloquean filas existentes con `FOR UPDATE`, verifican stock y los batches bloquean insumos por ID ascendente. Movimientos ordenados por fecha+ID. Usuario autenticado se guarda en `created_by`/receptor conforme al flujo actual.
- Idempotencia implementada en servicio/repositorio y clientes: endpoints exigen UUID; batches derivan clave unica por insumo. Reintento identico devuelve los movimientos previos; payload distinto o batch incompleto con la misma clave produce 409. Campo `warehouse_movements.idempotency_key` y migracion `20261001130000_add_warehouse_movement_idempotency` creados pero NO aplicados; hasta aplicarla la API nueva no puede ejecutarse en una base con el esquema actual.
- Filtros de fechas de movimientos ahora exigen `AAAA-MM-DD` real, normalizan limites UTC y rechazan intervalos invertidos. Pruebas unitarias `warehouse-idempotency.test.js` 4/4 e `warehouse-movements.test.js` 3/3. Sin pruebas de stock/concurrencia contra PostgreSQL.
- Permisos actuales: catalogo read/create/update, stock read, movimientos read/create. No hay permisos de aprobar/anular.
- No existen entidades formales de recepcion/despacho/documento/lineas, aprobacion ni anulacion.
- Decisiones requeridas antes de implementar documentos: rol que aprueba y cuando; documentos obligatorios por tipo de compra/entrada y datos de proveedor/OC/factura; quien puede anular y politica compensatoria del stock; si ajuste expresa saldo final o delta (hoy el backend interpreta `quantity` como saldo final, y la UI/backend impiden registrar cero); reglas de despacho, receptor y referencia obligatorios; politica de idempotencia/reintentos. Mantener separados consumibles, activos plaqueables, llantas/flota y toners conforme al plan.
- No agregar modelos/endpoints/permisos de recepciones y despachos hasta resolver esas reglas. La integridad de la clave idempotente, rollback por fallo y salidas concurrentes siguen pendientes de prueba real en PostgreSQL aislado; la migracion de idempotencia no debe aplicarse hasta validar ese entorno.

**Bloque Fase 7 implementado (2026-10-01):** entradas/salidas batch aceptan `reference` opcional (120 caracteres) y `observation` opcional (255), se conservan en cada `warehouse_movement` y aparecen en la confirmacion del modal. No representan documentos ni cambian obligatoriedad. `warehouse_movements` sigue siendo la fuente de stock y ledger; no se agregaron modelos/servicios paralelos. Pruebas unitarias metadata/idempotencia 5/5 y movimientos/filtros 3/3; build frontend exitoso.

**Avance AUD-05 adicional (2026-10-01):** se agrego accion `Reintentar` al estado de error del historial en `InventoryDetailModal.jsx`; dispara de nuevo la consulta del equipo sin cerrar/reabrir el modal. `npm run build --workspace apps/frontend` paso. No se verifico la interaccion visual ni el error contra API real; no hay suite frontend de componentes configurada.

**Avance AUD-04 UI individual (2026-10-01):** `InventoryDetailModal.jsx` consume `page`, `totalPages` y `total` de `GET /api/inventory/history`, solicita 10 registros y reutiliza el componente compartido `Pagination`. Si una pagina contiene solo eventos no mostrables en el detalle, informa que no hay cambios relevantes en esa pagina en vez de declarar vacio todo el historial. Build frontend exitoso y prueba `inventory-history-query.test.js` 4/4; validacion con API/DB real pendiente.

#### Revision de migraciones pendientes (sin aplicar)

| Migracion | Compatibilidad/datos | Riesgo operativo | Estado |
| --------- | -------------------- | ---------------- | ------ |
| `20261001123000_add_inventory_history_pagination_indexes` | Solo crea dos indices no unicos. No reescribe filas ni cambia contratos/esquema logico. Los nombres no colisionan con indices actuales; las claves se justifican por filtros + orden de historial individual/general. | `CREATE INDEX` normal escanea la tabla y toma lock que puede bloquear escrituras durante el build; tamaño/uso no medidos con `EXPLAIN`. Aplicar en ventana controlada o convertir a `CONCURRENTLY` mediante migration planificada si el volumen lo exige. | Creada; no aplicada a desarrollo ni producción. |
| `20261001130000_add_warehouse_movement_idempotency` | Agrega `VARCHAR(100) NULL` y unique index. Filas previas quedan NULL; PostgreSQL permite múltiples NULL en un índice único, así que no hay colisiones de datos legacy. | `ALTER TABLE` requiere lock breve; índice único escanea tabla y bloquea escrituras durante creación. Sin consulta de volumen no se declara impacto despreciable. | Creada; no aplicada. La API que exige la clave requiere aplicar la migración antes de desplegar backend/frontend. |

Validaciones ejecutadas: `prisma:validate` y `prisma:generate` correctos; SQL revisado manualmente. No se ejecutó migration status/deploy después de crearlas ni se corrieron escrituras contra `aaud_system`.

8. Agregar recepciones, despachos, orden de entrega y llantas.

Fase 1, Fase 2 y Fase 3 permanecen cerradas. Fase 4 sigue parcial por definicion pendiente del responsable patrimonial legal. Fase 5 y Fase 6 siguen parciales. El nuevo trabajo funcional cae principalmente en Fase 7 y conecta con Fase 15 frontend.

## Matriz Fase 0 -> Fase 16

| Fase                                    | Estado     | Evidencia                                                                                                                            | Pendiente                                                                               |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 0. Base documental y decisiones         | COMPLETADA | Flujos AAUD/Almacen/SIGA/Bienes Patrimoniales documentados en este plan                                                              | Mantener vivo                                                                           |
| 1. Clasificacion del activo             | COMPLETADA | Asset types, extensions, clasificaciones, mappings, reglas y catalogo oficial cargado                                                | No hacer backfill sin dry-run/aprobacion                                                |
| 2. Nucleo de inventario                 | COMPLETADA | `bd_inventory` opera como activo principal con compatibilidad legacy                                                                 | Mantener campos legacy hasta Fase 16                                                    |
| 3. Activo general                       | COMPLETADA | Descripcion, condicion, area administradora, fechas, clasificacion/tipo/extension                                                    | Falta evolucionar item types para bienes no tecnologicos                                |
| 4. Responsable y asignacion patrimonial | PARCIAL    | Persona tenedora en `bd_inventory.user`, trazabilidad e historial                                                                    | Definir responsable patrimonial legal separado                                          |
| 5. Extensiones especificas              | PARCIAL    | `inventory_devices` existe como extension tecnologica 1:1                                                                            | Disenar extensiones de vehiculos, propiedades y bienes generales                        |
| 6. Catalogo de productos MEF            | PARCIAL    | `inventory_product_catalog` y synonyms existen                                                                                       | Integrarlo sin confundirlo con clasificacion ni stock                                   |
| 7. Almacen / Intake / Consumibles       | PARCIAL    | `warehouse_items`, `warehouse_stock`, `warehouse_movements`, API protegida y migracion versionada para catalogo, stock y movimientos | Implementar recepciones, despachos, documentos, orden de entrega, llantas/flota y actas |
| 8. Adquisicion                          | PENDIENTE  | No existe dominio completo de compras/OC/facturas/actas                                                                              | Disenar despues del intake base                                                         |
| 9. Documentos                           | PENDIENTE  | Existen uploads generales, no dominio documental de inventario/almacen                                                               | Tipos de documento, adjuntos, firmas, recibido conforme                                 |
| 10. Informacion patrimonial / MEF       | PENDIENTE  | Catalogo patrimonial existe, activos historicos aun concentrados en tecnologia                                                       | Confirmar campos de plaqueo y responsables con Bienes Patrimoniales                     |
| 11. Catalogo contable                   | PENDIENTE  | No existe `accounting_catalog`                                                                                                       | Requiere fuente documental                                                              |
| 12. Depreciacion                        | PENDIENTE  | No existen modelos ni reglas                                                                                                         | Requiere reglas oficiales                                                               |
| 13. Revaluos                            | PENDIENTE  | No existe historial de valoracion                                                                                                    | Requiere definicion funcional                                                           |
| 14. Transferencias y perdidas           | PARCIAL    | Transferencias sobre `bd_inventory`, snapshots, aprobacion e historial                                                               | Crear perdidas/reportes y conectar con bienes generales                                 |
| 15. Frontend                            | PARCIAL    | Inventario tecnologico funcional, clasificacion visible, paginacion/filtros/exportacion, Almacen y administracion de roles           | Crear UX separada: Tecnologia, Patrimonial general, Almacen                             |
| 16. Eliminacion legacy                  | PENDIENTE  | Campos legacy conservados intencionalmente                                                                                           | Solo al final, con migracion gradual validada                                           |

## Ya implementado - no repetir

- `bd_inventory` como activo principal del inventario patrimonial.
- `inventory_devices` como extension tecnologica 1:1.
- CRUD de inventario con compatibilidad legacy.
- Validacion de device/marca/modelo para tecnologia.
- Clasificacion patrimonial con `inventory_asset_types`, `inventory_asset_extensions`, `inventory_asset_classifications`, `inventory_asset_classification_mappings` y `inventory_asset_classification_rules`.
- Catalogo patrimonial oficial normalizado: 73 clasificaciones, 60 asignables y 123 mappings legacy.
- Reglas de clasificacion con soporte para `device_id`.
- Resolver central de clasificacion.
- Endpoint de resolucion de regla.
- Dry-run de reconciliacion.
- Reconcile real por lotes implementado, pero no debe ejecutarse sin aprobacion.
- Frontend de inventario tecnologico con clasificacion, tipo, extension, area, detalle, historial, exportacion, filtros y paginacion server-side.
- Transferencias de inventario con snapshots y aprobacion.
- Persona tenedora como texto libre en `bd_inventory.user`.
- Historial y auditoria de cambios principales.
- Modulo de toners con stock y movimientos, actualmente especializado y no generico.
- Modulo base de Almacen separado de `bd_inventory`: catalogo de consumibles, stock por ubicacion y movimientos `IN`/`OUT`/`ADJUSTMENT`.
- Endpoints protegidos de Almacen: `/api/warehouse/items`, `/api/warehouse/stock` y `/api/warehouse/movements`.
- Gestion administrativa de roles en `/admin/roles`: crear, editar y eliminar con proteccion contra roles asignados.
- API protegida `/api/roles` para CRUD de roles; la asignacion detallada de permisos permanece en `/admin/permissions`.
- El alta de roles usa modal con validacion local, normalizacion de espacios y actualizacion inmediata de la tabla.
- El rol `Administrador` no puede renombrarse ni eliminarse; sus permisos administrativos esenciales quedan protegidos.
- El módulo `/admin/permissions` ahora combina el catálogo vigente del código con los permisos almacenados, por lo que no oculta permisos nuevos mientras se sincroniza la base.
- Catálogo RBAC sincronizado con `prisma:seed:permissions`: se asignaron 9 permisos nuevos al rol Administrador; no se modificaron inventarios ni roles.
- Corregida la entrada duplicada de navegación `/inventario/equipos` que generaba warning de claves React.
- Aplicada la migración `20260902120000_add_warehouse_consumables` y regenerado Prisma; el esquema de Almacén ya está disponible para sus endpoints.
- Almacén usa como unidades cerradas las 31 unidades detectadas en `LISTADO DE STOCKS AGOSTO 2026.xlsx`; el backend también las valida para evitar errores de digitación.
- `category` en `warehouse_items` pertenece al dominio de Almacén, no a las categorías de incidencias; permanece opcional/NULL hasta recibir la lista oficial del encargado.
- El movimiento de Almacén inicia por defecto como `OUT` (salida); departamento es selector global independiente de la ubicación.
- `vehicle_target` no se muestra en el formulario general de insumos; se reserva para el futuro flujo de vehículos/llantas.
- El formulario de Almacén ya no permite escribir nombres, códigos ni unidades durante la operación: selecciona un `WarehouseItem` del catálogo y solo configura stock mínimo.
- No se asignan categorías automáticas desde el Excel; la categoría permanece opcional hasta recibir el catálogo oficial de Almacén.
- El selector de insumos busca por nombre o código contra `GET /api/warehouse/items?search=...` con paginación; movimientos y existencias usan únicamente `item_id`.
- Código, nombre, unidad y categoría se muestran como datos derivados de la selección; no son editables durante el movimiento.
- Administración incorpora `/admin/warehouse-items` para agregar, buscar, editar y activar/desactivar registros del catálogo `warehouse_items`, respetando permisos `warehouse_items.read/create/update`.
- El formulario administrativo de `warehouse_items` usa un selector cerrado con las 19 familias propuestas y `Sin categoría`; no permite escribir categorías manualmente y el backend valida la misma lista.
- En salidas, el departamento vuelve a filtrarse por la ubicación seleccionada y permanece bloqueado hasta elegir una ubicación; el backend conserva la validación de pertenencia.
- El formulario operativo ya no incluye una configuración duplicada de insumos: el catálogo se selecciona y los movimientos actualizan existencias.
- Las entradas (`IN`) se asignan automáticamente al departamento Almacén y a la ubicación asociada; no solicitan ubicación ni departamento al usuario.
- Las salidas (`OUT`) requieren ubicación y departamento solicitante; el historial muestra los tipos como Entrada/Salida/Ajuste y conserva ubicación y departamento.
- En las entradas, el receptor se toma automáticamente del usuario autenticado de la sesión.
- En las salidas, el receptor se escribe manualmente y es obligatorio, porque la persona que retira puede no tener cuenta en el sistema.
- Regla definitiva de salidas: cualquier departamento puede solicitar desde cualquier ubicación; el departamento no se filtra ni se compara con la ubicación.
- Las salidas usan el stock institucional total del `item_id`, sumando las existencias de todas las ubicaciones; la ubicación seleccionada se registra como solicitud y se consume primero cuando tiene saldo, continuando con otras ubicaciones si es necesario.
- Si el total institucional no alcanza, la salida se rechaza con `Stock institucional insuficiente`; el departamento nunca participa en el cálculo.
- En una salida, el historial conserva la ubicación seleccionada por el operador y el departamento solicitante; el descuento interno puede tomar stock de una o varias ubicaciones físicas, sin alterar la ubicación de la entrada ni duplicar la salida en el historial.
- Las entradas se dirigen al departamento exacto `Almacén` de la ubicación `Carrasquilla`; no se usa el almacén de P.H. Multiplaza.
- Los movimientos `ADJUSTMENT` también se asignan automáticamente a `Almacén` en `Carrasquilla`, porque representan actualización del inventario interno.
- La interfaz principal muestra `Motivo del ajuste` obligatorio y `Observación` opcional al seleccionar `Ajuste`, alineados con la validación backend.
- Almacén muestra Existencias actuales como vista principal; Registrar movimiento se abre desde un botón desplegable y Últimos movimientos se consulta desde el botón Historial junto a Actualizar.
- El historial ahora tiene página independiente en `/almacen/historial`; la vista principal ya no lo despliega debajo de Existencias.
- El historial usa el formateador compartido con fecha abreviada y hora de 12 horas AM/PM.
- El historial incluye la columna `Despachado por`, tomada del usuario autenticado que registra el movimiento mediante `created_by`.
- Existencias e historial cuentan ahora con búsqueda por texto y exportación Excel de todas las páginas filtradas.
- Las salidas pueden agrupar varios insumos mediante `/api/warehouse/movements/batch`, con una sola ubicación, departamento y receptor; la operación es atómica y crea una línea histórica por insumo.
- El registro de movimientos se presenta en modal paso a paso: primero tipo y destino; después insumos, cantidades y receptor/motivo. La pantalla principal ya no muestra el formulario inline.
- Las entradas también admiten varios insumos en una sola recepción mediante `/api/warehouse/movements/batch-in`, con operación atómica, destino automático Almacén/Carrasquilla y receptor de sesión.
- Los movimientos solo muestran insumos activos del catálogo; el paso 1 del modal presenta Movimiento, Ubicación y Departamento en columna vertical, y ordena alfabéticamente las ubicaciones y departamentos disponibles.
- Gestión de usuarios corregida: creación y edición persisten `id_ubication` e `id_department`, y backend valida que el departamento pertenezca a la ubicación; se puede limpiar la asignación sin conservar valores antiguos.
- La autorización frontend de roles dinámicos ya no depende del mapa de IDs 1-4: el panel Admin usa `users.read`, navegación usa permisos efectivos y roles personalizados no son forzados a `trabajador`.
- El importador `warehouse:import-catalog` permanece sin ejecutar y deberá ajustarse a esta regla antes de una futura carga: detectar duplicados y reportarlos sin fusionarlos ni clasificar categorías automáticamente.
- El importador fue convertido a dry-run por defecto: `npm run warehouse:import-catalog -w apps/backend` no escribe; `--apply` queda reservado para una aprobación posterior.
- Dry-run del Excel: 6,288 filas válidas, 0 inválidas, 0 códigos duplicados, 220 grupos de nombres duplicados normalizados, 6,288 candidatos nuevos y 0 existentes por código.
- El dry-run no cargó stock, cantidades, categorías ni valor; los 220 grupos deben revisarse antes de una importación real.
- Se eliminó el índice único `warehouse_items_name_key` mediante la migración `20260902183000_allow_duplicate_warehouse_item_names`; `code` permanece único y `name` tiene ahora índice no único.
- La carga controlada del catálogo se completó por `code`: 6,288 `warehouse_items`, sin cargar `warehouse_stock` ni `warehouse_movements`; las categorías permanecen NULL.
- Dry-run posterior idempotente: 6,288 válidas, 0 inválidas, 0 códigos duplicados, 220 nombres duplicados normalizados, 0 nuevos y 6,288 existentes por código.

## Estado real observado

- `bd_inventory`: auditoria previa observo 1972 registros en BD local.
- Todos los inventarios observados tenian fila en `inventory_devices`.
- Todos los inventarios observados estaban en area `TECNOLOGIA`.
- La mayoria seguia clasificada como `12040320 Equipo informatico`.
- Existe regla para `Proyector -> 12040310`, pero los inventarios historicos no deben tocarse sin dry-run/reconcile aprobado.
- Hay discrepancia historica entre 1971 y 1972 inventarios; la investigacion del registro adicional queda pendiente si no hay conexion read-only disponible.

## Diseno aprobado como rumbo: inventory_item_types

Recomendacion vigente: Alternativa B.

- `devices` queda exclusivo para tecnologia.
- Se introduce `inventory_item_types` como catalogo generico de tipos de bienes patrimoniales.
- `bd_inventory` debera apuntar a `inventory_item_type_id`.
- Los bienes tecnologicos podran enlazar su item type con `devices`.
- Los bienes no tecnologicos no deben requerir device, brand, model, IP ni serie si funcionalmente no aplica.

### Modelo conceptual objetivo

```text
bd_inventory
  -> inventory_item_types
      -> asset_type default
      -> extension default opcional
      -> classification rules
      -> inventory_asset_classifications

inventory_devices
  -> solo datos tecnologicos

warehouse_items
  -> stock consumible de almacen
```

### Propuesta conceptual de `inventory_item_types`

| Campo                      | Uso                      | Reglas                                |
| -------------------------- | ------------------------ | ------------------------------------- |
| `id`                       | PK interna               | Obligatorio                           |
| `code`                     | Identificador estable    | UNIQUE, editable solo con control     |
| `name`                     | Nombre visible           | UNIQUE o UNIQUE normalizado           |
| `description`              | Contexto funcional       | Opcional                              |
| `asset_type_id`            | Tipo general sugerido    | FK obligatoria o nullable transitoria |
| `extension_id`             | Extension sugerida       | FK nullable                           |
| `device_id`                | Enlace si es tecnologico | FK nullable, UNIQUE parcial           |
| `is_technological`         | Derivado/flag de control | Debe coincidir con `device_id`        |
| `active`                   | Baja logica              | Default true                          |
| `created_at`, `updated_at` | Auditoria tecnica        | Automaticos                           |

Reglas de integridad futuras:

- Si `is_technological = true`, debe existir `device_id`.
- Si `device_id` existe, el item type representa un tipo tecnologico.
- Si `is_technological = false`, `device_id` debe ser NULL.
- No permitir dos item types activos para el mismo device.

## Matriz conceptual de migracion de devices actuales

| Device actual             | Item type propuesto       | Tecnologico | Device conservado     | Observacion                                               |
| ------------------------- | ------------------------- | ----------- | --------------------- | --------------------------------------------------------- |
| Laptop                    | Laptop                    | Si          | Si                    | Mantener                                                  |
| Todo en 1                 | Todo en 1                 | Si          | Si                    | Mantener                                                  |
| Torre                     | Torre/PC                  | Si          | Si                    | Definir nombre oficial                                    |
| Monitor                   | Monitor                   | Si          | Si                    | Mantener                                                  |
| Teclado                   | Teclado                   | Si          | Si                    | Puede ser periferico                                      |
| Impresora                 | Impresora                 | Si          | Si                    | Mantener relacion con toners                              |
| Router                    | Router                    | Si          | Si                    | Comunicaciones                                            |
| Switch                    | Switch                    | Si          | Si                    | Probable comunicaciones                                   |
| Telefono                  | Telefono                  | Si          | Si                    | Comunicaciones                                            |
| Celular                   | Celular                   | Si          | Si                    | Comunicaciones                                            |
| Radio Telecomunicaciones  | Radio Telecomunicaciones  | Si          | Si                    | Comunicaciones                                            |
| Servidor                  | Servidor                  | Si          | Si                    | Mantener                                                  |
| UPS                       | UPS                       | Si          | Si                    | Revisar posible energia `12040305`                        |
| Regulador                 | Regulador                 | Si          | Si                    | Revisar posible energia `12040305`                        |
| Proyector                 | Proyector                 | Si          | Si                    | Regla futura/actual hacia `12040310`                      |
| Pantalla de Proyector     | Pantalla de Proyector     | POR DEFINIR | Si por compatibilidad | Puede no ser device tecnologico puro                      |
| Camara de Seguridad       | Camara de Seguridad       | Si          | Si                    | Revisar `12040312`                                        |
| Grabador de video digital | Grabador de video digital | Si          | Si                    | Seguridad/video                                           |
| Dron                      | Dron                      | Si          | Si                    | Clasificacion por definir                                 |
| HD Externo                | HD Externo                | Si          | Si                    | Equipo informatico                                        |
| Docking Station           | Docking Station           | Si          | Si                    | Equipo informatico                                        |
| Bocinas                   | Bocinas                   | Si          | Si                    | Clasificacion por definir                                 |
| Consola                   | Consola                   | Si          | Si                    | Clasificacion por definir                                 |
| Extersor                  | Extersor                  | Si          | Si                    | Posible typo de Extensor; no corregir dato sin aprobacion |

## Bienes futuros patrimoniales

| Bien                | Item type           | Asset Type                     | Extension                | Device     | Clasificacion                            |
| ------------------- | ------------------- | ------------------------------ | ------------------------ | ---------- | ---------------------------------------- |
| Aire acondicionado  | Aire acondicionado  | PROPERTY o POR DEFINIR         | POR DEFINIR              | No         | `12040301` probable, requiere aprobacion |
| Herramienta         | Herramienta         | PROPERTY                       | PROPERTIES o POR DEFINIR | No         | `12040321`                               |
| Escritorio          | Escritorio          | PROPERTY                       | PROPERTIES o POR DEFINIR | No         | `12040322` probable                      |
| Silla               | Silla               | PROPERTY                       | PROPERTIES o POR DEFINIR | No         | `12040322` probable                      |
| Equipo medico       | Equipo medico       | PROPERTY o POR DEFINIR         | POR DEFINIR              | No         | `12040303`                               |
| Equipo de energia   | Equipo de energia   | PROPERTY o POR DEFINIR         | POR DEFINIR              | No         | `12040305`                               |
| Equipo de seguridad | Equipo de seguridad | PROPERTY/TECHNOLOGY segun caso | POR DEFINIR              | Segun caso | `12040312`                               |
| Vehiculo            | Vehiculo            | VEHICLE                        | VEHICLES                 | No         | `12040302`                               |
| Terreno             | Terreno             | PROPERTY                       | PROPERTIES               | No         | `12040101/12040102`                      |

## Campos comunes vs especificos

Comunes a cualquier bien patrimonial:

- marbete/tag, descripcion/nombre, estado, condicion, ubicacion, departamento, area administradora, persona tenedora, observacion, clasificacion, tipo de bien.

Tecnologicos:

- device, marca/modelo tecnologico, IP, MAC futura, sistema operativo futuro, datos de red.

Categoria especifica:

- vehiculo: placa, chasis, motor, tipo, combustible, odometro.
- aire acondicionado: BTU/capacidad, tipo, ubicacion tecnica.
- llanta: medida, vehiculo destino, lote, salida.
- mobiliario: material, dimensiones, cantidad si aplica.
- consumible: unidad, stock, minimo, lote, vencimiento opcional.

Candidato futuro:

- sistema de atributos por tipo de bien, pero no implementar antes de estabilizar item types y Almacen.

## Diseno futuro de reglas de clasificacion

Prioridad recomendada:

1. `item_type + administrative_area`
2. `item_type`
3. `device + administrative_area`
4. `device`
5. `asset_type + extension + administrative_area`
6. `asset_type + extension`
7. default

Comportamiento:

- Si hay multiples reglas activas para el mismo alcance exacto, debe fallar con conflicto administrativo.
- Si no hay regla, permitir guardar sin clasificacion solo si el flujo lo permite y dejarlo visible como pendiente.
- Una regla para Telefono no debe afectar Celular: item type/device deben ser scopes exactos.
- El reconcile historico solo debe ejecutarse despues de dry-run revisado.

## Modulo en construccion: Almacen / Consumibles

El inventario de consumibles no debe usar `bd_inventory` como si cada unidad de papel, agua o llanta fuese un activo plaqueable.

### Modelo conceptual

```text
warehouse_items
  -> catalogo de insumos consumibles
warehouse_stock
  -> existencia actual por item/ubicacion
warehouse_movements
  -> entradas, salidas, ajustes
warehouse_receipts
  -> recepciones desde proveedor/compra
warehouse_dispatches
  -> ordenes de entrega a departamentos
warehouse_documents
  -> factura, orden de compra, recibido conforme, memo, acta
```

### Casos funcionales iniciales

- Entrada por orden de compra/factura.
- Salida por orden de entrega de materiales.
- Retiro por departamento solicitante.
- Historial de entradas y salidas.
- Stock fisico en vivo.
- Consumibles sin codigo por caja menuda.
- Llantas por medida con despacho hacia vehiculo.
- Memo de recepcion a Bienes Patrimoniales cuando aplique plaqueo.
- Acuse/acta final para Compras y proveedores.

### Toners

El modulo de toners existente demuestra el patron stock + movimientos, pero esta especializado por impresora/modelo/color. Debe evaluarse si:

- se mantiene como submodulo especializado;
- se migra gradualmente a `warehouse_items`;
- o se integra como categoria de consumible manteniendo compatibilidad.

No eliminar toners sin migracion aprobada.

## Impacto esperado en Prisma

- Agregar `inventory_item_types`: riesgo medio.
- Agregar `bd_inventory.inventory_item_type_id` nullable inicialmente: riesgo medio.
- Agregar relacion opcional item type -> device: riesgo medio.
- Hacer nullable futuros `id_device`, `id_brand`, `id_model` en `bd_inventory`: riesgo alto si se hace antes de adaptar backend/frontend.
- Agregar tablas de almacen/consumibles: riesgo medio, si son paralelas y no rompen inventario actual.
- Agregar documentos de almacen/intake: riesgo medio.
- Agregar vehiculos/flota para llantas: riesgo medio/alto por dependencia funcional.

## Impacto esperado en backend

Modulos acoplados a `devices`:

- `inventory.service`
- `inventory.repository`
- `inventory.validator`
- `inventory.dto`
- `inventory-update.service`
- `inventory-classification.service`
- `classification-rules.*`
- `devices.*`
- `models.*`
- `toners.*`
- `inventoryTransferRequests.*`
- `activity.resolver`

Cambios futuros:

- Crear services/repositories separados para Almacen.
- Mantener API actual de equipos durante transicion.
- Agregar API de item types.
- Adaptar resolver para item types sin romper device rules.
- Adaptar DTO para distinguir tecnologia, patrimonial general y consumible.

## Impacto esperado en frontend

Pantallas futuras recomendadas:

- Inventario > Equipos tecnologicos
- Inventario > Bienes patrimoniales
- Almacen > Consumibles
- Almacen > Movimientos
- Almacen > Recepciones
- Almacen > Despachos
- Almacen > Llantas

El formulario actual de equipos no debe absorber todos los bienes. Debe mantenerse para tecnologia mientras se crea un formulario patrimonial general y otro de consumibles.

## Estrategia gradual

1. Actualizar documentacion y cerrar diseno.
2. Crear `inventory_item_types` nullable y sembrar tipos desde devices actuales.
3. Backfill controlado de `bd_inventory.inventory_item_type_id`.
4. Adaptar resolver para item type conservando device.
5. Crear CRUD administrativo de item types.
6. Separar UI de equipos tecnologicos vs bienes patrimoniales.
7. [HECHO] Crear modulo base de Almacen con consumibles, stock y movimientos.
8. Agregar recepciones, despachos, documentos y llantas.
9. Ejecutar dry-runs antes de cualquier reconcile/backfill patrimonial.
10. Solo al final evaluar eliminacion/nullable de campos legacy.

## Riesgos y decisiones pendientes

## Fuera de esta fase

- Documentos físicos, escaneos, carga de archivos, recibido conforme, memos y acta de aceptación final.
- Integración de impresión con ISTMO.
- Catálogo de vehículos/flota y trazabilidad completa de llantas por vehículo.

## Riesgos y decisiones pendientes

proxima implementacion recomendada (nota historica, reemplazada el 2026-10-01): Fase 7 recepciones y despachos formales; no iniciar hasta resolver las reglas institucionales enumeradas en Etapa D.

- Definir responsable patrimonial legal separado de persona tenedora.
- Decidir si marca/modelo sera catalogo generico o se mantiene solo tecnologico.
- Definir si serie es obligatoria por tipo de bien.
- Definir extensiones para propiedades, vehiculos, aires, mobiliario y herramientas.
- Definir si llantas requieren catalogo de vehiculos/flota antes del despacho.
- Definir documentos obligatorios por recepcion: factura, orden de compra, recibido conforme, memo, acta.
- Investigar diferencia 1971 vs 1972 inventarios con consulta read-only cuando sea posible.

## Estado de control

```text
All.md: actualizado como plan maestro vivo
schema.prisma: incluye indices de historial y clave de idempotencia aditivos
migraciones creadas en esta etapa: 2 (`20261001123000_add_inventory_history_pagination_indexes`, `20261001130000_add_warehouse_movement_idempotency`)
migraciones ejecutadas en esta etapa: 0
INSERT/UPDATE/DELETE BD en esta actualizacion documental: 0
seeds en esta actualizacion documental: 0
reconcile en esta actualizacion documental: 0
proxima implementacion recomendada: Fase 7 recepciones y despachos formales
```

## Backlog priorizado vigente - 2026-10-01

- **P1 - Verificar integridad de auditoria y Almacen en PostgreSQL aislado.** Dependencia: instancia efimera o base descartable verificable, usuario exclusivo y schema aislado. Ejecutar migraciones pendientes en ese entorno y probar rollback, insercion de auditoria, idempotencia concurrente y proteccion de stock. Criterio de cierre: resultados reproducibles y sin escrituras a `aaud_system` local/productivo. Bloqueado por falta de entorno.
- **P1 - Coordinar el despliegue de idempotencia de Almacen.** La API nueva requiere `20261001130000_add_warehouse_movement_idempotency`; aplicar primero solo en un entorno aislado, medir impacto y definir ventana antes de cualquier despliegue. No aplicar migracion ahora.
- **P2 - AUD-06: validar diseno de identidad tecnologica.** Requiere revision/aprobacion del cambio de identidad y una base read-only para inventario de integridad; conservar el diseno aditivo y las columnas legacy hasta completar fases de transicion.
- **P2 - Completar validacion UX de AUD-05.** Con API de pruebas disponible, provocar error de historial, comprobar mensaje, reintento, carga y estado vacio separados. La compilacion ya esta verificada; la interaccion no.
- **P2 - Evaluar busqueda historica por nombres resueltos para eventos legacy.** AUD-04 hoy busca texto guardado en snapshots/actor. La resolucion requiere consultar varios catalogos por cada log y duplicar el predicado para conteo y pagina; no extender la consulta hasta demostrar con `EXPLAIN (ANALYZE, BUFFERS)` en una copia aislada que el costo es aceptable. No cambiar el significado ni alterar registros.
- **P2 - Formalizar recepciones/despachos de Fase 7.** No iniciar modelos ni permisos hasta acordar responsables/aprobaciones, documentos requeridos, anulacion compensatoria, semantica de ajustes y datos obligatorios de despacho. Avanzar solo en partes que no presupongan esas reglas.

**Siguiente tarea seleccionada:** cuando exista PostgreSQL aislado, medir el plan/costo de buscar etiquetas resueltas en snapshots legacy y decidir entre optimizar esa consulta o conservar la limitacion actual. Mientras tanto, seguir con mejoras frontend/API que no requieran cambiar reglas de negocio ni asumir costos SQL. La falta de entorno bloquea esa medicion, no el desarrollo independiente ya completado en este avance. La recomendacion anterior de iniciar recepciones formales queda reemplazada por este backlog y las dependencias institucionales de Etapa D.

## Auditoría general para revisión del usuario - 2026-10-01

**Alcance y restricciones:** revisión estática dirigida de los flujos de autenticación/RBAC, incidencias y sockets, inventario/traslados, tóneres, Almacén, Prisma/migraciones y despliegue. No se ejecutaron pruebas, solicitudes API, consultas de base de datos, migraciones ni operaciones de escritura durante esta auditoría. No se usó la interfaz ni se verificó producción. El árbol ya tenía cambios locales; se conservaron. Solo se actualiza esta documentación.

**Conteo:** 13 observaciones: P0=1, P1=3, P2=7, P3=2. Evidencia: CONFIRMADA EN CÓDIGO=6; RIESGO TÉCNICO=2; PENDIENTE DE VALIDACIÓN DE BASE DE DATOS=3; PENDIENTE DE VERIFICACIÓN MANUAL=1; MEJORA PROPUESTA=1. Los estados describen evidencia del repositorio, no incidentes reproducidos en producción. Estado de decisión inicial en todos los casos: `PENDIENTE DE MI REVISIÓN`.

### Seguridad y autenticación

#### OBS-001 - Registro público permite seleccionar cualquier rol

- **Módulo / prioridad / evidencia:** autenticación y RBAC; P0 — CONFIRMADA EN CÓDIGO.
- **Observación:** `POST /api/auth/register` está fuera de `authMiddleware`. El cuerpo exige `id_rol`; el servicio solo confirma que exista, crea la cuenta con `active: true` y no requiere invitación ni aprobación. El resolver de permisos asigna `*.*` a los roles cuyo nombre sea Administrador/Admin. No se encontró una pantalla frontend de registro, pero el endpoint REST permanece expuesto.
- **Evidencia técnica:** `apps/backend/src/modules/routes.js`, `modules/auth/auth.routes.js`, `modules/auth/auth.validator.js`, `modules/auth/auth.service.js`, `common/rbac/permissions.service.js`, `app.js` (el limitador cubre login, no registro).
- **Verificación manual segura:** 1. En un staging desechable, identificar el ID del rol administrador. 2. Sin encabezado Authorization, enviar un registro válido con ese `id_rol`. 3. Intentar iniciar sesión con la cuenta creada y consultar permisos efectivos. No hacerlo en producción ni en una base compartida.
- **Esperado:** el registro anónimo se rechaza o crea una cuenta limitada/inactiva conforme a una política aprobada.
- **Indicador del problema:** respuesta 201, usuario activo y permisos efectivos administrativos.
- **Impacto:** acceso administrativo no autorizado a inventario, usuarios, permisos y demás módulos.
- **Solución propuesta, no implementada:** retirar el registro público o usar invitación/aprobación y rol inicial no privilegiado asignado por servidor; limitar intentos.
- **Pruebas necesarias:** integración de registro anónimo, elección de rol privilegiado, inicio de sesión y resolución efectiva de permisos.
- **Dependencias/decisión:** confirmar si alguna entidad externa debe auto-registrarse. **Decisión: PENDIENTE DE MI REVISIÓN.**

#### OBS-009 - El rol de administrador de un token sigue autorizando cambio de contraseñas

- **Módulo / prioridad / evidencia:** usuarios/autenticación; P2 — RIESGO TÉCNICO.
- **Observación:** los JWT expiran en 60 minutos y contienen el nombre de rol. `PUT /api/users/:id/password` requiere autenticación, pero no permiso RBAC; el servicio permite cambiar contraseñas ajenas si `actor.role` del token dice admin. El router de usuarios no monta `attachUserContext`, y el servicio no vuelve a consultar el rol actual antes de permitir esa operación.
- **Evidencia técnica:** `modules/auth/auth.service.js`, `modules/users/users.routes.js`, `modules/users/users.controller.js`, `modules/users/users.service.js`, `common/middleware/authMiddleware.js`.
- **Verificación manual segura:** 1. En staging, iniciar sesión con una cuenta administradora y conservar el token. 2. Con otra cuenta autorizada, cambiar el rol de la primera a uno no administrador. 3. Usar el token anterior para solicitar cambio de contraseña de un tercer usuario. No modificar cuentas reales.
- **Esperado:** el token antiguo pierde privilegios al revocarse/cambiarse el rol, o la operación exige una capacidad administrativa vigente.
- **Indicador del problema:** el token anterior cambia la contraseña de otro usuario hasta que expire.
- **Impacto:** ventana temporal para tomar o bloquear cuentas tras una degradación de rol.
- **Solución propuesta, no implementada:** verificar en base de datos el rol/estado vigente o autorizar mediante permiso efectivo actual y definir invalidación de sesiones al cambiar privilegios.
- **Pruebas necesarias:** token previo a degradación, token expirado, cambio propio y cambio administrativo autorizado/no autorizado.
- **Dependencias/decisión:** definir política institucional de revocación inmediata. **Decisión: PENDIENTE DE MI REVISIÓN.**

### Incidencias y tiempo real

#### OBS-002 - Las incidencias no se limitan por técnico en backend ni en sockets

- **Módulo / prioridad / evidencia:** incidencias, API y Socket.IO; P1 — CONFIRMADA EN CÓDIGO.
- **Observación:** el catálogo RBAC y su seed asignan `incidents.read` al rol Técnico por defecto; no se consultaron los grants efectivos actuales. `GET /api/incidents` ignora el usuario de la solicitud y el servicio/repositorio devuelve todas las incidencias sin paginación. La UI filtra por técnico asignado después de descargar los datos. Socket.IO solo verifica que exista un JWT válido; permite `joinIncidentRoom` con cualquier ID y los eventos de creación se emiten globalmente. El filtro visual no protege el API ni el canal realtime.
- **Evidencia técnica:** `common/rbac/permissions.catalog.js`, `modules/incidents/incidents.routes.js`, `incidents.controller.js`, `incidents.service.js`, `incidents.repository.js`, `apps/frontend/src/modules/incidents/hooks/useIncidentsPage.js`, `config/socket.js`, `modules/incidents/incidentNotificationService.js`.
- **Verificación manual segura:** 1. En staging, iniciar sesión como técnico con incidencias asignadas. 2. Consultar `GET /api/incidents` y comparar la respuesta con los IDs asignados. 3. Conectar Socket.IO usando el mismo token y solicitar una sala de un incidente no asignado; observar eventos de actualización. No consultar datos de personas reales.
- **Esperado:** la respuesta REST contiene solo filas autorizadas y paginadas; el socket rechaza salas fuera del alcance del usuario y no distribuye detalles a clientes no autorizados.
- **Indicador del problema:** la API devuelve descripciones/correos de incidencias ajenas o el socket entrega actualizaciones de otra sala.
- **Impacto:** exposición de datos de reportantes y carga de datos ilimitada al navegador; posibilidad de suscribirse a eventos fuera del alcance de la UI.
- **Solución propuesta, no implementada:** aplicar alcance por usuario/rol en backend antes de consultar, paginar en servidor, validar autorización al entrar a una sala y revisar emisiones globales.
- **Pruebas necesarias:** pruebas de integración REST por rol, volumen/paginación, autorización de salas y distribución de eventos.
- **Dependencias/decisión:** confirmar qué roles pueden ver incidencias globales y cuáles solo asignadas. **Decisión: PENDIENTE DE MI REVISIÓN.**

#### OBS-003 - El formulario público atribuye todos los reportes al usuario 2

- **Módulo / prioridad / evidencia:** creación de incidencias; P1 — CONFIRMADA EN CÓDIGO.
- **Observación:** `/crear-incidencia` es una ruta pública y monta `IncidentForm` con `loggedUserId={2}`. El formulario envía ese valor como `id_user`; el endpoint `POST /api/incidents` tampoco exige autenticación y acepta el ID proporcionado. No hay limitador de solicitudes para esta ruta en `app.js`, y cada alta programa notificaciones internas y al correo enviado.
- **Evidencia técnica:** `apps/frontend/src/app/App.jsx`, `modules/incidents/pages/CreateIncidentPage.jsx`, `modules/incidents/hooks/useIncidentForm.js`, `modules/incidents/incidents.routes.js`, `modules/incidents/incidents.validator.js`, `modules/incidents/incidentService.js`, `modules/incidents/incidentNotificationService.js`, `app.js`.
- **Verificación manual segura:** 1. En staging con correo de prueba, abrir `/crear-incidencia` sin sesión y enviar un reporte ficticio. 2. Revisar el `id_user` guardado y la respuesta. 3. Comprobar que solicitudes anónimas repetidas se limitan, sin hacer pruebas de carga.
- **Esperado:** la atribución sigue una política explícita (usuario autenticado, cuenta de servicio o solicitante anónimo separado) y el endpoint limita abuso.
- **Indicador del problema:** el reporte se registra siempre con `id_user=2`, un llamante puede seleccionar cualquier ID existente o se generan notificaciones sin protección contra abuso.
- **Impacto:** historial de autoría incorrecto, suplantación de reportante y spam de tickets/correos.
- **Solución propuesta, no implementada:** derivar identidad desde sesión o modelar explícitamente reportes anónimos; añadir límites de frecuencia y controles antiabuso acordes con el flujo público.
- **Pruebas necesarias:** alta autenticada/anónima, suplantación de `id_user`, límites por IP y verificación con servicio de correo aislado.
- **Dependencias/decisión:** confirmar si el formulario debe ser público y cuál es la identidad legal del reportante. **Decisión: PENDIENTE DE MI REVISIÓN.**

#### OBS-005 - La numeración de tickets puede colisionar en altas simultáneas

- **Módulo / prioridad / evidencia:** incidencias/PostgreSQL; P2 — PENDIENTE DE VALIDACIÓN DE BASE DE DATOS.
- **Observación:** dentro de la transacción, el servicio lee el ticket máximo y calcula `máximo + 1`; la columna tiene restricción única. Dos transacciones concurrentes pueden observar el mismo máximo y competir por el mismo número. La transacción no usa un contador bloqueado ni reintenta una violación única.
- **Evidencia técnica:** `modules/incidents/incidentService.js` (`findFirst` + incremento), `prisma/schema.prisma` (`ticket_number @unique @default(autoincrement())`).
- **Verificación manual segura:** 1. En PostgreSQL de staging, enviar simultáneamente dos altas válidas. 2. Revisar ambas respuestas y los tickets creados. No ejecutarlo en producción.
- **Esperado:** ambos reportes se crean con números distintos y secuenciales según la política vigente.
- **Indicador del problema:** una petición falla por colisión/`P2002` o se pierde el reporte aunque el usuario reciba error.
- **Impacto:** alta de incidencias intermitentemente fallida en picos de uso.
- **Solución propuesta, no implementada:** usar un mecanismo atómico de secuencia/contador y definir reintento controlado ante conflicto.
- **Pruebas necesarias:** concurrencia real, verificación de unicidad y recuperación de secuencia tras fallos.
- **Dependencias/decisión:** definir si la secuencia debe ser estrictamente continua o solo única. **Decisión: PENDIENTE DE MI REVISIÓN.**

#### OBS-007 - La creación de incidencias no comprueba que departamento y ubicación coincidan

- **Módulo / prioridad / evidencia:** incidencias/datos relacionales; P2 — CONFIRMADA EN CÓDIGO.
- **Observación:** el alta convierte `id_ubication` e `id_department` de forma independiente; solo se comprueba que las claves foráneas existan. No se verifica que el departamento pertenezca a esa ubicación, a diferencia del servicio de usuarios.
- **Evidencia técnica:** `modules/incidents/incidentService.js` (`buildCreateData`), `modules/incidents/incidents.repository.js`, relaciones `bd_incidents` de `prisma/schema.prisma`, `modules/users/users.service.js` (`validateLocationAssignment`).
- **Verificación manual segura:** 1. En staging, elegir IDs válidos de dos ubicaciones distintas. 2. Enviar un alta ficticia con departamento de la ubicación B y ubicación A. 3. Consultar el reporte resultante.
- **Esperado:** API rechaza la combinación antes de guardar.
- **Indicador del problema:** la incidencia se crea con relación ubicación/departamento incoherente.
- **Impacto:** asignación, reportes o notificaciones pueden dirigir el caso al área equivocada.
- **Solución propuesta, no implementada:** validar en backend la relación del departamento con la ubicación.
- **Pruebas necesarias:** caso válido, IDs inexistentes y combinación cruzada en integración.
- **Dependencias/decisión:** ninguna regla nueva; confirmar si existen excepciones operativas.
- **Estado de decisión:** `PENDIENTE DE MI REVISIÓN`.

#### OBS-008 - El cuerpo de actualización de incidencias no tiene esquema de validación

- **Módulo / prioridad / evidencia:** incidencias/validación API; P2 — CONFIRMADA EN CÓDIGO.
- **Observación:** `validateUpdateIncident` valida solo el parámetro `id`. Un estado no reconocido se convierte en `undefined` en vez de producir error. Si llega junto a otro campo válido, ese campo puede aplicarse mientras el estado inválido se ignora.
- **Evidencia técnica:** `modules/incidents/incidents.routes.js`, `modules/incidents/incidents.validator.js`, `modules/incidents/incidentUpdateService.js` (`parseRequestedStatus`, `buildUpdateData`).
- **Verificación manual segura:** 1. En staging, usar una incidencia no resuelta y una cuenta con `incidents.update`. 2. Enviar una actualización con estado inválido y otro campo válido. 3. Comparar respuesta y registro antes/después.
- **Esperado:** la petición completa se rechaza con 400 y no cambia ningún campo.
- **Indicador del problema:** respuesta exitosa donde el campo válido cambió, pero el estado inválido fue ignorado.
- **Impacto:** el cliente puede creer que una transición ocurrió cuando la base conserva el estado anterior.
- **Solución propuesta, no implementada:** validar el cuerpo con un esquema parcial y enum explícito; rechazar campos desconocidos/estados inválidos.
- **Pruebas necesarias:** estado permitido/no permitido, combinaciones de campos y ausencia de escrituras parciales.
- **Dependencias/decisión:** confirmar los estados oficiales y transiciones permitidas.
- **Estado de decisión:** `PENDIENTE DE MI REVISIÓN`.

### Inventario y traslados

#### OBS-006 - Solicitudes concurrentes pueden duplicar un traslado pendiente

- **Módulo / prioridad / evidencia:** transferencias de inventario/PostgreSQL; P2 — PENDIENTE DE VALIDACIÓN DE BASE DE DATOS.
- **Observación:** `create` busca una solicitud `PENDING` y luego inserta fuera de transacción. El esquema solo indexa `inventory_id`; no declara unicidad para una solicitud pendiente por activo. La aprobación sí usa bloqueo y actualización condicional; no se reporta ese control como defectuoso.
- **Evidencia técnica:** `modules/inventoryTransferRequests/inventoryTransferRequests.service.js` (`create`), `prisma/schema.prisma` (`inventory_transfer_requests`).
- **Verificación manual segura:** 1. En staging, enviar a la vez dos solicitudes para el mismo activo desde dos sesiones autorizadas. 2. Revisar las respuestas y el listado de pendientes.
- **Esperado:** una sola solicitud pendiente; la otra recibe conflicto.
- **Indicador del problema:** ambas peticiones se aceptan y aparecen dos filas pendientes para el mismo activo.
- **Impacto:** revisión ambigua y posibilidad de aprobar destinos contradictorios.
- **Solución propuesta, no implementada:** serializar la comprobación/inserción por activo y/o agregar una restricción compatible que impida duplicados pendientes.
- **Pruebas necesarias:** carrera concurrente real, solicitud posterior a rechazo/aprobación y aprobación simultánea.
- **Dependencias/decisión:** confirmar si se permite más de una solicitud pendiente por activo. **Decisión: PENDIENTE DE MI REVISIÓN.**

#### OBS-013 - Los traslados usan una lista fija de nombres de rol

- **Módulo / prioridad / evidencia:** transferencias/RBAC; P3 — MEJORA PROPUESTA.
- **Observación:** las rutas de traslados usan `requireRole('admin', 'tecnico', 'consultor')`, mientras otras áreas del sistema admiten roles dinámicos y permisos efectivos. Un rol personalizado no puede acceder aunque tenga permisos generales de inventario; no se encontró un permiso granular específico de solicitudes de traslado en esta revisión.
- **Evidencia técnica:** `modules/inventoryTransferRequests/inventoryTransferRequests.routes.js`, `common/middleware/requireRole.js`, `common/middleware/requirePermission.js`, `apps/frontend/src/modules/inventory/devices/pages/InventoryPage.jsx`.
- **Verificación manual segura:** 1. En staging, crear un rol personalizado con permisos equivalentes de inventario. 2. Intentar crear y consultar una solicitud desde la UI y API. 3. Comparar con Técnico/Consultor.
- **Esperado:** depende de si la elegibilidad de traslado debe seguir siendo exclusivamente por rol canónico o configurar permisos granulares.
- **Indicador del problema:** la UI ofrece la acción al rol personalizado y el API responde 403, o el usuario autorizado por política no puede completar el flujo.
- **Impacto:** comportamiento inconsistente para roles institucionales personalizados.
- **Solución propuesta, no implementada:** decidir y documentar los roles elegibles; si deben ser configurables, definir permisos específicos y hacer que UI/backend usen el mismo contrato.
- **Pruebas necesarias:** matriz de roles canónicos y personalizados con permisos concedidos/denegados.
- **Dependencias/decisión:** definición institucional de quién puede solicitar y revisar traslados.
- **Estado de decisión:** `PENDIENTE DE MI REVISIÓN`.

### Tóneres y documentos

#### OBS-010 - El helper de carga de documentos de movimientos de tóner no tiene ruta backend

- **Módulo / prioridad / evidencia:** tóneres/adjuntos; P3 — CONFIRMADA EN CÓDIGO.
- **Observación:** existe `Toners.uploadDocument` apuntando a `POST /api/toner-movements/:id/upload`, además de controller, service, validator y Multer; `tonerMovements.routes.js` registra solamente GET y POST de movimientos y no conecta el handler de carga. No se encontró un componente frontend que invoque el helper.
- **Evidencia técnica:** `apps/frontend/src/modules/inventory/toners/services/toners.api.js`, `modules/tonerMovements/tonerMovements.routes.js`, `.controller.js`, `.service.js`, `.validator.js`, `common/utils/multerDocuments.js`.
- **Verificación manual segura:** 1. En staging, con un movimiento de prueba, enviar un PDF pequeño al path usado por el cliente. 2. Comprobar respuesta HTTP y si hay control para iniciar la acción en la UI.
- **Esperado:** si la carga sigue siendo un requisito, ruta con autorización, archivo validado, persistencia y control de descarga.
- **Indicador del problema:** 404 en el path o ausencia de acción accesible para cargar el documento.
- **Impacto:** la función de documento firmado no está disponible mediante el flujo actual.
- **Solución propuesta, no implementada:** acordar si el flujo se mantiene; de ser así, registrar la ruta con permiso/Multer y completar UX/descarga.
- **Pruebas necesarias:** permiso, tipo y tamaño de archivo, movimiento inexistente, persistencia y descarga autorizada.
- **Dependencias/decisión:** confirmar si los documentos firmados de tóner siguen siendo parte del proceso.
- **Estado de decisión:** `PENDIENTE DE MI REVISIÓN`.

### Almacén y base de datos

#### OBS-011 - No se puede registrar un saldo final de ajuste igual a cero

- **Módulo / prioridad / evidencia:** Almacén/ajustes; P2 — PENDIENTE DE VERIFICACIÓN MANUAL.
- **Observación:** el campo `quantity` requiere entero mínimo 1 y el servicio usa parser de entero positivo. El código documenta el ajuste como saldo final (`newStock = quantity`), pero está pendiente decidir institucionalmente si el ajuste representa saldo final o delta.
- **Evidencia técnica:** `modules/warehouse/warehouse.validator.js`, `modules/warehouse/warehouse.service.js`, `All.md` (Etapa D, decisión de semántica pendiente).
- **Verificación manual segura:** 1. En staging, seleccionar un insumo con stock positivo y registrar un ajuste de conteo físico igual a cero. 2. Observar validación frontend/API. No modificar stock compartido.
- **Esperado:** si se confirma semántica de saldo final, aceptar cero; si la regla es delta, ajustar la UX para mostrar explícitamente el delta y el saldo resultante.
- **Indicador del problema:** la operación física válida de stock cero no puede registrarse, o el usuario confunde cantidad objetivo con delta.
- **Impacto:** existencia teórica no puede reflejar una ubicación vacía o el motivo del ajuste resulta ambiguo.
- **Solución propuesta, no implementada:** no cambiar reglas hasta confirmar semántica; luego alinear formulario, validador y ledger.
- **Pruebas necesarias:** cero, saldo positivo, ajuste incremental/decremental, idempotencia y stock insuficiente según regla aprobada.
- **Dependencias/decisión:** definición institucional de ajuste y tratamiento de stock cero.
- **Estado de decisión:** `PENDIENTE DE MI REVISIÓN`.

#### OBS-012 - Las migraciones nuevas aún requieren medición y validación operativa

- **Módulo / prioridad / evidencia:** Prisma/PostgreSQL; P2 — PENDIENTE DE VALIDACIÓN DE BASE DE DATOS.
- **Observación:** las migraciones de índices usan `CREATE INDEX` ordinario y la de idempotencia crea un índice único sobre `warehouse_movements.idempotency_key`. Pueden escanear tablas y bloquear escrituras durante la construcción; no se midieron cardinalidad, duración ni planes. El código nuevo consulta/escribe `idempotency_key`, por lo que necesita la migración aplicada antes de ejecutarse contra un esquema anterior. `deploy.sh` ejecuta `prisma migrate deploy` antes de reiniciar backend, pero el estado de la base conectada no se comprobó en esta auditoría.
- **Evidencia técnica:** `prisma/migrations/20261001123000_add_inventory_history_pagination_indexes/migration.sql`, `20261001130000_add_warehouse_movement_idempotency/migration.sql`, `prisma/schema.prisma`, `modules/warehouse/warehouse.repository.js`, `infrastructure/deploy.sh`.
- **Verificación manual segura:** 1. En una copia aislada, revisar `prisma migrate status`. 2. Medir conteos y `EXPLAIN (ANALYZE, BUFFERS)` antes/después. 3. Medir duración y bloqueo al aplicar cada migración; verificar API solo después de migrar.
- **Esperado:** tiempo/lock aceptables para la ventana operativa y esquema consistente antes de iniciar el nuevo backend.
- **Indicador del problema:** bloqueo prolongado de escrituras, índice no utilizable/duplicado o backend iniciado contra una tabla sin `idempotency_key`.
- **Impacto:** indisponibilidad temporal o fallos 500 en movimientos de Almacén si se rompe el orden de despliegue.
- **Solución propuesta, no implementada:** validar en copia, definir ventana; valorar `CREATE INDEX CONCURRENTLY` en una migración compatible si volumen lo exige.
- **Pruebas necesarias:** estado de migraciones, planes, tiempo de aplicación, reintentos idempotentes y despliegue con migración aplicada.
- **Dependencias/decisión:** acceso a PostgreSQL aislado y estimación del volumen productivo. No se ejecutó ninguna migración.
- **Estado de decisión:** `PENDIENTE DE MI REVISIÓN`.

### Infraestructura y despliegue

#### OBS-004 - El despliegue puede borrar adjuntos del directorio público

- **Módulo / prioridad / evidencia:** infraestructura/archivos; P1 — RIESGO TÉCNICO.
- **Observación:** `deploy.sh` define `WEB_ROOT=apps/backend/public` y sincroniza `apps/frontend/dist/` a ese destino con `rsync --delete`. Multer guarda documentos en `apps/backend/public/uploads/documents`, que está ignorado por Git; el backup del script cubre PostgreSQL, no ese directorio. El compose Docker tampoco declara volumen persistente para archivos. En el workspace se observó un archivo en la carpeta local, sin abrirlo ni identificarlo; no se infiere que producción tenga el mismo contenido. La ruta API de carga de tóner actualmente no está conectada, por lo que el estado de uso de esos archivos requiere revisión operacional.
- **Evidencia técnica:** `infrastructure/deploy.sh`, `apps/backend/src/common/utils/multerDocuments.js`, `.gitignore`, `infrastructure/docker/docker-compose.yml`.
- **Verificación manual segura:** 1. En staging/disposable, crear un archivo centinela en `apps/backend/public/uploads/documents`. 2. Ejecutar `rsync --dry-run --delete` contra una copia destino temporal con la misma estructura. 3. Confirmar qué paths anuncia borrar. No ejecutar el deploy ni rsync destructivo en producción.
- **Esperado:** los adjuntos permanecen y se respaldan independientemente del build frontend.
- **Indicador del problema:** el dry-run marca `uploads/documents` para eliminación o recrear el contenedor elimina archivos sin volumen.
- **Impacto:** pérdida irreversible de documentos que no están dentro del backup de base de datos.
- **Solución propuesta, no implementada:** separar el webroot del almacenamiento persistente y añadir respaldo/restauración de archivos con política de retención.
- **Pruebas necesarias:** despliegue en staging con centinela, recreación del contenedor, restauración del backup de archivos y verificación de enlaces.
- **Dependencias/decisión:** confirmar dónde se almacenan los adjuntos productivos y quién conserva copias externas.
- **Estado de decisión:** `PENDIENTE DE MI REVISIÓN`.

### Seguimiento

| ID | Prioridad | Observación | Evidencia | Verificación manual | Estado de decisión |
| -- | --------- | ----------- | --------- | ------------------- | ------------------ |
| OBS-001 | P0 | Registro público permite elegir rol administrador | CONFIRMADA EN CÓDIGO | Alta anónima en staging y permisos efectivos | PENDIENTE DE MI REVISIÓN |
| OBS-002 | P1 | Incidencias y sockets no se limitan por asignación | CONFIRMADA EN CÓDIGO | GET y sala Socket.IO con usuario técnico | PENDIENTE DE MI REVISIÓN |
| OBS-003 | P1 | Formulario público atribuye al usuario 2 y permite abuso | CONFIRMADA EN CÓDIGO | Alta ficticia con correo sandbox | PENDIENTE DE MI REVISIÓN |
| OBS-004 | P1 | Deploy puede eliminar adjuntos | RIESGO TÉCNICO | rsync dry-run sobre staging temporal | PENDIENTE DE MI REVISIÓN |
| OBS-005 | P2 | Colisión de ticket bajo concurrencia | PENDIENTE DE VALIDACIÓN DE BASE DE DATOS | Dos altas simultáneas en PostgreSQL aislado | PENDIENTE DE MI REVISIÓN |
| OBS-006 | P2 | Duplicado de traslado pendiente bajo concurrencia | PENDIENTE DE VALIDACIÓN DE BASE DE DATOS | Dos solicitudes simultáneas para un activo de prueba | PENDIENTE DE MI REVISIÓN |
| OBS-007 | P2 | Incidencia acepta departamento ajeno a ubicación | CONFIRMADA EN CÓDIGO | Alta ficticia con IDs cruzados en staging | PENDIENTE DE MI REVISIÓN |
| OBS-008 | P2 | Estado inválido de incidencia se ignora en actualización | CONFIRMADA EN CÓDIGO | PUT inválido combinado con campo válido en staging | PENDIENTE DE MI REVISIÓN |
| OBS-009 | P2 | Token admin conserva permiso de cambio de contraseña | RIESGO TÉCNICO | Degradar rol y reusar token anterior en staging | PENDIENTE DE MI REVISIÓN |
| OBS-011 | P2 | Ajuste de Almacén no admite saldo final cero | PENDIENTE DE VERIFICACIÓN MANUAL | Ajuste a cero en staging sin stock compartido | PENDIENTE DE MI REVISIÓN |
| OBS-012 | P2 | Migraciones/indexes requieren medir bloqueo y compatibilidad | PENDIENTE DE VALIDACIÓN DE BASE DE DATOS | Status, EXPLAIN y aplicación en copia aislada | PENDIENTE DE MI REVISIÓN |
| OBS-010 | P3 | Helper de adjunto de tóner apunta a ruta no registrada | CONFIRMADA EN CÓDIGO | Solicitud de prueba con movimiento en staging | PENDIENTE DE MI REVISIÓN |
| OBS-013 | P3 | Lista fija de roles en traslados puede excluir roles personalizados | MEJORA PROPUESTA | Probar rol personalizado y definir elegibilidad | PENDIENTE DE MI REVISIÓN |

**Módulos no revisados completamente:** inventario tecnológico CRUD/clasificación y sus formularios; CRUD de tóner y toda su UX; pantallas completas de incidencias/usuarios/catálogos/notificaciones/exportaciones; configuración efectiva de producción. No se ejecutaron flujos de interfaz. No se verificaron permisos efectivos contra datos reales, despliegue productivo, archivos productivos, planes PostgreSQL, rollback ni concurrencia. Las observaciones de esta sección son para validación/aprobación del usuario; no son autorización para implementar cambios.

## Estado de corrección OBS-001 a OBS-013 - 2026-10-01

Esta sección actualiza el estado del informe anterior sin borrar sus observaciones, evidencia ni pasos manuales. No implica que se haya validado el comportamiento en producción.

| ID | Estado actual | Cambio realizado / límite |
| -- | ------------- | ------------------------- |
| OBS-001 | CORREGIDO EN CÓDIGO | `POST /api/auth/register` conserva la ruta, pero responde 403 y no llama al servicio de persistencia. La creación administrativa protegida por `users.create` sigue disponible. Prueba unitaria directa; no se consultó DB ni se verificó staging. La política de registro externo sigue pendiente. |
| OBS-002 | PARCIALMENTE CORREGIDO | Listado y detalle REST limitan técnicos/roles sin `incidents.assign` a incidencias asignadas; las actualizaciones de estos usuarios también exigen asignación. Las salas Socket.IO comprueban `incidents.read` y asignación, y creación/actualización/eliminación dejaron de emitir el detalle a todos los sockets. La conexión requiere usuario activo y carga permisos vigentes al handshake. Pendiente: paginación para lectores globales y revocación de salas en sockets ya conectados cuando cambian permisos. Pruebas unitarias del helper, no integración HTTP/Socket.IO. Los grants reales no se consultaron. |
| OBS-003 | BLOQUEADO POR DECISIÓN INSTITUCIONAL | No se alteró `/crear-incidencia`, su carácter público ni `id_user=2`: decidir identidad legal del reportante antes de cambiar el contrato. Riesgo de suplantación/abuso continúa. |
| OBS-004 | PARCIALMENTE CORREGIDO | `deploy.sh` excluye `/uploads/***` y `/fotos_personal/***` del `rsync --delete`. Solo se comprobó `bash -n`; por prohibición no se ejecutó sincronización ni deploy. Persistencia Docker, ubicación productiva y respaldo/retención de archivos requieren confirmación. |
| OBS-005 | CORREGIDO EN CÓDIGO; CONCURRENCIA SIN VALIDAR | La creación omite `ticket_number` para usar el `autoincrement()` existente; dentro de la transacción bloquea escrituras de incidencias, sincroniza con el máximo persistido y el último valor consumido de la secuencia, y luego crea el registro. No requiere migración nueva. La garantía es número único/no reutilizado, no secuencia sin huecos. Prueba unitaria verifica orden de bloqueo/sincronización; PostgreSQL aislado debe validar compatibilidad del SQL y concurrencia real. |
| OBS-006 | CORREGIDO EN CÓDIGO; CONCURRENCIA SIN VALIDAR | Chequeo/insert de solicitud pendiente ahora corre en transacción con bloqueo `FOR UPDATE` de la fila `bd_inventory`. Pruebas con doble verifican orden lock-check-insert y conflicto cuando ya hay pendiente. No es prueba de concurrencia PostgreSQL y no detecta ni elimina duplicados históricos. |
| OBS-007 | CORREGIDO EN CÓDIGO | El alta de incidencia valida en la misma transacción que el departamento exista y pertenezca a la ubicación indicada. Prueba unitaria cubre combinación válida e inválida; no se creó una incidencia real. |
| OBS-008 | PARCIALMENTE CORREGIDO | El PUT valida campos, longitudes, fechas, técnicos, categoría y estados actualmente reconocidos; rechaza estados desconocidos y acepta `id_category` que envía el formulario. No se definieron transiciones nuevas; el catálogo oficial y las transiciones permitidas siguen pendientes. Prueba de esquema y suite backend; no prueba HTTP/DB. |
| OBS-009 | CORREGIDO EN CÓDIGO; REVOCACIÓN DE SESIÓN PENDIENTE | Cambio de contraseña propia requiere usuario activo; para cambiar la de otro se consultan permisos RBAC actuales y se exige `users.update_password`, ya no se confía en el nombre de rol del JWT. Prueba unitaria de la regla de autorización; sin prueba contra roles almacenados. La expiración/revocación de sesiones generales aún no es inmediata. |
| OBS-010 | BLOQUEADO POR REQUISITO | No se registró ruta de carga ni se conectó Multer: no hay consumidor frontend y debe confirmarse que el documento firmado siga requerido. El helper actual continúa apuntando a una ruta no registrada. |
| OBS-011 | BLOQUEADO POR DECISIÓN INSTITUCIONAL | No se cambió `quantity` ni se habilitó cero. Confirmar si el ajuste es saldo final o delta y si cero representa un conteo físico válido. |
| OBS-012 | PARCIALMENTE VALIDADO | `prisma:validate` pasó. Las migraciones existentes de índices/idempotencia permanecen sin aplicar. La secuencia de tickets se sincroniza en el código dentro de una transacción, sin migración nueva. No se ejecutó `migrate status`, `EXPLAIN`, rollback ni medición de locks por falta de PostgreSQL aislado. |
| OBS-013 | CORREGIDO EN CÓDIGO; ASIGNACIÓN DE ROLES PENDIENTE | Traslados usan `inventory_transfers.read_own`, `create`, `read_all` y `review` en backend y UI. Defaults conservan crear/consultar propios para Técnico y Consultor, y revisión global para Admin; roles personalizados requieren grants explícitos. Prueba de defaults; no se ejecutó `prisma:seed:permissions`, por lo que el catálogo/grants deben sincronizarse en el despliegue autorizado. |

### Validación del bloque

- `npm test --workspace apps/backend`: 79/79 aprobadas. Son pruebas automatizadas locales; las nuevas de autorización, secuencia y traslados usan helpers/dobles, no prueban PostgreSQL ni Socket.IO real.
- `npm run build --workspace apps/frontend`: correcto; permanecen avisos Rollup preexistentes de comentarios Zod y chunk `react` vacío.
- `npm run prisma:validate`: correcto. No se necesitó regenerar Prisma Client porque no se modificó `schema.prisma` en este bloque.
- `bash -n infrastructure/deploy.sh`: correcto. No se ejecutó el script ni `rsync`.
- `git diff --check`: correcto antes de esta actualización documental; repetir en la revisión final.
- ESLint no pudo ejecutarse: ESLint 9 no encuentra `eslint.config.*` en el repositorio. No se migró la configuración como parte de esta corrección.
- No se ejecutaron migraciones, seeds, pruebas HTTP con base de datos, escrituras, pruebas de concurrencia ni acciones productivas.

### Decisiones y validaciones pendientes

- OBS-003: identidad, atribución y carácter público del reporte de incidencia; política antiabuso/rate limit.
- OBS-008: estados oficiales y transiciones permitidas.
- OBS-010: confirmar requisito, usuarios autorizados, almacenamiento y descarga de documentos de tóner.
- OBS-011: semántica de ajuste y aceptación de saldo cero.
- OBS-012/OBS-005/OBS-006: PostgreSQL aislado para aplicar migraciones y validar secuencia, bloqueo, concurrencia y planes.
- OBS-004: ubicación productiva de archivos, persistencia en Docker y política de backup/retención.
- OBS-013: grants institucionales para roles personalizados; ejecutar seed solo en una operación autorizada.
- OBS-002: confirmar el alcance global de cada rol, añadir paginación al listado global y decidir cómo revocar salas Socket.IO activas al cambiar permisos.

**Estado de Git al cierre del bloque:** conservar los cambios locales previos y los nuevos archivos. No se hizo staging, commit, migración ni despliegue. Las correcciones de código no deben considerarse verificadas en producción.

## Corrección focalizada posterior a segunda auditoría - 2026-10-02

Esta sección supersede únicamente los estados de OBS-002, OBS-003, OBS-005, OBS-008, OBS-009 y OBS-014 descritos arriba; preserva el informe y el resto de antecedentes.

| Hallazgo | Estado actualizado | Archivos/alcance y límite |
| -------- | ----------------- | ------------------------- |
| OBS-002 | CORREGIDO EN EMISIONES; LISTADO GLOBAL PENDIENTE | `incidentEventPublisher.js` reconsulta usuarios activos, permisos actuales y asignación antes de cada evento y desconecta usuarios inactivos. Creación, actualización, borrado e IMAP usan el publicador; se retiraron salas Socket.IO y sus emits del frontend. El evento de reasignación solo llega al técnico nuevo tras consultar la asignación actual. La pantalla pública por token ya no abre socket. El listado global sigue sin paginación para preservar el contrato array y sus consumidores; la comprobación RBAC por emisión puede costar varias consultas por usuario conectado. Pruebas con dobles; no integración Socket.IO/DB. |
| OBS-003 | FLUJO PÚBLICO HABILITADO CON ATRIBUCIÓN GENÉRICA | `/crear-incidencia`, `POST /api/incidents` y opciones de tóner son públicas. El backend fija `id_user=2`, fuerza estado Pendiente y no acepta ID/estado/solución del cliente. Se permite 1 POST válido cada 3 minutos por `req.ip`; formularios inválidos no consumen el cupo. El IP registrado usa `req.ip` de Express. Nombre/correo siguen siendo autodeclarados como pidió el flujo; no equivalen a identidad verificada. El rate limit vive en memoria por proceso, y NAT compartida puede bloquear a varios funcionarios. La prueba HTTP aislada comprobó 400 por body inválido, 201 simulado y luego 429 con Retry-After sin DB. |
| OBS-005 | MEJORADO EN CÓDIGO; SQL/PRIVILEGIOS PENDIENTES | Se retiró el lock y `MAX+1` por alta. `ticketSequence.js` sincroniza una vez al arranque antes de escuchar HTTP, con lock de tabla, máximo persistido y estado de secuencia. No se añadió migración. Requiere validar versión, disponibilidad de `pg_sequence_last_value`, privilegio `setval`, duración del lock inicial y despliegue sin solapamiento de una versión vieja en PostgreSQL aislado. No se promete numeración sin huecos. |
| OBS-008 | CORREGIDO EN CONTRATO; TRANSICIONES INSTITUCIONALES PENDIENTES | El PUT es estricto, rechaza claves extras/objetos vacíos, conserva `category`/`id_category` y `status`/`id_status` compatibles, rechaza discrepancias, estados desconocidos y `id_technician:null`. Asignar técnico junto con estado incompatible también se rechaza. No se inventó una matriz de transiciones. |
| OBS-009 | POLÍTICA FORTALECIDA; REVOCACIÓN INSTANTÁNEA NO GARANTIZADA | La validación de contraseña se comparte con registro y `requirePasswordChange` es booleano validado; el valor literal, incluidos espacios, se conserva. Cambiar contraseña propia requiere usuario activo; cambiar la ajena exige `users.update_password` vigente. Existe una ventana TOCTOU entre leer permisos y actualizar password si se revoca concurridamente; no se afirma revocación instantánea. |
| OBS-014 | CORREGIDO EN CONFIG DOCKER | El Dockerfile copia `infrastructure/docker/default.conf`; ambos configs Docker apuntan a `backend:3000` sin reescritura de URI, manteniendo `/api` y `/socket.io`. Compose declara el servicio `backend`. `infrastructure/nginx.conf` de host, si se introduce por separado, no se modificó. Validación DNS real requiere red Compose activa; no se levantaron contenedores. |

**Riesgos pendientes de esta iteración:** OBS-004 conserva exclusiones de rsync, pero Compose no persiste `public/uploads`; confirmar almacenamiento/backup productivo antes de recrear contenedores. OBS-006 usa lock por activo para escritores de la versión actual, pero no protege contra un escritor antiguo que no adquiera ese lock ni contra duplicados legacy; concurrencia real sigue pendiente. OBS-011 continúa bloqueado por semántica del ajuste. OBS-010 continúa sin ruta hasta confirmar el requisito institucional.

**IMAP:** `setSocketIO` y `startTechnicianEmailProcessor` permanecen definidos/exportados en `common/utils/imapClien.js`, pero no se encontró un caller en `apps/backend/src`; por tanto el procesamiento de respuestas por correo no se inicia desde `Server.js` en este árbol. No se activó: validar si está configurado/operado externamente y confirmar credenciales/proceso antes de iniciarlo. Si se invoca, su emisión ya pasa por `incidentEventPublisher`.

### Corrección de duración del historial de movimientos

- Causa 1: `LAG` sobre `ORDER BY created_at DESC` devuelve para la fila nueva la siguiente fila más nueva, no el movimiento más antiguo; al restar producía un intervalo negativo que la UI ocultaba como `-`.
- Causa 2: para el primer movimiento `LAG` devuelve NULL, pero `toTimestamp(null)` lo convertía en `new Date(null)`, es decir `1970-01-01`; la diferencia aparecía como aproximadamente 20,728 días.
- Corrección: la consulta usa `LEAD` con el orden descendente para obtener el evento cronológicamente anterior; `toTimestamp` preserva null/undefined/vacío. El primero queda `-` y los siguientes muestran duración positiva.
- Pruebas: SQL espera `LEAD`; pruebas de servicio cubren fecha previa ausente y duración de 24 horas.

### Categoría y actor de asignación en el detalle

- `mapIncidentListItem` ahora expone `category_name`, que ya venía del `categories` incluido por `findAll`; esto permite que el modal abierto desde la tabla muestre la misma categoría.
- Se agregó `bd_incidents.assigned_by` nullable, relación restrictiva a `users` e índice `bd_incidents_assigned_by_idx`. Al asignar o reasignar, backend guarda el actor autenticado y actualiza `assigned_at`; DTO de tabla, detalle y respuesta de actualización exponen el nombre del asignador. Incidencias anteriores conservan NULL y se muestran como “No registrado”.
- Usuarios con asignaciones registradas no pueden eliminarse sin resolver/reasignar esas referencias; `users.repository.countUserHistory` incluye esa dependencia.
- Migración creada, NO aplicada: `20261002120000_add_incident_assigned_by`. Listado/detalle caen al select legacy solo ante `P2022` por esa columna y conservan categoría; asignación consulta `information_schema` y sigue funcionando sin persistir el autor mientras la columna falte. Aplicar la migración antes de esperar autoría persistida/visible para asignaciones nuevas. La compatibilidad se probó con dobles, no contra la DB local.

**Validación ejecutada el 2026-10-02:** `npm test --workspace apps/backend` 94/94; build frontend correcto (avisos Rollup preexistentes Zod/chunk vacío); `prisma:validate` y `prisma:generate` correctos; `node --check` en Server, Socket y módulos editados correcto; `docker compose ... config --quiet` correcto; ambos server blocks Nginx pasaron `nginx -t` usando wrapper temporal, loopback y puerto 8080 porque el host no resuelve DNS Compose ni puede bindear puerto 80; `git diff --check` correcto. Pruebas de DTO, fallback y retorno del INSERT usan dobles y no leen la DB local. La prueba del limiter usa un Express temporal y handler simulado. Las pruebas Socket/DB usan dobles; no se ejecutaron migraciones, seeds, escrituras, pruebas PostgreSQL, despliegues ni `rsync`.

### IP de impresora en solicitud de tóner

- El endpoint público de opciones devuelve marca/modelo/tóneres, sin IP. Al crear una solicitud, backend resuelve el modelo+tóner contra impresoras instaladas en la ubicación/departamento y anexa las IPs deduplicadas al final del mismo campo `bd_incidents.description` con marcador `[IP impresora (soporte): ...]`.
- Los DTOs de gestión separan ese sufijo del texto del reportante y entregan `printer_ip_links`; el modal autenticado y el evento Socket.IO enviado a managers autorizados muestran enlaces. Respuesta de alta, correo al reportante y vista por token reciben la descripción limpia. Se descartó explícitamente el diseño previo de `internal_notes`: no existe esa columna ni una migración para ella; la IP está en el mismo `description` persistido con un marcador interno.
- La columna existente limita `description` a 255 caracteres; si texto + sufijo IP supera ese límite, la solicitud se rechaza con un mensaje para acortar la descripción. El IP se obtiene de inventario, nunca del navegador. El endpoint de opciones, respuesta de alta, correo al reportante y vista por token no exponen IP; los endpoints protegidos extraen los enlaces del mismo campo almacenado. La disponibilidad/IP vigente no se confirmó contra datos reales.
- Validación ejecutada: `npm test --workspace apps/backend` 97/97, build frontend, `prisma:validate`, `prisma:generate` y `git diff --check`; pruebas confirman texto limpio + enlaces, IP deduplicadas y derivación por modelo/tóner/ubicación/departamento con dobles. No se consultó inventario ni DB real.

**No verificado:** SQL y privilegios reales de la sincronización de secuencia; lock y carrera de traslados en PostgreSQL; distribución Socket.IO real; permisos RBAC vigentes de producción; almacenamiento/retención productivos. ESLint sigue sin configuración ESLint 9 del repo. `20261002120000_add_incident_assigned_by` está creada pero no aplicada; tampoco se aplicaron las otras migraciones pendientes.
