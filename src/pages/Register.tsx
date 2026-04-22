import { Link, useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export default function Register() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ company: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await signUp(form.email, form.password, form.company);
    setLoading(false);
    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        toast.error("Ese email ya está registrado. Iniciá sesión o usá 'Olvidé mi contraseña'.");
      } else if (msg.includes("password")) {
        toast.error("La contraseña no cumple los requisitos. Usá al menos 8 caracteres seguros.");
      } else {
        toast.error(error.message || "Error al crear la cuenta");
      }
      return;
    }
    // Detectar user_repeated_signup: Supabase devuelve un user con identities vacío
    const identities = (data?.user as { identities?: unknown[] } | null)?.identities;
    if (data?.user && Array.isArray(identities) && identities.length === 0) {
      toast.error(
        "Ese email ya tiene una cuenta. Si te registraste con Google, iniciá sesión con Google."
      );
      navigate("/login", { replace: true });
      return;
    }
    toast.success("¡Cuenta creada! Revisá tu email para verificarla antes de iniciar sesión.");
    navigate("/login?registered=1", { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error(result.error.message || "Error al registrarte con Google");
      return;
    }
    if (result.redirected) return;
    navigate("/app/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden gradient-hero flex-col justify-between p-12 lg:flex lg:w-2/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/20">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">OneStock</span>
        </Link>
        <div>
          <div className="mb-8 space-y-3">
            {["14 días de prueba gratuita", "Sin tarjeta de crédito", "Cancelá cuando quieras"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/80">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                {item}
              </div>
            ))}
          </div>
          <blockquote className="text-lg font-medium text-white">
            "En 10 minutos ya teníamos todo el stock cargado y funcionando."
          </blockquote>
          <p className="mt-3 text-sm text-white/60">— María G., Comercio textil</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="h-7 w-7 flex items-center justify-center rounded-lg gradient-primary">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground">OneStock</span>
          </Link>

          <h1 className="mb-2 text-2xl font-bold">Creá tu cuenta gratis</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Iniciá sesión
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company">Nombre de la empresa</Label>
              <Input
                id="company"
                name="company"
                placeholder="Mi Distribuidora S.A."
                value={form.company}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@empresa.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary shadow-primary text-primary-foreground"
              size="lg"
              disabled={loading}
            >
              {loading ? "Creando cuenta…" : "Crear cuenta — 14 días gratis"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Al registrarte aceptás nuestros{" "}
              <a href="#" className="text-primary hover:underline">términos y condiciones</a>
            </p>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
            </svg>
            Continuar con Google
          </Button>
        </div>
      </div>
    </div>
  );
}
