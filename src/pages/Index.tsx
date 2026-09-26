import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  FileText,
  Mail,
  Menu,
  MessageCircle,
  Package,
  Plug,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import warehouse1 from "@/assets/warehouse-1.jpg.asset.json";
import warehouse2 from "@/assets/warehouse-2.jpg.asset.json";

type BillingCycle = "mensual" | "anual";

const features = [
  { icon: Package, title: "Control de stock", desc: "SKU, códigos, variantes y stock reservado en varios depósitos." },
  { icon: ArrowLeftRight, title: "Movimientos unificados", desc: "Compras, ventas, ajustes y transferencias con trazabilidad." },
  { icon: FileText, title: "Reportes y Kardex", desc: "Valorización y exportación a Excel, CSV y PDF." },
  { icon: Truck, title: "Proveedores y compras", desc: "Órdenes, precios históricos y contacto directo." },
  { icon: AlertTriangle, title: "Alertas inteligentes", desc: "Mínimos, máximos, vencimientos y productos estancados." },
  { icon: Smartphone, title: "App móvil", desc: "La misma operación desde el celular, sin instalar nada." },
  { icon: Plug, title: "Integraciones", desc: "ARCA, Mercado Libre, Tienda Nube, Shopify y WhatsApp." },
  { icon: Sparkles, title: "IA para tu negocio", desc: "Análisis del inventario para decidir con más contexto." },
];

const industries = [
  { name: "Distribuidoras mayoristas", size: "text-3xl md:text-5xl" },
  { name: "Ferreterías", size: "text-2xl md:text-4xl" },
  { name: "Tiendas de ropa", size: "text-xl md:text-3xl" },
  { name: "Repuestos", size: "text-2xl md:text-4xl" },
  { name: "Bazares", size: "text-xl md:text-2xl" },
  { name: "Distribuidoras de bebidas", size: "text-2xl md:text-3xl" },
  { name: "Pinturerías", size: "text-xl md:text-2xl" },
  { name: "Depósitos", size: "text-2xl md:text-4xl" },
  { name: "Farmacias", size: "text-xl md:text-3xl" },
  { name: "Librerías", size: "text-lg md:text-2xl" },
  { name: "Perfumerías", size: "text-lg md:text-2xl" },
  { name: "Electrónica", size: "text-xl md:text-3xl" },
];

const steps = [
  { title: "Cargá tu catálogo", desc: "Importá desde Excel o creá productos con SKU, variantes, costo y precios mayorista y minorista.", label: "Catálogo" },
  { title: "Sumá tus proveedores", desc: "Relacioná cada producto con su proveedor, sus condiciones y el historial de precios.", label: "Proveedores" },
  { title: "Operá compras y ventas", desc: "Registrá cada movimiento y actualizá el inventario en el momento.", label: "Operación" },
  { title: "Mové mercadería", desc: "Transferí stock entre depósitos sin perder trazabilidad ni alterar el total.", label: "Depósitos" },
  { title: "Conectá tus canales", desc: "Sincronizá e-commerce, mensajería y facturación electrónica.", label: "Canales" },
  { title: "Analizá y exportá", desc: "Consultá Kardex, valorización y reportes desde la computadora o el celular.", label: "Reportes" },
];

const faqs = [
  { q: "¿OneStock funciona para mi tipo de negocio?", a: "Sí. Está pensado para comercios, distribuidoras, depósitos y pymes con uno o varios locales, y ventas por mostrador u online." },
  { q: "¿Puedo usarlo desde el celular como una app?", a: "Sí. Todos los módulos están adaptados para el teléfono y podés agregar OneStock a la pantalla de inicio." },
  { q: "¿Cómo funcionan los movimientos y las transferencias?", a: "Compras, ventas, ajustes y transferencias actualizan el inventario y quedan registrados con fecha, usuario y motivo." },
  { q: "¿Qué reportes puedo generar?", a: "Podés consultar el Kardex, la valorización del inventario y los movimientos del período, y exportarlos a Excel, CSV o PDF." },
  { q: "¿Puedo controlar vencimientos y stock mínimo?", a: "Sí. Configurás mínimos y máximos, seguís vencimientos y detectás productos sin rotación." },
  { q: "¿Puedo conectar Mercado Libre, Tienda Nube o Shopify?", a: "Sí. OneStock contempla integraciones con esos canales, WhatsApp Business y ARCA para facturación electrónica." },
  { q: "¿Mis datos están seguros?", a: "La información está cifrada, con backups automáticos, accesos individuales y permisos por usuario." },
  { q: "¿Qué pasa cuando termina el período de prueba?", a: "Después de los 7 días elegís un plan para continuar sin perder datos. No pedimos tarjeta para empezar." },
];

