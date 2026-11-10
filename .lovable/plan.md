# Integración OneStock ↔ Bakhome

## Alcance y verificación
**Diagnóstico y propuesta únicamente; implementación pendiente de aprobación.** Se revisaron el código de OneStock y las definiciones reales de tablas, RLS, índices, funciones y triggers mediante consultas de solo lectura. No se modificaron código funcional, datos, permisos, secretos ni servicios.

Bakhome no apareció como proyecto accesible al intentar `Bakhome` y buscar `Backhome`. No significa que no exista: su catálogo, pedidos, pagos y administración están **sin verificar**. Los endpoints de ese lado son una propuesta.

## Diagnóstico técnico de OneStock
| Área | Tablas y situación actual |
|---|---|
| Empresa y acceso | `companies`, `users.company_id`, `user_roles`. RLS por empresa y suscripción activa. |
| Productos | `products`: nombre, UUID, SKU/barcode, descripción, categoría, imagen, precios general/minorista/mayorista, stock, `version`, `updated_at`. SKU no es único. |
| Inventario | `product_stock`: producto/depósito, `quantity`, `reserved`; unicidad producto/depósito. `warehouses` y `product_variants` con existencias separadas. |
| Movimientos | `stock_movements`: empresa, producto, usuario obligatorio, tipo, cantidad, depósitos, fechas, operación idempotente. Historial protegido contra edición/borrado. |
| Ventas | `sales` + `sale_items`: cliente, canal, origen, estado, cobros, descuento, impuesto, total y operación única. Sin ciclo de pedidos externos o pagos de tienda. |
| Clientes | `customers`: identidad/contacto, CUIT, dirección, saldo, empresa y versión; sin identificador externo. |
| Integraciones | `/app/integrations` solo muestra plataformas y abre WhatsApp. No hay conexiones persistidas ni tablas de pedidos externos/inbox/outbox en el esquema consultado. No se encontraron funciones de integración en el repositorio. |

### Riesgos comprobados
- `create_pos_sale`, `apply_stock_movement` y `annul_sale` son transaccionales y aprovechan bloqueos. Sin embargo, las ventas/movimientos actualizan `products.current_stock`, y transferencias actualizan `product_stock`; los triggers revisados **no mantienen ambos sincronizados**. Puede existir divergencia; no se midieron ni corrigieron existencias reales.
- POS no considera `reserved`: agregar reservas online sin adaptar caja permitiría vender unidades comprometidas.
- `Sales.tsx` descuenta movimientos y luego guarda venta/líneas en llamadas separadas: no reutilizar ese flujo para pedidos online.
- Las funciones actuales dependen de `auth.uid()` y de la empresa del usuario. Una tienda no puede usarlas como si fuera un empleado.
- Idempotencia actual no conserva hash y resultado por conexión; requiere protección ante reintentos concurrentes. Cantidades POS son enteras; códigos de pagos del cliente y servidor no coinciden completamente.
- SKU duplicado, variantes con stock independiente e imágenes privadas necesitan tratamiento explícito.

## Arquitectura propuesta
**Dos bases independientes; OneStock es la autoridad de inventario.** No compartir claves administrativas ni sesiones de empleados; comunicación exclusivamente por APIs privadas en Edge Functions de Lovable Cloud.

```text
OneStock: cambio de producto/precio/stock
  → outbox transaccional → webhook firmado → inbox Bakhome → copia de catálogo
Bakhome: checkout → API OneStock → reserva validada
  → pago comprobado → outbox → webhook firmado → inbox OneStock
OneStock: transacción venta + salida + reserva + evento
  → webhook firmado → Bakhome actualiza disponibilidad y pedido
```

Son webhooks de eventos comerciales propios; **no** los Eventos & Hooks del workspace Lovable, destinados a actividad de proyectos.

