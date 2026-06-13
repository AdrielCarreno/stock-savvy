import { Link } from "react-router-dom";
import {
  Package,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Users,
  Truck,
  Ship,
  Landmark,
  Warehouse,
  Store,
  ShoppingBag,
  Globe,
  FileText,
  TrendingUp,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveSocialProof } from "@/components/landing/LiveSocialProof";
import { ThemeToggle } from "@/components/ThemeToggle";

const stages = [
  { icon: Users, title: "Proveedores", desc: "Buscá y evaluá proveedores internacionales" },
  { icon: ShoppingBag, title: "Compra", desc: "Creá órdenes de compra y controlá pagos a proveedores" },
  { icon: Ship, title: "Embarque", desc: "Hacé seguimiento de tus embarques en tiempo real" },
  { icon: Landmark, title: "Aduana", desc: "Gestioná documentos y estados de aduana sin complicaciones" },
  { icon: Warehouse, title: "Depósito", desc: "Controlá tu stock y costos de almacenamiento" },
  { icon: Store, title: "Venta", desc: "Vendé en todos tus canales y hacé crecer tu negocio" },
];

const featuresDark = [
  { icon: Globe, title: "Importaciones", desc: "Gestioná proveedores, órdenes de compra, costos, pagos y toda tu operación internacional." },
  { icon: Truck, title: "Logística internacional", desc: "Seguimiento de embarques aéreos, marítimos y courier. Alertas y fechas estimadas." },
  { icon: Landmark, title: "Aduana", desc: "Documentación, estados y vencimientos. Tené todo bajo control hasta la liberación." },
  { icon: Package, title: "Stock e inventario", desc: "Controlá tu stock en tiempo real, múltiples depósitos, lotes, series y más." },
  { icon: Store, title: "Ventas y distribución", desc: "Gestioná pedidos, remitos, despachos y vendedores. Integrado con tus canales de venta." },
  { icon: BarChart3, title: "Reportes y finanzas", desc: "Rentabilidad por importación, productos, clientes y más. Tomá mejores decisiones." },
];

const integrations = ["Mercado Libre", "Tienda Nube", "Shopify", "WhatsApp Business", "ARCA (AFIP)", "+ Más integraciones"];

const faqs = [
  {
    q: "¿OneStock funciona para mi tipo de operación de importación?",
    a: "Sí. OneStock está diseñado para importadores que trabajan con proveedores internacionales, independientemente del régimen de importación, el canal de venta o el volumen de operaciones. Ya sea que importes desde China, Estados Unidos o Europa, vendas por Mercado Libre, Tienda Nube o canal propio, o manejes uno o varios depósitos — el sistema se adapta a tu flujo. Durante los 14 días de prueba gratuita podés configurarlo con tu operación real y validarlo sin ningún riesgo.",
  },
  {
    q: "¿Necesito instalar algo para usar OneStock?",
    a: "No. OneStock es 100% en la nube. Solo necesitás un navegador y acceso a internet. No hay nada que descargar, instalar ni configurar en tu computadora o servidor. Podés acceder desde cualquier dispositivo, en cualquier momento.",
  },
  {
    q: "¿Qué módulos incluye el sistema y cuándo los necesito?",
    a: "OneStock está organizado en módulos que cubren todo el ciclo de importación: Proveedores, Compras, Embarques, Aduana, Depósito, Stock e Inventario, Ventas y Distribución, y Reportes y Finanzas. No todos los importadores necesitan todos los módulos desde el día uno — por eso tenemos planes diferenciados. Podés empezar con lo esencial y escalar cuando tu operación lo requiera.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Toda la información que cargás en OneStock está almacenada en servidores con cifrado, backups automáticos y acceso protegido por credenciales individuales. Vos controlás quién ve qué dentro de tu equipo mediante permisos por usuario. Nunca compartimos ni vendemos tus datos a terceros.",
  },
  {
    q: "¿Puedo usar OneStock si también vendo por Mercado Libre o Tienda Nube?",
    a: "Sí, de hecho es una de las ventajas principales. OneStock se integra con Mercado Libre, Tienda Nube, Shopify y WhatsApp Business para que tus ventas, stock y pedidos estén sincronizados en un solo lugar. También se conecta con ARCA (ex-AFIP) para simplificar la parte impositiva.",
  },
  {
    q: "¿Qué pasa cuando termina el período de prueba?",
    a: "Al finalizar los 14 días podés elegir el plan que mejor se adapte a tu operación y continuar sin perder ningún dato. Si decidís no continuar, no se te cobra nada — no pedimos tarjeta de crédito para empezar.",
  },
  {
    q: "¿Puedo importar mis datos desde Excel?",
    a: "Sí. OneStock permite importar proveedores, productos, movimientos de stock y operaciones desde archivos Excel para que no empieces de cero. Disponible en cualquier plan.",
  },
];

