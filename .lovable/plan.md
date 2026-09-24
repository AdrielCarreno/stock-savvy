# Mejoras de diseño y uso en Caja POS

## Cambios
- Mostrar el catálogo como una lista vertical, con un producto por fila y datos claros: nombre, SKU o código, stock y precios minorista/mayorista.
- Permitir elegir el tipo de venta por producto; al llegar a 10 unidades, aplicar automáticamente el precio mayorista cuando exista.
- Dar más ancho y altura útil al carrito para compras grandes, manteniendo cantidades y totales visibles.
- Mejorar la selección de clientes con búsqueda y opción para registrar un cliente comercial sin salir de Caja.
- Corregir el flujo de impresión para que el ticket se cierre al terminar y los botones de volver permitan continuar usando Caja.

## Comprobación
- Validar cálculos minoristas/mayoristas, cantidad máxima por stock, selección/alta de clientes y navegación al cerrar el cobro.
- Revisar la vista en escritorio y móvil, y confirmar que no haya errores de compilación o ejecución.

## Detalles técnicos
- Reutilizar los precios `price_retail` y `price_wholesale`, el catálogo y los clientes existentes.
- Registrar en los movimientos si cada salida fue minorista o mayorista, sin crear catálogos paralelos.
- El umbral automático mayorista será de 10 unidades por producto.