### Vinculación y seguridad
1. Administrador autenticado de OneStock inicia autorización de uso único y corta duración. El servidor obtiene su empresa y rol de `user_roles`, nunca del formulario.
2. Administrador autenticado de Bakhome autoriza su tienda y su servidor canjea la autorización. Confirmación final en OneStock mostrando identidad, depósitos y alcance.
3. Vínculo tienda→empresa inmutable. Propuesta piloto: una tienda pertenece a una empresa y un vínculo Bakhome activo por empresa; ampliable luego.
4. Credenciales por vínculo/dirección, cifradas solo en servidor con clave maestra en secretos de Cloud; rotación y revocación. Nunca entregar claves administrativas, persistir credenciales en navegador ni registrarlas en logs.
5. APIs y webhooks firmados mediante Standard Webhooks sobre cuerpo original, ID y timestamp; ventana temporal, deduplicación persistente y límites de tamaño/tasa. Lecturas mediante POST con cuerpo firmado. CORS no sustituye autenticación.
6. Resolver empresa desde la conexión verificada y validar empresa de cada producto/cliente/depósito. RPCs de integración solo ejecutables por servidor, con privilegios mínimos y esquema fijo. No simular sesiones humanas.
7. Destinos HTTPS verificados y registrados, sin URLs arbitrarias por evento; bloquear redes privadas/locales, redirecciones y SSRF. No vincular por email ni otorgar acceso por el correo con plan de por vida.

## Detalles técnicos: endpoints v1 propuestos
Nombres lógicos de Edge Functions, no rutas `/api/` ni servicios ya disponibles.

| App | Endpoint / acciones | Finalidad |
|---|---|---|
| OneStock | `ecommerce-link`: iniciar/confirmar/revocar/rotar | Administración con sesión y rol validados. |
| OneStock | `ecommerce-pair`: canjear | Vinculación de uso único y verificación de ambos servidores. |
| OneStock | `ecommerce-catalog`: snapshot/changes | Catálogo paginado, precios, existencias absolutas, versiones y bajas. |
| OneStock | `ecommerce-orders`: reserve/release/status | Reservar antes del cobro, liberar y conciliar respuestas inciertas. |
| OneStock | `ecommerce-webhook` | Recibir pedidos, pagos verificados, cancelaciones/devoluciones; inbox durable. |
| OneStock | `ecommerce-dispatch` | Worker interno autenticado para entregas/reintentos. |
| Bakhome | `onestock-link`, `onestock-webhook` | Autorizar vínculo y recibir catálogo/stock/estados firmados. |
| Bakhome | `onestock-orders`, `onestock-dispatch` | Checkout servidor, pagos comprobados y entrega durable de eventos. |

Contrato: `schema_version`, `event_id`, `connection_id`, `type`, `occurred_at`, ID externo, versión y payload mínimo. Escrituras con clave idempotente estable + hash: misma clave/cuerpo devuelve resultado existente; cuerpo diferente da conflicto. `202` confirma recepción durable, **no venta completada**; consultar estado. Datos inválidos `400`, autenticación `401/403`, stock/precio/conflicto `409`, límites `429`.

## Sincronización y propiedad de datos
- OneStock→Bakhome: productos seleccionados, descripción, imagen autorizada, identificadores, precio y disponibilidad. Propuesta: minorista con fallback al general, ARS, cálculo en centavos. Impuestos, promociones, envío y medios de pago requieren contrato antes de activar cobros. No exportar costos ni campos internos.
- UUID OneStock↔ID externo mediante correspondencias por conexión. SKU solo propone coincidencias; revisar faltantes/duplicados. Carga inicial revisada, sin sobrescribir/borrar Bakhome automáticamente.
- Bakhome→OneStock: pedidos, pagos comprobados y clientes de esas compras. OneStock devuelve estados y cambios pertinentes. Identidad cliente por ID externo, no fusión automática por email/CUIT; no copiar saldos ni todo el padrón, ni crear usuarios Auth por compras.
- Antes de activar: conciliar total/depósitos y centralizar ajustes, importaciones, POS, anulaciones y ventas en operaciones que mantengan inventario coherente y reservas.
- Disponible = `max(0, cantidades de depósitos habilitados − reservas activas)`. Reservar no reduce físico; cobrar transforma reserva en salida. Caja debe respetar esas reservas.
- Enviar cantidades absolutas con secuencia monotónica; ignorar versiones antiguas. Outbox creada en la transacción local, también para importaciones/borrados, sin depender de navegador abierto.
- Snapshot con marca de agua consistente y cambios posteriores; cursor que no pierda transacciones concurrentes, mediante orden de confirmación o solapamiento/deduplicación. Bajas con tombstones y conciliación periódica como respaldo, no mecanismo principal.
- Transferir imágenes mediante acceso autorizado o publicación consentida; no abrir el bucket privado ni tratar enlaces temporales como permanentes. Bloquear variantes/unidades fraccionarias del piloto hasta validar modelos.

