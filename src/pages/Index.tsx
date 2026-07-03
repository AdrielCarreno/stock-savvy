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
  Target,
  Rocket,
  Store,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LiveSocialProof } from "@/components/landing/LiveSocialProof";
import { ThemeToggle } from "@/components/ThemeToggle";
import warehouse1 from "@/assets/warehouse-1.jpg.asset.json";
import warehouse2 from "@/assets/warehouse-2.jpg.asset.json";
import warehouse3 from "@/assets/warehouse-3.jpg.asset.json";

type BillingCycle = "mensual" | "anual";

const heroImages = [warehouse1.url, warehouse2.url, warehouse3.url];

const featuresDark = [
  { icon: Package, title: "Control de stock", desc: "Gestioná tu inventario en tiempo real, con múltiples depósitos y trazabilidad por producto." },
  { icon: ArrowLeftRight, title: "Movimientos", desc: "Registrá entradas, salidas y ajustes. Mantené el historial completo de tu mercadería." },
  { icon: AlertTriangle, title: "Alertas de bajo stock", desc: "Configurá mínimos por producto y recibí avisos antes de quedarte sin mercadería." },
  { icon: Plug, title: "Integraciones", desc: "Conectá Mercado Libre, Tienda Nube, Shopify, WhatsApp Business y ARCA en pocos clics." },
  { icon: BarChart3, title: "Reportes claros", desc: "Valor de inventario, rotación, productos críticos y evolución mes a mes." },
  { icon: ShieldCheck, title: "Datos seguros", desc: "Información cifrada, backups automáticos y permisos por usuario." },
];

const industries = [
  "Bazares", "Librerías", "Ferreterías", "Repuestos", "Tiendas de ropa",
  "Pinturerías", "Perfumerías", "Farmacias", "Distribuidoras mayoristas",
  "Kioscos y almacenes", "Ópticas", "Tiendas de electrónica",
];

const roadmap = [
  { step: "01", title: "Cargá tu catálogo", desc: "Importá tus productos desde Excel o creálos manualmente. Definí SKU, categoría, costo y precios mayorista/minorista.", icon: Package },
  { step: "02", title: "Registrá movimientos", desc: "Cada entrada, salida o ajuste actualiza el stock al instante. Todo queda en el historial con fecha, usuario y motivo.", icon: ArrowLeftRight },
  { step: "03", title: "Configurá alertas", desc: "Definí stock mínimo por producto. Cuando algo cae por debajo, aparece en el panel de alertas.", icon: AlertTriangle },
  { step: "04", title: "Conectá tus canales", desc: "Sincronizá Mercado Libre, Tienda Nube, Shopify y WhatsApp Business para operar todo desde un solo lugar.", icon: Plug },
  { step: "05", title: "Analizá y crecé", desc: "Revisá valor de inventario, rotación y productos críticos. Tomá decisiones basadas en datos reales.", icon: BarChart3 },
];

const integrations = ["Mercado Libre", "Tienda Nube", "Shopify", "WhatsApp Business", "ARCA (AFIP)", "+ Más integraciones"];

