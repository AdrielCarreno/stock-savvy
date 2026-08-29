import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Purchases from "./Purchases";
import Sales from "./Sales";
import { StockAdjustmentsPanel } from "@/components/movements/StockAdjustmentsPanel";
import { AllMovementsPanel } from "@/components/movements/AllMovementsPanel";
import { TransfersPanel } from "@/components/movements/TransfersPanel";

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
        <TabsList className="mb-4 grid w-full grid-cols-3 gap-1 h-auto md:w-auto md:inline-flex">
          <TabsTrigger value="all" className="text-xs md:text-sm px-2">Todos</TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs md:text-sm px-2">Compras</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs md:text-sm px-2">Ventas</TabsTrigger>
          <TabsTrigger value="adjustments" className="text-xs md:text-sm px-2 leading-tight">Ajustes</TabsTrigger>
          <TabsTrigger value="transfers" className="text-xs md:text-sm px-2 leading-tight">Transferencias</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-0"><AllMovementsPanel /></TabsContent>
        <TabsContent value="purchases" className="mt-0"><Purchases /></TabsContent>
        <TabsContent value="sales" className="mt-0"><Sales /></TabsContent>
        <TabsContent value="adjustments" className="mt-0"><StockAdjustmentsPanel /></TabsContent>
        <TabsContent value="transfers" className="mt-0"><TransfersPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
