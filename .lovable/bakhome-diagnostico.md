# Integración OneStock ↔ Bakhome: diagnóstico y arquitectura propuesta

## Alcance y estado
Primera etapa de análisis, sin implementación. Se revisaron el código de OneStock y las definiciones reales de tablas, políticas, índices, funciones y triggers mediante consultas de solo lectura. No se cambiaron código funcional, datos, permisos, secretos ni servicios.

Bakhome no pudo inspeccionarse: no apareció como proyecto accesible al intentar `Bakhome` y buscar `Backhome`. Esto no demuestra que no exista. Su esquema, administración, pagos y mecanismos actuales de webhooks están **sin verificar**. El contrato de ese lado es propuesto, no una integración ya disponible.

## Diagnóstico técnico de OneStock

| Área | Base existente y resultado |
|---|---|
| Aplicación | React + Vite, Lovable Cloud, empresas en `companies`, membresía en `users.company_id`, roles en `user_roles`. |
| Integraciones | `/app/integrations` muestra plataformas y abre WhatsApp. No persiste conexiones ni sincroniza. No se encontraron Edge Functions de integración en el repositorio ni tablas de conexiones, pedidos externos, inbox u outbox en el esquema consultado. |
| Productos | `products`: UUID, empresa, nombre, SKU, barcode, categoría, descripción, imagen, precios general/minorista/mayorista, stock total, mínimos y máximos. `version` y `updated_at` permiten detectar cambios; SKU tiene índice **no único**. |
| Inventario | `product_stock`: producto, depósito, cantidad y `reserved`; unicidad producto/depósito. `warehouses` identifica depósitos; `product_variants` tiene stock separado. |
| Movimientos | `stock_movements`: entrada/salida/ajuste, cantidad, empresa, usuario, depósito/origen/destino, fecha y operación del cliente. Historial protegido contra edición/borrado desde el cliente. |
| Ventas | `sales` + `sale_items`: cliente, canal, estado, descuentos, impuestos, cobros, total y origen. `client_op_id` único para ventas. No hay ciclo específico de pedidos online, reservas ni pagos externos. |
| Clientes | `customers`: identidad/contacto, CUIT, dirección, saldo, empresa, versión y operación. No hay identificador externo ni unicidad por email. |
| Seguridad | RLS por empresa y suscripción activa. Las funciones actuales dependen de `auth.uid()` y `current_company_id()`; no son una API para tiendas. |

### Riesgos comprobados en las rutas actuales
- `create_pos_sale` registra venta, líneas y salidas en una transacción; bloquea productos y rechaza stock insuficiente. `apply_stock_movement` y `annul_sale` también son transaccionales. Es una base aprovechable, no suficiente por sí sola.
- POS y movimientos actualizan `products.current_stock`; transferencias actualizan `product_stock`. Los triggers revisados no mantienen ambos valores sincronizados tras cada venta/movimiento. **Puede existir divergencia**; no se midió ni corrigió inventario real.
- `reserved` existe, pero POS no lo descuenta de disponibilidad. Reservar online sin adaptar caja permitiría vender unidades ya comprometidas.
- El formulario `Sales.tsx` descuenta movimientos, luego inserta venta y líneas en llamadas separadas. Puede dejar stock descontado sin venta si falla una llamada. No debe reutilizarse para pedidos externos.
- Los índices de operación actuales ayudan contra duplicados, pero no guardan hash de solicitud ni resultado de integración; una carrera con la misma operación requiere bloqueo/recuperación específica.
- Las cantidades de POS se convierten a enteros. Unidades fraccionarias y variantes necesitan reglas explícitas antes de publicarse.
- Los cobros aceptados por el servidor no coinciden completamente con los códigos mostrados por POS. Bakhome necesitará un adaptador de pagos validado, no copiar códigos libremente.
- Imágenes privadas no pueden publicarse compartiendo rutas internas o enlaces temporales como si fueran permanentes.

## Arquitectura propuesta

Dos aplicaciones y dos bases independientes. No compartir claves administrativas, sesiones de usuarios ni acceso directo a tablas entre aplicaciones.

```text
OneStock: catálogo y disponibilidad autoritativos
  cambio local → outbox transaccional → emisor Edge Function
                      ↓ webhook HTTPS firmado
Bakhome: copia para exhibición → inbox → actualiza catálogo
  checkout → API privada OneStock → reserva validada
  pago verificado → outbox → webhook OneStock → venta transaccional
OneStock: venta + salida + liberación de reserva + outbox
                      ↓ webhook de existencias/estado
Bakhome: actualiza copia y confirma estado del pedido
```