const faqs = [
  { q: "¿OneStock funciona para mi tipo de negocio?", a: "Sí. OneStock está pensado para comercios, distribuidoras, mayoristas y pymes que necesitan controlar stock, entradas, salidas y ventas. Funciona igual de bien si tenés un solo local o varios depósitos, y si vendés por mostrador, online o por canales como Mercado Libre, Tienda Nube o Shopify." },
  { q: "¿Necesito instalar algo para usarlo?", a: "No. OneStock es 100% en la nube. Solo necesitás un navegador y acceso a internet — no hay nada que descargar ni configurar en tu computadora. Podés acceder desde cualquier dispositivo, en cualquier momento." },
  { q: "¿Cómo funciona el control de stock y los movimientos?", a: "Cada producto tiene su stock actual, stock mínimo y costo. Cuando registrás una entrada (compra, ajuste) o una salida (venta, devolución), el sistema actualiza el inventario al instante y guarda el movimiento en el historial. Si un producto cae por debajo del mínimo, recibís una alerta de bajo stock." },
  { q: "¿Puedo conectar Mercado Libre, Tienda Nube o Shopify?", a: "Sí. OneStock se integra con Mercado Libre, Tienda Nube, Shopify y WhatsApp Business para sincronizar productos, stock y pedidos en un solo lugar. También se conecta con ARCA (ex-AFIP) para simplificar la parte impositiva." },
  { q: "¿Mis datos están seguros?", a: "Sí. Toda la información que cargás en OneStock está almacenada en servidores con cifrado, backups automáticos y acceso protegido por credenciales individuales. Vos controlás quién ve qué dentro de tu equipo mediante permisos por usuario. Nunca compartimos ni vendemos tus datos a terceros." },
  { q: "¿Puedo importar mis productos desde Excel?", a: "Sí. OneStock permite importar productos y movimientos de stock desde archivos Excel/CSV para que no tengas que cargar todo a mano. Disponible en todos los planes." },
  { q: "¿Qué pasa cuando termina el período de prueba?", a: "Al finalizar los 14 días podés elegir el plan que mejor se adapte a tu negocio y continuar sin perder ningún dato. No pedimos tarjeta de crédito para empezar — si decidís no continuar, no se te cobra nada." },
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
  { name: "Inicial", monthly: 28700, desc: "Para comercios y pymes que empiezan a ordenar su stock",
    features: ["Hasta 500 productos", "1 depósito", "Movimientos ilimitados", "Alertas de bajo stock", "Hasta 2 usuarios", "Soporte por email"] },
  { name: "Premium", monthly: 47600, desc: "Para negocios que venden por varios canales", highlight: true,
    features: ["Productos ilimitados", "Hasta 3 depósitos", "Integraciones (Mercado Libre, Tienda Nube, Shopify)", "WhatsApp Business y ARCA", "Reportes avanzados", "Hasta 5 usuarios", "Soporte prioritario"] },
  { name: "Empresarial", monthly: 68400, desc: "Para distribuidoras y empresas con operación grande",
    features: ["Todo lo del plan Premium", "Depósitos ilimitados", "Usuarios ilimitados con permisos avanzados", "Integraciones completas", "Reportes personalizados", "Onboarding asistido", "Soporte por WhatsApp dedicado"] },
  { name: "A medida", monthly: null, custom: true, desc: "¿Necesitás algo distinto? Armamos un plan a la medida de tu operación",
    features: ["Integraciones a medida", "Volumen y SLA personalizado", "Implementación y migración asistida", "Capacitación para tu equipo", "Facturación corporativa"] },
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
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), 6000);
    return () => clearInterval(t);
  }, []);

  const priceFor = (p: Plan) => {
    if (p.monthly == null) return null;
    return cycle === "anual" ? Math.round(p.monthly * 0.9) : p.monthly;
  };

  const contactWA = `https://wa.me/5493516516785?text=${encodeURIComponent("Hola, quiero saber más de OneStock")}`;

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

          <div className="hidden items-center gap-6 md:flex">
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground">Sobre OneStock</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Funcionalidades</a>
            <a href="#roadmap" className="text-sm text-muted-foreground hover:text-foreground">Cómo funciona</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Precios</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">Contacto</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQs</a>
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
              <a href="#about" className="text-sm" onClick={() => setMenuOpen(false)}>Sobre OneStock</a>
              <a href="#features" className="text-sm" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
              <a href="#roadmap" className="text-sm" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
              <a href="#pricing" className="text-sm" onClick={() => setMenuOpen(false)}>Precios</a>
              <a href="#contact" className="text-sm" onClick={() => setMenuOpen(false)}>Contacto</a>
              <a href="#faq" className="text-sm" onClick={() => setMenuOpen(false)}>FAQs</a>
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Iniciar sesión</Button></Link>
                <Link to="/register" className="flex-1"><Button className="w-full gradient-primary text-primary-foreground" size="sm">Comenzar gratis</Button></Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO with background images */}
      <section className="relative overflow-hidden">
        {/* Background carousel */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {heroImages.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ${
                i === heroIdx ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${src})` }}
              aria-hidden="true"
            />
          ))}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="container relative z-10 px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <Badge className="mb-6 inline-flex bg-white/10 text-white border-white/20 backdrop-blur hover:bg-white/15">
              <Sparkles className="mr-1 h-3 w-3" /> Sistema de control de stock para tu negocio
            </Badge>
            <h1 className="text-balance mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Controlá tu stock y tus movimientos{" "}
              <span className="bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-white/80">
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
              <a href="#features" className="inline-flex items-center gap-2 text-sm text-white hover:text-primary-glow">
                <PlayCircle className="h-5 w-5" /> Ver cómo funciona
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary-glow" /> 14 días gratis</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary-glow" /> Sin tarjeta de crédito</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary-glow" /> Cancelá cuando quieras</span>
            </div>
          </div>
        </div>

        {/* Carousel dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-8 bg-white" : "w-4 bg-white/40"}`}
              aria-label={`Imagen ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* SOBRE ONESTOCK */}
      <section id="about" className="border-t border-border bg-background py-20 px-4">
        <div className="container max-w-6xl grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Sobre OneStock</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ordenar tu stock no tiene que ser complicado
            </h2>
            <p className="mb-4 text-muted-foreground">
              OneStock nació con un objetivo claro: darle a los comercios, distribuidoras y pymes
              de Argentina una herramienta simple, en español y a precio local para llevar el control
              real de su inventario y sus movimientos, sin planillas de Excel desordenadas ni sistemas
              carísimos pensados para grandes multinacionales.
            </p>
            <p className="text-muted-foreground">
              Creemos que cada negocio, sin importar su tamaño, merece saber en tiempo real qué tiene,
              qué le falta, cuánto vale su mercadería y qué se mueve. Por eso construimos una
              plataforma clara, rápida y conectada con los canales que ya usás.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <Target className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Nuestro objetivo</h3>
              <p className="text-xs text-muted-foreground">Que cualquier negocio pueda controlar su stock en 10 minutos, no en 10 días.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <ShieldCheck className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Datos seguros</h3>
              <p className="text-xs text-muted-foreground">Información cifrada, backups automáticos y accesos por usuario.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <Smartphone className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">100% en la nube</h3>
              <p className="text-xs text-muted-foreground">Accedé desde cualquier dispositivo, sin instalar nada.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <Rocket className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Simple y rápido</h3>
              <p className="text-xs text-muted-foreground">Interfaz clara en español, pensada para el día a día del comercio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="features" className="gradient-hero px-4 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-white/10 text-white border-white/20 hover:bg-white/15">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Todo lo que necesitás para controlar tu stock
            </h2>
          </div>
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

          {/* Integrations mini strip */}
          <div className="mt-12">
            <p className="mb-4 text-center text-sm text-white/60">Integraciones</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {integrations.map((i) => (
                <div key={i} className="flex h-16 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-center text-xs font-medium text-white/80 backdrop-blur">
                  {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="bg-background py-20 px-4">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Roadmap</Badge>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Cómo usar OneStock</h2>
            <p className="text-muted-foreground">Un mapa simple para empezar a controlar tu stock en minutos.</p>
          </div>

          <div className="relative">
            {/* Vertical line for desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
            <div className="space-y-6 md:space-y-12">
              {roadmap.map((r, idx) => (
                <div key={r.step} className={`relative flex flex-col md:flex-row md:items-center gap-4 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  <div className="md:w-1/2 md:px-8">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-primary">
                          <r.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-mono font-semibold text-primary">PASO {r.step}</span>
                      </div>
                      <h3 className="mb-1 text-lg font-semibold">{r.title}</h3>
                      <p className="text-sm text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex md:w-1/2 justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background font-bold text-primary shadow-primary">
                      {r.step}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="border-t border-border bg-card py-20 px-4">
        <div className="container max-w-6xl">
          <div className="mb-10 text-center">
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Rubros</Badge>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Pensado para todo tipo de comercio</h2>
            <p className="text-muted-foreground">Si tenés stock, OneStock es para vos.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {industries.map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 shadow-card transition-all hover:shadow-elevated hover:border-primary/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary shrink-0">
                  <Store className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-4">
        <div className="container max-w-7xl">
          <div className="mb-10 text-center">
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Precios</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Elegí el plan que mejor se adapta a tu negocio</h2>
            <p className="text-muted-foreground">Precios en pesos argentinos. 14 días gratis sin tarjeta de crédito.</p>
          </div>

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
                    <a href={contactWA} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full" variant="outline">Contactar ventas</Button>
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

      {/* CONTACT */}
      <section id="contact" className="border-t border-border bg-card py-20 px-4">
        <div className="container max-w-5xl grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">Contacto</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Hablemos de tu negocio</h2>
            <p className="mb-6 text-muted-foreground">
              ¿Tenés dudas sobre qué plan te conviene o necesitás ayuda para migrar tu Excel a OneStock?
              Escribinos y te respondemos en menos de 24 horas hábiles.
            </p>
            <div className="space-y-3">
              <a href="mailto:hola@onestock.app" className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary"><Mail className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Escribinos por email</p>
                  <p className="text-sm font-semibold text-foreground">hola@onestock.app</p>
                </div>
              </a>
              <a href={contactWA} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary"><MessageCircle className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Chateá con nosotros</p>
                  <p className="text-sm font-semibold text-foreground">WhatsApp de ventas</p>
                </div>
              </a>
            </div>
          </div>

          <form
            className="rounded-2xl border border-border bg-background p-6 shadow-card space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name") ?? "");
              const email = String(fd.get("email") ?? "");
              const msg = String(fd.get("msg") ?? "");
              const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\n${msg}`);
              window.location.href = `mailto:hola@onestock.app?subject=${encodeURIComponent("Consulta OneStock")}&body=${body}`;
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Nombre</label>
              <Input name="name" required placeholder="Tu nombre" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email</label>
              <Input name="email" type="email" required placeholder="tunombre@empresa.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">¿En qué te podemos ayudar?</label>
              <Textarea name="msg" required rows={4} placeholder="Contanos brevemente sobre tu negocio y qué necesitás." />
            </div>
            <Button type="submit" className="w-full gradient-primary shadow-primary text-primary-foreground">
              Enviar consulta
            </Button>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-background py-20 px-4">
        <div className="container max-w-2xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-primary-light text-primary border-primary/20">FAQs</Badge>
            <h2 className="text-3xl font-bold">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
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
        <div className="container grid gap-8 md:grid-cols-4">
          <div>
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
              <li><a href="#roadmap" className="hover:text-white">Cómo funciona</a></li>
              <li><a href="#pricing" className="hover:text-white">Precios</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-white">Sobre nosotros</a></li>
              <li><a href="#contact" className="hover:text-white">Contacto</a></li>
              <li><a href="#faq" className="hover:text-white">FAQs</a></li>
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
