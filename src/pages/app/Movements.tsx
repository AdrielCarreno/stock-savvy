import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Purchases from "./Purchases";
import Sales from "./Sales";
import { StockAdjustmentsPanel } from "@/components/movements/StockAdjustmentsPanel";
import { AllMovementsPanel } from "@/components/movements/AllMovementsPanel";

export default function Movements() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "all";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <div className="animate-fade-in">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 md:w-auto md:inline-flex md:grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="adjustments">Ajustes de stock</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-0"><AllMovementsPanel /></TabsContent>
        <TabsContent value="purchases" className="mt-0"><Purchases /></TabsContent>
        <TabsContent value="sales" className="mt-0"><Sales /></TabsContent>
        <TabsContent value="adjustments" className="mt-0"><StockAdjustmentsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
