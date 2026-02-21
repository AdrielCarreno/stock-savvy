import { Link } from "react-router-dom";
import { Package, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Error al enviar el correo");
      return;
    }
    setSent(true);
    toast.success("Revisá tu correo para restablecer la contraseña");
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden gradient-hero flex-col justify-between p-12 lg:flex lg:w-2/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/20">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Stockly</span>
        </Link>
        <div>
          <p className="text-white/80">
            Ingresá el email de tu cuenta y te enviamos un enlace para restablecer la contraseña.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="h-7 w-7 flex items-center justify-center rounded-lg gradient-primary">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground">Stockly</span>
          </Link>

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Recuperar contraseña</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            ¿Recordás tu contraseña?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Iniciá sesión
            </Link>
          </p>

          {sent ? (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
              <p className="text-sm text-green-800 dark:text-green-200">
                Si existe una cuenta con <strong>{email}</strong>, vas a recibir un correo con el enlace para restablecer la contraseña.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Volver al login</Link>
              </Button>
            </div>
          ) : (
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
              <Button
                type="submit"
                className="w-full gradient-primary shadow-primary text-primary-foreground"
                size="lg"
                disabled={loading}
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">Cancelar</Link>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
