## Alcance

Seis cambios, agrupados de menor a mayor riesgo:

### 1. Dashboard (`/app/dashboard`)
- Mover `StockChart` y `ClientsChart` **al inicio** de la página (arriba de los KPIs).
- Reemplazar los bloques inferiores y dejar sólo los datos pedidos:
  - Ventas totales (monto y cantidad)
  - Productos más vendidos (top 5)
  - Productos bajo stock (lista corta + link)
  - Movimientos últimos 30 días (cantidad total, entradas vs salidas)
  - Entradas y salidas en términos **monetarios** (compras vs ventas del período)
- Eliminar KPIs sueltos que no estén en la lista (Integraciones, Clientes/Proveedores del panel actual, valor inventario, etc.).

### 2. Products — Importar datos (`/app/products`)
- Actualizar `ImportProductsDialog` para que el mapeo/plantilla use **exactamente los mismos nombres de columna** que muestra la tabla en pantalla, excepto la columna "Acciones".
- Regenerar la plantilla CSV de ejemplo con esos headers.
- Aceptar el archivo cuando los headers coinciden con los visibles.

### 3. Unificar Movimientos + Compras + Ventas
- `/app/movements` pasa a ser la página única con **pestañas**: `Todos | Compras | Ventas | Ajustes de stock`.
- Cada pestaña reutiliza el contenido actual de su página (formularios, filtros, tablas).
- La pestaña "Todos" es un feed cronológico con columna `Tipo`.
- `/app/purchases` y `/app/sales` se convierten en redirecciones a `/app/movements?tab=...`.
- Sidebar y bottom nav: quitar Compras y Ventas como entradas separadas; "Movimientos" queda como único acceso.

### 4. Proveedores (`/app/suppliers`)
- Agregar columna **Producto que provee**.
- Modelo: relación N:M (un proveedor puede proveer varios productos). Se guarda como array de IDs de producto en una tabla intermedia liviana `supplier_products` (supplier_id, product_id).
- En la tabla se muestran los primeros 2 nombres + "+N" si hay más.
- En el formulario de alta/edición de proveedor, multi-select de productos existentes.

### 5. Ocultar Clientes
- Quitar `/app/customers` del sidebar, del bottom nav y del router (redirect a dashboard).
- **No** se toca la tabla `customers` ni las referencias en `sales` (queda todo en BD, reversible).

### 6. Contabilidad — nueva página `/app/accounting` (partida doble estricta)

Módulo contable formal con las siguientes secciones (tabs):

- **Plan de cuentas**: árbol editable con tipo (`activo | pasivo | patrimonio | ingreso | gasto`), código y nombre. Se siembra un plan estándar por empresa al crearse.
- **Libro diario**: alta de asientos con múltiples líneas (débito/haber). Validación: suma débitos = suma haberes antes de guardar. Cada asiento tiene fecha, descripción, número correlativo.
- **Libro mayor**: por cuenta, movimientos y saldo acumulado, filtrable por período.
- **Balance general**: Activo / Pasivo / Patrimonio Neto a una fecha, con verificación Activo = Pasivo + PN.
- **Estado de resultados**: Ingresos − Gastos por período, con resultado del ejercicio.

Los asientos son **manuales** en esta primera versión (no se auto-generan desde ventas/compras) para no ensuciar datos existentes. Queda como mejora futura enganchar triggers.

## Detalles técnicos

**Migración de base de datos (una sola):**

```sql
-- 5. Suppliers ↔ Products
CREATE TABLE public.supplier_products (
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id)  ON DELETE CASCADE,
  company_id  UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (supplier_id, product_id)
);
-- GRANT + RLS por company_id vía current_company_id()

-- 6. Contabilidad
CREATE TYPE account_type AS ENUM ('activo','pasivo','patrimonio','ingreso','gasto');

CREATE TABLE public.accounts (
  id UUID PK, company_id UUID, code TEXT, name TEXT,
  type account_type, parent_id UUID NULL, is_active BOOL DEFAULT true,
  created_at, updated_at
);

CREATE TABLE public.journal_entries (
  id UUID PK, company_id UUID, entry_number INT,
  entry_date DATE, description TEXT, created_by UUID,
  created_at, updated_at
);

CREATE TABLE public.journal_lines (
  id UUID PK, entry_id UUID REFERENCES journal_entries ON DELETE CASCADE,
  company_id UUID, account_id UUID REFERENCES accounts,
  debit NUMERIC(14,2) DEFAULT 0, credit NUMERIC(14,2) DEFAULT 0,
  CHECK ((debit=0 AND credit>0) OR (credit=0 AND debit>0))
);

-- Trigger BEFORE INSERT/UPDATE en journal_entries que valide
-- SUM(debit)=SUM(credit) sobre journal_lines del asiento (via función DEFERRABLE
-- ejecutada al confirmar el asiento desde la app).
```

Grants + RLS por `company_id = current_company_id()` en las 4 tablas.
Seed del plan de cuentas se hace desde el cliente al primer ingreso a `/app/accounting` si la empresa no tiene cuentas.

**Frontend:**
- `src/pages/app/Accounting.tsx` con tabs (`Tabs` de shadcn).
- Componentes: `ChartOfAccounts`, `JournalEntryForm`, `JournalList`, `GeneralLedger`, `BalanceSheet`, `IncomeStatement`.
- Hook `useAccounting` centraliza queries.
- Formulario de asiento con líneas dinámicas y totalizador vivo; botón "Guardar" deshabilitado hasta que débitos = haberes y ≥ 2 líneas.

**Movimientos unificado:**
- `Movements.tsx` envuelve el contenido existente en `<Tabs>` con `defaultValue` según `?tab=`.
- Se importan los componentes actuales de `Purchases.tsx` y `Sales.tsx` extrayendo su contenido en subcomponentes reutilizables (`PurchasesPanel`, `SalesPanel`).

**Sidebar / bottom nav:**
- Quitar: Compras, Ventas, Clientes.
- Agregar: Contabilidad.
- Ajustar `pageTitles` en `AppLayout`.

**Rutas:**
- `/app/purchases` → `<Navigate to="/app/movements?tab=purchases" />`
- `/app/sales` → `<Navigate to="/app/movements?tab=sales" />`
- `/app/customers` → `<Navigate to="/app/dashboard" />`
- `/app/accounting` → nueva ruta.

## Fuera de alcance
- Auto-generar asientos contables desde ventas/compras (queda para siguiente iteración).
- Cierre de ejercicio / bloqueo de períodos.
- Multi-moneda en contabilidad (todo en ARS).
