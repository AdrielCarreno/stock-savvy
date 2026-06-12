
-- 1. Add stage to imports (timeline)
ALTER TABLE public.imports ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'cotizacion';

-- 2. Add rating to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS rating SMALLINT;

-- 3. Generic documents table (polymorphic by entity_type)
CREATE TABLE IF NOT EXISTS public.operation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('import','supplier','shipment','customs')),
  entity_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_op_docs_entity ON public.operation_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_op_docs_company ON public.operation_documents(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_documents TO authenticated;
GRANT ALL ON public.operation_documents TO service_role;
ALTER TABLE public.operation_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "op_docs_select" ON public.operation_documents FOR SELECT TO authenticated
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "op_docs_insert" ON public.operation_documents FOR INSERT TO authenticated
WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "op_docs_update" ON public.operation_documents FOR UPDATE TO authenticated
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "op_docs_delete" ON public.operation_documents FOR DELETE TO authenticated
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());

-- 4. Customs checklist items
CREATE TABLE IF NOT EXISTS public.customs_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customs_id UUID NOT NULL REFERENCES public.customs_declarations(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cust_checklist_cust ON public.customs_checklist(customs_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customs_checklist TO authenticated;
GRANT ALL ON public.customs_checklist TO service_role;
ALTER TABLE public.customs_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cust_chk_select" ON public.customs_checklist FOR SELECT TO authenticated
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "cust_chk_insert" ON public.customs_checklist FOR INSERT TO authenticated
WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "cust_chk_update" ON public.customs_checklist FOR UPDATE TO authenticated
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "cust_chk_delete" ON public.customs_checklist FOR DELETE TO authenticated
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
