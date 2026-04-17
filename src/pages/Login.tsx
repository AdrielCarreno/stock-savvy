import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Package, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const recoveryOk = searchParams.get("recovery") === "ok";
  const registered = searchParams.get("registered") === "1";
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Error al iniciar sesión");
      return;
    }
    toast.success("Sesión iniciada");
    navigate(from?.startsWith("/app") ? from : "/app/dashboard", { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error(result.error.message || "Error al iniciar sesión con Google");
      return;
    }
    if (result.redirected) return;
    navigate(from?.startsWith("/app") ? from : "/app/dashboard", { replace: true });
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
          <blockquote className="text-xl font-medium text-white">
            "Desde que usamos Stockly no volvimos a quedarnos sin stock en temporada alta."
          </blockquote>
          <p className="mt-4 text-sm text-white/60">— Carlos M., Distribuidor mayorista</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="h-7 w-7 flex items-center justify-center rounded-lg gradient-primary">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground">Stockly</span>
          </Link>

          {recoveryOk && (
            <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
              Revisá tu correo para restablecer la contraseña.
            </p>
          )}
          {registered && (
            <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
              Confirmá tu cuenta desde el correo que te enviamos y luego iniciá sesión.
            </p>
          )}

          <h1 className="mb-2 text-2xl font-bold">Bienvenido de vuelta</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Registrate gratis
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
              {loading ? "Iniciando sesión…" : "Iniciar sesión"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