Los webhooks aquí son **eventos comerciales de las apps**, no los Eventos & Hooks del workspace Lovable, que notifican creación/publicación de proyectos.

### Vinculación segura de tienda y empresa
1. Administrador de OneStock autenticado inicia la vinculación. El servidor obtiene su empresa y valida rol en `user_roles`; no confía en empresa o rol enviados desde el navegador.
2. Genera autorización de uso único, de vida corta y ligada a esa empresa. El administrador de Bakhome autenticado la canjea mediante su servidor; se valida también la propiedad de la tienda.
3. Confirmación final en OneStock muestra la tienda y alcance. El vínculo conserva tienda externa inmutable, empresa, depósitos habilitados, política de precios y estado. Propuesta inicial: una tienda pertenece a una sola empresa y un vínculo Bakhome activo por empresa; ampliable posteriormente.
4. Credenciales por conexión y dirección, rotables/revocables. Claves privadas compartidas cifradas en almacenamiento solo de servidor con clave maestra en secretos de Cloud; los valores nunca aparecen en logs, Excel ni almacenamiento del navegador. La autorización de canje no concede acceso permanente por sí sola.
5. Firmar llamadas y webhooks con Standard Webhooks sobre cuerpo original, ID y timestamp; comprobar ventana temporal, firma y deduplicación persistente. Las consultas de lectura usan POST con cuerpo firmado. CORS no es autenticación.
6. Resolver `company_id` **desde la conexión verificada**, nunca desde el payload. Cada consulta y vínculo producto/cliente/pedido valida esa empresa. Funciones de integración solo ejecutables por el servidor, con privilegios mínimos y búsqueda de esquema fija; no simular sesiones de empleados.
7. Destinos HTTPS previamente registrados y verificados, sin URLs arbitrarias en eventos; bloquear direcciones privadas/locales, redirecciones y SSRF. Límites de tamaño, tasa y lotes; validar todos los datos.

No pedir certificados ARCA ni claves de Cloud: esta conexión no requiere facturación fiscal. No inferir vínculo ni permisos por email, incluso si el comercio tiene acceso de por vida.

## Contrato técnico propuesto: endpoints v1
Nombres lógicos de Edge Functions; no son rutas ya implementadas ni `/api/...`.

| App | Endpoint / acción | Uso |
|---|---|---|
| OneStock | `ecommerce-link` / iniciar, confirmar, revocar, rotar | Gestión con sesión y rol administrador. |
| OneStock | `ecommerce-pair` / canjear | Autorización de uso único, verificación mutua de servidores. |
| OneStock | `ecommerce-catalog` / snapshot, changes | POST firmado: catálogo paginado, disponibilidad absoluta, precios, versiones y bajas. |
| OneStock | `ecommerce-orders` / reserve, release, status | Reserva sin venta, liberación y consulta para resolver tiempos de espera inciertos. |
| OneStock | `ecommerce-webhook` | Recibe pedido creado, pago verificado, cancelación y solicitud de devolución. Persiste inbox antes de responder. |
| OneStock | `ecommerce-dispatch` | Worker interno autenticado: entregas/reintentos y conciliación; no abierto al público. |
| Bakhome | `onestock-link` | Vinculación desde su administración, canje y almacenamiento seguro. |
| Bakhome | `onestock-webhook` | Recibe productos, precios, disponibilidad y estado de pedidos con firma. |
| Bakhome | `onestock-orders` | Servidor de checkout llama a reservas; publica eventos a partir de pagos comprobados. |
| Bakhome | `onestock-dispatch` | Entrega durable de eventos de pedidos y pagos. |

Envelope: `schema_version`, `event_id`, `connection_id`, `type`, `occurred_at`, identificador externo, versión y payload mínimo. Escrituras: clave idempotente obligatoria + hash del contenido. Misma clave/contenido devuelve el resultado existente; misma clave/contenido diferente produce conflicto. `202` significa recibido de forma durable, **no venta confirmada**; `status` informa el resultado. Conflictos de stock/precio: `409`; datos inválidos: `400`; firma inválida: `401/403`; límites: `429`.

