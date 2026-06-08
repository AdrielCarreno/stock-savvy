import { Link } from "react-router-dom";
import { 
  Package, 
  TrendingDown, 
  BarChart3, 
  Bell, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveSocialProof } from "@/components/landing/LiveSocialProof";

const features = [
  {
    icon: Package,
    title: "Gestión de Productos",
    description: "Controlá tu catálogo completo con SKU, precios y categorías. Buscá y filtrá en segundos.",
  },
  {
    icon: BarChart3,
    title: "Movimientos de Stock",
    description: "Registrá entradas y salidas con historial completo. Sabé qué pasó, cuándo y quién lo hizo.",
  },
  {
    icon: TrendingDown,
    title: "Alertas de Bajo Stock",
    description: "Recibí avisos automáticos cuando un producto cae bajo el mínimo configurado.",
  },
  {
    icon: Bell,
    title: "Dashboard en tiempo real",
    description: "Métricas clave de tu inventario al instante: valor total, movimientos y productos críticos.",
  },
];

const steps = [
  { number: "01", title: "Registrá tu empresa", desc: "Creá tu cuenta y configurá tu depósito en menos de 2 minutos." },
  { number: "02", title: "Cargá tus productos", desc: "Importá o creá tu catálogo con precios, SKUs y stock mínimo." },
  { number: "03", title: "Registrá movimientos", desc: "Cada entrada o salida queda registrada con fecha y usuario." },
  { number: "04", title: "Controlá todo", desc: "Tu dashboard te muestra el estado real de tu inventario siempre." },
];

