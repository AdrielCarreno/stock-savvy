import { useEffect, useState } from "react";
import { Loader2, Shield, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";

type Role = "admin" | "manager" | "staff" | "viewer";
type RoleRow = { id: string; user_id: string; role: Role; created_at: string; email?: string };
type AuditRow = { id: string; action: string; entity: string | null; created_at: string; user_id: string | null; detail: any };

export default function UsersPermissions() {
  const { company } = useAuth();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: users }, { data: a }] = await Promise.all([
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("id, email"),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    const map = new Map<string, string>();
    (users ?? []).forEach((u: any) => map.set(u.id, u.email));
    setRoles((r ?? []).map((x: any) => ({ ...x, email: map.get(x.user_id) ?? x.user_id.slice(0, 8) })));
    setAudit((a ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const assign = async () => {
    if (!company?.id || !email.trim()) return;
    const { data: u } = await supabase.from("users").select("id").eq("email", email.trim()).maybeSingle();
    if (!u) return toast({ title: "Usuario no encontrado en la empresa", variant: "destructive" });
    const { error } = await supabase.from("user_roles").insert({ company_id: company.id, user_id: u.id, role });
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    await supabase.from("audit_log").insert({ company_id: company.id, user_id: (await supabase.auth.getUser()).data.user?.id, action: "role.assign", entity: "user_roles", detail: { email, role } });
    setEmail(""); load();
    toast({ title: "Rol asignado" });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Quitar rol?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Usuarios y Permisos</h2>
        <p className="text-sm text-muted-foreground">Control de acceso por roles y auditoría de acciones</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="font-semibold mb-3">Asignar rol</h3>
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1"><Label>Email del usuario</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" /></div>
          <div className="w-48"><Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={assign}>Asignar</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 border-b border-border"><h3 className="font-semibold">Roles asignados</h3></div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : roles.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Sin roles asignados aún.</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Asignado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.email}</TableCell>
                  <TableCell><Badge>{r.role}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-AR")}</TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 border-b border-border"><h3 className="font-semibold">Registro de auditoría</h3></div>
        {audit.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Sin eventos registrados.</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>Detalle</TableHead></TableRow></TableHeader>
            <TableBody>
              {audit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{new Date(a.created_at).toLocaleString("es-AR")}</TableCell>
                  <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                  <TableCell className="text-xs">{a.entity ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{a.detail ? JSON.stringify(a.detail) : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
