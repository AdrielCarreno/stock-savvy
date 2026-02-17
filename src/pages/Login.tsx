import { Link } from "react-router-dom";
import { Package, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auth integration goes here
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden gradient-hero flex-col justify-between p-12 lg:flex lg:w-2/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground">Stockly</span>
          </Link>

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
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <a href="#" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            <Button type="submit" className="w-full gradient-primary shadow-primary text-primary-foreground" size="lg">
              Iniciar sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
