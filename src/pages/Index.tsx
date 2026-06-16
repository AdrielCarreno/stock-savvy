import { Link } from "react-router-dom";
import {
  Package,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Plug,
  Smartphone,
  ShieldCheck,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveSocialProof } from "@/components/landing/LiveSocialProof";
import { ThemeToggle } from "@/components/ThemeToggle";

type BillingCycle = "mensual" | "anual";

const featuresDark = [
  { icon: Package, title: "Control de stock", desc: "Gestioná tu inventario en tiempo real, con múltiples depósitos y trazabilidad por producto." },
  { icon: ArrowLeftRight, title: "Movimientos", desc: "Registrá entradas, salidas y ajustes. Mantené el historial completo de tu mercadería." },
  { icon: AlertTriangle, title: "Alertas de bajo stock", desc: "Configurá mínimos por producto y recibí avisos antes de quedarte sin mercadería." },
  { icon: Plug, title: "Integraciones", desc: "Conectá Mercado Libre, Tienda Nube, Shopify, WhatsApp Business y ARCA en pocos clics." },
  { icon: BarChart3, title: "Reportes claros", desc: "Valor de inventario, rotación, productos críticos y evolución mes a mes." },
  { icon: ShieldCheck, title: "Datos seguros", desc: "Información cifrada, backups automáticos y permisos por usuario." },
];

const integrations = ["Mercado Libre", "Tienda Nube", "Shopify", "WhatsApp Business", "ARCA (AFIP)", "+ Más integraciones"];

const faqs = [
  {
    q: "¿OneStock funciona para mi tipo de negocio?",
    a: "Sí. OneStock está pensado para comercios, distribuidoras, mayoristas y pymes que necesitan controlar stock, entradas, salidas y ventas. Funciona igual de bien si tenés un solo local o varios depósitos, y si vendés por mostrador, online o por canales como Mercado Libre, Tienda Nube o Shopify.",
  },
  {
    q: "¿Necesito instalar algo para usarlo?",
    a: "No. OneStock es 100% en la nube. Solo necesitás un navegador y acceso a internet — no hay nada que descargar ni configurar en tu computadora. Podés acceder desde cualquier dispositivo, en cualquier momento.",
  },
  {
    q: "¿Cómo funciona el control de stock y los movimientos?",
    a: "Cada producto tiene su stock actual, stock mínimo y costo. Cuando registrás una entrada (compra, ajuste) o una salida (venta, devolución), el sistema actualiza el inventario al instante y guarda el movimiento en el historial. Si un producto cae por debajo del mínimo, recibís una alerta de bajo stock.",
  },
  {
    q: "¿Puedo conectar Mercado Libre, Tienda Nube o Shopify?",
    a: "Sí. OneStock se integra con Mercado Libre, Tienda Nube, Shopify y WhatsApp Business para sincronizar productos, stock y pedidos en un solo lugar. También se conecta con ARCA (ex-AFIP) para simplificar la parte impositiva.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Toda la información que cargás en OneStock está almacenada en servidores con cifrado, backups automáticos y acceso protegido por credenciales individuales. Vos controlás quién ve qué dentro de tu equipo mediante permisos por usuario. Nunca compartimos ni vendemos tus datos a terceros.",
  },
  {
    q: "¿Puedo importar mis productos desde Excel?",
    a: "Sí. OneStock permite importar productos y movimientos de stock desde archivos Excel/CSV para que no tengas que cargar todo a mano. Disponible en todos los planes.",
  },
  {
    q: "¿Qué pasa cuando termina el período de prueba?",
    a: "Al finalizar los 14 días podés elegir el plan que mejor se adapte a tu negocio y continuar sin perder ningún dato. No pedimos tarjeta de crédito para empezar — si decidís no continuar, no se te cobra nada.",
  },
];

type Plan = {
  name: string;
  monthly: number | null;
  desc: string;
  highlight?: boolean;
  custom?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Inicial",
    monthly: 28700,
    desc: "Para comercios y pymes que empiezan a ordenar su stock",
    features: [
      "Hasta 500 productos",
      "1 depósito",
      "Movimientos ilimitados",
      "Alertas de bajo stock",
      "Hasta 2 usuarios",
      "Soporte por email",
    ],
  },
  {
    name: "Premium",
    monthly: 47600,
    desc: "Para negocios que venden por varios canales",
    highlight: true,
    features: [
      "Productos ilimitados",
      "Hasta 3 depósitos",
      "Integraciones (Mercado Libre, Tienda Nube, Shopify)",
      "WhatsApp Business y ARCA",
      "Reportes avanzados",
      "Hasta 5 usuarios",
      "Soporte prioritario",
    ],
  },
  {
    name: "Empresarial",
    monthly: 68400,
    desc: "Para distribuidoras y empresas con operación grande",
    features: [
      "Todo lo del plan Premium",
      "Depósitos ilimitados",
      "Usuarios ilimitados con permisos avanzados",
      "Integraciones completas",
      "Reportes personalizados",
      "Onboarding asistido",
      "Soporte por WhatsApp dedicado",
    ],
  },
  {
    name: "A medida",
    monthly: null,
    custom: true,
    desc: "¿Necesitás algo distinto? Armamos un plan a la medida de tu operación",
    features: [
      "Integraciones a medida",
      "Volumen y SLA personalizado",
      "Implementación y migración asistida",
      "Capacitación para tu equipo",
      "Facturación corporativa",
    ],
  },
];