## Productos, precios, existencias y clientes
- OneStock → Bakhome: productos seleccionados, SKU/barcode, descripción, imágenes autorizadas, precio de venta y disponibilidad. Por defecto minorista con fallback al general, ARS e importes en centavos; impuestos, descuentos, envío y promociones deben acordarse antes de activar cobros. No exportar costos, saldo de clientes ni campos internos.
- Identidad mediante tabla de correspondencia UUID OneStock ↔ ID externo. SKU sirve para proponer coincidencias iniciales, no para vincular automáticamente si falta o está duplicado. La primera carga permite revisar diferencias; no sobrescribe ni borra el catálogo de Bakhome sin aprobación.
- Bakhome → OneStock: pedidos, pagos comprobados y clientes asociados. OneStock → Bakhome: aceptación, rechazo y cambios comerciales pertinentes. No copiar todos los clientes a la tienda ni sincronizar saldos; no crear cuentas Auth por una compra. Identidad del cliente por conexión + ID externo; coincidencias por email/CUIT requieren revisión para evitar fusiones incorrectas.
- Elegir depósitos vendibles; antes de producción conciliar stock por depósito y total. Mantener una sola verdad de inventario dentro de OneStock: movimientos, POS, edición/importación y anulaciones deben usar operaciones transaccionales que mantengan ambos valores y respeten reservas.
- Disponible = `max(0, suma de cantidades de depósitos habilitados − reservas activas en esos depósitos)`. Stock físico no baja al reservar. POS debe consumir solo unidades no reservadas; al pagar se transforma la reserva en salida una vez.
- Enviar **valores absolutos** con secuencia monotónica, no decrementos repetibles. Inbox ignora versiones antiguas. Outbox transaccional captura también cambios de caja, importaciones y ajustes, no depende de la pestaña abierta.
- Snapshot inicial con cursor/ marca de agua consistente; reproducir cambios posteriores sin pérdidas. Secuencia durable asignada respetando el orden de confirmación o estrategia de solapamiento/deduplicación que evite saltarse transacciones concurrentes. Bajas mediante tombstones; reconciliación periódica corrige eventos perdidos y detecta divergencias, no es la vía principal.
- Copia de imágenes mediante endpoint autorizado o medios publicados con consentimiento; jamás volver público el bucket privado completo. Variantes y unidades fraccionarias quedan fuera del primer piloto hasta validar ambos modelos; bloquear su publicación en lugar de degradarlas silenciosamente.

## Flujo de pedido, pago y venta online
1. Bakhome calcula checkout en servidor con el catálogo autorizado y solicita reserva con ID externo de pedido e idempotencia estable. OneStock valida vínculo activo, producto/precio/empresa/cantidades y bloquea filas en orden determinista.
2. Una transacción crea pedido externo y reserva o rechaza el pedido completo. No hay venta ni salida en este paso. Reserva con expiración configurable y asignación por depósito.
3. Bakhome comprueba el pago con su proveedor en servidor, no con el éxito mostrado en el navegador. Publica evento durable con ID de pago, moneda, importe y versión del pedido; OneStock valida importe contra la reserva/snapshot aceptado.
4. OneStock bloquea pedido, reserva e inventario y **en una única transacción** deduplica pago/pedido, vincula cliente, crea `sales` y `sale_items`, registra salidas, reduce físico y reservas, actualiza total y estado, guarda respuesta idempotente y genera eventos de salida. `source='ecommerce'`, canal Bakhome; no volver a llamar a salida de stock por separado.
5. Si la respuesta se pierde, Bakhome consulta `status` o reintenta con la misma clave. Nunca crea una venta alternativa para resolver un timeout. Las ventas online deben figurar en reportes y su historial específico, sin confundirse con el cierre de caja presencial.
6. Cancelación antes de pagar libera la reserva una vez. Expiración y pago simultáneos comparten el mismo bloqueo. Pago tardío intenta recuperar stock atómicamente; si no alcanza, queda en incidencia para devolución/gestión, sin stock negativo ni venta ficticia.
7. Reembolso financiero no repone stock automáticamente: devolución de mercadería confirmada genera entrada una vez, total o parcial. Cancelaciones de ventas confirmadas siguen política explícita y no usan libremente `annul_sale` de POS.
8. Si no hay conexión durante checkout, no prometer disponibilidad ni confirmar la compra. Si se corta tras el pago, conservar el evento y consultar/reintentar; mostrar pedido pendiente de confirmación. Sin transacción distribuida, pagos/reservas requieren compensación y conciliación.

