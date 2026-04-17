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
    const { error } = await signUp(form.email, form.password, form.company);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Error al crear la cuenta");
      return;
    }
    toast.success("¡Cuenta creada! Redirigiendo…");
    setTimeout(() => {
      navigate("/app/dashboard", { replace: true });
    }, 400);
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
          <span className="text-lg font-bold text-white">Stockly</span>
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
            <span className="font-bold text-foreground">Stockly</span>
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
        </div>
      </div>
    </div>
  );
}