const MP_LINKS: Record<string, string> = {
  Inicial: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=a6a2ae80190846abb41a393568f6eab3",
  Premium: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=a6a2ae80190846abb41a393568f6eab3",
  Empresarial: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=a6a2ae80190846abb41a393568f6eab3",
};

const fmtAR = (n: number) => `$${n.toLocaleString("es-AR")}`;

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("mensual");

  const priceFor = (p: Plan) => {
    if (p.monthly == null) return null;
    return cycle === "anual" ? Math.round(p.monthly * 0.9) : p.monthly;
  };

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

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Funcionalidades</a>
            <a href="#integrations" className="text-sm text-muted-foreground hover:text-foreground">Integraciones</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Precios</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">Recursos</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">Iniciar sesión</Button></Link>
            <Link to="/register">
              <Button size="sm" className="gradient-primary shadow-primary text-primary-foreground">Comenzar gratis</Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-card px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
              <a href="#integrations" className="text-sm" onClick={() => setMenuOpen(false)}>Integraciones</a>
              <a href="#pricing" className="text-sm" onClick={() => setMenuOpen(false)}>Precios</a>
              <a href="#faq" className="text-sm" onClick={() => setMenuOpen(false)}>Recursos</a>
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Iniciar sesión</Button></Link>
                <Link to="/register" className="flex-1"><Button className="w-full gradient-primary text-primary-foreground" size="sm">Comenzar gratis</Button></Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="px-4 py-16 md:py-24">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge className="mb-6 inline-flex bg-primary-light text-primary border-primary/20 hover:bg-primary-light">
              <Sparkles className="mr-1 h-3 w-3" /> Sistema de control de stock para tu negocio
            </Badge>
            <h1 className="text-balance mb-6 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              Controlá tu stock y tus movimientos{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              Gestioná productos, entradas, salidas y alertas de bajo stock. Integrá Mercado Libre,
              Tienda Nube, Shopify, WhatsApp Business y ARCA — todo desde una misma plataforma.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link to="/register">
                <Button size="lg" className="h-12 gap-2 gradient-primary px-8 text-base font-semibold text-primary-foreground shadow-primary">
                  Comenzar prueba gratuita
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary">
                <PlayCircle className="h-5 w-5" /> Ver cómo funciona
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> 14 días gratis</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Sin tarjeta de crédito</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Cancelá cuando quieras</span>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative rounded-2xl border border-border bg-card p-2 shadow-elevated">
            <div className="flex overflow-hidden rounded-xl">
              <aside className="hidden w-40 shrink-0 bg-[hsl(222_47%_9%)] p-3 text-xs text-white/70 sm:block">
                <div className="mb-4 flex items-center gap-2 px-2">
                  <div className="h-5 w-5 rounded gradient-primary" />
                  <span className="font-semibold text-white">OneStock</span>
                </div>
                {["Dashboard","Productos","Alertas de stock","Movimientos","Reportes","Integraciones","Configuración"].map((i, idx) => (
                  <div key={i} className={`mb-1 rounded px-2 py-1.5 ${idx===0 ? "bg-primary/20 text-white" : ""}`}>{i}</div>
                ))}
              </aside>
              <div className="flex-1 bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Dashboard</h3>
                  <span className="text-xs text-muted-foreground">Hola, Marcos</span>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { l: "Productos", v: "342" },
                    { l: "Stock total", v: "12.480" },
                    { l: "Valor inventario", v: "$ 18.450.000" },
                    { l: "Bajo stock", v: "7" },
                  ].map((k) => (
                    <div key={k.l} className="rounded-lg border border-border bg-card p-2">
                      <div className="text-[10px] text-muted-foreground">{k.l}</div>
                      <div className="text-xs font-semibold">{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-[10px] font-medium text-muted-foreground">Evolución de stock</div>
                    <svg viewBox="0 0 100 40" className="h-16 w-full">
                      <polyline fill="none" stroke="hsl(221 83% 53%)" strokeWidth="1.5" points="0,30 15,25 30,28 45,18 60,22 75,12 100,8" />
                      <polyline fill="hsl(221 83% 53% / 0.15)" stroke="none" points="0,30 15,25 30,28 45,18 60,22 75,12 100,8 100,40 0,40" />
                    </svg>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-[10px] font-medium text-muted-foreground">Movimientos (7d)</div>
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 36 36" className="h-16 w-16">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(220 14% 93%)" strokeWidth="5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(168 84% 42%)" strokeWidth="5" strokeDasharray="55 100" strokeDashoffset="0" transform="rotate(-90 18 18)" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(221 83% 53%)" strokeWidth="5" strokeDasharray="30 100" strokeDashoffset="-55" transform="rotate(-90 18 18)" />
                      </svg>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />Entradas</div>
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Salidas</div>
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" />Ajustes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features (dark) */}
      <section id="features" className="gradient-hero px-4 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
            Todo lo que necesitás para controlar tu stock
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuresDark.map((f) => (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:bg-white/10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <f.icon className="h-5 w-5 text-primary-glow" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="bg-card py-16 px-4">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">Integraciones que potencian tu negocio</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {integrations.map((i) => (
              <div key={i} className="flex h-20 items-center justify-center rounded-xl border border-border bg-background px-4 text-center text-sm font-medium text-foreground shadow-card">
                {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container max-w-7xl">
          <div className="mb-10 text-center">
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Precios</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Elegí el plan que mejor se adapta a tu negocio</h2>
            <p className="text-muted-foreground">Precios en pesos argentinos. 14 días gratis sin tarjeta de crédito.</p>
          </div>

          {/* Billing toggle */}
          <div className="mb-10 flex items-center justify-center">
            <div className="inline-flex rounded-full border border-border bg-card p-1">
              <button
                onClick={() => setCycle("mensual")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  cycle === "mensual" ? "bg-primary text-primary-foreground shadow-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setCycle("anual")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  cycle === "anual" ? "bg-primary text-primary-foreground shadow-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cycle === "anual" ? "bg-white/20 text-white" : "bg-accent/15 text-accent"}`}>
                  -10%
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const price = priceFor(plan);
              const isCustom = plan.custom;
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all hover:shadow-elevated ${
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
                    <p className="text-xs text-muted-foreground mt-1 min-h-[2.5rem]">{plan.desc}</p>
                  </div>

                  <div className="mb-5 min-h-[4.5rem]">
                    {isCustom ? (
                      <div>
                        <span className="text-2xl font-bold text-foreground">Personalizado</span>
                        <p className="mt-1 text-xs text-muted-foreground">Hablemos para armar tu propuesta</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-3xl font-bold text-foreground">{fmtAR(price!)}</span>
                          <span className="text-sm text-muted-foreground">/mes</span>
                        </div>
                        {cycle === "anual" ? (
                          <p className="mt-1 text-xs text-accent">🏷 Pagando anual ahorrás un 10%</p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">Pagando anual: {fmtAR(Math.round(plan.monthly! * 0.9))}/mes</p>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="mb-6 space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isCustom ? (
                    <a
                      href={`https://wa.me/5493516516785?text=${encodeURIComponent("Hola, me interesa un plan a medida de OneStock")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full" variant="outline">
                        Contactar ventas
                      </Button>
                    </a>
                  ) : (
                    <a href={MP_LINKS[plan.name]} target="_blank" rel="noopener noreferrer">
                      <Button
                        className={`w-full ${plan.highlight ? "gradient-primary shadow-primary text-primary-foreground" : ""}`}
                        variant={plan.highlight ? "default" : "outline"}
                      >
                        Contratar
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 pb-16">
        <div className="container">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl gradient-primary p-8 text-primary-foreground md:flex-row md:items-center">
            <div>
              <h3 className="mb-1 text-2xl font-bold">Probalo gratis durante 14 días</h3>
              <p className="text-sm text-white/80">Descubrí por qué cada vez más negocios eligen OneStock para controlar su stock.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/80">
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Sin tarjeta de crédito</span>
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cancelá cuando quieras</span>
                <span className="inline-flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Acceso desde cualquier dispositivo</span>
              </div>
            </div>
            <Link to="/register">
              <Button size="lg" className="h-12 bg-white px-8 text-primary hover:bg-white/90">
                Comenzar gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-card py-20 px-4">
        <div className="container max-w-2xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium hover:bg-muted/50"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-6 py-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gradient-hero px-4 py-12 text-white/70">
        <div className="container grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded gradient-primary"><Package className="h-3 w-3 text-white" /></div>
              <span className="font-semibold text-white">OneStock</span>
            </div>
            <p className="text-sm">El sistema de control de stock pensado para negocios que quieren crecer sin perder el orden.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Funcionalidades</a></li>
              <li><a href="#integrations" className="hover:text-white">Integraciones</a></li>
              <li><a href="#pricing" className="hover:text-white">Precios</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              <li><a href="#" className="hover:text-white">Guías</a></li>
              <li><a href="#" className="hover:text-white">Centro de ayuda</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Sobre nosotros</a></li>
              <li><a href="#" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">¿Tenés dudas?</h4>
            <p className="mb-3 text-sm">Escribinos, respondemos en menos de 24 horas.</p>
            <a href="mailto:hola@onestock.app" className="inline-block rounded-lg border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10">hola@onestock.app</a>
          </div>
        </div>
        <div className="container mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs md:flex-row">
          <p>© 2025 OneStock. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Privacidad</a>
            <a href="#" className="hover:text-white">Términos</a>
          </div>
        </div>
      </footer>

      <LiveSocialProof />
    </div>
  );
}