## Venta online y descuento correcto
1. Checkout servidor solicita reserva con ID de pedido estable. OneStock verifica conexión activa, empresa, precios, cantidades y depósitos; bloquea inventario en orden determinista y reserva todo o rechaza todo.
2. Bakhome verifica pago con su proveedor en servidor, nunca por el éxito del navegador; envía evento durable con ID de pago, moneda, importe y versión. OneStock compara con el snapshot aceptado.
3. Una transacción bloquea pedido/reserva/inventario, deduplica pago, vincula cliente, crea `sales`/`sale_items`, registra salidas, reduce físico/reservas, guarda resultado y outbox. Origen `ecommerce`, canal Bakhome. **No ejecutar una salida adicional** después.
4. Timeout: consultar estado o reintentar la misma operación; nunca crear venta alternativa. Mostrar ventas online en historial/reportes, separadas del cierre de caja presencial.
5. Cancelación sin pago libera una vez. Expiración y pago comparten bloqueo; pago tardío intenta recuperar disponibilidad atómicamente. Si no alcanza: incidencia y compensación, sin inventario negativo ni venta ficticia.
6. Reembolso no repone mercadería automáticamente. Devolución física confirmada genera entrada idempotente, completa o parcial; no reutilizar libremente anulación POS.
7. Sin conexión no prometer disponibilidad ni confirmar checkout. Si ya se pagó, conservar evento y mostrar pedido pendiente. No existe transacción distribuida: hacen falta conciliación y compensación.

## Cambios necesarios tras aprobación
- Tablas aditivas: conexiones/autorizaciones/credenciales cifradas, correspondencias producto/cliente, pedidos/líneas/reservas, inbox/outbox/entregas. Unicidad conexión+evento/pedido/pago, hash/resultados y transiciones bloqueadas.
- Procedencia de movimientos para actor de integración: el usuario actual es obligatorio. Proponer usuario nullable para servicio con actor/conexión explícitos; preservar autores reales en operaciones humanas.
- RPCs privadas reservar/confirmar/liberar/devolver y adaptación de inventario existente. Validación de precios/pagos para servicio sin atribuirle privilegios ficticios de administrador.
- RLS y GRANT por tabla; credenciales y escritura de colas solo servidor. Administradores ven configuración e incidencias sanitizadas de su empresa.
- Worker durable programado en Cloud, mecanismo soportado a validar al implementar; backoff exponencial, jitter, `Retry-After`, límites, cola de incidencias y reintento manual seguro. No depender de procesos permanentes o tareas efímeras tras responder.
- Integraciones: vincular Bakhome, revisar productos, depósitos/precio, iniciar carga, última sincronización, pendientes/errores, pausar/revocar. Bloquear nuevas reservas al revocar; resolver pagos pendientes explícitamente. Sin cambios de planes/precios ni facturación ARCA; facturar no vuelve a descontar stock.

## Etapas y pruebas
1. Validar arquitectura de Bakhome con acceso de lectura o esquema/checkout exportados sin secretos; sus cambios requieren su propio proyecto.
2. Conciliar inventario y adaptar transacciones/reservas con regresión POS.
3. Implementar contrato, vinculación, seguridad y colas en ambas apps.
4. Piloto catálogo/precio/stock con productos revisados; después reservas/ventas en pruebas.

Aceptación: aislamiento entre empresas; firma/replay/revocación; pago duplicado concurrente produce una venta/salida; mismo ID con otro cuerpo da conflicto; caja y tienda por última unidad; rollback completo; timeout recuperable; eventos fuera de orden; snapshot con cambios/bajas; pago tardío y reserva expirada; devolución parcial/duplicada; cortes y reintentos; precio/moneda/cantidades manipulados; imágenes privadas. Finalmente compra de prueba real en Bakhome→venta visible OneStock→stock actualizado en ambas, más POS/reportes. **No ejecutado en este análisis.**

Riesgos prioritarios: stock divergente, sobreventa, acceso cruzado, duplicados y pagos sin disponibilidad. También costos/límites de Cloud, volúmenes, claves comprometidas y datos personales. No prometer entrega única o sincronización instantánea.

## Próximo paso
Aprobar el plan y facilitar enlace/nombre exacto del proyecto Bakhome con acceso de lectura, o esquema y flujo de pedidos sin credenciales. No enviar secretos al chat. No activar ventas reales antes de pruebas y autorización.
