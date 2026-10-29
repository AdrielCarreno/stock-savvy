# OneStock — Offline-first, cámara y notificaciones

## Fase 1 — Resultado de la auditoría (hecha)

**Base actual**
- React 18 + Vite 5 + TanStack Query + Lovable Cloud. Sin backend propio: todo se lee y escribe directo desde el navegador.
- App instalable solo con manifiesto: **no hay Service Worker, ni caché, ni IndexedDB, ni sincronización, ni Realtime, ni funciones del servidor**.
- Tablas reales: `products`, `product_stock` (stock por depósito), `product_variants`, `warehouses`, `stock_movements` (solo inserción), `sales` + `sale_items` (la Caja usa `source='pos'`), `purchases` + `purchase_items`, `customers`, `suppliers`, `supplier_products`, `supplier_price_history`, `operation_documents` + bucket privado `operation-docs`, `users`, `user_roles`, `companies`, `audit_log`. No existen tablas de notificaciones ni de "caja" separada.
- Seguridad: aislamiento por empresa con `current_company_id()` y `current_company_is_active()`; roles en `user_roles`; triggers de validación en ventas, ítems y movimientos.

**Riesgos encontrados**
- El stock se calcula en el navegador: lee `current_stock`, suma/resta y lo sobreescribe (`usePos.applyStock`, `useStockMovements`). Dos dispositivos a la vez pueden pisarse el stock. Esto hay que corregirlo antes de cualquier modo offline.
- Venta + ítems + movimientos + stock se guardan en varias llamadas separadas: si una falla a mitad, queda incompleto. No hay protección contra duplicados.

**Depende sí o sí de internet:** registro/login inicial, links de Mercado Pago/WhatsApp, subida a Storage, IA/OCR en la nube, envío de push.

## Etapas (cada una se entrega y prueba por separado)

**Etapa 1 — Servidor confiable (sin cambiar pantallas)**
- Columna `client_op_id uuid unique` (opcional, nullable) en `sales`, `stock_movements`, `purchases`, `products`, `customers`, `suppliers` para idempotencia; columna `version` en entidades editables.
- Funciones del servidor transaccionales: `apply_stock_movement(op_id, …)`, `create_pos_sale(op_id, …)`, `annul_sale(op_id, …)`, `upsert_product/customer/supplier(op_id, base_version, …)`. Validan empresa, rol y stock; si el `op_id` ya existe devuelven el resultado anterior (sin duplicar). Stock negativo: rechazo con motivo, salvo admin/gerente con confirmación.
- Pasar Caja y Movimientos a estas funciones (mismo diseño de pantalla). Se elimina la carrera de stock.
- Columna `updated_at` indexada para descarga incremental en las tablas sincronizadas que no la tienen (`stock_movements`, `sale_items`).

**Etapa 2 — Base local + cola de pendientes**
- Dexie (IndexedDB), una base por `empresa + usuario` (`onestock_<company>_<user>`). Al cambiar de usuario se cierra la anterior; nunca se mezcla.
- Tabla local `outbox`: `op_id`, empresa, usuario, `device_id`, entidad, tipo, datos, `created_at`, versión local, estado (pendiente / en proceso / sincronizada / error), intentos, último error.
- Motor de sincronización: al iniciar, al volver la conexión, cada 30 s con la app activa y por Realtime. Reintentos con espera creciente; errores permanentes quedan visibles para resolver o descartar.
- Descarga incremental por `updated_at` con cursor guardado por tabla; Realtime solo acelera.
- Indicador en el encabezado: En línea / Sin conexión / Sincronizando / N pendientes / Error, con panel de detalle.
- Pantalla "Preparar para usar sin internet" en Configuración: elegir qué datos guardar (productos, clientes, proveedores, últimos N días de movimientos y ventas), ver espacio usado y pedir almacenamiento persistente.

**Etapa 3 — Abrir sin internet**
- `vite-plugin-pwa` (generateSW) con registro protegido: nunca en la vista previa del editor ni en desarrollo; solo en la web publicada. Navegación "red primero", archivos con hash en caché.
- Sesión offline explícita: si el token venció sin red, se permite modo local de solo-lectura + cola hasta 7 días; al reconectar se exige re-login antes de enviar.
- Cerrar sesión con pendientes: aviso y opción de exportar/conservar la cola cifrada por usuario.

**Etapa 4 — Módulos leyendo y escribiendo local**
Productos, Movimientos (entradas/salidas/ajustes/transferencias), Clientes, Proveedores, Caja (cobro, historial, anulación, cierre), Alertas y Reportes. Los reportes offline muestran "Calculado con datos de este dispositivo".
- Conflictos: productos/clientes/proveedores → si la versión del servidor cambió, se muestra comparación y el usuario elige (nunca se pisa en silencio). Ventas y movimientos → nunca se editan, se aplican como operaciones; si el servidor rechaza por stock, queda en "error" con explicación.

**Etapa 5 — Escáner y documentos**
- Sección "Escanear" (menú lateral y móvil). ZXing (`@zxing/browser`) para EAN-13/EAN-8/UPC/QR, cámara trasera, permiso solo al tocar, ingreso manual, bloqueo de lectura repetida 2 s, buscar en base local, abrir producto, registrar entrada/salida, asociar código.
- Documentos: foto o archivo → guardado local + cola de subida a `operation-docs` en la carpeta de la empresa. OCR en el navegador con Tesseract.js; extracción con IA opcional cuando hay red. Pantalla de revisión obligatoria antes de crear una compra.

**Etapa 6 — Alertas y notificaciones**
- Tabla `notifications` (empresa, destinatario, tipo, título, descripción, referencia, leída, `dedupe_key`, `resolved_at`) con regla única sobre alerta activa por producto → sin duplicados entre cliente y servidor.
- Trigger en `products`: crea alerta al llegar a `min_stock`, la resuelve al recuperarse. Mismo cálculo local offline.
- Centro de notificaciones (campana actual).
- Push: tabla `push_subscriptions`, claves VAPID como secretos del servidor, función del servidor que envía y borra suscripciones inválidas; botón explícito para activar/desactivar; tocar abre el producto. Push solo funciona en la web publicada.

## Pruebas
Pruebas automáticas para: cola, idempotencia, conflictos de versión, regla de alerta y aislamiento por usuario. Pruebas en navegador simulando sin conexión, cierre/reapertura y dos dispositivos. Modo avión real, cámara y push con la app cerrada **solo se pueden comprobar en tu celular con la versión publicada**; lo marcaré como pendiente de tu prueba, sin simular resultados.

## Detalles técnicos
- Cambia la regla actual del proyecto "PWA solo manifiesto" → se actualizará AGENTS.md.
- Migraciones solo aditivas; nada se borra.
- Dependencias nuevas: `dexie`, `dexie-react-hooks`, `vite-plugin-pwa`, `@zxing/browser`, `tesseract.js`.
- Es un trabajo grande: estimo varias entregas; empiezo por la Etapa 1 al aprobar.