const faqs = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. OneStock es 100% web y funciona desde cualquier computadora con internet, sin instalaciones. Además, si tu empresa lo desea, ofrecemos capacitación y migración de datos sin costo adicional para que arranques sin fricción.",
  },
  {
    q: "¿Cuántos usuarios puedo tener?",
    a: "El plan Inicial incluye hasta 3 usuarios por empresa, ideal para equipos pequeños que necesitan trabajar en paralelo sobre el mismo inventario.",
  },
  {
    q: "¿Qué pasa cuando termina el período de prueba?",
    a: "Tu cuenta queda suspendida hasta activar el plan. Tus datos no se pierden.",
  },
  {
    q: "¿Puedo manejar múltiples depósitos?",
    a: "Sí. El plan Inicial te permite gestionar hasta 3 depósitos en simultáneo desde la misma cuenta.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Cada empresa tiene sus datos completamente aislados. Usamos cifrado y backups automáticos.",
  },
];

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">OneStock</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Funcionalidades</a>
            <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Cómo funciona</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Precio</a>
            <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-primary shadow-primary text-primary-foreground">
                Comenzar gratis
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-card px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
              <a href="#how" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
              <a href="#pricing" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Precio</a>
              <a href="#faq" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>FAQ</a>
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Iniciar sesión</Button></Link>
                <Link to="/register" className="flex-1"><Button className="w-full gradient-primary text-primary-foreground" size="sm">Comenzar gratis</Button></Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden px-4 py-24 md:py-36">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 25% 40%, hsl(221 83% 53%) 0%, transparent 50%), radial-gradient(circle at 75% 60%, hsl(168 84% 42%) 0%, transparent 50%)"
          }}
        />
        <div className="container relative text-center">
          <Badge className="mb-6 inline-flex bg-white/10 text-white/80 border-white/20 hover:bg-white/10">
            🚀 14 días gratis — sin tarjeta de crédito
          </Badge>
          <h1 className="text-balance mb-6 text-4xl font-bold text-white md:text-6xl lg:text-7xl">
            Control de inventario
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              sin complicaciones
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-balance text-lg text-white/70 md:text-xl">
            La herramienta simple para distribuidores y comercios que quieren saber 
            exactamente cuánto stock tienen, sin planillas ni errores.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/register">
              <Button size="lg" className="h-12 gap-2 bg-white px-8 text-base font-semibold text-primary hover:bg-white/90">
                Comenzar prueba gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="ghost" className="h-12 px-8 text-base text-white/80 hover:bg-white/10 hover:text-white">
                Ver cómo funciona
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-white/40">Sin tarjeta de crédito · 14 días gratis · Cancelá cuando quieras</p>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-border bg-card py-20 px-4">
        <div className="container max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">¿Te pasa esto?</h2>
          <p className="mb-12 text-lg text-muted-foreground">Los problemas de inventario cuestan tiempo y dinero todos los días</p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { emoji: "📋", title: "Planillas desactualizadas", desc: "Tu Excel de stock nunca refleja la realidad porque nadie lo actualiza a tiempo." },
              { emoji: "🤷", title: "\"No sé si tengo\"", desc: "Clientes esperando respuestas que no tenés porque no sabés cuánto stock real hay." },
              { emoji: "💸", title: "Stock muerto o faltante", desc: "Comprás de más o te quedás sin producto. Ambas situaciones son pérdida de dinero." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-background p-6 text-left shadow-card">
                <div className="mb-3 text-3xl">{item.emoji}</div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container max-w-5xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Funcionalidades</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Todo lo que necesitás, nada que no</h2>
            <p className="text-muted-foreground">Diseñado para ser simple pero completo para el día a día.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-elevated">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light group-hover:gradient-primary transition-all">
                  <f.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-card py-20 px-4">
        <div className="container max-w-4xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-accent-light text-accent border-accent/20">Cómo funciona</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Empezá en minutos</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-8 top-5 hidden h-0.5 w-full bg-border lg:block" />
                )}
                <div className="relative flex flex-col gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-primary">
                    {step.number}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container max-w-7xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Precios</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Elegí el plan que mejor se adapta a tu operación</h2>
            <p className="text-muted-foreground">Precios en pesos argentinos. 14 días gratis sin tarjeta de crédito.</p>
          </div>

          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Básico",
                price: "$27.800",
                highlight: false,
                desc: "Ideal para arrancar a controlar tu stock",
                features: [
                  { label: "Operaciones", value: "Básico" },
                  { label: "Usuarios", value: "1 a 2" },
                  { label: "Depósitos", value: "1" },
                  { label: "Dashboard analítico de ingresos y egresos", value: true },
                  { label: "Integraciones", value: false },
                  { label: "Importaciones desde Excel", value: true },
                  { label: "Alertas de stock", value: true },
                  { label: "Funciones de IA", value: false },
                  { label: "Soporte", value: true },
                  { label: "Factura electrónica y remitos", value: true },
                ],
              },
              {
                name: "Premium",
                price: "$46.800",
                highlight: true,
                desc: "Para equipos que necesitan más potencia",
                features: [
                  { label: "Operaciones", value: "Premium" },
                  { label: "Usuarios", value: "3 a 5" },
                  { label: "Depósitos", value: "Hasta 3" },
                  { label: "Dashboard analítico de ingresos y egresos", value: true },
                  { label: "Integraciones", value: true },
                  { label: "Importaciones desde Excel", value: true },
                  { label: "Alertas de stock", value: true },
                  { label: "Funciones de IA", value: true },
                  { label: "Soporte", value: true },
                  { label: "Factura electrónica y remitos", value: true },
                ],
              },
              {
                name: "Empresa",
                price: "$72.300",
                highlight: false,
                desc: "Para operaciones que escalan",
                features: [
                  { label: "Operaciones", value: "Empresa" },
                  { label: "Usuarios", value: "7 a 10" },
                  { label: "Depósitos", value: "+4" },
                  { label: "Dashboard analítico de ingresos y egresos", value: true },
                  { label: "Integraciones", value: true },
                  { label: "Importaciones desde Excel", value: true },
                  { label: "Alertas de stock", value: true },
                  { label: "Funciones de IA", value: true },
                  { label: "Soporte", value: true },
                  { label: "Factura electrónica y remitos", value: true },
                ],
              },
              {
                name: "A medida",
                price: "Consultar ventas",
                highlight: false,
                custom: true,
                desc: "Software a medida, ecommerce, logística y más",
                features: [
                  { label: "Operaciones", value: "A medida" },
                  { label: "Usuarios", value: "A medida" },
                  { label: "Depósitos", value: "A medida" },
                  { label: "Dashboard analítico personalizado", value: true },
                  { label: "Integraciones específicas", value: true },
                  { label: "Importaciones a medida", value: true },
                  { label: "Alertas de stock", value: true },
                  { label: "IA personalizada", value: true },
                  { label: "Soporte dedicado", value: true },
                  { label: "Factura electrónica y remitos", value: true },
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-card p-6 shadow-card transition-all hover:shadow-elevated ${
                  plan.highlight ? "border-2 border-primary shadow-elevated" : "border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-primary-foreground border-0 px-3 py-1">Recomendado</Badge>
                  </div>
                )}
                <div className="mb-3 pt-2">
                  <h3 className={`text-xl font-semibold ${plan.highlight ? "text-primary" : "text-foreground"}`}>{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                </div>
                <div className="mb-4">
                  <span className={`font-bold text-foreground ${plan.custom ? "text-2xl" : "text-3xl"}`}>{plan.price}</span>
                  {!plan.custom && <span className="text-sm text-muted-foreground"> /mes</span>}
                </div>
                <div className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-start gap-2 text-sm">
                      {typeof f.value === "boolean" ? (
                        f.value ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-0.5" />
                        )
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                      )}
                      <span className={typeof f.value === "boolean" && !f.value ? "text-muted-foreground/60" : "text-foreground"}>
                        {f.label}
                        {typeof f.value === "string" && <span className="text-muted-foreground">: {f.value}</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href={`https://wa.me/5493516516785?text=${encodeURIComponent(`Hola, quiero consultar por el plan ${plan.name} de OneStock`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className={`w-full ${plan.highlight ? "gradient-primary shadow-primary text-primary-foreground" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.custom ? "Consultar ventas" : "Contratar"}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-card py-20 px-4">
        <div className="container max-w-2xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="gradient-hero py-20 px-4">
        <div className="container max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">¿Tenés dudas?</h2>
          <p className="mb-8 text-white/70">Escribinos y te respondemos en menos de 24 horas.</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="mailto:hola@onestock.app">
              <Button size="lg" className="h-12 bg-white px-8 text-primary hover:bg-white/90">
                hola@onestock.app
              </Button>
            </a>
            <Link to="/register">
              <Button size="lg" variant="ghost" className="h-12 border border-white/30 px-8 text-white hover:bg-white/10">
                Comenzar gratis ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded gradient-primary">
              <Package className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-foreground">OneStock</span>
          </div>
          <p>© 2025 OneStock. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacidad</a>
            <a href="#" className="hover:text-foreground">Términos</a>
          </div>
        </div>
      </footer>

      {/* Prueba social en vivo */}
      <LiveSocialProof />
    </div>
  );
}
