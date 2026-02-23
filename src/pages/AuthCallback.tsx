import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles the redirect from email verification links.
 * Supabase appends tokens as URL hash fragments (#access_token=...&type=signup).
 * This page lets the client pick up those tokens, establish a session,
 * then redirects the user into the app.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // supabase-js automatically reads the hash fragment and exchanges it for a session
        const { error } = await supabase.auth.getSession();
        if (error) {
          setError(error.message);
          return;
        }
        // Small delay to let onAuthStateChange propagate
        setTimeout(() => {
          navigate("/app/dashboard", { replace: true });
        }, 300);
      } catch (err: any) {
        setError(err?.message || "Error inesperado");
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-destructive">Error de verificación</h1>
          <p className="text-muted-foreground">{error}</p>
          <a href="/login" className="text-primary hover:underline text-sm">
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Verificando tu cuenta…</p>
      </div>
    </div>
  );
}