## Cambios necesarios después de aprobar
Tablas aditivas propuestas en ambas apps donde corresponda:
- `ecommerce_connections`, autorizaciones de vinculación y credenciales cifradas: empresa/tienda, alcances, depósitos, política, estado y rotación.
- `ecommerce_product_links` y `ecommerce_customer_links`: identidades externas por conexión con unicidad y vínculos de la misma empresa.
- `ecommerce_orders`, líneas y reservas: snapshot de precio, pago externo, venta asociada, estado, expiración y asignación de inventario.
- `ecommerce_inbox`, `ecommerce_outbox`, entregas/intentos: ID de evento/operación, hash, resultado, secuencia, estado, próximos intentos y error sanitizado. Claves únicas por conexión + evento/pedido/pago y transiciones bloqueadas.
- Agregar procedencia comercial de movimientos; `stock_movements.user_id` es obligatorio y referencia `users`, por lo que se necesita actor de integración explícito sin fingir un empleado. Propuesta: usuario nullable para operaciones de servicio con `actor_type/connection_id`, conservando usuarios reales para operaciones humanas.
- RPCs privadas de reservar, confirmar venta, liberar y devolver; adaptar operaciones existentes a inventario coherente y reservas. Revisar triggers de precios y pagos para actor de servicio: validación servidor explícita, no privilegios de administrador artificiales.
- RLS + GRANT por tabla. Credenciales y cola modificables solo por servidor; administradores ven configuración/errores sanitizados de su empresa. Sin lectura anónima ni SQL arbitrario en endpoints.
- Worker programado durable en Cloud mediante mecanismo soportado a validar al implementar; reintentos exponenciales con jitter y `Retry-After`, límite, cola de incidencias, reintento manual seguro y conciliación. Edge Functions no deben mantener procesos permanentes ni confiar en tareas posteriores a la respuesta para durabilidad.
- Pantalla Bakhome en Integraciones: vincular, revisar correspondencias, elegir depósitos/precio, iniciar snapshot, ver última sincronización/pendientes/errores, pausar y revocar. Pausa/revocación bloquea nuevas reservas; pedidos ya pagados necesitan resolución operativa explícita. Logs con IDs técnicos, sin claves ni datos personales completos.

## Riesgos y condiciones de aprobación
**Prioridad alta:** divergencia de inventario, reservas ignoradas por POS, acceso cruzado por credenciales de servicio, ventas duplicadas y pagos cobrados sin disponibilidad. Se mitigan con transacciones, identidad de conexión, exclusión/uniqueness, máquina de estados y conciliación.

**También:** eventos fuera de orden, borrados durante snapshot, promociones/envío/IVA distintos, imágenes privadas, límites/costos de Cloud, catálogo grande, claves comprometidas, datos de clientes y baja de suscripción. Validar cadencia y volúmenes con mediciones; no prometer sincronización instantánea ni exactamente una entrega.

No cambiar precios, planes ni otorgar permisos comerciales por esta conexión. Mantener facturación ARCA separada: emitir factura sobre una venta existente nunca descuenta stock nuevamente.

## Implementación por etapas tras aprobación
1. Acceder al código de Bakhome mediante su proyecto compartido o revisar su esquema exportado sin secretos; confirmar IDs, variantes, checkout, pagos, moneda, devoluciones y autorización de tienda.
2. Conciliar inventario y adaptar transacciones de OneStock para depósitos/reservas, con pruebas de regresión de caja y movimientos.
3. Implementar vinculación, autenticación, tablas/colas y contrato v1 en ambas apps; los cambios de Bakhome requieren su propio proyecto, no se aplican desde un snapshot de solo lectura.
4. Piloto catálogo/precios/disponibilidad con productos seleccionados, carga inicial revisada y conciliación.
5. Habilitar reservas y ventas online en entorno de prueba; ampliar solo tras resultados satisfactorios y autorización.

### Pruebas de aceptación obligatorias
- Tienda A no lee/escribe productos, clientes, pedidos ni errores de empresa B; credencial revocada/expirada, firma adulterada y replay rechazados.
- Dos eventos de pago y reintentos concurrentes producen una venta y una salida; payload cambiado con misma clave da conflicto.
- Caja y tienda compiten por la última unidad: solo una puede consumirla; cantidad/total/depósito/reserva permanecen coherentes.
- Fallo entre líneas de pedido revierte venta, cliente relacionado, movimientos y stock; timeout se resuelve consultando el mismo pedido.
- Versiones antiguas no sobrescriben nuevas; snapshot con cambios/bajas concurrentes no pierde productos; reconciliación detecta diferencia.
- Pago posterior a expiración, cancelación duplicada, devolución parcial, desconexión/reconexión y reintento tras incidencia se resuelven sin doble reposición.
- Precio/moneda/pago/cantidades manipulados rechazados; no publicar costo, bucket privado ni claves.
- Recorrido real desde compra de prueba en Bakhome hasta venta visible en OneStock y stock actualizado en ambas apps, más regresión POS/reportes. **No ejecutado en esta etapa de análisis.**

## Próximo paso
Aprobar esta arquitectura y facilitar el enlace o nombre exacto del proyecto Bakhome con acceso de lectura, o su esquema y flujo de pedidos exportados sin credenciales. No hace falta enviar secretos en el chat. La aprobación permite implementar por etapas, no activar ventas reales antes de las pruebas.