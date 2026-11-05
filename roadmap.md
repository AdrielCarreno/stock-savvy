# Roadmap

## Facturación electrónica ARCA
- [x] Auditar arquitectura, aislamiento y compatibilidad del SDK; preparar el plan previo a cambios importantes.
- [x] Implementar configuración fiscal, persistencia y pantalla Facturación (modo homologación fijo).
- [ ] Servicio externo ARCA (Node.js 22): bloqueado — requiere alojamiento fuera de OneStock y certificado de homologación del comercio.
- [ ] (bloqueado por el servicio externo) Integrar emisión, conciliación, notas de crédito, ventas existentes, PDF e historial.
- [ ] Validar seguridad y casos fiscales exclusivamente en homologación; requiere credenciales ARCA del comercio.

- [x] Cambiar el catálogo de Caja a una lista vertical con datos comerciales completos.
- [x] Aplicar y permitir elegir precios minoristas o mayoristas desde 10 unidades.
- [x] Ampliar el espacio visible del carrito para compras grandes.
- [x] Incorporar búsqueda y alta rápida de clientes comerciales.
- [x] Permitir volver a Caja después de imprimir o cerrar el ticket.
- [x] Validar tipos, compilación y estado de la vista.
- [x] Rediseñar la landing con una dirección editorial de alto contraste.
- [x] Reemplazar grids repetitivos por bloques alternados, lista funcional y stepper interactivo.
- [x] Diferenciar precios, rubros y cierre con composiciones propias.
- [x] Mantener contenido comercial y enlaces sin inventar prueba social.

- [x] Confirmar que la foto de la landing carga en la web publicada (solo falla en el servidor local).
- [x] Crear el lenguaje visual editorial compartido del área interna.
- [x] Aplicar el nuevo diseño a navegación, encabezado y menú móvil.
- [x] Rediseñar Dashboard, Caja, Productos, Stock/Movimientos y Alertas.
- [x] Rediseñar Proveedores, Usuarios, Reportes, Integraciones, IA y Configuración.
- [x] Validar visualmente todas las páginas internas en escritorio y móvil y corregir los problemas detectados.
- [x] Mostrar el botón "Instalar app" solo dentro del área de usuarios, nunca en la landing.
- [x] Usar las tres fotos de depósito como fondo de la portada y la captura real de Productos en Funcionalidades.

## Etapa 5 — Escaneo y documentos
- [x] Escáner con cámara y búsqueda manual, catálogo local por empresa y usuario.
- [x] Entrada/salida y asociación de códigos con confirmación.
- [x] Documentos locales, OCR y revisión explícita; subida privada con reintentos.
- [x] Pruebas de reglas y persistencia local.
- [ ] Verificación real de movimientos, OCR y subida: bloqueada por prueba vencida; cámara física no disponible en el sandbox.

## Escaneo para cobro móvil
- [x] Destacar el escáner en el centro del menú móvil sin perder acceso a Stock.
- [x] Agregar lectura por cámara al carrito de Clientes y conectar Escanear con el cobro.
- [x] Probar códigos y carrito (14 pruebas), navegación autenticada y diseño del menú móvil; compilación correcta.
- [ ] Comprobar venta real y cámara física: prueba de la cuenta vencida y dispositivo físico no disponible.
