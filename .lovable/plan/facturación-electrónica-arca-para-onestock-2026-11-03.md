# Facturación electrónica ARCA para OneStock

## Auditoría: situación actual

- OneStock ya tiene empresas, usuarios y roles, clientes, productos, ventas, pagos y movimientos. La sección **Clientes** utiliza el punto de venta existente.
- Las ventas se registran mediante una operación transaccional que también descuenta stock. La facturación debe trabajar sobre esa venta, sin repetir la operación comercial.
- El aislamiento actual utiliza `company_id`, asociado a la empresa del usuario autenticado. Se conservará este identificador en lugar de crear otro `business_id` paralelo.
- Existen campos de número/enlace de factura, pero no configuración fiscal, certificados, CAE ni emisión electrónica. La tarjeta ARCA de Integraciones dice «Próximamente».
- Se consultaron las tablas y políticas vigentes. Los nuevos permisos fiscales serán explícitos y comprobados en el servidor; no se heredarán permisos amplios de escritura de ventas ni el campo de rol del perfil.
- Los importes actuales de ventas no contienen el desglose fiscal completo por alícuota y usan números de JavaScript en la interfaz. No se puede asumir que el impuesto agregado de una venta equivale a su IVA fiscal.

## Compatibilidad verificada y dependencia externa

El paquete publicado `facturas@0.26.0` requiere **Node.js 22 o superior**. `@facturas/pdf@0.26.0` también requiere Node.js 22. Lovable Cloud ejecuta funciones Deno; la compatibilidad de estos paquetes con ese entorno no está verificada.

Se propone un **servicio fiscal independiente Node.js 22**, separado de la aplicación web, conectado mediante funciones autenticadas de Lovable Cloud. Este entorno necesita alojamiento, configuración y despliegue externos; no se añadirá un servidor persistente al proyecto cliente ni se simulará una conexión ARCA funcional.

El adaptador oficial `createPostgresStore` requiere acceso SQL parametrizado a PostgreSQL y una tabla previamente creada. Su implementación publicada usa `key`, `value` y `updated_at` y bloqueos mediante filas con renovación de arrendamiento, compatibles en diseño con un pool transaccional. La conexión real y el aislamiento de las claves se probarán antes de elegir la persistencia definitiva. Lovable Cloud no ofrece al usuario una contraseña de base de datos para configurar el servicio externo: se podrá provisionar PostgreSQL privado junto al servicio y conservar en Lovable Cloud los registros fiscales de OneStock. No se prometerá reutilizar directamente la conexión de Cloud sin verificar una vía compatible.

## Etapas y entregables

### 1. Contrato técnico y prueba de compatibilidad

- Fijar versiones de ambos paquetes; comprobar sus tipos, contratos de emisión, recuperación y PDF.
- Probar el adaptador oficial con PostgreSQL persistente y concurrencia en el alojamiento del servicio fiscal.
- Validar que las reservas y bloqueos se separan por empresa, entorno, CUIT, punto de venta y tipo de comprobante, incluyendo empresas que compartan un emisor.
- Definir autenticación entre Cloud y servicio externo, almacenamiento cifrado y reconciliación si falla la escritura del resultado en OneStock.
- No avanzar a emisión si faltan alojamiento, persistencia duradera o credenciales de homologación.

### 2. Configuración y migraciones aditivas

Agregar **Facturación electrónica** dentro de Configuración, con CUIT, razón social, condición IVA, domicilio fiscal, inicio de actividades, Ingresos Brutos, punto de venta, entorno y estado de conexión.

Crear, sin reemplazar tablas comerciales:

| Entidad | Datos y protección |
| --- | --- |
| `fiscal_settings` | Identidad fiscal por empresa; lectura propia y cambios solo de administradores. |
| `fiscal_credentials` | Referencia a credenciales cifradas, versión y estado; sin acceso desde el navegador. |
| `fiscal_sales_points` | Puntos de venta por emisor y entorno; unicidad e índices. |
| `fiscal_invoices` | Venta/cliente opcionales, instantánea fiscal, importes exactos, operación estable, número, CAE, vencimiento, QR y estado. |
| `fiscal_invoice_items` | Detalle fiscal inmutable, cantidades, descuentos y alícuotas. |
| `fiscal_invoice_events` | Eventos auditables y conciliación; escritura exclusiva del servicio, sin edición ni borrado. |

Agregar datos fiscales opcionales a clientes y datos de alícuota/configuración a productos cuando sean necesarios; no deducirlos del precio ni de las notas del cliente.

