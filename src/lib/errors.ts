// Map Supabase/PostgREST errors to user-friendly messages so we don't leak
// constraint names, column names, or RLS policy details to end users.
export function friendlyError(err: unknown, fallback = "Algo salió mal. Intentá de nuevo."): string {
  if (import.meta.env.DEV) console.error("[app error]", err);
  const e = err as { code?: string; message?: string } | null;
  const code = e?.code;
  switch (code) {
    case "23505": return "Ya existe un registro con esos datos.";
    case "23503": return "No se puede completar: hay datos relacionados.";
    case "23502": return "Faltan datos obligatorios.";
    case "23514": return "Algunos datos no cumplen las reglas requeridas.";
    case "22P02": return "Formato de datos inválido.";
    case "42501":
    case "PGRST301":
    case "PGRST116": return "No tenés permisos para esta acción.";
  }
  const msg = e?.message ?? "";
  if (/row-level security/i.test(msg)) return "No tenés permisos para esta acción.";
  if (/duplicate key/i.test(msg)) return "Ya existe un registro con esos datos.";
  if (/violates not-null/i.test(msg)) return "Faltan datos obligatorios.";
  return fallback;
}
