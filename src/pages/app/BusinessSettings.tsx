import { useEffect, useState } from "react";
import { Building2, Save, Loader2, Bell, Globe, Receipt, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BusinessPrefs = {
  legal_name: string;
  cuit: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  invoice_prefix: string;
  invoice_next_number: string;
  notify_low_stock: boolean;
  notify_daily_summary: boolean;
  notify_new_movement: boolean;
  default_sale_type: "minorista" | "mayorista";
  theme: "system" | "light" | "dark";
};

const defaults: BusinessPrefs = {
  legal_name: "",
  cuit: "",
  address: "",
  city: "",
  province: "",
  phone: "",
  email: "",
  website: "",
  currency: "ARS",
  timezone: "America/Argentina/Buenos_Aires",
  invoice_prefix: "0001",
  invoice_next_number: "00000001",
  notify_low_stock: true,
  notify_daily_summary: false,
  notify_new_movement: false,
  default_sale_type: "minorista",
  theme: "system",
};

function storageKey(companyId: string | null) {
  return `onestock:business-prefs:${companyId ?? "anon"}`;
}

export default function BusinessSettings() {
  const { company, profile, refreshCompany } = useAuth();
  const [name, setName] = useState(company?.name ?? "");
  const [prefs, setPrefs] = useState<BusinessPrefs>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(company?.name ?? "");
  }, [company?.name]);

  useEffect(() => {
    if (!profile?.company_id) return;
    try {
      const raw = localStorage.getItem(storageKey(profile.company_id));
      if (raw) setPrefs({ ...defaults, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, [profile?.company_id]);

  const updatePref = <K extends keyof BusinessPrefs>(k: K, v: BusinessPrefs[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    if (!name.trim()) {
      toast.error("El nombre comercial es obligatorio");
      setSaving(false);
      return;
    }
    if (company?.id && name.trim() !== company.name) {
      const { error } = await supabase
        .from("companies")
        .update({ name: name.trim() })
        .eq("id", company.id);
      if (error) {
        toast.error("Error al guardar el nombre: " + error.message);
        setSaving(false);
        return;
      }
      await refreshCompany();
    }
    try {
      localStorage.setItem(storageKey(profile?.company_id ?? null), JSON.stringify(prefs));
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar la configuración local");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Configuración de negocio</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalizá los datos de tu empresa y el comportamiento del sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Datos del negocio */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <header className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Datos del negocio</h3>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Nombre comercial *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Empresa S.A." />
          </div>
          <div className="space-y-1.5">
            <Label>Razón social</Label>
            <Input value={prefs.legal_name} onChange={(e) => updatePref("legal_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CUIT</Label>
            <Input value={prefs.cuit} onChange={(e) => updatePref("cuit", e.target.value)} placeholder="30-12345678-9" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Dirección</Label>
            <Textarea
              rows={2}
              value={prefs.address}
              onChange={(e) => updatePref("address", e.target.value)}
              placeholder="Calle y número"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input value={prefs.city} onChange={(e) => updatePref("city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Provincia</Label>
            <Input value={prefs.province} onChange={(e) => updatePref("province", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={prefs.phone} onChange={(e) => updatePref("phone", e.target.value)} placeholder="+54 9 351 ..." />
          </div>
          <div className="space-y-1.5">
            <Label>Email de contacto</Label>
            <Input
              type="email"
              value={prefs.email}
              onChange={(e) => updatePref("email", e.target.value)}
              placeholder="contacto@miempresa.com"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Sitio web</Label>
            <Input value={prefs.website} onChange={(e) => updatePref("website", e.target.value)} placeholder="https://" />
          </div>
        </div>
      </section>

      {/* Sistema */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <header className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Sistema</h3>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Select value={prefs.currency} onValueChange={(v) => updatePref("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Peso argentino (ARS)</SelectItem>
                <SelectItem value="USD">Dólar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                <SelectItem value="BRL">Real (BRL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Zona horaria</Label>
            <Select value={prefs.timezone} onValueChange={(v) => updatePref("timezone", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                <SelectItem value="America/Argentina/Cordoba">Córdoba (GMT-3)</SelectItem>
                <SelectItem value="America/Argentina/Mendoza">Mendoza (GMT-3)</SelectItem>
                <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                <SelectItem value="America/Santiago">Santiago (GMT-4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de venta predeterminado</Label>
            <Select
              value={prefs.default_sale_type}
              onValueChange={(v) => updatePref("default_sale_type", v as "minorista" | "mayorista")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minorista">Minorista</SelectItem>
                <SelectItem value="mayorista">Mayorista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tema</Label>
            <Select value={prefs.theme} onValueChange={(v) => updatePref("theme", v as BusinessPrefs["theme"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Facturación */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <header className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Facturación y comprobantes</h3>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Punto de venta</Label>
            <Input
              value={prefs.invoice_prefix}
              onChange={(e) => updatePref("invoice_prefix", e.target.value)}
              placeholder="0001"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Próximo número</Label>
            <Input
              value={prefs.invoice_next_number}
              onChange={(e) => updatePref("invoice_next_number", e.target.value)}
              placeholder="00000001"
            />
          </div>
        </div>
      </section>

      {/* Notificaciones */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <header className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Notificaciones</h3>
        </header>
        <div className="space-y-3">
          {[
            { key: "notify_low_stock", label: "Alertas de bajo stock", desc: "Recibí un aviso cuando un producto cae bajo el mínimo." },
            { key: "notify_daily_summary", label: "Resumen diario", desc: "Resumen de movimientos y ventas al cierre de cada día." },
            { key: "notify_new_movement", label: "Movimientos en tiempo real", desc: "Notificación inmediata cuando un usuario registra un movimiento." },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch
                checked={prefs[n.key as keyof BusinessPrefs] as boolean}
                onCheckedChange={(v) => updatePref(n.key as keyof BusinessPrefs, v as never)}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 gradient-primary shadow-primary text-primary-foreground"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