Todas las tablas públicas tendrán permisos explícitos y RLS. Las referencias entre empresa, venta, cliente y comprobante deberán impedir asociaciones entre empresas. La tabla privada del adaptador SDK seguirá su contrato, sin exponer sesiones, reservas ni credenciales a usuarios.

### 3. Servicio fiscal seguro

- Validación de configuración, prueba de conexión, facturas A/B/C, consulta, recuperación, notas de crédito y consulta fiscal de clientes cuando el servicio y certificado lo permitan.
- Claves de idempotencia estables y una instantánea congelada de la solicitud. Un reintento mantiene la misma clave y los mismos datos.
- Tratar explícitamente `authorized`, `rejected`, `indeterminate` y `conflict`. Una emisión incierta queda bloqueada para conciliación mediante `recover()`; jamás genera otra factura automáticamente.
- Comprobar pertenencia y rol desde la sesión en Cloud; no confiar en empresa, importes, CAE ni estados enviados por el navegador.
- Cifrar certificados y claves con una clave mantenida fuera de la base de datos, o usar un gestor de secretos del alojamiento. No persistirlos en navegador, OCR, cachés ni logs.
- Incluir límites de solicitudes en el servicio externo y auditoría sin secretos ni cargas fiscales sensibles en logs.

### 4. Pantallas e integración comercial

- Nueva sección **Facturación** en el menú, manteniendo el diseño actual de escritorio y móvil.
- Nueva factura con cliente, comprobante, punto de venta, productos, cantidades, precios, descuentos, impuestos, total y vista previa.
- Administradores configuran credenciales; administradores y gerentes emiten/conciliarán; otros roles pueden consultar según permisos existentes, sin facultad de modificar comprobantes. Estos permisos se validarán también en el servidor.
- Desde el historial de Clientes, **Facturar venta** reutiliza productos, cliente e importes de la venta. Solicita datos fiscales faltantes, sin alterar la venta original.
- Si una venta no permite reconstruir un desglose fiscal exacto coherente con su total, bloquear la emisión y explicar qué dato falta; nunca ajustar importes silenciosamente.
- Mantener separados el estado comercial, los pagos y el estado fiscal. Facturar no crea cobros ni movimientos. Una factura independiente tampoco altera stock o caja por sí sola.
- No emitir sin conexión ni usar una cola offline para emitir automáticamente al reconectar.

### 5. PDF, historial y correcciones

- Generar PDF a partir del comprobante autorizado y su instantánea, usando `buildVoucherDocument()` y `@facturas/pdf` tras validar los contratos.
- Mostrar emisor, receptor, productos, impuestos, CAE, vencimiento y QR fiscal.
- Historial con filtros por fecha, cliente, tipo y estado; descarga y envío por email mediante un servicio de correo configurado.
- Comprobantes autorizados no editables ni eliminables desde interfaz o servidor. Notas de crédito vinculadas para correcciones; no confundir anulación comercial con anulación fiscal.

### 6. Validación en homologación

Pruebas automatizadas de importes exactos, permisos por empresa, inmutabilidad, idempotencia, concurrencia y ausencia de efectos comerciales al facturar una venta.

Pruebas del recorrido real en homologación: factura autorizada, rechazada, corte de conexión, recuperación/reintento, dos emisiones simultáneas, acceso entre empresas bloqueado, PDF y nota de crédito asociada. Las simulaciones sirven para pruebas unitarias, pero no sustituyen la autorización real de ARCA.

**Producción permanecerá deshabilitada hasta autorización expresa del usuario.**

## Dependencias manuales y límites de esta entrega

La implementación posterior necesita alojamiento Node.js 22 con PostgreSQL persistente y cifrado, certificado/clave ARCA de homologación por comercio, servicios habilitados y punto de venta electrónico. El envío de PDF necesita correo configurado. Se proporcionará un asistente y se solicitarán secretos por vías seguras, nunca pegados en el chat.

Esta entrega es la auditoría y el plan previo solicitado; no cambia ventas, stock, permisos actuales ni emite comprobantes.

## Referencias verificadas

- Documentación: https://facturas-sdk.dev/
- Prevención de duplicados: https://facturas-sdk.dev/guides/avoid-duplicates
- Comprobantes impresos: https://facturas-sdk.dev/guides/printed-voucher
- Repositorio: https://github.com/LaPyme/facturas
- Versiones y requisitos comprobados en npm: `facturas@0.26.0`, `@facturas/pdf@0.26.0`; contrato PostgreSQL revisado en el código publicado del SDK.