const plans = [
  { name: "Inicial", monthly: 34700, desc: "Para el que recién empieza a ordenar el local.", features: ["Hasta 500 productos", "Hasta 3 depósitos", "1 usuario", "300 operaciones mensuales", "Alertas de stock", "Proveedores ilimitados", "Soporte por email y WhatsApp", "Integración con ARCA"] },
  { name: "Personalizado", monthly: null, desc: "Para operaciones que ya necesitan otra escala.", features: ["Todo lo del plan Inicial", "Productos, depósitos y usuarios ilimitados", "Operaciones ilimitadas", "Reportes avanzados y Kardex", "Transferencias entre depósitos", "Integraciones con e-commerce y POS", "Soporte prioritario"] },
];

const MP_LINKS: Record<string, { mensual: string; anual: string }> = {
  Inicial: {
    mensual: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=a6a2ae80190846abb41a393568f6eab3",
    anual: "https://mpago.la/2f6DJAK",
  },
};

const fmtAR = (n: number) => `$${n.toLocaleString("es-AR")}`;

function ProductMockup({ compact = false }: { compact?: boolean }) {
  const rows = [
    ["Toalla hotelera 500 g", "TOA-500", "128", "$12.800"],
    ["Sábana percal queen", "SAB-QN", "42", "$24.500"],
    ["Almohada premium", "ALM-090", "8", "$18.900"],
  ];
  return (
    <div className={`overflow-hidden border border-landing-line bg-card shadow-elevated ${compact ? "rounded-sm" : "rounded-md"}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><span className="text-xs font-semibold">Inventario general</span></div>
        <span className="text-[10px] text-muted-foreground">Actualizado ahora</span>
      </div>
      <div className="grid grid-cols-3 border-b border-border bg-muted/50 p-4">
        <div><p className="text-[10px] text-muted-foreground">Valor de stock</p><p className="mt-1 text-lg font-semibold">$8,4 M</p></div>
        <div><p className="text-[10px] text-muted-foreground">Productos</p><p className="mt-1 text-lg font-semibold">612</p></div>
        <div><p className="text-[10px] text-muted-foreground">Alertas</p><p className="mt-1 text-lg font-semibold text-warning">12</p></div>
      </div>
      <div className="p-3">
        <div className="mb-2 flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-muted-foreground"><Search className="h-3.5 w-3.5" /> Buscar producto, SKU o código</div>
        {rows.map(([name, sku, stock, price]) => (
          <div key={sku} className="grid grid-cols-[1fr_auto] gap-3 border-b border-border px-2 py-3 last:border-0">
            <div><p className="text-xs font-medium">{name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{sku} · {stock} unidades</p></div>
            <p className="text-xs font-semibold">{price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPreview({ step }: { step: number }) {
  const current = steps[step];
  return (
    <div className="relative min-h-[320px] border border-landing-line bg-card p-5 shadow-card md:p-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div><p className="text-xs font-semibold text-primary">PASO {String(step + 1).padStart(2, "0")}</p><p className="mt-1 font-semibold">{current.title}</p></div>
        <span className="font-display text-5xl text-landing-ink/10">{String(step + 1).padStart(2, "0")}</span>
      </div>
      <div className="grid gap-5 py-6 sm:grid-cols-2">
        <div className="space-y-3">
          {["Información principal", "Datos comerciales", "Stock y depósito"].map((label, index) => (
            <div key={label} className="border-b border-border pb-3">
              <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
              <div className={`mt-2 h-2 bg-muted ${index === 1 ? "w-3/4" : "w-full"}`} />
            </div>
          ))}
        </div>
        <div className="flex min-h-40 items-end bg-landing-paper p-4">
          <div className="w-full">
            <p className="text-xs leading-relaxed text-muted-foreground">{current.desc}</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-success"><Check className="h-4 w-4" /> Listo para continuar</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("mensual");
  const [activeStep, setActiveStep] = useState(0);
  const contactWA = `https://wa.me/5493516516785?text=${encodeURIComponent("Hola, quiero saber más de OneStock")}`;

  return (
    <div className="min-h-screen bg-landing-paper font-sans text-landing-ink">
      <nav className="sticky top-0 z-50 border-b border-landing-line bg-landing-paper/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="OneStock, inicio">
            <span className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground"><Package className="h-4 w-4" /></span>
            <span className="font-display text-xl font-semibold">OneStock</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#about" className="text-xs text-muted-foreground hover:text-foreground">El sistema</a>
            <a href="#features" className="text-xs text-muted-foreground hover:text-foreground">Funcionalidades</a>
            <a href="#roadmap" className="text-xs text-muted-foreground hover:text-foreground">Cómo funciona</a>
            <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground">Precios</a>
            <a href="#faq" className="text-xs text-muted-foreground hover:text-foreground">Preguntas</a>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm"><Link to="/login">Iniciar sesión</Link></Button>
            <Button asChild size="sm" className="rounded-none"><Link to="/register">Comenzar gratis <ArrowRight /></Link></Button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-card px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4">
              {[['about','El sistema'],['features','Funcionalidades'],['roadmap','Cómo funciona'],['pricing','Precios'],['faq','Preguntas']].map(([id,label]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
              <Button asChild className="rounded-none"><Link to="/register">Comenzar gratis</Link></Button>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="relative overflow-hidden px-4 py-16 md:py-24 lg:py-28">
          <div className="container grid max-w-7xl gap-14 lg:grid-cols-12 lg:items-center">
            <div className="relative z-10 lg:col-span-7">
              <p className="mb-6 text-xs font-semibold uppercase text-primary">Inventario claro. Negocio en movimiento.</p>
              <h1 className="max-w-3xl font-display text-6xl font-medium leading-[0.92] md:text-7xl lg:text-[6.5rem]">
                Controlá tu stock. <span className="italic text-primary">Sin vueltas.</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Compras, ventas, depósitos, proveedores y reportes en un sistema simple, en español y hecho para la operación real.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <Button asChild size="lg" className="h-12 rounded-none px-7"><Link to="/register">Comenzar prueba gratuita <ArrowRight /></Link></Button>
                <a href="#roadmap" className="border-b border-foreground pb-1 text-sm font-medium">Ver cómo funciona ↓</a>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">7 días gratis · Sin tarjeta · Cancelá cuando quieras</p>
            </div>
            <div className="relative lg:col-span-5 lg:pl-4">
              <div className="relative rotate-1 transition-transform duration-500 hover:rotate-0"><ProductMockup /></div>
              <div className="absolute -bottom-8 -left-5 -rotate-3 bg-landing-accent px-5 py-4 text-landing-accent-foreground shadow-elevated md:-left-12">
                <p className="font-hand text-lg">Alertas antes de quedarte sin stock ↗</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Integraciones" className="border-y border-landing-line px-4 py-7">
          <div className="container flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-sm font-semibold text-muted-foreground grayscale">
            <span className="text-[10px] font-medium uppercase">Trabajá con tus canales</span>
            {['Mercado Libre','Tienda Nube','Shopify','WhatsApp Business','ARCA'].map((name) => <span key={name}>{name}</span>)}
          </div>
        </section>

        <section id="about" className="bg-card px-4 py-24 md:py-32">
          <div className="container grid max-w-7xl gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <p className="text-xs font-semibold uppercase text-primary">El problema no es vender</p>
              <h2 className="mt-5 font-display text-5xl leading-tight md:text-6xl">Es saber qué pasó con cada producto.</h2>
              <div className="my-8 h-px w-24 bg-landing-ink" />
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground">Cuando el stock vive entre planillas, mensajes y memoria, cada decisión cuesta más de lo necesario.</p>
            </div>
            <div className="space-y-24 lg:col-span-6 lg:col-start-7">
              <div>
                <div className="aspect-[16/10] overflow-hidden bg-muted"><img src={warehouse1.url} alt="Depósito con mercadería organizada en estanterías" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" /></div>
                <h3 className="mt-7 font-display text-3xl italic">Un dato, un lugar.</h3>
                <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">OneStock reúne catálogo, movimientos, depósitos, proveedores y reportes para que el inventario deje de depender de distintas versiones de la verdad.</p>
              </div>
              <div className="lg:pl-16">
                <ProductMockup compact />
                <h3 className="mt-7 font-display text-3xl italic">La operación, visible.</h3>
                <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">Cada entrada, salida, ajuste o transferencia queda registrada con fecha, usuario y motivo.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-landing-dark px-4 py-24 text-landing-dark-foreground md:py-32">
          <div className="container max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold uppercase text-primary-glow">La vista que ordena el día</p>
                <h2 className="mt-5 font-display text-5xl leading-tight md:text-6xl">Todo el inventario, sin perder el hilo.</h2>
                <p className="mt-6 max-w-md leading-relaxed text-landing-dark-muted">Valor, rotación, productos críticos y movimientos recientes. Primero lo importante; después, el detalle.</p>
              </div>
              <div className="lg:col-span-7"><ProductMockup /></div>
            </div>
            <div className="mt-20 grid gap-x-12 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="grid grid-cols-[auto_1fr] gap-4 border-t border-landing-dark-line py-6">
                  <feature.icon className="mt-1 h-5 w-5 text-primary-glow" />
                  <div><h3 className="font-semibold">{feature.title}</h3><p className="mt-1 text-sm leading-relaxed text-landing-dark-muted">{feature.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roadmap" className="px-4 py-24 md:py-32">
          <div className="container max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">Cómo funciona</p>
                <h2 className="mt-5 font-display text-5xl leading-tight">Del Excel al control, paso a paso.</h2>
                <div className="mt-9 space-y-1" role="tablist" aria-label="Pasos para empezar">
                  {steps.map((step, index) => (
                    <Button key={step.label} variant="ghost" role="tab" aria-selected={activeStep === index} onClick={() => setActiveStep(index)} className={`h-auto w-full justify-between rounded-none border-b border-landing-line px-0 py-4 text-left hover:bg-transparent ${activeStep === index ? "text-primary" : "text-muted-foreground"}`}>
                      <span><span className="mr-4 font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>{step.label}</span><ArrowRight className={`transition-transform ${activeStep === index ? "translate-x-1" : ""}`} />
                    </Button>
                  ))}
                </div>
              </div>
              <div role="tabpanel" className="lg:pt-8"><StepPreview step={activeStep} /></div>
            </div>
          </div>
        </section>

        <section className="border-y border-landing-line bg-card px-4 py-20">
          <div className="container grid max-w-6xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div><p className="text-xs font-semibold uppercase text-primary">Historias reales</p><h2 className="mt-4 font-display text-4xl">La mejor prueba la cuentan quienes lo usan.</h2></div>
            <div className="border-l-2 border-landing-accent pl-7 md:pl-10">
              <p className="font-display text-3xl italic leading-snug text-muted-foreground">Estamos reuniendo experiencias de comercios que ya ordenan su operación con OneStock.</p>
              <a href={contactWA} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block border-b border-foreground pb-1 text-sm font-semibold">¿Usás OneStock? Contanos tu historia</a>
            </div>
          </div>
        </section>

        <section id="industries" className="px-4 py-24 md:py-32">
          <div className="container max-w-7xl">
            <div className="max-w-xl"><p className="text-xs font-semibold uppercase text-primary">Rubros</p><h2 className="mt-4 font-display text-4xl md:text-5xl">Si manejás stock, hay un lugar para tu negocio.</h2></div>
            <div className="mt-14 flex flex-wrap items-baseline gap-x-8 gap-y-5">
              {industries.map((industry, index) => <span key={industry.name} className={`${industry.size} font-display ${index % 4 === 0 ? "italic text-primary" : index % 5 === 0 ? "text-landing-accent" : "text-landing-ink"}`}>{industry.name}</span>)}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-card px-4 py-24 md:py-32">
          <div className="container max-w-6xl">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div><p className="text-xs font-semibold uppercase text-primary">Precios claros</p><h2 className="mt-4 max-w-2xl font-display text-5xl leading-tight">Empezá simple. Escalá cuando lo necesites.</h2><p className="mt-4 text-muted-foreground">Precios en pesos argentinos. Probá 7 días sin tarjeta.</p></div>
              <div className="flex border border-landing-line p-1" aria-label="Frecuencia de pago">
                <Button variant="ghost" className={`rounded-none ${cycle === "mensual" ? "bg-landing-ink text-landing-paper hover:bg-landing-ink hover:text-landing-paper" : ""}`} onClick={() => setCycle("mensual")}>Mensual</Button>
                <Button variant="ghost" className={`rounded-none ${cycle === "anual" ? "bg-landing-ink text-landing-paper hover:bg-landing-ink hover:text-landing-paper" : ""}`} onClick={() => setCycle("anual")}>Anual · −10%</Button>
              </div>
            </div>
            <div className="mt-14 grid md:grid-cols-2">
              {plans.map((plan, index) => {
                const price = plan.monthly == null ? null : cycle === "anual" ? Math.round(plan.monthly * .9) : plan.monthly;
                const custom = plan.monthly == null;
                return (
                  <article key={plan.name} className={`flex flex-col border border-landing-line p-7 md:p-10 ${index === 0 ? "bg-landing-ink text-landing-paper" : "bg-landing-paper md:my-6"}`}>
                    <p className={`text-xs font-semibold uppercase ${index === 0 ? "text-primary-glow" : "text-primary"}`}>{index === 0 ? "Para empezar" : "Para crecer"}</p>
                    <h3 className="mt-4 font-display text-4xl">{plan.name}</h3>
                    <p className={`mt-2 text-sm ${index === 0 ? "text-landing-dark-muted" : "text-muted-foreground"}`}>{plan.desc}</p>
                    <div className="my-8 min-h-16">
                      {custom ? <><p className="font-display text-3xl">Hablemos</p><p className="mt-1 text-xs text-muted-foreground">Armamos una propuesta para tu operación.</p></> : <><p><span className="font-display text-5xl">{fmtAR(price ?? 0)}</span><span className="text-sm"> /mes</span></p><p className={`mt-1 text-xs ${index === 0 ? "text-landing-dark-muted" : "text-muted-foreground"}`}>{cycle === "anual" ? "Valor mensual abonando el año completo" : `Anual: ${fmtAR(Math.round((plan.monthly ?? 0) * .9))}/mes`}</p></>}
                    </div>
                    <ul className="mb-8 flex-1 space-y-3">{plan.features.map((item) => <li key={item} className="flex gap-3 text-sm"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${index === 0 ? "text-primary-glow" : "text-primary"}`} />{item}</li>)}</ul>
                    <Button asChild variant={index === 0 ? "secondary" : "outline"} className="h-12 rounded-none">
                      <a href={custom ? contactWA : MP_LINKS[plan.name][cycle]} target="_blank" rel="noopener noreferrer">{custom ? "Contactar ventas" : "Contratar"}</a>
                    </Button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-landing-accent px-4 py-20 text-landing-accent-foreground">
          <div className="container grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start">
            <div><p className="text-xs font-semibold uppercase">¿Lo ordenamos?</p><h2 className="mt-4 max-w-xl font-display text-5xl leading-tight md:text-6xl">Tu stock puede dejar de ser una incógnita.</h2><p className="mt-5 max-w-md opacity-80">Empezá gratis o escribinos si necesitás migrar tu información.</p><div className="mt-8 flex flex-wrap gap-5 text-sm"><a href="mailto:hola@onestock.app" className="flex items-center gap-2 border-b border-current pb-1"><Mail className="h-4 w-4" /> hola@onestock.app</a><a href={contactWA} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border-b border-current pb-1"><MessageCircle className="h-4 w-4" /> WhatsApp</a></div></div>
            <form className="space-y-4 border border-landing-accent-foreground/25 bg-landing-paper p-6 text-landing-ink md:p-8" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const body = encodeURIComponent(`Nombre: ${data.get("name") ?? ""}\nEmail: ${data.get("email") ?? ""}\n\n${data.get("msg") ?? ""}`); window.location.href = `mailto:hola@onestock.app?subject=${encodeURIComponent("Consulta OneStock")}&body=${body}`; }}>
              <div><label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium">Nombre</label><Input id="contact-name" name="name" required placeholder="Tu nombre" className="rounded-none" /></div>
              <div><label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium">Email</label><Input id="contact-email" name="email" type="email" required placeholder="tunombre@empresa.com" className="rounded-none" /></div>
              <div><label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium">¿En qué te podemos ayudar?</label><Textarea id="contact-message" name="msg" required rows={3} placeholder="Contanos sobre tu negocio." className="rounded-none" /></div>
              <Button type="submit" className="w-full rounded-none">Enviar consulta <ArrowRight /></Button>
            </form>
          </div>
        </section>

        <section id="faq" className="px-4 py-24 md:py-32">
          <div className="container grid max-w-6xl gap-12 lg:grid-cols-[0.65fr_1.35fr]">
            <div><p className="text-xs font-semibold uppercase text-primary">Preguntas frecuentes</p><h2 className="mt-4 font-display text-4xl">Antes de empezar.</h2></div>
            <div className="border-t border-landing-line">
              {faqs.map((faq, index) => (
                <div key={faq.q} className="border-b border-landing-line">
                  <Button variant="ghost" className="h-auto min-h-14 w-full justify-between whitespace-normal rounded-none px-0 py-5 text-left hover:bg-transparent" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                    <span>{faq.q}</span><ChevronDown className={`shrink-0 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                  </Button>
                  {openFaq === index && <p className="max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-landing-dark-line bg-landing-dark px-4 py-12 text-landing-dark-muted">
        <div className="container grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2"><div className="flex items-center gap-2 text-landing-dark-foreground"><Package className="h-5 w-5" /><span className="font-display text-2xl">OneStock</span></div><p className="mt-4 max-w-sm text-sm">Control de stock para negocios que quieren crecer sin perder el orden.</p></div>
          <div><h3 className="mb-3 text-sm font-semibold text-landing-dark-foreground">Producto</h3><ul className="space-y-2 text-sm"><li><a href="#features">Funcionalidades</a></li><li><a href="#roadmap">Cómo funciona</a></li><li><a href="#pricing">Precios</a></li></ul></div>
          <div><h3 className="mb-3 text-sm font-semibold text-landing-dark-foreground">Contacto</h3><ul className="space-y-2 text-sm"><li><a href="mailto:hola@onestock.app">hola@onestock.app</a></li><li><a href="#faq">Preguntas frecuentes</a></li></ul></div>
        </div>
        <div className="container mt-10 flex flex-col justify-between gap-3 border-t border-landing-dark-line pt-6 text-xs sm:flex-row"><p>© 2026 OneStock. Todos los derechos reservados.</p><div className="flex gap-4"><a href="#">Privacidad</a><a href="#">Términos</a></div></div>
      </footer>
    </div>
  );
}