const plans = [
  {
    name: "Stock",
    price: "$24.900",
    annual: "$19.900/mes pagando anual",
    highlight: false,
    desc: "Para mayoristas y distribuidores",
    features: [
      { label: "Modelo de stock e inventario", value: true },
      { label: "Alertas de stock", value: true },
      { label: "Movimientos de inventario", value: true },
      { label: "Integraciones (ML, TN, Shopify)", value: true },
      { label: "Hasta 2 usuarios", value: true },
      { label: "Soporte por email", value: true },
      { label: "Importaciones y aduana", value: false },
      { label: "Embarques y logística", value: false },
      { label: "Reportes financieros", value: false },
    ],
  },
  {
    name: "Importador",
    price: "$49.900",
    annual: "$39.900/mes pagando anual",
    highlight: true,
    desc: "Para importadores — sistema completo",
    headerNote: "TODO LO DEL PLAN STOCK, MÁS",
    features: [
      { label: "Proveedores internacionales", value: true },
      { label: "Órdenes de compra e importación", value: true },
      { label: "Embarques y logística internacional", value: true },
      { label: "Módulo de aduana y documentación", value: true },
      { label: "Ventas, pedidos y distribución", value: true },
      { label: "Reportes financieros por importación", value: true },
      { label: "Hasta 5 usuarios", value: true },
      { label: "Soporte prioritario por WhatsApp", value: true },
      { label: "Importación desde Excel", value: true },
    ],
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
              <Sparkles className="mr-1 h-3 w-3" /> Sistema operativo para importadores argentinos
            </Badge>
            <h1 className="text-balance mb-6 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              Gestioná toda tu operación de importación{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              Desde la compra a proveedores internacionales hasta la venta final. Controlá costos,
              embarques, aduana, stock y distribución desde una única plataforma.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link to="/register">
                <Button size="lg" className="h-12 gap-2 gradient-primary px-8 text-base font-semibold text-primary-foreground shadow-primary">
                  Comenzar prueba gratuita
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary">
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
                {["Inicio","Importaciones","Proveedores","Embarques","Aduana","Stock","Ventas","Reportes","Configuración"].map((i, idx) => (
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
                    { l: "Mercadería en tránsito", v: "US$ 128.540" },
                    { l: "En aduana", v: "US$ 45.230" },
                    { l: "Stock total", v: "$ 245.760.000" },
                    { l: "Órdenes activas", v: "24" },
                  ].map((k) => (
                    <div key={k.l} className="rounded-lg border border-border bg-card p-2">
                      <div className="text-[10px] text-muted-foreground">{k.l}</div>
                      <div className="text-xs font-semibold">{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-[10px] font-medium text-muted-foreground">Costo total de importaciones</div>
                    <svg viewBox="0 0 100 40" className="h-16 w-full">
                      <polyline fill="none" stroke="hsl(221 83% 53%)" strokeWidth="1.5" points="0,30 15,25 30,28 45,18 60,22 75,12 100,8" />
                      <polyline fill="hsl(221 83% 53% / 0.15)" stroke="none" points="0,30 15,25 30,28 45,18 60,22 75,12 100,8 100,40 0,40" />
                    </svg>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-[10px] font-medium text-muted-foreground">Estado de embarques</div>
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 36 36" className="h-16 w-16">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(220 14% 93%)" strokeWidth="5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(221 83% 53%)" strokeWidth="5" strokeDasharray="40 100" strokeDashoffset="0" transform="rotate(-90 18 18)" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(168 84% 42%)" strokeWidth="5" strokeDasharray="25 100" strokeDashoffset="-40" transform="rotate(-90 18 18)" />
                      </svg>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />En tránsito</div>
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />En aduana</div>
                        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" />Liberados</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stages */}
      <section id="how" className="border-y border-border bg-card py-16 px-4">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">Cada etapa, controlada</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {stages.map((s, i) => (
              <div key={s.title} className="relative">
                {i < stages.length - 1 && (
                  <div className="absolute left-full top-8 hidden h-px w-full -translate-x-1/2 border-t border-dashed border-border lg:block" />
                )}
                <div className="relative rounded-xl border border-border bg-background p-4 text-center shadow-card">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features (dark) */}
      <section id="features" className="gradient-hero px-4 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
            Todo lo que necesitás para importar y vender
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

      {/* Reports / Insight */}
      <section className="bg-primary-light/40 py-20 px-4">
        <div className="container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge className="mb-4 bg-primary-light text-primary border-primary/20">Visión completa de tu negocio</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Tomá decisiones con información real</h2>
            <ul className="mb-6 space-y-3">
              {["Costeo automático de importaciones","Capital inmovilizado y rentabilidad","Métricas en tiempo real","Reportes claros y personalizados"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <a href="#pricing"><Button variant="outline">Ver reportes en acción</Button></a>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-elevated">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light"><FileText className="h-4 w-4 text-primary" /></div>
              <span className="font-semibold">Rentabilidad por importación</span>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { l: "Importaciones", v: "12" },
                { l: "Inversión total", v: "US$ 287.450" },
                { l: "Ganancia total", v: "US$ 98.750" },
                { l: "Rentabilidad", v: "34,3%" },
              ].map((k) => (
                <div key={k.l} className="rounded-lg border border-border p-3">
                  <div className="text-[10px] text-muted-foreground">{k.l}</div>
                  <div className="text-sm font-semibold">{k.v}</div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Importación</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Inversión</th>
                    <th className="px-3 py-2 text-left">Ventas</th>
                    <th className="px-3 py-2 text-left">Rentab.</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["ARG-2024-05","10/05/2024","US$ 64.250","US$ 89.500","39,3%"],
                    ["ARG-2024-04","20/04/2024","US$ 53.400","US$ 74.600","39,7%"],
                    ["ARG-2024-03","15/03/2024","US$ 46.800","US$ 61.100","30,6%"],
                    ["ARG-2024-02","10/02/2024","US$ 58.700","US$ 79.300","35,1%"],
                  ].map((r) => (
                    <tr key={r[0]} className="border-t border-border">
                      {r.map((c, idx) => <td key={idx} className="px-3 py-2">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            {plans.map((plan) => (
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
                <div className="mb-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mes</span>
                </div>
                <p className="mb-5 text-xs text-accent">🏷 {plan.annual}</p>
                {"headerNote" in plan && plan.headerNote && (
                  <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">{plan.headerNote}</p>
                )}
                <div className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-start gap-2 text-sm">
                      {f.value ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-0.5" />
                      )}
                      <span className={!f.value ? "text-muted-foreground/60" : "text-foreground"}>
                        {f.label}
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
                    Contratar
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 pb-16">
        <div className="container">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl gradient-primary p-8 text-primary-foreground md:flex-row md:items-center">
            <div>
              <h3 className="mb-1 text-2xl font-bold">Probalo gratis durante 14 días</h3>
              <p className="text-sm text-white/80">Descubrí por qué cada vez más importadores eligen OneStock para hacer crecer su negocio.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/80">
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Sin tarjeta de crédito</span>
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cancelá cuando quieras</span>
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
            <p className="text-sm">El sistema operativo para importadores y distribuidores que quieren crecer sin límites.</p>
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
